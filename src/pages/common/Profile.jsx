// src/pages/common/Profile.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { storeService } from '../../services/storeService';
import {
  User, Mail, MapPin, Shield, Calendar, Store,
  Lock, Eye, EyeOff, CheckCircle2, AlertCircle,
} from 'lucide-react';

const ROLE_META = {
  admin:       { label: 'Administrator', badge: 'bg-red-100 text-red-700',       icon: Shield },
  store_owner: { label: 'Store Owner',   badge: 'bg-purple-100 text-purple-700', icon: Store  },
  user:        { label: 'Normal User',   badge: 'bg-blue-100 text-blue-700',     icon: User   },
};

// ── Password tab ──────────────────────────────────────────────
// Receives `email` as a prop from the parent — fixes the previous
// useAuthSnapshot()/_email bug, which referenced things that didn't exist.
function PasswordTab({ email }) {
  const [form, setForm]       = useState({ current: '', next: '', confirm: '' });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [serverErr, setServerErr] = useState('');
  const [show, setShow] = useState({ current: false, next: false, confirm: false });

  const toggle = (f) => setShow((p) => ({ ...p, [f]: !p[f] }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: '' }));
    setServerErr('');
    setSuccess('');
  };

  const validate = () => {
    const errs = {};
    if (!form.current) errs.current = 'Current password is required';
    if (!form.next)    errs.next    = 'New password is required';
    else if (form.next.length < 8)  errs.next = 'Min 8 characters';
    else if (form.next.length > 16) errs.next = 'Max 16 characters';
    else if (!/[A-Z]/.test(form.next))                  errs.next = 'Needs one uppercase letter';
    else if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.next)) errs.next = 'Needs one special character';
    if (!form.confirm)                   errs.confirm = 'Please confirm new password';
    else if (form.next !== form.confirm) errs.confirm = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    if (!email) {
      setServerErr('Could not determine your account email. Please refresh and try again.');
      return;
    }

    setLoading(true);
    try {
      // Re-authenticate with the current password before changing it,
      // so anyone who left a tab open can't silently change the password.
      await authService.signIn({ email, password: form.current });
      await authService.updatePassword(form.next);
      setSuccess('Password updated successfully.');
      setForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      const msg = err.message?.toLowerCase() || '';
      if (msg.includes('invalid login credentials')) {
        setServerErr('Current password is incorrect.');
      } else {
        setServerErr(err.message || 'Failed to update password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputCls = (name) =>
    `w-full pl-4 pr-10 py-2.5 rounded-xl border text-sm outline-none transition-all
    ${errors[name]
      ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200'
      : 'border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'}`;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 max-w-md">
      {serverErr && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />{serverErr}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-100 text-green-700 text-sm">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />{success}
        </div>
      )}

      {[
        { name: 'current', label: 'Current password',    key: 'current' },
        { name: 'next',    label: 'New password',         key: 'next'    },
        { name: 'confirm', label: 'Confirm new password', key: 'confirm' },
      ].map(({ name, label, key }) => (
        <div key={name}>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
          <div className="relative">
            <input
              type={show[key] ? 'text' : 'password'}
              name={name}
              value={form[name]}
              onChange={handleChange}
              autoComplete={name === 'current' ? 'current-password' : 'new-password'}
              className={inputCls(name)}
            />
            <button type="button" tabIndex={-1} onClick={() => toggle(key)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {show[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {name === 'next' && !errors.next && (
            <p className="mt-1 text-xs text-gray-400">8-16 chars · one uppercase · one special character</p>
          )}
          {errors[name] && <p className="mt-1 text-xs text-red-500">{errors[name]}</p>}
        </div>
      ))}

      <button type="submit" disabled={loading}
        className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700
          disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition text-sm mt-2">
        {loading
          ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
          : <Lock className="w-4 h-4" />}
        {loading ? 'Updating…' : 'Update Password'}
      </button>
    </form>
  );
}

// ── Info row helper ───────────────────────────────────────────
function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
      <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-gray-900 mt-0.5 break-words">{value || '—'}</p>
      </div>
    </div>
  );
}

// ── Admin-specific extra info ─────────────────────────────────
function AdminProfileExtra() {
  return (
    <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
      <p className="font-semibold mb-1">Administrator account</p>
      <p className="text-red-600 text-xs">
        You have full access to manage users, stores, and platform settings.
        Keep your credentials secure.
      </p>
    </div>
  );
}

// ── Store-owner-specific extra info ──────────────────────────
function OwnerProfileExtra({ profile }) {
  const [store, setStore]     = useState(null);
  const [loading, setLoading] = useState(true);

  // Fixed: useState is not an effect hook — useState(() => {...}, [deps])
  // is invalid and never runs on dependency change. Switched to useEffect.
  useEffect(() => {
    if (!profile?.id) { setLoading(false); return; }
    let cancelled = false;

    storeService.getStoreByOwner(profile.id)
      .then((data) => { if (!cancelled) setStore(data); })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [profile?.id]);

  if (loading) return (
    <div className="h-20 flex items-center justify-center">
      <span className="h-5 w-5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
    </div>
  );

  if (!store) return (
    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700">
      No store is assigned to your account yet. Contact an administrator.
    </div>
  );

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Your Store</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InfoRow icon={Store}  label="Store Name"    value={store.name} />
        <InfoRow icon={Mail}   label="Store Email"   value={store.email} />
        <InfoRow icon={MapPin} label="Store Address" value={store.address} />
        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-indigo-700">
              {store.average_rating > 0 ? Number(store.average_rating).toFixed(1) : '—'}
            </p>
            <p className="text-xs text-indigo-500 font-medium">avg rating</p>
          </div>
          <div className="h-10 w-px bg-indigo-200" />
          <div className="text-center">
            <p className="text-2xl font-bold text-indigo-700">{store.rating_count ?? 0}</p>
            <p className="text-xs text-indigo-500 font-medium">total ratings</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────
export default function Profile() {
  const { profile } = useAuth();
  const [tab, setTab] = useState('profile');

  const meta = ROLE_META[profile?.role] || ROLE_META.user;
  const RoleIcon = meta.icon;

  const tabs = [
    { key: 'profile',  label: 'Profile Info' },
    { key: 'password', label: 'Change Password' },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 text-sm mt-1">View your account info and update your password</p>
      </div>

      {/* Avatar + role banner */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-2xl font-bold flex-shrink-0">
          {profile?.full_name?.charAt(0).toUpperCase() || '?'}
        </div>
        <div className="min-w-0">
          <p className="text-lg font-bold text-gray-900 truncate">{profile?.full_name}</p>
          <p className="text-sm text-gray-500 truncate">{profile?.email}</p>
          <span className={`inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full ${meta.badge}`}>
            <RoleIcon className="w-3 h-3" />
            {meta.label}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition -mb-px
              ${tab === t.key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile Info tab */}
      {tab === 'profile' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-bold text-gray-900">Account Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoRow icon={User}     label="Full Name"    value={profile?.full_name} />
              <InfoRow icon={Mail}     label="Email"        value={profile?.email} />
              <InfoRow icon={MapPin}   label="Address"      value={profile?.address} />
              <InfoRow icon={Calendar} label="Member Since"
                value={profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })
                  : '—'} />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-bold text-gray-900">
              {profile?.role === 'admin'       ? 'Admin Details' :
               profile?.role === 'store_owner' ? 'Store Details' :
               'Account Status'}
            </h2>
            {profile?.role === 'admin'       && <AdminProfileExtra />}
            {profile?.role === 'store_owner' && <OwnerProfileExtra profile={profile} />}
            {profile?.role === 'user'        && (
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
                <p className="font-semibold mb-1">Normal User account</p>
                <p className="text-blue-600 text-xs">
                  You can browse stores, submit ratings from 1 to 5, and update your own ratings at any time.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Password tab */}
      {tab === 'password' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-5">Change Password</h2>
          <PasswordTab email={profile?.email} />
        </div>
      )}
    </div>
  );
}