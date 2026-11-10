import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import api from '../../services/api';
import { toast } from 'sonner';

export const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
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
      setLoading(true);
      const res = await api.put('/auth/change-password', {
        currentPassword,
        newPassword
      });
      if (res.data.success) {
        toast.success('Password updated successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Password">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Current Password
          </label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            placeholder="••••••••"
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
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            placeholder="Min 6 characters"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Confirm New Password
          </label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            placeholder="Repeat new password"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Update Password'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

