// src/routes/AppRoutes.jsx
import { Routes, Route } from 'react-router-dom';

import ProtectedRoute from './ProtectedRoute';
import RoleBasedRoute from './RoleBasedRoute';
import HomeRedirect from './HomeRedirect';

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

// Owner pages
import OwnerDashboard from '../pages/owner/OwnerDashboard';
import StoreAnalytics from '../pages/owner/StoreAnalytics';

// Shared — one Profile component, adapts content per role internally
import Profile from '../pages/common/Profile';
import NotFound from '../pages/shared/NotFound';
import Unauthorized from '../pages/shared/Unauthorized';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Root → smart redirect based on role */}
      <Route path="/" element={<HomeRedirect />} />

      {/* Auth routes — public */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Route>

      {/* Every route below requires a logged-in session */}
      <Route element={<ProtectedRoute />}>

        {/* Admin */}
        <Route element={<RoleBasedRoute roles={['admin']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin/dashboard"     element={<AdminDashboard />} />
            <Route path="/admin/users"         element={<ManageUsers />} />
            <Route path="/admin/users/:userId" element={<UserDetails />} />
            <Route path="/admin/stores"        element={<ManageStores />} />
            <Route path="/admin/profile"       element={<Profile />} />  {/* ← added */}
          </Route>
        </Route>

        {/* Normal user */}
        <Route element={<RoleBasedRoute roles={['user']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/user/dashboard" element={<UserDashboard />} />
            <Route path="/user/stores"    element={<StoresPage />} />
            <Route path="/user/profile"   element={<Profile />} />
          </Route>
        </Route>

        {/* Store owner */}
        <Route element={<RoleBasedRoute roles={['store_owner']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/owner/dashboard" element={<OwnerDashboard />} />
            <Route path="/owner/analytics" element={<StoreAnalytics />} />
            <Route path="/owner/profile"   element={<Profile />} />
          </Route>
        </Route>

      </Route>

      {/* Shared */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}