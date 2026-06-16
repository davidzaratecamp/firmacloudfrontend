import { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('fc_token');
    if (token) {
      getMe().then(r => setUser(r.data)).catch(() => localStorage.removeItem('fc_token')).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = (token, userData) => {
    localStorage.setItem('fc_token', token);
    setUser(userData);
  };

  const signOut = () => {
    localStorage.removeItem('fc_token');
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
