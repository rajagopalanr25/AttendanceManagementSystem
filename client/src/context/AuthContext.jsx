import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('attendance_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('attendance_token') || null);
  const [loading, setLoading] = useState(true);

  // Validate session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('attendance_token');
      if (savedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('attendance_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.error('Session expired or invalid:', err);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('attendance_token', res.data.token);
      localStorage.setItem('attendance_user', JSON.stringify(res.data.user));
      return res.data;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const logout = () => {
    try {
      if (token) api.post('/auth/logout').catch(() => {});
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('attendance_token');
      localStorage.removeItem('attendance_user');
    }
  };

  const updateUser = (updatedData) => {
    setUser((prev) => {
      const nextUser = { ...prev, ...updatedData };
      localStorage.setItem('attendance_user', JSON.stringify(nextUser));
      return nextUser;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user ? user.role : null,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        logout,
        updateUser
      }}
    >
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

