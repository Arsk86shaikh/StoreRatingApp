// src/pages/auth/Login.jsx
import { Link } from 'react-router-dom';
import { Store } from 'lucide-react';
import LoginForm from '../../components/forms/LoginForm';

export default function Login() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 shadow-lg">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">StoreRate</h1>
          <p className="text-gray-500 mt-1">Sign in to your account</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <LoginForm />
          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/signup" className="text-indigo-600 font-medium hover:underline">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}