import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, token, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
          <p className="text-xs font-semibold text-slate-500">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // Redirect to their own dashboard
    if (role === 'admin') return <Navigate to="/admin" replace />;
    if (role === 'teacher') return <Navigate to="/teacher" replace />;
    if (role === 'student') return <Navigate to="/student" replace />;
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
