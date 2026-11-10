import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { DashboardLayout } from '../components/layout/DashboardLayout';

// Auth Pages
import { Login } from '../pages/auth/Login';
import { ForgotPassword } from '../pages/auth/ForgotPassword';
import { ResetPassword } from '../pages/auth/ResetPassword';

// Admin Pages
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { StudentsPage } from '../pages/admin/StudentsPage';
import { TeachersPage } from '../pages/admin/TeachersPage';
import { DepartmentsPage } from '../pages/admin/DepartmentsPage';
import { ClassesPage } from '../pages/admin/ClassesPage';
import { SubjectsPage } from '../pages/admin/SubjectsPage';
import { AdminAttendanceHub } from '../pages/admin/AdminAttendanceHub';
import { ReportsPage } from '../pages/admin/ReportsPage';
import { SettingsPage } from '../pages/admin/SettingsPage';

// Teacher Pages
import { TeacherDashboard } from '../pages/teacher/TeacherDashboard';
import { MarkAttendancePage } from '../pages/teacher/MarkAttendancePage';
import { TeacherAttendanceHistory } from '../pages/teacher/TeacherAttendanceHistory';
import { TeacherReportsPage } from '../pages/teacher/TeacherReportsPage';

// Student Pages
import { StudentDashboard } from '../pages/student/StudentDashboard';
import { StudentCalendarPage } from '../pages/student/StudentCalendarPage';
import { StudentReportPage } from '../pages/student/StudentReportPage';
import { StudentProfilePage } from '../pages/student/StudentProfilePage';

// Root redirector based on authenticated user's role
const RoleRedirect = () => {
  const { role, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role === 'admin') return <Navigate to="/admin" replace />;
  if (role === 'teacher') return <Navigate to="/teacher" replace />;
  return <Navigate to="/student" replace />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Root Role-Based Redirection */}
      <Route path="/" element={<RoleRedirect />} />

      {/* Protected Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/students" element={<StudentsPage />} />
          <Route path="/admin/teachers" element={<TeachersPage />} />
          <Route path="/admin/departments" element={<DepartmentsPage />} />
          <Route path="/admin/classes" element={<ClassesPage />} />
          <Route path="/admin/subjects" element={<SubjectsPage />} />
          <Route path="/admin/attendance" element={<AdminAttendanceHub />} />
          <Route path="/admin/reports" element={<ReportsPage />} />
          <Route path="/admin/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Protected Teacher Routes */}
      <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/teacher" element={<TeacherDashboard />} />
          <Route path="/teacher/mark" element={<MarkAttendancePage />} />
          <Route path="/teacher/history" element={<TeacherAttendanceHistory />} />
          <Route path="/teacher/reports" element={<TeacherReportsPage />} />
        </Route>
      </Route>

      {/* Protected Student Routes */}
      <Route element={<ProtectedRoute allowedRoles={['student']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/calendar" element={<StudentCalendarPage />} />
          <Route path="/student/report" element={<StudentReportPage />} />
          <Route path="/student/profile" element={<StudentProfilePage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

