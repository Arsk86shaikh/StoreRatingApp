// src/services/userService.js
import { supabase } from './supabase';

export const userService = {
  // Get a single profile by id
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();      // ← fixed: .single() threw if the row didn't exist yet
    if (error) throw error;
    return data;
  },

  // Update editable profile fields (name/address) — used by the
  // normal user's own profile screen, not role changes
  async updateProfile(userId, updates) {
    const allowed = ['full_name', 'address'];
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

  // Spec: "Can update their password after logging in" — re-authenticates
  // with the current password first, same pattern as the admin/owner flow.
  async updatePassword(email, currentPassword, newPassword) {
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email, password: currentPassword,
    });
    if (signInErr) {
      const msg = signInErr.message?.toLowerCase() || '';
      if (msg.includes('invalid login credentials')) {
        throw new Error('Current password is incorrect.');
      }
      throw signInErr;
    }

    const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
    if (updateErr) throw updateErr;
  },

  // Spec: "Can view a list of all registered stores" with overall rating
  async getAllStores() {
    const { data, error } = await supabase
      .from('stores_with_rating')
      .select('id, name, email, address, average_rating, rating_count')
      .order('name', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  // The current user's own rating for one store, or null
  async getMyRating(storeId, userId) {
    const { data, error } = await supabase
      .from('ratings')
      .select('id, rating')
      .eq('store_id', storeId)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  // Spec: submit a new rating (1–5)
  async submitRating(storeId, userId, rating) {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new Error('Rating must be a whole number between 1 and 5.');
    }
    const { data, error } = await supabase
      .from('ratings')
      .insert({ store_id: storeId, user_id: userId, rating })
      .select()
      .single();
    if (error) {
      if (error.code === '23505') {
        throw new Error('You have already rated this store. Use update instead.');
      }
      throw error;
    }
    return data;
  },

  // Spec: "Option to modify their submitted rating"
  async updateRating(ratingId, rating) {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new Error('Rating must be a whole number between 1 and 5.');
    }
    const { data, error } = await supabase
      .from('ratings')
      .update({ rating, updated_at: new Date().toISOString() })
      .eq('id', ratingId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ── Admin-only methods kept here since they were already in this file ──

  async getAllUsers({ search = '', role = '', sortBy = 'created_at', sortOrder = 'desc' } = {}) {
    let query = supabase.from('profiles').select('*');
    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,email.ilike.%${search}%,address.ilike.%${search}%`
      );
    }
    if (role) query = query.eq('role', role);
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getUserWithRatings(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        ratings ( id, rating, created_at, stores ( id, name, address ) )
      `)
      .eq('id', userId)
      .maybeSingle();       // ← fixed: was .single()
    if (error) throw error;
    return data;
  },

  // NOTE: this only deletes the profiles row. It does NOT delete the
  // matching auth.users row or cascade — Supabase does not auto-delete
  // auth users from a profiles table delete. True user deletion needs
  // the admin API (auth.admin.deleteUser) via a service-role Edge
  // Function, same pattern as admin-create-user. Left as a TODO rather
  // than silently mislabeled as a full delete.
  async deleteProfileOnly(userId) {
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) throw error;
  },
};

export default userService;