// src/routes/HomeRedirect.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import RouteSpinner from '../components/common/RouteSpinner';

export default function HomeRedirect() {
  const { profile, loading, isAuthenticated, getRoleHome } = useAuth();

  if (loading) return <RouteSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!profile) return <RouteSpinner />;  // waiting for DB trigger

  return <Navigate to={getRoleHome(profile)} replace />;
}