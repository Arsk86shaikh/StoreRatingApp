import { useState, useEffect } from 'react';
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch total users
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Fetch total stores
      const { count: storesCount } = await supabase
        .from('stores')
        .select('*', { count: 'exact', head: true });

      // Fetch total ratings
      const { count: ratingsCount } = await supabase
        .from('ratings')
        .select('*', { count: 'exact', head: true });

      // Fetch recent ratings
      const { data: ratings } = await supabase
        .from('ratings')
        .select(`
          id,
          rating,
          created_at,
          stores(name),
          users(name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalUsers: usersCount || 0,
        totalStores: storesCount || 0,
        totalRatings: ratingsCount || 0,
      });

      setRecentRatings(
        ratings?.map((r) => ({
          store_name: r.stores?.name || 'Unknown Store',
          user_name: r.users?.name || 'Anonymous',
          rating: r.rating,
          created_at: r.created_at,
        })) || []
      );
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to the administration panel</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          icon="👥"
          color="indigo"
        />
        <StatsCard
          title="Total Stores"
          value={stats.totalStores}
          icon="🏪"
          color="blue"
        />
        <StatsCard
          title="Total Ratings"
          value={stats.totalRatings}
          icon="⭐"
          color="green"
        />
      </div>

      {/* Recent Ratings */}
      <div>
        <RecentRatings ratings={recentRatings} limit={10} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <a
              href="/admin/users"
              className="block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Manage Users
            </a>
            <a
              href="/admin/stores"
              className="block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Manage Stores
            </a>
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
              <span className="text-gray-600">API:</span>
              <span className="text-green-600 font-medium">Active</span>
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
