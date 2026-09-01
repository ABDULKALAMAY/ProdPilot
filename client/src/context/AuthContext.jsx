import { createContext, useContext, useMemo, useState } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);
const STORAGE_KEY = 'prodpilot_session';

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession);

  const saveSession = (nextSession) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
  };

  const login = async (credentials) => {
    const data = await api('/api/auth/login', { method: 'POST', body: credentials });
    saveSession(data);
  };

  const register = async (details) => {
    const data = await api('/api/auth/register', { method: 'POST', body: details });
    saveSession(data);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  };

  const value = useMemo(() => ({
    user: session?.user || null,
    token: session?.token || null,
    isAuthenticated: Boolean(session?.token),
    login,
    register,
    logout
  }), [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
