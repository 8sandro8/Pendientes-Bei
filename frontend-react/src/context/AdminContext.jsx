import { createContext, useContext, useState, useEffect } from 'react';

const AdminContext = createContext();

const ADMIN_TOKEN_KEY = 'admin_token';
const API_URL = '/api';

export function AdminProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(ADMIN_TOKEN_KEY));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) {
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
    }
  }, [token]);

  const login = async (password) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[AdminContext] Intentando login...');
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      console.log('[AdminContext] Response status:', res.status);

      if (res.ok) {
        const data = await res.json();
        console.log('[AdminContext] Login exitoso, token:', data.token ? 'recibido' : 'FALTA');
        setToken(data.token);
        return true;
      } else {
        const data = await res.json();
        console.log('[AdminContext] Login fallido:', data.message);
        setError(data.message || 'Contraseña incorrecta');
        return false;
      }
    } catch (err) {
      console.error('[AdminContext] Error de conexión:', err);
      setError('Error de conexión');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setError(null);
  };

  const isAuthenticated = !!token;

  const authFetch = async (url, options = {}) => {
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    };
    return fetch(url, { ...options, headers });
  };

  return (
    <AdminContext.Provider value={{
      token,
      isAuthenticated,
      isLoading,
      error,
      login,
      logout,
      authFetch,
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);
