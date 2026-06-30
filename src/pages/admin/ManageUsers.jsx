import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { adminService } from '../../services/adminService';
import { AlertCircle, UserPlus, X, Eye, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react';

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

const EMPTY_FORM = {
  full_name: '',
  email: '',
  address: '',
  password: '',
  role: 'user',
};

export default function ManageUsers() {
  const navigate = useNavigate();

  const [users,       setUsers]       = useState([]);
  const [search,      setSearch]      = useState('');
  const [filterRole,  setFilterRole]  = useState('all');
  const [sortKey,     setSortKey]     = useState('full_name');
  const [sortAsc,     setSortAsc]     = useState(true);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [formErrors,  setFormErrors]  = useState({});
  const [serverError, setServerError] = useState('');
  const [saving,      setSaving]      = useState(false);
  const [successMsg,  setSuccessMsg]  = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, address, role, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) console.error('fetchUsers:', error.message);
    setUsers(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const displayed = users
    .filter((u) => {
      const term = search.toLowerCase();
      const matchSearch = !term ||
        u.full_name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.address?.toLowerCase().includes(term);
      const matchRole = filterRole === 'all' || u.role === filterRole;
      return matchSearch && matchRole;
    })
    .sort((a, b) => {
      const av = (a[sortKey] || '').toString().toLowerCase();
      const bv = (b[sortKey] || '').toString().toLowerCase();
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
    const name = form.full_name.trim();
    if (!name)               errs.full_name = 'Name is required';
    else if (name.length < 20) errs.full_name = 'Name must be at least 20 characters';
    else if (name.length > 60) errs.full_name = 'Name must be at most 60 characters';

    if (!form.email)
      errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Invalid email address';

    const addr = form.address.trim();
    if (!addr)               errs.address = 'Address is required';
    else if (addr.length > 400) errs.address = 'Address max 400 characters';

    if (!form.password)           errs.password = 'Password is required';
    else if (form.password.length < 8)  errs.password = 'Min 8 characters';
    else if (form.password.length > 16) errs.password = 'Max 16 characters';
    else if (!/[A-Z]/.test(form.password))              errs.password = 'Needs one uppercase letter';
    else if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.password)) errs.password = 'Needs one special character';

    return errs;
  };

  // FIXED: now uses adminService.createUser(), which calls the
  // admin-create-user Edge Function (service_role key, server-side).
  // The admin's own browser session is NEVER touched — no sign-out,
  // no session swap, no 403 redirect. The previous client-side
  // supabase.auth.signUp() approach always hijacked the current session
  // into the newly created account, which is what caused the
  // /unauthorized (403) screen you hit.
  const handleAddUser = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }

    setSaving(true);
    setServerError('');

    try {
      const newUser = await adminService.createUser({
        email: form.email.trim(),
        password: form.password,
        full_name: form.full_name.trim(),
        address: form.address.trim(),
        role: form.role,
      });

      // Add to local state immediately so it appears without a refetch
      setUsers((prev) => [{
        id: newUser.id,
        full_name: newUser.full_name,
        email: newUser.email,
        address: form.address.trim(),
        role: newUser.role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, ...prev]);

      setSuccessMsg(`User "${newUser.full_name}" created successfully. They can log in immediately.`);
      setTimeout(() => setSuccessMsg(''), 5000);
      closeModal();

    } catch (err) {
      setServerError(err.message || 'Failed to add user. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setServerError('');
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
          <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
          <p className="text-gray-500 text-sm mt-1">{users.length} total users</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            title="Refresh list"
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-300 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
          >
            <UserPlus className="w-4 h-4" /> Add User
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-3.5 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">
          <span className="text-green-500">✓</span> {successMsg}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, email or address…"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Role</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="all">All Roles</option>
              <option value="user">Normal User</option>
              <option value="store_owner">Store Owner</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {[
                  { key: 'full_name', label: 'Name' },
                  { key: 'email',     label: 'Email' },
                  { key: 'address',   label: 'Address' },
                  { key: 'role',      label: 'Role' },
                ].map(({ key, label }) => (
                  <th
                    key={key}
                    onClick={() => toggleSort(key)}
                    className="px-5 py-3 text-left font-semibold text-gray-600 cursor-pointer select-none hover:text-gray-900"
                  >
                    {label}<SortIcon col={key} />
                  </th>
                ))}
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-gray-400">
                    {search || filterRole !== 'all' ? 'No users match your filters.' : 'No users yet.'}
                  </td>
                </tr>
              ) : displayed.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-gray-900">{u.full_name}</td>
                  <td className="px-5 py-3.5 text-gray-600">{u.email}</td>
                  <td className="px-5 py-3.5 text-gray-500 max-w-[180px] truncate" title={u.address}>
                    {u.address}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${ROLE_BADGE[u.role] || 'bg-gray-100 text-gray-600'}`}>
                      {ROLE_LABEL[u.role] || u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => navigate(`/admin/users/${u.id}`)}
                      className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium text-xs"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {displayed.length > 0 && (
          <div className="px-5 py-2.5 border-t border-gray-50 text-xs text-gray-400">
            Showing {displayed.length} of {users.length} users
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-lg font-bold text-gray-900">Add New User</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} noValidate className="p-6 space-y-4">
              {serverError && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{serverError}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  placeholder="Min 20 characters"
                  className={inputCls('full_name')}
                />
                <div className="flex justify-between mt-1">
                  <span>{formErrors.full_name && <p className="text-xs text-red-500">{formErrors.full_name}</p>}</span>
                  <p className={`text-xs ml-auto ${form.full_name.length > 60 ? 'text-red-500' : 'text-gray-400'}`}>
                    {form.full_name.length}/60
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="user@example.com"
                  className={inputCls('email')}
                />
                {formErrors.email && <p className="mt-1 text-xs text-red-500">{formErrors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Full address"
                  className={`${inputCls('address')} resize-none`}
                />
                <div className="flex justify-between mt-1">
                  <span>{formErrors.address && <p className="text-xs text-red-500">{formErrors.address}</p>}</span>
                  <p className={`text-xs ml-auto ${form.address.length > 400 ? 'text-red-500' : 'text-gray-400'}`}>
                    {form.address.length}/400
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="8-16 chars, 1 uppercase, 1 special"
                  className={inputCls('password')}
                />
                {formErrors.password && <p className="mt-1 text-xs text-red-500">{formErrors.password}</p>}
                <p className="mt-1 text-xs text-gray-400">
                  The new user can log in with this password right away — no email confirmation needed for admin-created accounts.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'user',        label: 'Normal User' },
                    { value: 'store_owner', label: 'Store Owner' },
                    { value: 'admin',       label: 'Admin' },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, role: value }))}
                      className={`py-2 rounded-lg border text-xs font-medium transition-all
                        ${form.role === value
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700
                    disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition text-sm"
                >
                  {saving
                    ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                    : <UserPlus className="w-4 h-4" />}
                  {saving ? 'Adding…' : 'Add User'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-lg transition text-sm"
                >
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