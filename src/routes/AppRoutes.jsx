// src/routes/AppRoutes.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Layouts
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';

// Auth pages
import Login from '../pages/auth/Login';
import Signup from '../pages/auth/Signup';

// Admin pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import ManageUsers from '../pages/admin/ManageUsers';
import ManageStores from '../pages/admin/ManageStores';
import UserDetails from '../pages/admin/UserDetails';

// User pages
import UserDashboard from '../pages/user/UserDashboard';
import StoresPage from '../pages/user/StoresPage';
import Profile from '../pages/user/Profile';

// Owner pages
import OwnerDashboard from '../pages/owner/OwnerDashboard';
import StoreAnalytics from '../pages/owner/StoreAnalytics';

// Shared
import NotFound from '../pages/shared/NotFound';
import Unauthorized from '../pages/shared/Unauthorized';

// -------------------------------------------------------
// ProtectedRoute - must be logged in
// -------------------------------------------------------
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" /></div>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// -------------------------------------------------------
// RoleBasedRoute - must have specific role(s)
// -------------------------------------------------------
function RoleBasedRoute({ children, roles }) {
  const { profile, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" /></div>;
  if (!profile) return <Navigate to="/login" replace />;
  if (!roles.includes(profile.role)) return <Navigate to="/unauthorized" replace />;
  return children;
}

// -------------------------------------------------------
// Smart home redirect based on role
// -------------------------------------------------------
function HomeRedirect() {
  const { profile, loading, isAuthenticated } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (profile?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (profile?.role === 'store_owner') return <Navigate to="/owner/dashboard" replace />;
  return <Navigate to="/user/dashboard" replace />;
}

// -------------------------------------------------------
// AppRoutes
// -------------------------------------------------------
export default function AppRoutes() {
  return (
    <Routes>
      {/* Root → smart redirect */}
      <Route path="/" element={<HomeRedirect />} />

      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Route>

      {/* Admin routes */}
      <Route
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['admin']}>
              <DashboardLayout />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      >
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<ManageUsers />} />
        <Route path="/admin/users/:userId" element={<UserDetails />} />
        <Route path="/admin/stores" element={<ManageStores />} />
      </Route>

      {/* User routes */}
      <Route
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['user']}>
              <DashboardLayout />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      >
        <Route path="/user/dashboard" element={<UserDashboard />} />
        <Route path="/user/stores" element={<StoresPage />} />
        <Route path="/user/profile" element={<Profile />} />
      </Route>

      {/* Owner routes */}
      <Route
        element={
          <ProtectedRoute>
            <RoleBasedRoute roles={['store_owner']}>
              <DashboardLayout />
            </RoleBasedRoute>
          </ProtectedRoute>
        }
      >
        <Route path="/owner/dashboard" element={<OwnerDashboard />} />
        <Route path="/owner/analytics" element={<StoreAnalytics />} />
        <Route path="/owner/profile" element={<Profile />} />
      </Route>

      {/* Shared */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}