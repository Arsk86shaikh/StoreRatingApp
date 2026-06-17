import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, Store } from 'lucide-react';
import { authService } from '../../services/authService';

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    address: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: '' }));
    setServerError('');
  };

  const validate = () => {
    const errs = {};

    if (!form.full_name.trim()) errs.full_name = 'Full name is required';
    else if (form.full_name.trim().length < 20) errs.full_name = 'Name must be at least 20 characters';
    else if (form.full_name.trim().length > 60) errs.full_name = 'Name must be at most 60 characters';

    if (!form.email) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email address';

    if (!form.address.trim()) errs.address = 'Address is required';
    else if (form.address.trim().length > 400) errs.address = 'Address must be at most 400 characters';

    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    else if (!/[A-Z]/.test(form.password)) errs.password = 'Must include at least one uppercase letter';
    else if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.password)) errs.password = 'Must include at least one special character';

    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await authService.signUp({
        email: form.email,
        password: form.password,
        full_name: form.full_name.trim(),
        address: form.address.trim(),
        role: 'user',
      });
      setSuccess(true);
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account created!</h2>
          <p className="text-gray-500 mb-6">Check your email to confirm your account, then sign in.</p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const pwdInputClass = (name) =>
    `w-full px-4 py-2.5 pr-10 rounded-lg border text-sm outline-none transition-all ${
      errors[name]
        ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300'
        : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'
    }`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 shadow-lg">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">StoreRate</h1>
          <p className="text-gray-500 mt-1">Create your free account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {serverError && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input
                type="text"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Enter your full name (min. 20 characters)"
                className={`w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-all
                  ${errors.full_name ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'}`}
              />
              <div className="flex justify-between mt-1">
                {errors.full_name
                  ? <p className="text-xs text-red-500">{errors.full_name}</p>
                  : <span />}
                <p className="text-xs text-gray-400">{form.full_name.length}/60</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={`w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-all
                  ${errors.email ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'}`}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Your full address"
                rows={2}
                className={`w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-all resize-none
                  ${errors.address ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'}`}
              />
              {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min 8 chars, 1 uppercase, 1 special"
                  className={pwdInputClass('password')}
                />
                <button type="button" onClick={() => setShowPwd(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  className={pwdInputClass('confirmPassword')}
                />
                <button type="button" onClick={() => setShowConfirm(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700
                disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors shadow-sm"
            >
              {loading ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <UserPlus className="w-4 h-4" />}
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}