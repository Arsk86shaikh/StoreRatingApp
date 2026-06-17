import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const ROLE_HOME = {
  admin: '/admin/dashboard',
  user: '/user/stores',
  store_owner: '/owner/dashboard',
}

export default function HomeRedirect() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return <Navigate to={ROLE_HOME[user.role] || '/login'} replace />
}