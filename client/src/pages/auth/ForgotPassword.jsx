import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, KeyRound } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'sonner';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenHint, setTokenHint] = useState(null);
  const navigate = useNavigate();

  const handleForgot = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data.success) {
        toast.success(res.data.message);
        if (res.data.demoResetToken) {
          setTokenHint(res.data.demoResetToken);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error requesting reset token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-3 border border-blue-100">
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Forgot Password</h2>
            <p className="mt-1 text-xs text-slate-500">
              Enter your registered email address and we will generate a password reset authorization.
            </p>
          </div>

          <form onSubmit={handleForgot} className="space-y-4">
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
                  placeholder="admin@example.com"
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-60 cursor-pointer"
            >
              {loading ? 'Processing...' : 'Send Reset Instructions'}
            </button>
          </form>

          {tokenHint && (
            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800">
              <p className="font-semibold mb-1">Generated Reset Token:</p>
              <code className="block break-all bg-emerald-100 p-2 rounded text-[11px] font-mono select-all">
                {tokenHint}
              </code>
              <button
                type="button"
                onClick={() => navigate(`/reset-password?token=${tokenHint}`)}
                className="mt-2.5 inline-flex items-center gap-1 font-semibold text-emerald-700 underline"
              >
                Proceed to Reset Password Now &rarr;
              </button>
            </div>
          )}

          <div className="mt-6 text-center border-t border-slate-100 pt-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
