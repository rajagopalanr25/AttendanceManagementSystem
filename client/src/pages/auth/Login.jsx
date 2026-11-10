import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CalendarCheck2, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      const data = await login(email, password);
      toast.success(`Welcome back, ${data.user.name}!`);

      // Role-based redirection
      if (data.user.role === 'admin') {
        navigate('/admin');
      } else if (data.user.role === 'teacher') {
        navigate('/teacher');
      } else {
        navigate('/student');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20 mb-3">
            <CalendarCheck2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Student Attendance ERP
          </h1>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            Sign in to access college attendance portal & dashboards
          </p>
        </div>

        {/* Login Form Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@college.edu"
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Switcher */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center mb-2.5">
              Instant Demo Quick Fill
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('admin@example.com', 'Admin@123')}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-purple-100 bg-purple-50/60 hover:bg-purple-100 text-purple-700 transition-all"
              >
                <ShieldCheck className="w-4 h-4 mb-0.5" />
                <span className="text-[11px] font-bold">Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('teacher@example.com', 'Teacher@123')}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-indigo-100 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-700 transition-all"
              >
                <GraduationCap className="w-4 h-4 mb-0.5" />
                <span className="text-[11px] font-bold">Teacher</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('student@example.com', 'Student@123')}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-blue-100 bg-blue-50/60 hover:bg-blue-100 text-blue-700 transition-all"
              >
                <UserCheck className="w-4 h-4 mb-0.5" />
                <span className="text-[11px] font-bold">Student</span>
              </button>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Role-Based Access Control • Institutional Data Protection • 256-bit JWT
        </p>
      </div>
    </div>
  );
};
