import { supabase } from './supabase';

export const adminService = {
  // Dashboard counts — three parallel queries against the correct tables
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

  // NEW: create a user via the admin-create-user Edge Function.
  // This is the ONLY method that should be used to add users from the
  // admin panel — it uses the service_role key server-side, so the calling
  // admin's browser session is never touched (unlike supabase.auth.signUp()
  // which always signs the browser into the newly created account).
  async createUser({ email, password, full_name, address, role }) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Your session has expired. Please log in again.');

    const { data, error } = await supabase.functions.invoke('admin-create-user', {
      body: { email, password, full_name, address, role },
    });

    if (error) {
      // supabase-js wraps non-2xx responses in FunctionsHttpError; the actual
      // message from our function body is in error.context, fall back gracefully
      let message = error.message || 'Failed to create user.';
      try {
        const body = await error.context?.json?.();
        if (body?.error) message = body.error;
      } catch (_) { /* ignore parse failure, use default message */ }
      throw new Error(message);
    }

    if (data?.error) throw new Error(data.error);
    return data.user;
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

  // Assign (or reassign) a store owner
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

  // All profiles — used by ManageUsers table
  async getAllUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // Single profile with optional store/ratings detail.
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
      const { data: store, error: storeErr } = await supabase
        .from('stores_with_rating')
        .select('*')
        .eq('owner_id', userId)
        .maybeSingle();
      if (storeErr) throw storeErr;
      storeDetail = store;

      if (store) {
        const { data: r, error: rErr } = await supabase
          .from('ratings')
          .select('id, rating, created_at, profiles ( full_name )')
          .eq('store_id', store.id)
          .order('created_at', { ascending: false });
        if (rErr) throw rErr;
        ratings = r || [];
      }
    } else if (profile.role === 'user') {
      const { data: r, error: rErr } = await supabase
        .from('ratings')
        .select('id, rating, created_at, stores ( name )')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (rErr) throw rErr;
      ratings = r || [];
    }

    return { profile, storeDetail, ratings };
  },
};

export default adminService;