// src/services/storeService.js
import { supabase } from './supabase';

export const storeService = {
  // All stores with live average_rating + rating_count baked in
  async getAllStores({ search = '', sortBy = 'name', sortOrder = 'asc' } = {}) {
    let query = supabase
      .from('stores_with_rating')
      .select('*');

    if (search) {
      query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%`);
    }

    // average_rating is a computed column — Supabase can sort it directly
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getStore(storeId) {
    const { data, error } = await supabase
      .from('stores_with_rating')
      .select('*')
      .eq('id', storeId)
      .single();
    if (error) throw error;
    return data;
  },

  // Returns null (not an error) when owner has no store yet
  async getStoreByOwner(ownerId) {
    const { data, error } = await supabase
      .from('stores_with_rating')
      .select('*')
      .eq('owner_id', ownerId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  // Individual ratings for a store, including rater profile info
  async getStoreRatings(storeId) {
    const { data, error } = await supabase
      .from('ratings')
      .select(`
        id, rating, created_at,
        profiles ( full_name, email )
      `)
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // The current user's rating for a specific store (null if not yet rated)
  async getUserRating(storeId, userId) {
    const { data, error } = await supabase
      .from('ratings')
      .select('id, rating')
      .eq('store_id', storeId)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  // Submit a new rating
  async submitRating(storeId, userId, rating) {
    const { data, error } = await supabase
      .from('ratings')
      .insert({ store_id: storeId, user_id: userId, rating })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Update an existing rating (uses the unique constraint: store_id + user_id)
  async updateRating(ratingId, rating) {
    const { data, error } = await supabase
      .from('ratings')
      .update({ rating, updated_at: new Date().toISOString() })
      .eq('id', ratingId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Admin only
  async createStore(storeData) {
    const { data, error } = await supabase
      .from('stores')
      .insert(storeData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

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

  async deleteStore(storeId) {
    const { error } = await supabase
      .from('stores')
      .delete()
      .eq('id', storeId);
    if (error) throw error;
  },
};

export default storeService;