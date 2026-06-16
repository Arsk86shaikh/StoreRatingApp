import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Star, LogOut, User, ChevronDown, Menu, X } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { ROLE_HOME, ROLE_LABELS } from '../../constants/roles'
import { getInitials } from '../../utils/helpers'

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const homeLink = user ? ROLE_HOME[user.role] : '/'

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to={homeLink} className="flex items-center gap-2 font-display font-bold text-lg text-ink">
          <span className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <Star className="w-4.5 h-4.5 text-white" fill="white" />
          </span>
          RateIt
        </Link>

        {user && (
          <>
            {/* Desktop user menu */}
            <div className="hidden sm:block relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors"
              >
                <span className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold">
                  {getInitials(user.name)}
                </span>
                <span className="text-sm font-medium text-ink/80">{user.name.split(' ')[0]}</span>
                <ChevronDown className="w-4 h-4 text-ink/40" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-card border border-gray-100 py-1.5 z-20">
                    <div className="px-3.5 py-2.5 border-b border-gray-100">
                      <p className="text-sm font-semibold text-ink truncate">{user.name}</p>
                      <p className="text-xs text-ink/50 truncate">{user.email}</p>
                      <span className="inline-block mt-1.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">
                        {ROLE_LABELS[user.role]}
                      </span>
                    </div>
                    <Link
                      to={`/${user.role === 'store_owner' ? 'owner' : user.role}/profile`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3.5 py-2 text-sm text-ink/70 hover:bg-gray-50"
                    >
                      <User className="w-4 h-4" /> Profile & password
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      <LogOut className="w-4 h-4" /> Log out
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Mobile toggle */}
            <button className="sm:hidden p-2" onClick={() => setMobileOpen((o) => !o)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </>
        )}
      </div>

      {user && mobileOpen && (
        <div className="sm:hidden border-t border-gray-100 px-4 py-3 space-y-1">
          <div className="px-1 pb-2 mb-1 border-b border-gray-100">
            <p className="text-sm font-semibold text-ink">{user.name}</p>
            <p className="text-xs text-ink/50">{user.email}</p>
          </div>
          <Link
            to={`/${user.role === 'store_owner' ? 'owner' : user.role}/profile`}
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 px-1 py-2 text-sm text-ink/70"
          >
            <User className="w-4 h-4" /> Profile & password
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-1 py-2 text-sm text-red-600 w-full text-left"
          >
            <LogOut className="w-4 h-4" /> Log out
          </button>
        </div>
      )}
    </header>
  )
}

export default Navbar