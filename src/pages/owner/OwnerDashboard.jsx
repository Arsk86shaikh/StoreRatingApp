// src/pages/owner/OwnerDashboard.jsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { Star, Users, BarChart2, Store } from 'lucide-react';

const StarRow = ({ value }) => (
  <span className="inline-flex gap-0.5">
    {[1,2,3,4,5].map((i) => (
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
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
};

export default function OwnerDashboard() {
  const { profile } = useAuth();
  const [store, setStore]               = useState(null);
  const [summary, setSummary]           = useState(null);
  const [recentRatings, setRecentRatings] = useState([]);
  const [loading, setLoading]           = useState(true);

  const fetchOwnerData = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      // 1. Get the store owned by this user
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', profile.id)
        .maybeSingle();

      if (storeError) throw storeError;
      if (!storeData) { setLoading(false); return; }
      setStore(storeData);

      // 2. Pull aggregated stats from the summary view
      const { data: summaryData } = await supabase
        .from('store_ratings_summary')          // ← uses the view, not manual calc
        .select('average_rating, total_ratings')
        .eq('store_id', storeData.id)
        .maybeSingle();
      setSummary(summaryData);

      // 3. Recent individual ratings with rater name — profiles not users
      const { data: ratingsData } = await supabase
        .from('ratings')
        .select(`
          id, rating, created_at,
          profiles ( full_name )
        `)                                      // ← fixed: was users(name)
        .eq('store_id', storeData.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentRatings(ratingsData || []);
    } catch (err) {
      console.error('OwnerDashboard fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => { fetchOwnerData(); }, [fetchOwnerData]);

  if (loading) return (
    <div className="flex justify-center items-center h-96">
      <span className="h-10 w-10 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
    </div>
  );

  if (!store) return (
    <div className="bg-blue-50 border border-blue-200 text-blue-800 p-5 rounded-xl">
      No store is assigned to your account yet. Contact an administrator to have one created.
    </div>
  );

  const avg   = summary ? Number(summary.average_rating).toFixed(2) : '—';
  const total = summary?.total_ratings ?? 0;

  // Unique raters counted from the fetched rows (already limited to 10 for display;
  // use total_ratings from the view for the true count)
  const uniqueRaters = new Set(recentRatings.map((r) => r.profiles?.full_name)).size;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Store Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Managing "{store.name}"</p>
      </div>

      {/* Store info */}
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
            <p className="text-gray-800 font-medium">{store.address}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide font-medium mb-0.5">Average Rating</p>
            <div className="flex items-center gap-2">
              {summary && <StarRow value={Math.round(Number(summary.average_rating))} />}
              <span className="font-bold text-gray-900">{avg} / 5</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={Star}     label="Average Rating" value={avg}          color="indigo" />
        <StatCard icon={BarChart2} label="Total Ratings"  value={total}        color="blue"   />
        <StatCard icon={Users}    label="Recent Raters"  value={uniqueRaters} color="green"  />
      </div>

      {/* Recent ratings table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Recent Ratings</h3>
          <span className="text-xs text-gray-400">{total} total</span>
        </div>

        {recentRatings.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            No ratings yet — share your store link to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Rated By</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Rating</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentRatings.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-900">
                      {r.profiles?.full_name || 'Anonymous'}  {/* ← fixed */}
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