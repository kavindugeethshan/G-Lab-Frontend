import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Cross-tab storage listener
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        setToken(e.newValue);
      }
      if (e.key === 'user') {
        try {
          setUser(e.newValue ? JSON.parse(e.newValue) : null);
        } catch {
          setUser(null);
        }
      }
    };

    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  // Verify profile on initial mount if token exists
  useEffect(() => {
    let isMounted = true;
    async function verifySession() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await authService.getProfile();
        if (isMounted && res && res.user) {
          setUser(res.user);
          localStorage.setItem('user', JSON.stringify(res.user));
        }
      } catch (err) {
        console.warn('Session verification failed:', err?.message);
        // If 401, token is removed by interceptor
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    verifySession();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const login = useCallback(async (email, password) => {
    const data = await authService.login(email, password);
    if (!data.token) {
      throw new Error('Server did not return a session token.');
    }
    setToken(data.token);
    setUser(data.user || {});
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user || {}));
    return data;
  }, []);

  const register = useCallback(async (userData) => {
    return await authService.register(userData);
  }, []);

  const verifyEmail = useCallback(async (email, otp) => {
    return await authService.verifyEmail(email, otp);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cartCount');
  }, []);

  const updateUser = useCallback((updatedData) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedData };
      localStorage.setItem('user', JSON.stringify(merged));
      return merged;
    });
  }, []);

  const isAdmin = Boolean(
    user && (user.isadmin === true || user.isadmin === 'true' || user.isAdmin === true || user.role === 'admin')
  );

  const value = {
    token,
    user,
    isAuthenticated: Boolean(token),
    isAdmin,
    loading,
    login,
    register,
    verifyEmail,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
