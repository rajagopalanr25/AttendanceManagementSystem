import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, BookOpen, ShieldCheck, KeyRound } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'sonner';

export const StudentProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPass, setUpdatingPass] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setProfile(res.data.user?.profile);
      }
    } catch (err) {
      toast.error('Failed to load profile details');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setUpdatingPass(true);
      const res = await api.put('/auth/change-password', {
        currentPassword,
        newPassword
      });
      if (res.data.success) {
        toast.success('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setUpdatingPass(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading profile dossier...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          My Student Profile
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Personal identification, enrolled academic department, and account security
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white font-extrabold text-xl uppercase shadow-md shadow-blue-500/20">
              {profile?.fullName?.slice(0, 2) || 'ST'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{profile?.fullName}</h3>
              <p className="text-xs font-mono text-blue-700 font-semibold">{profile?.registerNumber}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {profile?.course} • {profile?.department?.name}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <Mail className="w-4 h-4 text-blue-600 mt-0.5" />
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Email Address</span>
                <p className="font-semibold text-slate-800">{profile?.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <Phone className="w-4 h-4 text-blue-600 mt-0.5" />
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Phone Number</span>
                <p className="font-semibold text-slate-800">{profile?.phoneNumber || 'Not provided'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <BookOpen className="w-4 h-4 text-blue-600 mt-0.5" />
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Cohort / Class</span>
                <p className="font-semibold text-slate-800">{profile?.class?.name || 'Class'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <Calendar className="w-4 h-4 text-blue-600 mt-0.5" />
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Admission Year</span>
                <p className="font-semibold text-slate-800">{profile?.admissionYear || 2024}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Security Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <KeyRound className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">Security Credentials</h3>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-600"
              />
            </div>

            <button
              type="submit"
              disabled={updatingPass}
              className="w-full mt-2 rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-2xs transition-colors disabled:opacity-50"
            >
              {updatingPass ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

