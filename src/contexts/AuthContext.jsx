// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // load existing session/profile on mount, e.g. from localStorage or an API call
    const stored = localStorage.getItem('profile');
    if (stored) setProfile(JSON.parse(stored));
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    // replace with your real login call
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data = await res.json();
    setProfile(data.profile);
    localStorage.setItem('profile', JSON.stringify(data.profile));
    return data;
  };

  const logout = async () => {
    setProfile(null);
    localStorage.removeItem('profile');
  };

  return (
    <AuthContext.Provider value={{ profile, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};