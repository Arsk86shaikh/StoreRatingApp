import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { ROLE_OPTIONS, ROLE_LABELS } from '../../constants/roles';

export default function Signup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    role: 'user',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const validateForm = () => {
    // Full name validation - MUST match DB constraint (20-60 chars)
    if (!formData.full_name.trim()) {
      throw new Error('Full name is required');
    }

    if (formData.full_name.length < 20) {
      throw new Error('Full name must be at least 20 characters');
    }

    if (formData.full_name.length > 60) {
      throw new Error('Full name must not exceed 60 characters');
    }

    // Email validation
    if (!formData.email.trim()) {
      throw new Error('Email is required');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      throw new Error('Please enter a valid email address');
    }

    // Password validation
    if (!formData.password) {
      throw new Error('Password is required');
    }

    if (formData.password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    if (formData.password !== formData.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    // Address validation - MUST match DB constraint (max 400 chars)
    if (formData.address && formData.address.length > 400) {
      throw new Error('Address must not exceed 400 characters');
    }

    // Role validation
    if (!formData.role) {
      throw new Error('Please select a role');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      console.log('📝 Starting validation...');
      
      // Validate form first
      validateForm();

      console.log('✅ Form validation passed');
      console.log('📤 Submitting signup with data:', {
        full_name: formData.full_name,
        email: formData.email,
        role: formData.role,
        address: formData.address,
      });

      // Call signup service
      const result = await authService.signUp({
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        address: formData.address || null,
        role: formData.role,
      });

      if (result.success) {
        console.log('✅ Signup successful! Account created.');
        setSuccess(
          `✅ Account created successfully as ${ROLE_LABELS[formData.role]}!\n\nPlease check your email for verification.\n\nRedirecting to login in 3 seconds...`
        );

        // Clear form
        setFormData({
          full_name: '',
          email: '',
          password: '',
          confirmPassword: '',
          address: '',
          role: 'user',
        });

        // Wait 3 seconds then redirect to login
        setTimeout(() => {
          console.log('🔀 Redirecting to login...');
          navigate('/login');
        }, 3000);
      } else {
        console.error('❌ Signup failed:', result.error);
        setError(result.error || 'Signup failed. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      console.error('❌ Error during signup:', err.message);
      setError(err.message || 'Signup failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Join our platform today</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg animate-pulse">
            <p className="text-green-700 text-sm font-medium whitespace-pre-line">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name - IMPORTANT: 20-60 characters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span> (20-60 characters)
            </label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="e.g., Muhammad Ahmad Ali Ahmed"
              disabled={loading}
              maxLength="60"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
            />
            {formData.full_name && (
              <p className={`text-xs mt-1 ${
                formData.full_name.length < 20
                  ? 'text-orange-500'
                  : formData.full_name.length > 60
                  ? 'text-red-500'
                  : 'text-green-500'
              }`}>
                {formData.full_name.length}/60 characters
                {formData.full_name.length < 20 && ` (need ${20 - formData.full_name.length} more)`}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Your Role <span className="text-red-500">*</span>
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              📌 {ROLE_LABELS[formData.role]}
            </p>
          </div>

          {/* Address (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address <span className="text-gray-400">(Optional - max 400 characters)</span>
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter your address..."
              disabled={loading}
              maxLength="400"
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed text-sm resize-none"
            />
            {formData.address && (
              <p className="text-xs text-gray-500 mt-1">
                {formData.address.length}/400 characters
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span> (minimum 6 characters)
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
            />
            {formData.password && (
              <p className={`text-xs mt-1 ${
                formData.password.length < 6 ? 'text-orange-500' : 'text-green-500'
              }`}>
                {formData.password.length < 6
                  ? `${6 - formData.password.length} more characters needed`
                  : '✓ Password strength: Good'}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
            />
            {formData.confirmPassword && (
              <p className={`text-xs mt-1 ${
                formData.password === formData.confirmPassword
                  ? 'text-green-500'
                  : 'text-red-500'
              }`}>
                {formData.password === formData.confirmPassword
                  ? '✓ Passwords match'
                  : '✗ Passwords do not match'}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition duration-200 disabled:cursor-not-allowed mt-6"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                Creating Account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-3 text-gray-500 text-sm">or</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Sign In Link */}
        <div className="text-center">
          <p className="text-gray-600 text-sm">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-green-600 hover:text-green-700 font-semibold transition"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}