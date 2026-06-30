// src/services/adminService.js
import { supabase } from './supabase';

export const adminService = {
  // ── Dashboard ────────────────────────────────────────────────
  // Three parallel count-only queries for the admin dashboard cards
  async getDashboardStats() {
    const [usersRes, storesRes, ratingsRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('stores').select('id',   { count: 'exact', head: true }),
      supabase.from('ratings').select('id',  { count: 'exact', head: true }),
    ]);

    if (usersRes.error)   throw usersRes.error;
    if (storesRes.error)  throw storesRes.error;
    if (ratingsRes.error) throw ratingsRes.error;

    return {
      totalUsers:   usersRes.count   ?? 0,
      totalStores:  storesRes.count  ?? 0,
      totalRatings: ratingsRes.count ?? 0,
    };
  },

  // ── Users ────────────────────────────────────────────────────

  // All profiles — used by the ManageUsers table
  async getAllUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, address, role, created_at, updated_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // Single profile + role-specific detail (store info for owners,
  // submitted ratings for normal users)
  async getUserDetail(userId) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    if (!profile) return null;

    let storeDetail = null;
    let ratings = [];

    if (profile.role === 'store_owner') {
      const { data: store } = await supabase
        .from('stores_with_rating')
        .select('*')
        .eq('owner_id', userId)
        .maybeSingle();

      storeDetail = store;

      if (store) {
        const { data: r } = await supabase
          .from('ratings')
          .select('id, rating, created_at, profiles ( full_name )')
          .eq('store_id', store.id)
          .order('created_at', { ascending: false });
        ratings = r || [];
      }
    } else if (profile.role === 'user') {
      const { data: r } = await supabase
        .from('ratings')
        .select('id, rating, created_at, stores ( name )')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      ratings = r || [];
    }

    return { profile, storeDetail, ratings };
  },

  // Admin-only: create a user of any role via the admin-create-user
  // Edge Function, which runs server-side with the service_role key.
  // This NEVER touches the admin's own browser session — unlike
  // client-side supabase.auth.signUp(), which hijacks the active
  // session into the newly created account.
  //
  // Requires the Edge Function to be deployed:
  //   supabase functions deploy admin-create-user
  async createUser({ email, password, full_name, address, role }) {
    const { data, error } = await supabase.functions.invoke('admin-create-user', {
      body: { email, password, full_name, address, role },
    });

    if (error) {
      // Supabase wraps the function's JSON error body inside error.context —
      // unwrap it so the caller sees the real message instead of a generic one
      let msg = error.message;
      try {
        const body = await error.context?.json();
        if (body?.error) msg = body.error;
      } catch {
        // context wasn't JSON or wasn't readable — fall back to error.message
      }
      throw new Error(msg || 'Failed to create user');
    }

    if (data?.error) throw new Error(data.error);

    return data; // { id, email, full_name, role }
  },

  // Change any user's role
  async setUserRole(userId, role) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Update editable profile fields (admin editing another user's record)
  async updateUserProfile(userId, updates) {
    const allowed = ['full_name', 'address', 'role'];
    const payload = Object.fromEntries(
      Object.entries(updates).filter(([k]) => allowed.includes(k))
    );
    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ── Stores ───────────────────────────────────────────────────

  // All stores with live average_rating + rating_count from the view
  async getAllStores() {
    const { data, error } = await supabase
      .from('stores_with_rating')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  // Create a new store (admin only)
  async createStore({ name, email, address, owner_id = null }) {
    const { data, error } = await supabase
      .from('stores')
      .insert({ name, email, address, owner_id })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Update a store's fields
  async updateStore(storeId, updates) {
    const { data, error } = await supabase
      .from('stores')
      .update(updates)
      .eq('id', storeId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Assign (or remove, if ownerId is falsy) a store owner
  async assignStoreOwner(storeId, ownerId) {
    const { data, error } = await supabase
      .from('stores')
      .update({ owner_id: ownerId || null })
      .eq('id', storeId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Delete a store
  async deleteStore(storeId) {
    const { error } = await supabase
      .from('stores')
      .delete()
      .eq('id', storeId);
    if (error) throw error;
  },

  // All profiles with role = store_owner, for assignment dropdowns
  async getStoreOwners() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'store_owner')
      .order('full_name', { ascending: true });
    if (error) throw error;
    return data || [];
  },
};

export default adminService;