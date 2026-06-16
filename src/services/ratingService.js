// src/services/ratingService.js
import { supabase } from './supabase';

export const ratingService = {
  // Get user's rating for a specific store
  async getUserRating(storeId, userId) {
    const { data, error } = await supabase
      .from('ratings')
      .select('*')
      .eq('store_id', storeId)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  // Submit or update rating (upsert)
  async upsertRating({ store_id, user_id, rating }) {
    const { data, error } = await supabase
      .from('ratings')
      .upsert({ store_id, user_id, rating }, { onConflict: 'store_id,user_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Delete rating
  async deleteRating(storeId, userId) {
    const { error } = await supabase
      .from('ratings')
      .delete()
      .eq('store_id', storeId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  // Get all ratings by a user
  async getUserRatings(userId) {
    const { data, error } = await supabase
      .from('ratings')
      .select('*, stores(id, name, address)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Get all ratings for a store (with user info)
  async getStoreRatings(storeId) {
    const { data, error } = await supabase
      .from('ratings')
      .select('*, profiles(full_name)')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
};