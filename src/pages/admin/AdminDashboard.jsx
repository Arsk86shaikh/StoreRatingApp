import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import StatsCard from '../../components/dashboard/StatsCard';
import RecentRatings from '../../components/dashboard/RecentRatings';
import { supabase } from '../../services/supabase';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStores: 0,
    totalRatings: 0,
  });
  const [recentRatings, setRecentRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // AD-5 FIX

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // AD-1 FIX: query profiles, not users — there is no users table
      const { count: usersCount, error: usersErr } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      if (usersErr) throw usersErr;

      const { count: storesCount, error: storesErr } = await supabase
        .from('stores')
        .select('*', { count: 'exact', head: true });
      if (storesErr) throw storesErr;

      const { count: ratingsCount, error: ratingsErr } = await supabase
        .from('ratings')
        .select('*', { count: 'exact', head: true });
      if (ratingsErr) throw ratingsErr;

      // AD-2+3 FIX: join profiles (not users), select full_name (not name)
      const { data: ratings, error: recentErr } = await supabase
        .from('ratings')
        .select(`
          id,
          rating,
          created_at,
          stores ( name ),
          profiles ( full_name )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentErr) throw recentErr;

      setStats({
        totalUsers: usersCount || 0,
        totalStores: storesCount || 0,
        totalRatings: ratingsCount || 0,
      });

      setRecentRatings(
        (ratings || []).map((r) => ({
          store_name: r.stores?.name || 'Unknown Store',
          user_name: r.profiles?.full_name || 'Anonymous',
          rating: r.rating,
          created_at: r.created_at,
        }))
      );
    } catch (err) {
      console.error('Error fetching dashboard data:', err.message);
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="h-12 w-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  // AD-5 FIX: show error instead of silently rendering zeros
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-5 rounded-xl">
        <p className="font-semibold mb-1">Failed to load dashboard</p>
        <p className="text-sm mb-3">{error}</p>
        <button onClick={fetchDashboardData} className="text-sm font-medium text-red-700 underline">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to the administration panel</p>
      </div>

      {/* Stats — matches spec: total users, total stores, total ratings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard title="Total Users"   value={stats.totalUsers}   icon="👥" color="indigo" />
        <StatsCard title="Total Stores"  value={stats.totalStores}  icon="🏪" color="blue" />
        <StatsCard title="Total Ratings" value={stats.totalRatings} icon="⭐" color="green" />
      </div>

      <div>
        <RecentRatings ratings={recentRatings} limit={10} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {/* AD-4 FIX: Link instead of <a href> — no full page reload,
                preserves AuthContext state and React Router history */}
            <Link
              to="/admin/users"
              className="block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-center"
            >
              Manage Users
            </Link>
            <Link
              to="/admin/stores"
              className="block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-center"
            >
              Manage Stores
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">System Status</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Database:</span>
              <span className="text-green-600 font-medium">Connected</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Last Sync:</span>
              <span className="text-gray-600">Just now</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}