import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function HomeRedirect() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated → go to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated → redirect based on role
  const roleRoutes = {
    admin: '/admin/dashboard',
    store_owner: '/owner/dashboard',
    user: '/user/dashboard',
    moderator: '/user/dashboard', // fallback
  };

  const userRole = profile?.role || 'user';
  const route = roleRoutes[userRole] || '/user/dashboard';

  return <Navigate to={route} replace />;
}