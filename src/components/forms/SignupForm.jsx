// src/components/forms/SignupForm.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { SIGNUP_ROLES } from '../../constants/signupRoles';

const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

export default function SignupForm({ onSuccess }) {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '', email: '', address: '', role: 'user', password: '', confirmPassword: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const passwordRules = {
    length: formData.password.length >= 8 && formData.password.length <= 16,
    uppercase: /[A-Z]/.test(formData.password),
    special: SPECIAL_CHAR_REGEX.test(formData.password),
  };
  const passwordValid = passwordRules.length && passwordRules.uppercase && passwordRules.special;
  const passwordsMatch = formData.password.length > 0 && formData.password === formData.confirmPassword;

  const validateForm = () => {
    if (!formData.name.trim()) { setError('Full name is required'); return false; }
    if (formData.name.trim().length < 20) { setError('Name must be at least 20 characters'); return false; }
    if (formData.name.trim().length > 60) { setError('Name must not exceed 60 characters'); return false; }
    if (!formData.email.trim()) { setError('Email is required'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { setError('Invalid email format'); return false; }
    if (!formData.address.trim()) { setError('Address is required'); return false; }
    if (formData.address.trim().length > 400) { setError('Address must not exceed 400 characters'); return false; }
    if (!['user', 'store_owner', 'admin'].includes(formData.role)) { setError('Please select a valid role'); return false; }
    if (!formData.password) { setError('Password is required'); return false; }
    if (!passwordRules.length) { setError('Password must be 8-16 characters long'); return false; }
    if (!passwordRules.uppercase) { setError('Password must include at least one uppercase letter'); return false; }
    if (!passwordRules.special) { setError('Password must include at least one special character'); return false; }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      await signup({
        email: formData.email, password: formData.password,
        name: formData.name.trim(), address: formData.address.trim(), role: formData.role,
      });
      if (onSuccess) onSuccess();
      else navigate('/login');
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Full Name <span className="text-gray-400 font-normal">(20-60 characters)</span>
        </label>
        <input type="text" name="name" value={formData.name} onChange={handleChange}
          placeholder="Enter your full name"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
        {formData.name && (
          <p className={`text-xs mt-1 ${formData.name.trim().length >= 20 ? 'text-green-600' : 'text-gray-500'}`}>
            {formData.name.length}/60 characters
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange}
          placeholder="you@example.com"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Your Role</label>
        <select name="role" value={formData.role} onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white">
          {SIGNUP_ROLES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          📌 {SIGNUP_ROLES.find((r) => r.value === formData.role)?.description}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <textarea name="address" value={formData.address} onChange={handleChange}
          placeholder="Enter your address" rows="3"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
        {formData.address && (
          <p className="text-xs text-gray-500 mt-1">{formData.address.length}/400 characters</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password <span className="text-gray-400 font-normal">(8-16 characters)</span>
        </label>
        <input type="password" name="password" value={formData.password} onChange={handleChange}
          placeholder="Min 8 chars, 1 uppercase, 1 special character"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
        {formData.password && (
          <div className="text-xs mt-1 space-y-1">
            <p className={passwordRules.length ? 'text-green-600' : 'text-red-600'}>
              {passwordRules.length ? '✓' : '✗'} 8-16 characters
            </p>
            <p className={passwordRules.uppercase ? 'text-green-600' : 'text-red-600'}>
              {passwordRules.uppercase ? '✓' : '✗'} At least one uppercase letter
            </p>
            <p className={passwordRules.special ? 'text-green-600' : 'text-red-600'}>
              {passwordRules.special ? '✓' : '✗'} At least one special character
            </p>
            <p className={passwordValid ? 'text-green-600 font-medium' : 'text-gray-400'}>
              ✓ Password strength: {passwordValid ? 'Good' : 'Needs work'}
            </p>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
        <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
          placeholder="Re-enter your password"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
        {formData.confirmPassword && (
          <p className={`text-xs mt-1 ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
            {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
          </p>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">{error}</div>
      )}

      <button type="submit" disabled={loading}
        className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium">
        {loading ? 'Creating account...' : 'Create Account'}
      </button>
    </form>
  );
}