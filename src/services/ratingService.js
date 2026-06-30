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

  // RATING-1 FIX: upsert with onConflict using column names works in Supabase
  // JS client v2 when the constraint name matches 'store_id,user_id'.
  // However, the safest pattern is to check first then insert or update,
  // avoiding reliance on constraint names that may differ per project.
  async upsertRating({ store_id, user_id, rating }) {
    // Check for existing rating
    const { data: existing, error: checkError } = await supabase
      .from('ratings')
      .select('id')
      .eq('store_id', store_id)
      .eq('user_id', user_id)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existing) {
      // Update existing rating — let DB trigger handle updated_at
      const { data, error } = await supabase
        .from('ratings')
        .update({ rating })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      // Insert new rating — let DB set created_at/updated_at
      const { data, error } = await supabase
        .from('ratings')
        .insert({ store_id, user_id, rating })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
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

  // Get all ratings submitted by a user, with store details
  async getUserRatings(userId) {
    const { data, error } = await supabase
      .from('ratings')
      .select('*, stores(id, name, address)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // Get all ratings for a store, with rater profile info
  async getStoreRatings(storeId) {
    const { data, error } = await supabase
      .from('ratings')
      .select('*, profiles(full_name)')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
};

export default ratingService;