import { useState, useEffect } from 'react';
import StatsCard from '../../components/dashboard/StatsCard';
import RecentRatings from '../../components/dashboard/RecentRatings';
import StoreRating from '../../components/store/StoreRating';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';

export default function OwnerDashboard() {
  const { profile } = useAuth();
  const [store, setStore] = useState(null);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalRatings: 0,
    uniqueRaters: 0,
  });
  const [recentRatings, setRecentRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOwnerData();
  }, [profile?.id]);

  const fetchOwnerData = async () => {
    try {
      setLoading(true);

      // Fetch store owned by this user
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', profile?.id)
        .single();

      if (storeError && storeError.code !== 'PGRST116') throw storeError;

      if (storeData) {
        setStore(storeData);

        // Fetch ratings for this store
        const { data: ratingsData } = await supabase
          .from('ratings')
          .select(`
            id,
            rating,
            created_at,
            users(name)
          `)
          .eq('store_id', storeData.id)
          .order('created_at', { ascending: false });

        const ratings = ratingsData || [];

        // Calculate statistics
        const avgRating =
          ratings.length > 0
            ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(2)
            : 0;

        setStats({
          averageRating: avgRating,
          totalRatings: ratings.length,
          uniqueRaters: new Set(ratings.map((r) => r.users?.id)).size,
        });

        setRecentRatings(
          ratings.map((r) => ({
            store_name: storeData.name,
            user_name: r.users?.name || 'Anonymous',
            rating: r.rating,
            created_at: r.created_at,
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching owner data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="h-12 w-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <p className="text-blue-800">
          No store assigned to your account. Please contact the administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Store Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Manage and analyze your store "{store.name}"
        </p>
      </div>

      {/* Store Info Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{store.name}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="text-lg font-semibold text-gray-900">{store.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Address</p>
            <p className="text-lg font-semibold text-gray-900">{store.address}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Average Rating"
          value={stats.averageRating}
          icon="⭐"
          color="indigo"
        />
        <StatsCard
          title="Total Ratings"
          value={stats.totalRatings}
          icon="📊"
          color="blue"
        />
        <StatsCard
          title="Unique Raters"
          value={stats.uniqueRaters}
          icon="👥"
          color="green"
        />
      </div>

      {/* Detailed Rating Display */}
      {store && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Rating Details</h3>
          <StoreRating store={store} />
        </div>
      )}

      {/* Recent Ratings */}
      <RecentRatings ratings={recentRatings} limit={10} />
    </div>
  );
}
