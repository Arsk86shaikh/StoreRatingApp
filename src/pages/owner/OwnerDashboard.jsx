// src/pages/owner/OwnerDashboard.jsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ownerService } from '../../services/ownerService';
import { Star, Users, BarChart2, Store, RefreshCw } from 'lucide-react';

const StarRow = ({ value }) => (
  <span className="inline-flex gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <span key={i} className={i <= value ? 'text-yellow-400' : 'text-gray-200'}>★</span>
    ))}
  </span>
);

const StatCard = ({ icon: Icon, label, value, color }) => {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    blue:   'bg-blue-50   text-blue-600',
    green:  'bg-green-50  text-green-600',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
};

const Spinner = () => (
  <div className="flex justify-center items-center h-64">
    <span className="h-10 w-10 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
  </div>
);

const ErrorBanner = ({ message, onRetry }) => (
  <div className="bg-red-50 border border-red-200 text-red-700 p-5 rounded-xl">
    <p className="font-semibold mb-1">Failed to load dashboard</p>
    <p className="text-sm mb-3">{message}</p>
    <button onClick={onRetry}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-red-700 underline">
      <RefreshCw className="w-3.5 h-3.5" /> Try again
    </button>
  </div>
);

export default function OwnerDashboard() {
  const { profile } = useAuth();

  const [store, setStore]                 = useState(null);
  const [avgRating, setAvgRating]         = useState(null);
  const [totalRatings, setTotalRatings]   = useState(0);
  const [recentRatings, setRecentRatings] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);

  const fetchDashboard = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await ownerService.getDashboard(profile.id);
      setStore(data.store);
      setAvgRating(data.avgRating);
      setTotalRatings(data.totalRatings);
      setRecentRatings(data.recentRatings);
    } catch (err) {
      console.error('OwnerDashboard:', err);
      setError(err.message || 'Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  if (loading) return <Spinner />;
  if (error)   return <ErrorBanner message={error} onRetry={fetchDashboard} />;

  // Spec: store is created by admin and assigned to the owner — owners don't
  // self-create a store. This is the correct state when no admin has linked one yet.
  if (!store) return (
    <div className="bg-blue-50 border border-blue-200 text-blue-800 p-5 rounded-xl text-sm">
      No store is assigned to your account yet. Contact an administrator to have one created and linked to you.
    </div>
  );

  const avg = avgRating !== null ? Number(avgRating).toFixed(2) : '—';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Store Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Managing "{store.name}"</p>
      </div>

      {/* Store info card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">{store.name}</h2>
            <p className="text-xs text-gray-500">{store.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide font-medium mb-0.5">Address</p>
            <p className="text-gray-800">{store.address}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide font-medium mb-0.5">Average Rating</p>
            <div className="flex items-center gap-2">
              {avgRating !== null && <StarRow value={Math.round(Number(avgRating))} />}
              <span className="font-bold text-gray-900">{avg} / 5</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards — Average Rating + Total Ratings per spec */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard icon={Star}      label="Average Rating" value={avg}          color="indigo" />
        <StatCard icon={BarChart2} label="Total Ratings"  value={totalRatings} color="blue"   />
      </div>

      {/* Spec: "view a list of users who have submitted ratings for their store" */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Users Who Rated Your Store</h3>
          <span className="text-xs text-gray-400">{totalRatings} total</span>
        </div>

        {recentRatings.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-400 text-sm">No ratings yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">User</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Rating</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentRatings.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-900">
                      {r.profiles?.full_name || 'Anonymous'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5">
                        <StarRow value={r.rating} />
                        <span className="font-bold text-gray-700">{r.rating}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {new Date(r.created_at).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}