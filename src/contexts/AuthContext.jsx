// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { ROLE_HOME, ROLES } from '../constants/roles';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null); setUser(null); setError(null);
      return null;
    }
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles').select('*').eq('id', userId).single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) {
            const meta = authUser.user_metadata || {};
            const fallback = {
              id: userId, email: authUser.email,
              full_name: meta.full_name || '', address: meta.address || '',
              role: meta.role || ROLES.USER,
              created_at: authUser.created_at, updated_at: new Date().toISOString(),
            };
            setProfile(fallback); setUser(authUser); setError(null);
            return fallback;
          }
        }
        throw fetchError;
      }
      setProfile(data); setError(null);
      return data;
    } catch (err) {
      console.error('Profile fetch error:', err.message);
      setError(err.message); setProfile(null);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (authUser?.id) { setUser(authUser); return await fetchProfile(authUser.id); }
      setProfile(null); setUser(null); return null;
    } catch (err) {
      console.error('Refresh profile error:', err.message);
      setError(err.message); return null;
    }
  }, [fetchProfile]);

  const getRoleHome = useCallback((profileData) => {
    const p = profileData || profile;
    if (!p?.role) return '/login';
    return ROLE_HOME[p.role] || ROLE_HOME[ROLES.USER];
  }, [profile]);

  useEffect(() => {
    let mounted = true;
    const initializeAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (session?.user?.id && mounted) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        }
      } catch (err) {
        console.error('Auth initialization error:', err.message);
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    initializeAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (session?.user?.id) { setUser(session.user); await fetchProfile(session.user.id); }
      else { setUser(null); setProfile(null); }
    });

    return () => { mounted = false; listener?.subscription?.unsubscribe(); };
  }, [fetchProfile]);

  const login = useCallback(async (email, password) => {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(), password,
    });
    if (signInError) {
      const msg = signInError.message?.toLowerCase() || '';
      if (msg.includes('email not confirmed')) {
        throw new Error('Please confirm your email address first. Check your inbox for the confirmation link.');
      }
      throw signInError;
    }
  }, []);

  const signup = useCallback(async ({ email, password, name, address, role = ROLES.USER }) => {
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(), password,
      options: { data: { full_name: name, address, role } },
    });
    if (signUpError) throw signUpError;
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setProfile(null); setUser(null); setError(null);
    } catch (err) {
      console.error('Logout error:', err.message);
      setError(err.message); throw err;
    }
  }, []);

  const updatePassword = useCallback(async (newPassword) => {
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) throw updateError;
  }, []);

  const value = {
    profile, user, loading, error,
    isAuthenticated: !!(user || profile),
    role: profile?.role || null,
    login, signup, logout, updatePassword, refreshProfile, getRoleHome,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export default useAuth;