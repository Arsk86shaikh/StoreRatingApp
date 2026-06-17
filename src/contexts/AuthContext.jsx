import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../services/supabase'

export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      return
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      // Row may not exist yet for a split second right after signup while the
      // DB trigger runs — don't treat this as a hard failure.
      console.warn('Could not fetch profile:', error.message)
      setProfile(null)
      return
    }
    setProfile(data)
  }, [])

  const refreshProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    await fetchProfile(user?.id)
  }, [fetchProfile])

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchProfile(session?.user?.id).finally(() => {
        if (mounted) setLoading(false)
      })
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchProfile(session?.user?.id)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [fetchProfile])

  const logout = async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }

  const value = {
    profile,
    user: profile, // alias so components/hooks expecting `user` keep working
    loading,
    isAuthenticated: !!profile,
    logout,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export default useAuth