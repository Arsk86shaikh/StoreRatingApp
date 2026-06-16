// src/services/storeService.js
import { supabase } from './supabase';

export const storeService = {
  // Get all stores with ratings
  async getAllStores({ search = '', sortBy = 'name', sortOrder = 'asc' } = {}) {
    let query = supabase
      .from('stores_with_ratings')
      .select('*');

    if (search) {
      query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%`);
    }
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get single store with ratings
  async getStore(storeId) {
    const { data, error } = await supabase
      .from('stores_with_ratings')
      .select('*')
      .eq('id', storeId)
      .single();
    if (error) throw error;
    return data;
  },

  // Get store by owner
  async getStoreByOwner(ownerId) {
    const { data, error } = await supabase
      .from('stores_with_ratings')
      .select('*')
      .eq('owner_id', ownerId)
      .single();
    if (error) throw error;
    return data;
  },

  // Create store (admin only)
  async createStore(storeData) {
    const { data, error } = await supabase
      .from('stores')
      .insert(storeData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Update store (admin only)
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

  // Delete store (admin only)
  async deleteStore(storeId) {
    const { error } = await supabase.from('stores').delete().eq('id', storeId);
    if (error) throw error;
  },

  // Get store ratings with user info
  async getStoreRatings(storeId) {
    const { data, error } = await supabase
      .from('ratings')
      .select('*, profiles(full_name, email)')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
};