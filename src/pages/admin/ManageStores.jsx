import { useState, useEffect, useCallback } from 'react';
import { Plus, X, AlertCircle, ChevronUp, ChevronDown, UserCheck, Pencil } from 'lucide-react';
import { storeService } from '../../services/storeService';
import { supabase } from '../../services/supabase';

const EMPTY_FORM = { name: '', email: '', address: '', owner_id: '' };

export default function ManageStores() {
  const [stores,          setStores]          = useState([]);
  const [owners,          setOwners]          = useState([]);
  const [search,          setSearch]          = useState('');
  const [sortKey,         setSortKey]         = useState('name');
  const [sortAsc,         setSortAsc]         = useState(true);
  const [loading,         setLoading]         = useState(true);
  const [showAddModal,    setShowAddModal]    = useState(false);
  const [form,            setForm]            = useState(EMPTY_FORM);
  const [formErrors,      setFormErrors]      = useState({});
  const [serverError,     setServerError]     = useState('');
  const [saving,          setSaving]          = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignStore,     setAssignStore]     = useState(null);
  const [assignOwnerId,   setAssignOwnerId]   = useState('');
  const [assignSaving,    setAssignSaving]    = useState(false);
  const [assignError,     setAssignError]     = useState('');
  const [successMsg,      setSuccessMsg]      = useState('');

  const flash = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 4000); };

  const fetchStores = useCallback(async () => {
    setLoading(true);
    try {
      // storeService.getAllStores uses stores_with_rating view, which
      // returns avg_rating + total_ratings (NOT average_rating/rating_count)
      const data = await storeService.getAllStores();
      const ownerIds = [...new Set(data.map((s) => s.owner_id).filter(Boolean))];
      let ownerMap = {};
      if (ownerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', ownerIds);
        (profiles || []).forEach((p) => { ownerMap[p.id] = p; });
      }
      setStores(data.map((s) => ({ ...s, ownerProfile: ownerMap[s.owner_id] || null })));
    } catch (err) {
      console.error('fetchStores:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOwners = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'store_owner')
      .order('full_name');
    setOwners(data || []);
  }, []);

  useEffect(() => { fetchStores(); fetchOwners(); }, [fetchStores, fetchOwners]);

  // MS-1+2+3 FIX: use avg_rating / total_ratings — the real column names
  // from stores_with_rating. The previous average_rating/rating_count keys
  // don't exist on the returned rows, so they were always undefined.
  const displayed = stores
    .filter((s) => {
      const t = search.toLowerCase();
      return !t || s.name?.toLowerCase().includes(t) ||
        s.email?.toLowerCase().includes(t) ||
        s.address?.toLowerCase().includes(t);
    })
    .sort((a, b) => {
      const av = sortKey === 'avg_rating'
        ? (a.avg_rating || 0)
        : (a[sortKey] || '').toString().toLowerCase();
      const bv = sortKey === 'avg_rating'
        ? (b.avg_rating || 0)
        : (b[sortKey] || '').toString().toLowerCase();
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });

  const toggleSort = (key) => {
    if (sortKey === key) setSortAsc((p) => !p);
    else { setSortKey(key); setSortAsc(true); }
  };

  const SortIcon = ({ col }) =>
    sortKey !== col ? null : sortAsc
      ? <ChevronUp   className="w-3 h-3 inline ml-1" />
      : <ChevronDown className="w-3 h-3 inline ml-1" />;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setFormErrors((p) => ({ ...p, [name]: '' }));
    setServerError('');
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim())    errs.name    = 'Store name is required';
    else if (form.name.trim().length > 60) errs.name = 'Max 60 characters';
    if (!form.email)          errs.email   = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    if (!form.address.trim()) errs.address = 'Address is required';
    else if (form.address.trim().length > 400) errs.address = 'Max 400 characters';
    return errs;
  };

  const handleAddStore = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSaving(true);
    setServerError('');
    try {
      await storeService.createStore({
        name:     form.name.trim(),
        email:    form.email.trim(),
        address:  form.address.trim(),
        owner_id: form.owner_id || null,
      });
      flash(`Store "${form.name.trim()}" added.`);
      closeAddModal();
      await fetchStores();
    } catch (err) {
      setServerError(err.message || 'Failed to add store.');
    } finally {
      setSaving(false);
    }
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setServerError('');
  };

  const openAssignModal = (store) => {
    setAssignStore(store);
    setAssignOwnerId(store.owner_id || '');
    setAssignError('');
    setShowAssignModal(true);
  };

  const handleAssignOwner = async (e) => {
    e.preventDefault();
    if (!assignStore) return;
    setAssignSaving(true);
    setAssignError('');
    try {
      await storeService.updateStore(assignStore.id, { owner_id: assignOwnerId || null });
      const ownerName = owners.find((o) => o.id === assignOwnerId)?.full_name || 'nobody';
      flash(assignOwnerId
        ? `"${assignStore.name}" assigned to ${ownerName}.`
        : `Owner removed from "${assignStore.name}".`);
      setShowAssignModal(false);
      await fetchStores();
    } catch (err) {
      setAssignError(err.message || 'Failed to assign owner.');
    } finally {
      setAssignSaving(false);
    }
  };

  const inputCls = (name) =>
    `w-full px-3 py-2 rounded-lg border text-sm outline-none transition-all
    ${formErrors[name]
      ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200'
      : 'border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'}`;

  if (loading) return (
    <div className="flex justify-center items-center h-96">
      <span className="h-10 w-10 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Stores</h1>
          <p className="text-gray-500 text-sm mt-1">{stores.length} registered stores</p>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Store
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-3.5 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">
          <span>✓</span> {successMsg}
        </div>
      )}

      {owners.length === 0 && (
        <div className="flex items-start gap-2.5 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          No store owner accounts exist yet. Create one in Manage Users, then assign them here.
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Search</label>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Name, email or address…"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {[
                  { key: 'name',        label: 'Store Name' },
                  { key: 'email',       label: 'Email' },
                  { key: 'address',     label: 'Address' },
                  { key: 'avg_rating',  label: 'Avg Rating' },
                ].map(({ key, label }) => (
                  <th key={key} onClick={() => toggleSort(key)}
                    className="px-5 py-3 text-left font-semibold text-gray-600 cursor-pointer select-none hover:text-gray-900">
                    {label}<SortIcon col={key} />
                  </th>
                ))}
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Ratings</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Owner</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                    {search ? 'No stores match.' : 'No stores yet.'}
                  </td>
                </tr>
              ) : displayed.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-gray-900">{s.name}</td>
                  <td className="px-5 py-3.5 text-gray-600">{s.email}</td>
                  <td className="px-5 py-3.5 text-gray-500 max-w-[160px] truncate">{s.address}</td>
                  <td className="px-5 py-3.5">
                    {s.avg_rating > 0 ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="text-yellow-400">★</span>
                        <span className="font-bold">{Number(s.avg_rating).toFixed(1)}</span>
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs">No ratings</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">{s.total_ratings ?? 0}</td>
                  <td className="px-5 py-3.5">
                    {s.ownerProfile ? (
                      <div>
                        <p className="font-medium text-gray-900 text-xs">{s.ownerProfile.full_name}</p>
                        <p className="text-gray-400 text-xs">{s.ownerProfile.email}</p>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                        ⚠ Unassigned
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => openAssignModal(s)}
                      className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium text-xs">
                      {s.owner_id
                        ? <><Pencil className="w-3.5 h-3.5" /> Change</>
                        : <><UserCheck className="w-3.5 h-3.5" /> Assign</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {displayed.length > 0 && (
          <div className="px-5 py-2.5 border-t border-gray-50 text-xs text-gray-400">
            Showing {displayed.length} of {stores.length} stores
          </div>
        )}
      </div>

      {/* Add Store Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900">Add New Store</h2>
              <button onClick={closeAddModal} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddStore} noValidate className="p-6 space-y-4">
              {serverError && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /><span>{serverError}</span>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                <input name="name" value={form.name} onChange={handleChange}
                  placeholder="Store name" className={inputCls('name')} />
                {formErrors.name && <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange}
                  placeholder="store@example.com" className={inputCls('email')} />
                {formErrors.email && <p className="mt-1 text-xs text-red-500">{formErrors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea name="address" value={form.address} onChange={handleChange}
                  rows={2} placeholder="Full address" className={`${inputCls('address')} resize-none`} />
                {formErrors.address && <p className="mt-1 text-xs text-red-500">{formErrors.address}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign Owner <span className="text-gray-400 font-normal text-xs">(optional)</span>
                </label>
                {owners.length === 0 ? (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                    No store owners yet. Create one in Manage Users first.
                  </p>
                ) : (
                  <select name="owner_id" value={form.owner_id} onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200">
                    <option value="">— No owner yet —</option>
                    {owners.map((o) => (
                      <option key={o.id} value={o.id}>{o.full_name} ({o.email})</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition text-sm">
                  {saving ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" /> : <Plus className="w-4 h-4" />}
                  {saving ? 'Adding…' : 'Add Store'}
                </button>
                <button type="button" onClick={closeAddModal}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-lg transition text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Owner Modal */}
      {showAssignModal && assignStore && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Assign Owner</h2>
                <p className="text-xs text-gray-500 mt-0.5">"{assignStore.name}"</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAssignOwner} className="p-6 space-y-4">
              {assignError && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /><span>{assignError}</span>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Store Owner</label>
                {owners.length === 0 ? (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                    No store owner accounts found. Create one in Manage Users first.
                  </p>
                ) : (
                  <select value={assignOwnerId} onChange={(e) => setAssignOwnerId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200">
                    <option value="">— Remove owner —</option>
                    {owners.map((o) => (
                      <option key={o.id} value={o.id}>{o.full_name} ({o.email})</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={assignSaving || owners.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition text-sm">
                  {assignSaving ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" /> : <UserCheck className="w-4 h-4" />}
                  {assignSaving ? 'Saving…' : 'Save'}
                </button>
                <button type="button" onClick={() => setShowAssignModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-lg transition text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}