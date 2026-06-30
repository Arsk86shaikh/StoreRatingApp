import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ownerService } from '../../services/ownerService';
import { Star, Users, BarChart2, Store, AlertCircle, RefreshCw } from 'lucide-react';

// ─── Helpers ───────────────────────────────────────────────────────────────────
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
    <button
      onClick={onRetry}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-red-700 underline"
    >
      <RefreshCw className="w-3.5 h-3.5" /> Try again
    </button>
  </div>
);

// ─── Create store form ─────────────────────────────────────────────────────────
function CreateStoreForm({ ownerId, onCreated }) {
  const [form, setForm]               = useState({ name: '', email: '', address: '' });
  const [errors, setErrors]           = useState({});
  const [loading, setLoading]         = useState(false);
  const [serverError, setServerError] = useState('');

  const validate = () => {
    const e = {};
    if (!form.name.trim())                 e.name    = 'Store name is required';
    else if (form.name.trim().length < 3)  e.name    = 'Name must be at least 3 characters';
    else if (form.name.trim().length > 60) e.name    = 'Name must not exceed 60 characters';
    if (!form.email.trim())                e.email   = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email address';
    if (!form.address.trim())              e.address = 'Address is required';
    else if (form.address.length > 400)    e.address = 'Address must not exceed 400 characters';
    return e;
  };

  const handleChange = (key) => (e) => {
    setForm((p) => ({ ...p, [key]: e.target.value }));
    setErrors((p) => ({ ...p, [key]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setServerError('');
    try {
      const newStore = await ownerService.createStore(ownerId, form);
      onCreated(newStore);
    } catch (err) {
      setServerError(err.message || 'Failed to create store. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (key) =>
    `w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-all ${
      errors[key]
        ? 'border-red-400 bg-red-50'
        : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'
    }`;

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Set up your store</h2>
            <p className="text-sm text-gray-500">Create your profile to start receiving ratings</p>
          </div>
        </div>

        {serverError && (
          <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
            <input type="text" value={form.name} onChange={handleChange('name')}
              placeholder="e.g. Raheman Coffee Shop Downtown" className={inputClass('name')} />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Store Email</label>
            <input type="email" value={form.email} onChange={handleChange('email')}
              placeholder="store@example.com" className={inputClass('email')} />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Store Address</label>
            <textarea value={form.address} onChange={handleChange('address')}
              placeholder="123 Main Street, City, State 00000" rows={3}
              className={`${inputClass('address')} resize-none`} />
            {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors">
            {loading ? 'Creating store…' : 'Create Store'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Main dashboard ────────────────────────────────────────────────────────────
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
      setError(err.message || 'Could not reach the server. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  if (loading) return <Spinner />;
  if (error)   return <ErrorBanner message={error} onRetry={fetchDashboard} />;

  if (!store) return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Store Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Welcome, {profile?.full_name?.split(' ')[0]}! You don't have a store yet.
        </p>
      </div>
      <CreateStoreForm
        ownerId={profile.id}
        onCreated={(newStore) => {
          setStore(newStore);
          setAvgRating(null);
          setTotalRatings(0);
          setRecentRatings([]);
        }}
      />
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

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={Star}      label="Average Rating" value={avg}          color="indigo" />
        <StatCard icon={BarChart2} label="Total Ratings"  value={totalRatings} color="blue"   />
        <StatCard icon={Users}     label="Total Raters"   value={totalRatings} color="green"  />
      </div>

      {/* Recent ratings table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Recent Ratings</h3>
          <span className="text-xs text-gray-400">{totalRatings} total</span>
        </div>

        {recentRatings.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-400 text-sm">No ratings yet.</p>
            <p className="text-gray-400 text-xs mt-1">Share your store with customers to get started.</p>
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