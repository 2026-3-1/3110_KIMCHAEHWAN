import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('devclass_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const saveUser = useCallback((userData) => {
    const { token, tokenType, ...userWithoutToken } = userData;
    localStorage.setItem('devclass_user', JSON.stringify(userWithoutToken));
    if (token) localStorage.setItem('devclass_token', token);
    setUser(userWithoutToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('devclass_user');
    localStorage.removeItem('devclass_token');
    setUser(null);
  }, []);

  useEffect(() => {
    const handler = () => logout();
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, saveUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
