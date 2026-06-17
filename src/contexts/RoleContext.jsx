import { createContext, useContext } from 'react'
import { AuthContext } from './AuthContext'

export const RoleContext = createContext(null)

export const RoleProvider = ({ children }) => {
  const { user } = useContext(AuthContext)

  const role = user?.role || null

  const value = {
    role,
    isAdmin: role === 'admin',
    isUser: role === 'user',
    isStoreOwner: role === 'store_owner',
  }

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
}

export const useRole = () => {
  const context = useContext(RoleContext)
  if (!context) throw new Error('useRole must be used within a RoleProvider')
  return context
}

export default useRole