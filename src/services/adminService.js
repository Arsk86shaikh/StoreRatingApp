// src/services/adminService.js
import { supabase } from './supabase';

export const adminService = {
  // Dashboard stats
  async getDashboardStats() {
    const [usersRes, storesRes, ratingsRes] = await Promise.all([
      supabase.from('profiles').select('id, role', { count: 'exact' }),
      supabase.from('stores').select('id', { count: 'exact' }),
      supabase.from('ratings').select('id', { count: 'exact' }),
    ]);

    if (usersRes.error) throw usersRes.error;
    if (storesRes.error) throw storesRes.error;
    if (ratingsRes.error) throw ratingsRes.error;

    const totalUsers = usersRes.count ?? 0;
    const totalStores = storesRes.count ?? 0;
    const totalRatings = ratingsRes.count ?? 0;

    return { totalUsers, totalStores, totalRatings };
  },

  // Promote user to admin
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

  // Create store owner profile + store together
  async createStoreOwner({ email, full_name, address, password, storeName, storeEmail, storeAddress }) {
    // Step 1: Create auth user (uses admin API via service role key, or regular signUp)
    // NOTE: For full admin user creation you need the service_role key on a backend.
    // Here we do normal signUp and then set role.
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name, address, role: 'store_owner' } },
    });
    if (authError) throw authError;

    const ownerId = authData.user?.id;
    if (!ownerId) throw new Error('User creation failed');

    // Step 2: Update role (trigger creates profile, we update role)
    await supabase.from('profiles').update({ role: 'store_owner' }).eq('id', ownerId);

    // Step 3: Create store linked to owner
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .insert({ name: storeName, email: storeEmail, address: storeAddress, owner_id: ownerId })
      .select()
      .single();
    if (storeError) throw storeError;

    return { owner: authData.user, store };
  },
};