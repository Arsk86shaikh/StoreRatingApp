import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
// import{useAuth} from "../contexts/AuthContext";
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import Footer from '../components/common/Footer';

export default function DashboardLayout() {
  const { logout, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getNavItems = () => {
    if (!profile) return [];

    const baseItems = [
      { label: 'Profile', path: `/${profile.role}/profile` },
    ];

    if (profile.role === 'admin') {
      return [
        { label: 'Dashboard', path: '/admin/dashboard' },
        { label: 'Users', path: '/admin/users' },
        { label: 'Stores', path: '/admin/stores' },
        ...baseItems,
      ];
    }

    if (profile.role === 'user') {
      return [
        { label: 'Dashboard', path: '/user/dashboard' },
        { label: 'Stores', path: '/user/stores' },
        ...baseItems,
      ];
    }

    if (profile.role === 'store_owner') {
      return [
        { label: 'Dashboard', path: '/owner/dashboard' },
        { label: 'Analytics', path: '/owner/analytics' },
        ...baseItems,
      ];
    }

    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Navbar */}
      <Navbar />

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'w-64' : 'w-20'
          } bg-gray-900 text-white transition-all duration-300 shadow-lg`}
        >
          <div className="p-4 border-b border-gray-700">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white"
            >
              {sidebarOpen ? '✕' : '☰'}
            </button>
          </div>

          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <a
                key={item.path}
                href={item.path}
                className={`block px-4 py-2 rounded-lg transition ${
                  location.pathname === item.path
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                } ${!sidebarOpen && 'text-center'}`}
              >
                {sidebarOpen ? item.label : item.label.charAt(0)}
              </a>
            ))}

            <hr className="border-gray-700 my-4" />

            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-gray-300 hover:bg-red-600 rounded-lg transition"
            >
              {sidebarOpen ? 'Logout' : '✕'}
            </button>
          </nav>

          {sidebarOpen && (
            <div className="absolute bottom-4 left-4 right-4 p-3 bg-gray-800 rounded-lg text-xs">
              <p className="text-gray-400">Logged in as:</p>
              <p className="font-bold text-white truncate">{profile?.name}</p>
              <p className="text-gray-500 capitalize">{profile?.role}</p>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto p-6">
            <Outlet />
          </div>

          {/* Footer */}
          <Footer />
        </main>
      </div>
    </div>
  );
}
