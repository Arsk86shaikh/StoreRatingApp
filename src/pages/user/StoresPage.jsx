import { useState, useEffect } from 'react';
import StoreList from '../../components/store/StoreList';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';

export default function StoresPage() {
  const { profile } = useAuth();
  const [stores, setStores] = useState([]);
  const [userRatings, setUserRatings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStoresAndRatings();
  }, [profile?.id]);

  const fetchStoresAndRatings = async () => {
    try {
      setLoading(true);

      // Fetch all stores
      const { data: storesData } = await supabase
        .from('stores')
        .select('*')
        .order('name');

      setStores(storesData || []);

      // Fetch user's ratings
      const { data: ratingsData } = await supabase
        .from('ratings')
        .select('store_id, rating')
        .eq('user_id', profile?.id);

      const ratingMap = {};
      ratingsData?.forEach((r) => {
        ratingMap[r.store_id] = r.rating;
      });

      setUserRatings(ratingMap);
    } catch (error) {
      console.error('Error fetching stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingSubmit = async (data) => {
    try {
      const existingRating = Object.keys(userRatings).find(
        (key) => parseInt(key) === data.storeId
      );

      if (existingRating) {
        // Update existing rating
        const { data: rating } = await supabase
          .from('ratings')
          .select('id')
          .eq('store_id', data.storeId)
          .eq('user_id', profile?.id)
          .single();

        await supabase
          .from('ratings')
          .update({ rating: data.rating })
          .eq('id', rating.id);
      } else {
        // Insert new rating
        await supabase.from('ratings').insert([
          {
            store_id: data.storeId,
            user_id: profile?.id,
            rating: data.rating,
          },
        ]);
      }

      await fetchStoresAndRatings();
    } catch (error) {
      console.error('Error submitting rating:', error);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">All Stores</h1>
        <p className="text-gray-600 mt-1">
          Browse and rate stores to help others find the best ones
        </p>
      </div>

      <StoreList
        stores={stores}
        userRatings={userRatings}
        onRatingSubmit={handleRatingSubmit}
        loading={loading}
      />
    </div>
  );
}
