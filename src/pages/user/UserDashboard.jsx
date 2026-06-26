import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import StatsCard from '../../components/dashboard/StatsCard';
import UserRatingsTable from '../../components/dashboard/UserRatingsTable';
import StoreList from '../../components/store/StoreList';

export default function UserDashboard() {
  const navigate = useNavigate();
  const { profile, user, loading: authLoading, isAuthenticated } = useAuth();

  const [stores, setStores] = useState([]);
  const [userRatings, setUserRatings] = useState([]);
  const [stats, setStats] = useState({
    totalStores: 0,
    totalRatingsSubmitted: 0,
    averageRating: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // BUG 9 FIX: only redirect after auth has finished loading AND we have
  // confirmed there is no session at all. Redirecting on !user alone would
  // fire during the brief window where user is null but auth is still loading.
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // BUG 4 FIX: wrap in useCallback so the function reference is stable.
  // Passing it as a dep to useEffect is now safe — won't cause infinite loops.
  const fetchDashboardData = useCallback(async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      setError(null);

      // BUG 1 FIX: removed `category` and `phone` — those columns do not exist
      // in the schema. Only select columns that actually exist in public.stores.
      // BUG 8 FIX: query stores_with_rating view (created in schema) instead of
      // the raw stores table so avg_rating and total_ratings come back already
      // computed — StoreList can display per-store ratings without extra queries.
      const { data: storesData, error: storesError } = await supabase
        .from('stores_with_rating')
        .select('id, name, email, address, avg_rating, total_ratings')
        .order('name', { ascending: true });

      if (storesError) throw storesError;
      setStores(storesData || []);

      // Fetch this user's ratings joined with store name/address for the table
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

      if (ratingsError) throw ratingsError;

      const ratings = ratingsData || [];
      setUserRatings(ratings);

      // Stats: calculate from fetched data
      const avgRating =
        ratings.length > 0
          ? ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratings.length
          : 0;

      setStats({
        totalStores: storesData?.length || 0,
        totalRatingsSubmitted: ratings.length,
        // BUG 10 FIX: store as number here; format only at render time (once)
        averageRating: avgRating,
      });
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (!authLoading && profile?.id) {
      fetchDashboardData();
    }
  }, [authLoading, profile?.id, fetchDashboardData]);

  const handleRatingSubmit = async ({ storeId, rating }) => {
    try {
      const existingRating = userRatings.find((r) => r.store_id === storeId);

      if (existingRating) {
        // BUG 6+7 FIX: don't set updated_at manually — the DB trigger
        // (trg_ratings_updated_at) handles this server-side, consistently.
        const { error } = await supabase
          .from('ratings')
          .update({ rating })
          .eq('id', existingRating.id);

        if (error) throw error;
      } else {
        // BUG 6+7 FIX: don't set created_at manually either — let the DB default.
        const { error } = await supabase
          .from('ratings')
          .insert([{ store_id: storeId, user_id: profile.id, rating }]);

        if (error) throw error;
      }

      // Refresh all data so stats, ratings table, and store list stay in sync
      await fetchDashboardData();
    } catch (err) {
      setError('Failed to submit rating. Please try again.');
      throw err;
    }
  };

  // BUG 2+3 FIX: removed min-h-screen from loading/error states.
  // This page renders inside DashboardLayout's <main> which already controls
  // height — min-h-screen would push content outside the layout bounds.
  if (authLoading || (loading && !stores.length)) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
        <p className="text-gray-500 font-medium">Loading your dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="text-4xl">⚠️</div>
        <h2 className="text-xl font-bold text-gray-900">Something went wrong</h2>
        <p className="text-gray-500 max-w-sm">{error}</p>
        <button
          onClick={() => { setError(null); fetchDashboardData(); }}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Build rating map for O(1) lookup in StoreList
  const userRatingMap = Object.fromEntries(
    userRatings.map((r) => [r.store_id, r.rating])
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl p-6 text-white shadow-md">
        <h1 className="text-2xl font-bold mb-1">
          Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}! 👋
        </h1>
        <p className="text-indigo-100 text-sm">
          Rate your favourite stores and help others find the best places.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          title="Your Avg Rating"
          value={stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '—'}
          icon="📊"
          color="green"
          subtitle="Out of 5.0"
        />
      </div>

      {/* Ratings you've submitted */}
      {userRatings.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Your Ratings</h2>
            <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-sm font-medium">
              {userRatings.length} {userRatings.length === 1 ? 'rating' : 'ratings'}
            </span>
          </div>
          <UserRatingsTable ratings={userRatings} />
        </div>
      )}

      {/* All stores */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Browse All Stores</h2>
          <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
            {stores.length} {stores.length === 1 ? 'store' : 'stores'}
          </span>
        </div>

        {stores.length > 0 ? (
          <StoreList
            stores={stores}
            userRatings={userRatingMap}
            onRatingSubmit={handleRatingSubmit}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">📭 No stores available yet</p>
            <p className="text-gray-400 text-sm mt-1">Check back later for new stores</p>
          </div>
        )}
      </div>
    </div>
  );
}