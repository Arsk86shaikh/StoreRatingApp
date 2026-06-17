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
      setProfile(null);
      setUser(null);
      setError(null);
      return null;
    }

    try {
      console.log('Fetching profile for user:', userId);

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error('Fetch error:', fetchError);

        // Profile not found — use auth metadata as fallback
        if (fetchError.code === 'PGRST116') {
          const {
            data: { user: authUser },
          } = await supabase.auth.getUser();

          if (authUser) {
            const meta = authUser.user_metadata || {};
            const fallbackProfile = {
              id: userId,
              email: authUser.email,
              full_name: meta.full_name || '',
              address: meta.address || '',
              role: meta.role || ROLES.USER,
              created_at: authUser.created_at,
              updated_at: new Date().toISOString(),
            };

            console.log('Using fallback profile:', fallbackProfile);
            setProfile(fallbackProfile);
            setUser(authUser);
            setError(null);
            return fallbackProfile;
          }
        }

        throw fetchError;
      }

      console.log('Profile fetched:', data);
      setProfile(data);
      setError(null);
      return data;
    } catch (err) {
      console.error('Profile fetch error:', err.message);
      setError(err.message);
      setProfile(null);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (authUser?.id) {
        setUser(authUser);
        return await fetchProfile(authUser.id);
      } else {
        setProfile(null);
        setUser(null);
        return null;
      }
    } catch (err) {
      console.error('Refresh profile error:', err.message);
      setError(err.message);
      return null;
    }
  }, [fetchProfile]);

  const getRoleHome = useCallback(
    (profileData) => {
      const p = profileData || profile;
      if (!p || !p.role) return '/login';
      return ROLE_HOME[p.role] || ROLE_HOME[ROLES.USER];
    },
    [profile]
  );

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (mounted) {
          if (session?.user?.id) {
            console.log('Session found, fetching profile...');
            setUser(session.user);
            await fetchProfile(session.user.id);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Auth initialization error:', err.message);
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      if (mounted) {
        if (session?.user?.id) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setProfile(null);
      setUser(null);
      setError(null);
    } catch (err) {
      console.error('Logout error:', err.message);
      setError(err.message);
      throw err;
    }
  }, []);

  const value = {
    profile,
    user,
    loading,
    error,
    isAuthenticated: !!profile && !!user,
    logout,
    refreshProfile,
    getRoleHome,
    role: profile?.role,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;