import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatsCard from '../../components/dashboard/StatsCard';
import UserRatingsTable from '../../components/dashboard/UserRatingsTable';
import StoreList from '../../components/store/StoreList';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';

export default function UserDashboard() {
  const navigate = useNavigate();
  const { profile, loading: authLoading, user } = useAuth();
  const [stores, setStores] = useState([]);
  const [userRatings, setUserRatings] = useState([]);
  const [stats, setStats] = useState({
    totalStores: 0,
    totalRatingsSubmitted: 0,
    averageRating: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log('🔍 UserDashboard Debug:', {
    authLoading,
    profile,
    user,
    profileId: profile?.id,
  });

  // Check if user is logged in and has permission
  useEffect(() => {
    if (!authLoading && !user) {
      console.warn('❌ No user found, redirecting to login');
      navigate('/login', { replace: true });
    }
  }, [authLoading, user, navigate]);

  // Fetch dashboard data when profile is ready
  useEffect(() => {
    if (!authLoading && profile?.id) {
      console.log('📊 Starting dashboard data fetch for user:', profile.id);
      fetchDashboardData();
    }
  }, [profile?.id, authLoading]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('⏳ Fetching dashboard data...');

      // Fetch all stores
      console.log('📦 Fetching stores...');
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('id, name, address, category, phone, email')
        .order('name', { ascending: true });

      if (storesError) {
        console.error('❌ Stores fetch error:', storesError);
        throw storesError;
      }
      console.log('✅ Stores fetched:', storesData?.length || 0);
      setStores(storesData || []);

      // Fetch user's ratings with store details
      console.log('⭐ Fetching user ratings for user:', profile.id);
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('ratings')
        .select(`
          id,
          store_id,
          rating,
          created_at,
          stores:store_id (
            id,
            name,
            address
          )
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (ratingsError) {
        console.error('❌ Ratings fetch error:', ratingsError);
        throw ratingsError;
      }
      console.log('✅ Ratings fetched:', ratingsData?.length || 0);

      const ratings = ratingsData || [];
      setUserRatings(ratings);

      // Calculate statistics
      const avgRating =
        ratings.length > 0
          ? (ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratings.length).toFixed(1)
          : 0;

      const calculatedStats = {
        totalStores: storesData?.length || 0,
        totalRatingsSubmitted: ratings.length,
        averageRating: parseFloat(avgRating) || 0,
      };

      console.log('📈 Calculated stats:', calculatedStats);
      setStats(calculatedStats);
    } catch (err) {
      console.error('❌ Dashboard fetch error:', err);
      setError(err.message || 'Failed to load dashboard data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingSubmit = async (data) => {
    try {
      console.log('💾 Submitting rating:', data);
      const existingRating = userRatings.find((r) => r.store_id === data.storeId);

      if (existingRating) {
        console.log('🔄 Updating existing rating:', existingRating.id);
        // Update existing rating
        const { error } = await supabase
          .from('ratings')
          .update({ rating: data.rating, updated_at: new Date().toISOString() })
          .eq('id', existingRating.id);

        if (error) throw error;
      } else {
        console.log('✨ Creating new rating');
        // Insert new rating
        const { error } = await supabase.from('ratings').insert([
          {
            store_id: data.storeId,
            user_id: profile.id,
            rating: data.rating,
            created_at: new Date().toISOString(),
          },
        ]);

        if (error) throw error;
      }

      console.log('✅ Rating submitted successfully');
      // Refresh dashboard
      await fetchDashboardData();
    } catch (err) {
      console.error('❌ Rating submit error:', err);
      setError('Failed to submit rating. Please try again.');
      throw err;
    }
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchDashboardData();
            }}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Create rating map for quick lookups
  const userRatingMap = {};
  userRatings.forEach((r) => {
    userRatingMap[r.store_id] = r.rating;
  });

  return (
    <div className="space-y-6 pb-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg shadow-lg p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">
          Welcome, {profile?.full_name || 'User'}! 👋
        </h1>
        <p className="text-indigo-100">
          Rate your favorite stores and help others find the best places in town
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Total Stores"
          value={stats.totalStores}
          icon="🏪"
          color="indigo"
          subtitle="Available to rate"
        />
        <StatsCard
          title="Ratings Submitted"
          value={stats.totalRatingsSubmitted}
          icon="⭐"
          color="blue"
          subtitle="Your contributions"
        />
        <StatsCard
          title="Your Average Rating"
          value={stats.averageRating.toFixed(1)}
          icon="📊"
          color="green"
          subtitle="Out of 5.0"
        />
      </div>

      {/* Your Ratings Section */}
      {userRatings.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Your Ratings</h2>
            <span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-sm font-medium">
              {userRatings.length} ratings
            </span>
          </div>
          <UserRatingsTable ratings={userRatings} />
        </div>
      )}

      {/* Browse All Stores Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Browse All Stores</h2>
          <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
            {stores.length} stores
          </span>
        </div>

        {stores.length > 0 ? (
          <StoreList
            stores={stores}
            userRatings={userRatingMap}
            onRatingSubmit={handleRatingSubmit}
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg">📭 No stores available at the moment</p>
            <p className="text-gray-400 text-sm mt-2">Check back later for new stores</p>
          </div>
        )}
      </div>
    </div>
  );
}