// src/layouts/DashboardLayout.jsx
import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardLayout() {
  const { profile, logout } = useAuth(); // ← fixed: was { user, profile, signOut }
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await logout(); // ← fixed: was signOut()
      navigate('/login', { replace: true });
    }
  };

  const getMenuItems = () => {
    if (profile?.role === 'admin') {
      return [
        { label: 'Admin Dashboard', path: '/admin/dashboard', icon: '⚙️' },
        { label: 'Manage Users', path: '/admin/users', icon: '👥' },
        { label: 'Manage Stores', path: '/admin/stores', icon: '🏪' },
        { label: 'Profile', path: '/admin/profile', icon: '👤' },
      ];
    }

    if (profile?.role === 'store_owner') {
      return [
        { label: 'Dashboard', path: '/owner/dashboard', icon: '📊' },
        { label: 'Analytics', path: '/owner/analytics', icon: '📈' },
        { label: 'Profile', path: '/owner/profile', icon: '👤' },
      ];
    }

    // default: normal user
    return [
      { label: 'Dashboard', path: '/user/dashboard', icon: '📊' },
      { label: 'Browse Stores', path: '/user/stores', icon: '🏪' },
      { label: 'Profile', path: '/user/profile', icon: '👤' },
    ];
  };

  const menuItems = getMenuItems();
  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-indigo-700 text-white transition-all duration-300 flex flex-col shadow-lg`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-indigo-600">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-indigo-600 rounded-lg transition"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
          {sidebarOpen && <h1 className="text-2xl font-bold ml-2">StoreRate</h1>}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive(item.path)
                  ? 'bg-indigo-600 font-semibold'
                  : 'hover:bg-indigo-600'
              }`}
              title={!sidebarOpen ? item.label : ''}
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* User info + sign out */}
        <div className="border-t border-indigo-600 p-4">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-indigo-600">
            <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-lg font-bold">
              {profile?.full_name?.charAt(0).toUpperCase() || '?'}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {profile?.full_name || 'User'}
                </p>
                <p className="text-xs text-indigo-200 truncate capitalize">
                  {profile?.role?.replace('_', ' ') || 'user'}
                </p>
                <p className="text-xs text-indigo-300 truncate">
                  {profile?.email}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2 bg-red-600 hover:bg-red-700
              rounded-lg transition font-medium"
          >
            <span className="text-lg">🚪</span>
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm h-16 flex items-center px-8 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">
              {menuItems.find((item) => isActive(item.path))?.label || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 capitalize bg-gray-100 px-2 py-1 rounded-full">
              {profile?.role?.replace('_', ' ') || ''}
            </span>
            <span className="text-sm text-gray-600">{profile?.email}</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="container mx-auto px-8 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}