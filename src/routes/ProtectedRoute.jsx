// src/routes/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import RouteSpinner from '../components/common/RouteSpinner';

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <RouteSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}