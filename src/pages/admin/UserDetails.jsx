// src/pages/admin/UserDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { ArrowLeft, AlertCircle } from 'lucide-react';

const ROLE_BADGE = {
  admin:       'bg-red-100 text-red-700',
  store_owner: 'bg-purple-100 text-purple-700',
  user:        'bg-blue-100 text-blue-700',
};

const ROLE_LABEL = {
  admin:       'Administrator',
  store_owner: 'Store Owner',
  user:        'Normal User',
};

const StarRow = ({ value }) => (
  <span className="inline-flex items-center gap-0.5">
    {[1,2,3,4,5].map((i) => (
      <span key={i} className={i <= value ? 'text-yellow-400' : 'text-gray-200'}>★</span>
    ))}
    <span className="ml-1.5 font-bold text-gray-800 text-sm">{value}</span>
  </span>
);

function InfoRow({ label, value, span = 1 }) {
  return (
    <div className={span === 2 ? 'md:col-span-2' : ''}>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-gray-900 font-semibold break-words">{value || '—'}</p>
    </div>
  );
}

export default function UserDetails() {
  const { userId } = useParams();
  const navigate   = useNavigate();

  const [user,      setUser]      = useState(null);
  const [ratings,   setRatings]   = useState([]);
  const [avgRating, setAvgRating] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    if (!userId) return;

    const run = async () => {
      setLoading(true);
      setFetchError('');

      // ── 1. Fetch profile ──────────────────────────────────
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();         // ← maybeSingle: no error when row is absent

      if (profileError) {
        setFetchError(`Database error: ${profileError.message}`);
        setLoading(false);
        return;
      }

      if (!profile) {
        // Row missing — most likely a pre-trigger user. Show a helpful message.
        setFetchError(
          'Profile row not found. This user exists in Auth but has no profiles record. ' +
          'Run the SQL backfill query in the Supabase dashboard to fix it.'
        );
        setLoading(false);
        return;
      }

      setUser(profile);

      // ── 2. Ratings — branch by role ───────────────────────
      if (profile.role === 'store_owner') {
        const { data: store } = await supabase
          .from('stores')
          .select('id, name')
          .eq('owner_id', userId)
          .maybeSingle();

        if (store) {
          const [{ data: summary }, { data: ratingRows }] = await Promise.all([
            supabase
              .from('store_ratings_summary')
              .select('average_rating, total_ratings')
              .eq('store_id', store.id)
              .maybeSingle(),
            supabase
              .from('ratings')
              .select('id, rating, created_at, profiles ( full_name )')
              .eq('store_id', store.id)
              .order('created_at', { ascending: false }),
          ]);

          setAvgRating(summary);
          setRatings(ratingRows || []);
        }
      } else if (profile.role === 'user') {
        const { data: ratingRows } = await supabase
          .from('ratings')
          .select('id, rating, created_at, stores ( name )')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        setRatings(ratingRows || []);
      }
      // admin role: no ratings to show

      setLoading(false);
    };

    run();
  }, [userId]);

  // ── Loading ───────────────────────────────────────────────
  if (loading) return (
    <div className="flex justify-center items-center h-96">
      <span className="h-10 w-10 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
    </div>
  );

  // ── Error / not found ─────────────────────────────────────
  if (fetchError) return (
    <div className="space-y-4 max-w-2xl">
      <button
        onClick={() => navigate('/admin/users')}
        className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Users
      </button>
      <div className="flex items-start gap-3 p-5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold mb-1">Could not load user</p>
          <p className="text-red-600">{fetchError}</p>
        </div>
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-3xl">
      <button
        onClick={() => navigate('/admin/users')}
        className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Users
      </button>

      {/* Profile card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl font-bold flex-shrink-0">
            {user.full_name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{user.full_name}</h1>
            <span className={`inline-flex mt-1 px-2.5 py-0.5 text-xs font-semibold rounded-full ${ROLE_BADGE[user.role]}`}>
              {ROLE_LABEL[user.role] || user.role}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <InfoRow label="Email"        value={user.email} />
          <InfoRow label="Address"      value={user.address} span={2} />
          <InfoRow label="Member since" value={new Date(user.created_at).toLocaleDateString()} />
          <InfoRow label="Last updated" value={new Date(user.updated_at).toLocaleDateString()} />

          {user.role === 'store_owner' && avgRating && (
            <>
              <InfoRow
                label="Store average rating"
                value={`${Number(avgRating.average_rating).toFixed(2)} / 5`}
              />
              <InfoRow
                label="Total ratings received"
                value={String(avgRating.total_ratings)}
              />
            </>
          )}

          {user.role === 'admin' && (
            <div className="md:col-span-2 mt-1 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 font-medium">
              Administrator accounts do not submit ratings.
            </div>
          )}
        </div>
      </div>

      {/* Ratings table */}
      {ratings.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">
              {user.role === 'store_owner' ? 'Ratings received' : 'Ratings submitted'}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">
                    {user.role === 'store_owner' ? 'Rated by' : 'Store'}
                  </th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Rating</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ratings.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-gray-900 font-medium">
                      {user.role === 'store_owner'
                        ? r.profiles?.full_name || 'Anonymous'
                        : r.stores?.name        || 'Unknown store'}
                    </td>
                    <td className="px-5 py-3.5">
                      <StarRow value={r.rating} />
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
        </div>
      )}

      {/* Empty state for users with no ratings yet */}
      {ratings.length === 0 && user.role !== 'admin' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-400 text-sm">
          {user.role === 'store_owner'
            ? 'No ratings received yet for this store.'
            : 'This user has not submitted any ratings yet.'}
        </div>
      )}
    </div>
  );
}