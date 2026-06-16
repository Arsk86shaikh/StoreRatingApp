import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Store, UserCircle } from 'lucide-react'
import { classNames } from '../../utils/helpers'

const ADMIN_LINKS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Manage Users', icon: Users },
  { to: '/admin/stores', label: 'Manage Stores', icon: Store },
]

const OWNER_LINKS = [
  { to: '/owner/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/owner/profile', label: 'Profile', icon: UserCircle },
]

const Sidebar = ({ role }) => {
  const links = role === 'admin' ? ADMIN_LINKS : OWNER_LINKS

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-gray-100 bg-white min-h-[calc(100vh-4rem)] py-6 px-3">
      <nav className="space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              classNames(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-ink/60 hover:bg-gray-50 hover:text-ink'
              )
            }
          >
            <Icon className="w-4.5 h-4.5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar