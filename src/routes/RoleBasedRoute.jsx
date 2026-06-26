// src/routes/RoleBasedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import RouteSpinner from '../components/common/RouteSpinner';

export default function RoleBasedRoute({ roles }) {
  const { isAuthenticated, role, loading, profile } = useAuth();
  if (loading) return <RouteSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!profile) return <RouteSpinner />;  // wait for profile before role check
  if (!roles.includes(role)) return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
}