// src/pages/owner/OwnerAnalytics.jsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { ChevronUp, ChevronDown } from 'lucide-react';

const StarRow = ({ value }) => (
  <span className="inline-flex gap-0.5">
    {[1,2,3,4,5].map((i) => (
      <span key={i} className={`text-lg ${i <= value ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
    ))}
  </span>
);

export default function OwnerAnalytics() {
  const { profile } = useAuth();
  const [store, setStore]     = useState(null);
  const [ratings, setRatings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState('created_at');
  const [sortAsc, setSortAsc] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const { data: storeData } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', profile.id)
        .maybeSingle();

      if (!storeData) { setLoading(false); return; }
      setStore(storeData);

      // Summary from the view
      const { data: summaryData } = await supabase
        .from('store_ratings_summary')
        .select('average_rating, total_ratings')
        .eq('store_id', storeData.id)
        .maybeSingle();
      setSummary(summaryData);

      // Individual ratings — profiles not users, full_name not name
      const { data: ratingsData } = await supabase
        .from('ratings')
        .select(`
          id, rating, created_at,
          profiles ( full_name, email )
        `)                                    // ← fixed: was users(name, email)
        .eq('store_id', storeData.id);

      setRatings(ratingsData || []);
    } catch (err) {
      console.error('OwnerAnalytics fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortAsc((p) => !p);
    else { setSortKey(key); setSortAsc(true); }
  };

  const SortIcon = ({ col }) =>
    sortKey !== col ? null : sortAsc
      ? <ChevronUp className="w-3 h-3 inline ml-1" />
      : <ChevronDown className="w-3 h-3 inline ml-1" />;

  const sorted = [...ratings].sort((a, b) => {
    let av, bv;
    if (sortKey === 'rating') {
      av = a.rating; bv = b.rating;
    } else if (sortKey === 'full_name') {
      av = (a.profiles?.full_name || '').toLowerCase();   // ← fixed
      bv = (b.profiles?.full_name || '').toLowerCase();
    } else {
      av = new Date(a.created_at);
      bv = new Date(b.created_at);
    }
    if (av < bv) return sortAsc ? -1 : 1;
    if (av > bv) return sortAsc ? 1 : -1;
    return 0;
  });

  const distribution = { 5:0, 4:0, 3:0, 2:0, 1:0 };
  ratings.forEach((r) => { distribution[r.rating]++; });
  const maxDist = Math.max(...Object.values(distribution), 1);

  if (loading) return (
    <div className="flex justify-center items-center h-96">
      <span className="h-10 w-10 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
    </div>
  );

  if (!store) return (
    <div className="bg-blue-50 border border-blue-200 text-blue-800 p-5 rounded-xl text-sm">
      No store assigned to your account.
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Store Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">"{store.name}"</p>
      </div>

      {/* Summary row */}
      {summary && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Average Rating</p>
            <p className="text-3xl font-bold text-gray-900">{Number(summary.average_rating).toFixed(2)}</p>
            <div className="flex justify-center mt-1">
              <StarRow value={Math.round(Number(summary.average_rating))} />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Total Ratings</p>
            <p className="text-3xl font-bold text-gray-900">{summary.total_ratings}</p>
            <p className="text-xs text-gray-400 mt-1">from {ratings.length} users</p>
          </div>
        </div>
      )}

      {/* Rating distribution — visual bar chart */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-900 mb-5">Rating Distribution</h2>
        <div className="space-y-3">
          {[5,4,3,2,1].map((star) => {
            const count = distribution[star];
            const pct = Math.round((count / maxDist) * 100);
            return (
              <div key={star} className="flex items-center gap-3 text-sm">
                <span className="w-6 text-right font-semibold text-gray-700">{star}</span>
                <span className="text-yellow-400 text-xs">★</span>
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-6 text-gray-500 text-xs">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ratings table with clickable sort headers */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">All Ratings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {[
                  { key: 'full_name', label: 'User' },
                  { key: 'email',     label: 'Email' },
                  { key: 'rating',    label: 'Rating' },
                  { key: 'created_at',label: 'Date' },
                ].map(({ key, label }) => (
                  <th
                    key={key}
                    onClick={() => toggleSort(key)}
                    className="px-5 py-3 text-left font-semibold text-gray-600 cursor-pointer select-none hover:text-gray-900"
                  >
                    {label}<SortIcon col={key} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-gray-400">
                    No ratings yet.
                  </td>
                </tr>
              ) : sorted.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-gray-900">
                    {r.profiles?.full_name || 'Anonymous'}   {/* ← fixed */}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">
                    {r.profiles?.email || '—'}               {/* ← fixed */}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5">
                      <StarRow value={r.rating} />
                      <span className="font-bold text-gray-700 ml-1">{r.rating}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">
                    {new Date(r.created_at).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
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