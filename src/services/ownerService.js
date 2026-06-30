// src/services/ownerService.js
import { supabase } from './supabase';

export const ownerService = {
  // Returns { store, avgRating, totalRatings, recentRatings }
  async getDashboard(ownerId) {
    if (!ownerId) throw new Error('Missing owner id.');

    // .limit(1) + array destructure instead of .single()/.maybeSingle()
    // — completely immune to "multiple rows" errors even if a duplicate
    // owner_id ever slips into the data.
    const { data: storeRows, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('owner_id', ownerId)
      .limit(1);

    if (storeError) throw storeError;
    const store = storeRows?.[0] || null;

    if (!store) {
      return { store: null, avgRating: null, totalRatings: 0, recentRatings: [] };
    }

    const { data: summaryRows, error: summaryError } = await supabase
      .from('store_ratings_summary')
      .select('average_rating, total_ratings')
      .eq('store_id', store.id)
      .limit(1);

    if (summaryError) throw summaryError;
    const summary = summaryRows?.[0] || null;

    const { data: recentRatings, error: ratingsError } = await supabase
      .from('ratings')
      .select('id, rating, created_at, profiles ( full_name )')
      .eq('store_id', store.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (ratingsError) throw ratingsError;

    return {
      store,
      avgRating: summary?.average_rating ?? null,
      totalRatings: summary?.total_ratings ?? 0,
      recentRatings: recentRatings || [],
    };
  },

  // Returns { store, avgRating, totalRatings, ratings, distribution }
  async getAnalytics(ownerId) {
    if (!ownerId) throw new Error('Missing owner id.');

    const { data: storeRows, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('owner_id', ownerId)
      .limit(1);

    if (storeError) throw storeError;
    const store = storeRows?.[0] || null;

    if (!store) {
      return {
        store: null, avgRating: null, totalRatings: 0,
        ratings: [], distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const { data: summaryRows, error: summaryError } = await supabase
      .from('store_ratings_summary')
      .select('average_rating, total_ratings')
      .eq('store_id', store.id)
      .limit(1);

    if (summaryError) throw summaryError;
    const summary = summaryRows?.[0] || null;

    const { data: ratings, error: ratingsError } = await supabase
      .from('ratings')
      .select('id, rating, created_at, profiles ( full_name, email )')
      .eq('store_id', store.id)
      .order('created_at', { ascending: false });

    if (ratingsError) throw ratingsError;

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    (ratings || []).forEach((r) => {
      if (distribution[r.rating] !== undefined) distribution[r.rating]++;
    });

    return {
      store,
      avgRating: summary?.average_rating ?? null,
      totalRatings: summary?.total_ratings ?? 0,
      ratings: ratings || [],
      distribution,
    };
  },
};

export default ownerService;