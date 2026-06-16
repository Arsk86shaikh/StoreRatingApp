import { useState, useEffect } from 'react';
import StatsCard from '../../components/dashboard/StatsCard';
import UserRatingsTable from '../../components/dashboard/UserRatingsTable';
import StoreList from '../../components/store/StoreList';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';

export default function UserDashboard() {
  const { profile } = useAuth();
  const [stores, setStores] = useState([]);
  const [userRatings, setUserRatings] = useState([]);
  const [stats, setStats] = useState({
    totalStores: 0,
    totalRatingsSubmitted: 0,
    averageRating: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [profile?.id]);

  const fetchDashboardData = async () => {
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
        .select(`
          id,
          store_id,
          rating,
          created_at,
          stores(name)
        `)
        .eq('user_id', profile?.id)
        .order('created_at', { ascending: false });

      const ratings = ratingsData || [];
      setUserRatings(ratings);

      // Calculate statistics
      const userRatingMap = {};
      ratings.forEach((r) => {
        userRatingMap[r.store_id] = r.rating;
      });

      const avgRating =
        ratings.length > 0
          ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
          : 0;

      setStats({
        totalStores: storesData?.length || 0,
        totalRatingsSubmitted: ratings.length,
        averageRating: avgRating,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingSubmit = async (data) => {
    try {
      const existingRating = userRatings.find((r) => r.store_id === data.storeId);

      if (existingRating) {
        // Update existing rating
        await supabase
          .from('ratings')
          .update({ rating: data.rating })
          .eq('id', existingRating.id);
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

      await fetchDashboardData();
    } catch (error) {
      console.error('Error submitting rating:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="h-12 w-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  const userRatingMap = {};
  userRatings.forEach((r) => {
    userRatingMap[r.store_id] = r.rating;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {profile?.name}!
        </h1>
        <p className="text-gray-600 mt-1">Rate stores and see average ratings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Total Stores"
          value={stats.totalStores}
          icon="🏪"
          color="indigo"
        />
        <StatsCard
          title="Ratings Submitted"
          value={stats.totalRatingsSubmitted}
          icon="⭐"
          color="blue"
        />
        <StatsCard
          title="Your Average Rating"
          value={parseFloat(stats.averageRating).toFixed(1)}
          icon="📊"
          color="green"
        />
      </div>

      {/* Your Ratings */}
      {userRatings.length > 0 && (
        <UserRatingsTable ratings={userRatings} />
      )}

      {/* Browse Stores */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Browse All Stores</h2>
        <StoreList
          stores={stores}
          userRatings={userRatingMap}
          onRatingSubmit={handleRatingSubmit}
          loading={loading}
        />
      </div>
    </div>
  );
}
