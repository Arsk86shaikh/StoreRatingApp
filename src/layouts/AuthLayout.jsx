import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Store Rating
          </h1>
          <p className="text-indigo-200">Platform</p>
        </div>

        {/* Auth Form Container */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <Outlet />
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-indigo-200 text-sm">
            © 2026 Store Rating Platform. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
