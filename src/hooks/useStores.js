import { useState, useCallback } from 'react';
import { supabase } from '../services/supabase';

export function useStores() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStores = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('stores')
        .select(`
          *,
          ratings(rating)
        `)
        .order('name');

      if (fetchError) throw fetchError;

      // Calculate average rating for each store
      const storesWithRatings = data?.map((store) => {
        const ratings = store.ratings || [];
        const avgRating =
          ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
            : 0;

        return {
          ...store,
          average_rating: avgRating,
          rating_count: ratings.length,
        };
      }) || [];

      setStores(storesWithRatings);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching stores:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addStore = useCallback(
    async (storeData) => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: insertError } = await supabase
          .from('stores')
          .insert([storeData])
          .select();

        if (insertError) throw insertError;

        setStores((prev) => [
          ...prev,
          {
            ...data[0],
            average_rating: 0,
            rating_count: 0,
          },
        ]);

        return data[0];
      } catch (err) {
        setError(err.message);
        console.error('Error adding store:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateStore = useCallback(
    async (storeId, updates) => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: updateError } = await supabase
          .from('stores')
          .update(updates)
          .eq('id', storeId)
          .select();

        if (updateError) throw updateError;

        setStores((prev) =>
          prev.map((store) =>
            store.id === storeId ? { ...store, ...data[0] } : store
          )
        );

        return data[0];
      } catch (err) {
        setError(err.message);
        console.error('Error updating store:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteStore = useCallback(
    async (storeId) => {
      try {
        setLoading(true);
        setError(null);

        const { error: deleteError } = await supabase
          .from('stores')
          .delete()
          .eq('id', storeId);

        if (deleteError) throw deleteError;

        setStores((prev) => prev.filter((store) => store.id !== storeId));
      } catch (err) {
        setError(err.message);
        console.error('Error deleting store:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const searchStores = useCallback(
    async (searchTerm) => {
      if (!searchTerm.trim()) {
        await fetchStores();
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const term = searchTerm.toLowerCase();

        // Filter stores locally based on search term
        const filtered = stores.filter(
          (store) =>
            store.name.toLowerCase().includes(term) ||
            store.email.toLowerCase().includes(term) ||
            store.address.toLowerCase().includes(term)
        );

        return filtered;
      } catch (err) {
        setError(err.message);
        console.error('Error searching stores:', err);
      } finally {
        setLoading(false);
      }
    },
    [stores, fetchStores]
  );

  const getStoreById = useCallback(
    (storeId) => {
      return stores.find((store) => store.id === storeId);
    },
    [stores]
  );

  const getStoreRatings = useCallback(
    async (storeId) => {
      try {
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('ratings')
          .select(`
            id,
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
      }
    },
    []
  );

  return {
    stores,
    loading,
    error,
    fetchStores,
    addStore,
    updateStore,
    deleteStore,
    searchStores,
    getStoreById,
    getStoreRatings,
  };
}
