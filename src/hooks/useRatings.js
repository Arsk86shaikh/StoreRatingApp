import { useState, useCallback } from 'react';
import { supabase } from '../services/supabase';

export function useRatings() {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRatings = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('ratings')
        .select(`
          id,
          store_id,
          user_id,
          rating,
          created_at,
          stores(id, name),
          users(id, name, email)
        `);

      // Apply filters
      if (filters.storeId) {
        query = query.eq('store_id', filters.storeId);
      }

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.minRating) {
        query = query.gte('rating', filters.minRating);
      }

      if (filters.maxRating) {
        query = query.lte('rating', filters.maxRating);
      }

      const { data, error: fetchError } = await query.order('created_at', {
        ascending: filters.sortOrder === 'asc' ? true : false,
      });

      if (fetchError) throw fetchError;

      setRatings(data || []);
      return data || [];
    } catch (err) {
      setError(err.message);
      console.error('Error fetching ratings:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const submitRating = useCallback(
    async (storeId, userId, rating) => {
      try {
        setLoading(true);
        setError(null);

        // Validate rating
        if (rating < 1 || rating > 5) {
          throw new Error('Rating must be between 1 and 5');
        }

        // Check if rating already exists
        const { data: existingRating } = await supabase
          .from('ratings')
          .select('id')
          .eq('store_id', storeId)
          .eq('user_id', userId)
          .single();

        if (existingRating) {
          // Update existing rating
          return await updateRating(existingRating.id, rating);
        } else {
          // Create new rating
          const { data, error: insertError } = await supabase
            .from('ratings')
            .insert([
              {
                store_id: storeId,
                user_id: userId,
                rating,
              },
            ])
            .select(`
              id,
              store_id,
              user_id,
              rating,
              created_at,
              stores(id, name),
              users(id, name, email)
            `);

          if (insertError) throw insertError;

          setRatings((prev) => [data[0], ...prev]);
          return data[0];
        }
      } catch (err) {
        setError(err.message);
        console.error('Error submitting rating:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateRating = useCallback(
    async (ratingId, newRating) => {
      try {
        setLoading(true);
        setError(null);

        // Validate rating
        if (newRating < 1 || newRating > 5) {
          throw new Error('Rating must be between 1 and 5');
        }

        const { data, error: updateError } = await supabase
          .from('ratings')
          .update({ rating: newRating })
          .eq('id', ratingId)
          .select(`
            id,
            store_id,
            user_id,
            rating,
            created_at,
            stores(id, name),
            users(id, name, email)
          `);

        if (updateError) throw updateError;

        setRatings((prev) =>
          prev.map((r) => (r.id === ratingId ? data[0] : r))
        );

        return data[0];
      } catch (err) {
        setError(err.message);
        console.error('Error updating rating:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteRating = useCallback(
    async (ratingId) => {
      try {
        setLoading(true);
        setError(null);

        const { error: deleteError } = await supabase
          .from('ratings')
          .delete()
          .eq('id', ratingId);

        if (deleteError) throw deleteError;

        setRatings((prev) => prev.filter((r) => r.id !== ratingId));
      } catch (err) {
        setError(err.message);
        console.error('Error deleting rating:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getUserRatings = useCallback(
    async (userId) => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('ratings')
          .select(`
            id,
            store_id,
            user_id,
            rating,
            created_at,
            stores(id, name, address)
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        return data || [];
      } catch (err) {
        setError(err.message);
        console.error('Error fetching user ratings:', err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getStoreRatings = useCallback(
    async (storeId) => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('ratings')
          .select(`
            id,
            store_id,
            user_id,
            rating,
            created_at,
            users(id, name, email)
          `)
          .eq('store_id', storeId)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        return data || [];
      } catch (err) {
        setError(err.message);
        console.error('Error fetching store ratings:', err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getAverageRating = useCallback(
    async (storeId) => {
      try {
        const storeRatings = await getStoreRatings(storeId);

        if (storeRatings.length === 0) {
          return { average: 0, count: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
        }

        const sum = storeRatings.reduce((acc, r) => acc + r.rating, 0);
        const average = (sum / storeRatings.length).toFixed(2);

        // Calculate distribution
        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        storeRatings.forEach((r) => {
          distribution[r.rating]++;
        });

        return {
          average: parseFloat(average),
          count: storeRatings.length,
          distribution,
        };
      } catch (err) {
        setError(err.message);
        console.error('Error calculating average rating:', err);
        return { average: 0, count: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
      }
    },
    [getStoreRatings]
  );

  const getUserStoreRating = useCallback(
    async (userId, storeId) => {
      try {
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('ratings')
          .select('*')
          .eq('user_id', userId)
          .eq('store_id', storeId)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

        return data || null;
      } catch (err) {
        setError(err.message);
        console.error('Error fetching user store rating:', err);
        return null;
      }
    },
    []
  );

  return {
    ratings,
    loading,
    error,
    fetchRatings,
    submitRating,
    updateRating,
    deleteRating,
    getUserRatings,
    getStoreRatings,
    getAverageRating,
    getUserStoreRating,
  };
}
