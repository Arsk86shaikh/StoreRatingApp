// src/pages/owner/StoreAnalytics.jsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ownerService } from '../../services/ownerService';
import { ChevronUp, ChevronDown, RefreshCw } from 'lucide-react';

const StarRow = ({ value }) => (
  <span className="inline-flex gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <span key={i} className={`text-lg ${i <= value ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
    ))}
  </span>
);

const Spinner = () => (
  <div className="flex justify-center items-center h-64">
    <span className="h-10 w-10 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
  </div>
);

const ErrorBanner = ({ message, onRetry }) => (
  <div className="bg-red-50 border border-red-200 text-red-700 p-5 rounded-xl">
    <p className="font-semibold mb-1">Failed to load analytics</p>
    <p className="text-sm mb-3">{message}</p>
    <button onClick={onRetry}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-red-700 underline">
      <RefreshCw className="w-3.5 h-3.5" /> Try again
    </button>
  </div>
);

export default function StoreAnalytics() {
  const { profile } = useAuth();

  const [store, setStore]               = useState(null);
  const [ratings, setRatings]           = useState([]);
  const [distribution, setDistribution] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [avgRating, setAvgRating]       = useState(null);
  const [totalRatings, setTotalRatings] = useState(0);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [sortKey, setSortKey]           = useState('created_at');
  const [sortAsc, setSortAsc]           = useState(false);

  const fetchAnalytics = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await ownerService.getAnalytics(profile.id);
      setStore(data.store);
      setAvgRating(data.avgRating);
      setTotalRatings(data.totalRatings);
      setRatings(data.ratings);
      setDistribution(data.distribution);
    } catch (err) {
      console.error('StoreAnalytics:', err);
      setError(err.message || 'Could not load analytics data.');
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortAsc((p) => !p);
    else { setSortKey(key); setSortAsc(true); }
  };

  const SortIndicator = ({ col }) => {
    if (sortKey !== col) return null;
    return sortAsc
      ? <ChevronUp   className="w-3 h-3 inline ml-1 text-indigo-600" />
      : <ChevronDown className="w-3 h-3 inline ml-1 text-indigo-600" />;
  };

  const sorted = [...ratings].sort((a, b) => {
    let av, bv;
    if (sortKey === 'rating') {
      av = a.rating; bv = b.rating;
    } else if (sortKey === 'full_name') {
      av = (a.profiles?.full_name || '').toLowerCase();
      bv = (b.profiles?.full_name || '').toLowerCase();
    } else if (sortKey === 'email') {
      av = (a.profiles?.email || '').toLowerCase();
      bv = (b.profiles?.email || '').toLowerCase();
    } else {
      av = new Date(a.created_at).getTime();
      bv = new Date(b.created_at).getTime();
    }
    if (av < bv) return sortAsc ? -1 : 1;
    if (av > bv) return sortAsc ? 1 : -1;
    return 0;
  });

  if (loading) return <Spinner />;
  if (error)   return <ErrorBanner message={error} onRetry={fetchAnalytics} />;

  if (!store) return (
    <div className="bg-blue-50 border border-blue-200 text-blue-800 p-5 rounded-xl text-sm">
      No store assigned to your account yet. Contact an administrator.
    </div>
  );

  const avg = avgRating !== null ? Number(avgRating).toFixed(2) : '—';
  const maxDist = Math.max(...Object.values(distribution), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Store Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">"{store.name}"</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Average Rating</p>
          <p className="text-3xl font-bold text-gray-900">{avg}</p>
          {avgRating !== null && (
            <div className="flex justify-center mt-1">
              <StarRow value={Math.round(Number(avgRating))} />
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Total Ratings</p>
          <p className="text-3xl font-bold text-gray-900">{totalRatings}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-900 mb-5">Rating Distribution</h2>
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = distribution[star] ?? 0;
            const pct   = Math.round((count / maxDist) * 100);
            return (
              <div key={star} className="flex items-center gap-3 text-sm">
                <span className="w-6 text-right font-semibold text-gray-700">{star}</span>
                <span className="text-yellow-400 text-xs">★</span>
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }} />
                </div>
                <span className="w-6 text-gray-500 text-xs">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Users Who Rated Your Store</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {[
                  { key: 'full_name',  label: 'User'   },
                  { key: 'email',      label: 'Email'  },
                  { key: 'rating',     label: 'Rating' },
                  { key: 'created_at', label: 'Date'   },
                ].map(({ key, label }) => (
                  <th key={key} onClick={() => toggleSort(key)}
                    className="px-5 py-3 text-left font-semibold text-gray-600 cursor-pointer select-none hover:text-gray-900 whitespace-nowrap">
                    {label}<SortIndicator col={key} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-gray-400">No ratings yet.</td>
                </tr>
              ) : sorted.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-gray-900">{r.profiles?.full_name || 'Anonymous'}</td>
                  <td className="px-5 py-3.5 text-gray-500">{r.profiles?.email || '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5">
                      <StarRow value={r.rating} />
                      <span className="font-bold text-gray-700 ml-1">{r.rating}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}