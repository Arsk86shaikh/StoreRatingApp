// src/pages/user/StoresPage.jsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import StoreList from '../../components/store/StoreList';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';

export default function StoresPage() {
  const { profile } = useAuth();
  const [stores, setStores]           = useState([]);
  const [userRatings, setUserRatings] = useState({});
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [search, setSearch]           = useState('');

  const fetchStoresAndRatings = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    setError('');
    try {
      // Use the view so Overall Rating data is already attached to each store
      const { data: storesData, error: storesError } = await supabase
        .from('stores_with_rating')
        .select('id, name, email, address, average_rating, rating_count')
        .order('name', { ascending: true });

      if (storesError) throw storesError;
      setStores(storesData || []);

      const { data: ratingsData, error: ratingsError } = await supabase
        .from('ratings')
        .select('store_id, rating')
        .eq('user_id', profile.id);

      if (ratingsError) throw ratingsError;

      const ratingMap = {};
      (ratingsData || []).forEach((r) => { ratingMap[r.store_id] = r.rating; });
      setUserRatings(ratingMap);
    } catch (err) {
      console.error('Error fetching stores:', err.message);
      setError('Failed to load stores. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => { fetchStoresAndRatings(); }, [fetchStoresAndRatings]);

  // Spec: "Can search for stores by Name and Address" — client-side filter
  // over the already-fetched list, no extra round trip per keystroke.
  const filteredStores = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return stores;
    return stores.filter((s) =>
      s.name?.toLowerCase().includes(term) ||
      s.address?.toLowerCase().includes(term)
    );
  }, [stores, search]);

  const handleRatingSubmit = async ({ storeId, rating }) => {
    if (!profile?.id) return;
    try {
      // 1 to 5 enforced by the DB CHECK constraint too, but guard here
      // so a bad value never even reaches the network call.
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5.');
      }

      const hasExisting = userRatings[storeId] !== undefined;

      if (hasExisting) {
        const { data: existingRow, error: findErr } = await supabase
          .from('ratings')
          .select('id')
          .eq('store_id', storeId)
          .eq('user_id', profile.id)
          .maybeSingle();

        if (findErr) throw findErr;
        if (!existingRow) throw new Error('Could not find your existing rating to update.');

        const { error: updateErr } = await supabase
          .from('ratings')
          .update({ rating, updated_at: new Date().toISOString() })
          .eq('id', existingRow.id);

        if (updateErr) throw updateErr;
      } else {
        const { error: insertErr } = await supabase
          .from('ratings')
          .insert([{ store_id: storeId, user_id: profile.id, rating }]);

        if (insertErr) throw insertErr;
      }

      // Optimistic local update so the table feels instant, then
      // resync with the server to pick up the new overall average.
      setUserRatings((prev) => ({ ...prev, [storeId]: rating }));
      await fetchStoresAndRatings();
    } catch (err) {
      console.error('Error submitting rating:', err.message);
      throw err; // let StoreList show its own inline error if it handles one
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">All Stores</h1>
        <p className="text-gray-500 text-sm mt-1">
          Browse and rate stores to help others find the best ones
        </p>
      </div>

      {/* Search by Name and Address — per spec */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
          Search
        </label>
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by store name or address…"
            className="w-full pl-10 pr-9 py-2.5 rounded-lg border border-gray-200 text-sm outline-none
              focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {search && (
          <p className="mt-2 text-xs text-gray-400">
            {filteredStores.length} of {stores.length} stores match "{search}"
          </p>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      <StoreList
        stores={filteredStores}
        userRatings={userRatings}
        onRatingSubmit={handleRatingSubmit}
        loading={loading}
      />

      {!loading && filteredStores.length === 0 && stores.length > 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <p className="text-gray-400">No stores match "{search}".</p>
        </div>
      )}
    </div>
  );
}