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