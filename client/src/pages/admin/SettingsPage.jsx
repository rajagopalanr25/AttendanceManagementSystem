import React, { useState, useEffect } from 'react';
import { Settings, Save, BellRing, Sliders, ShieldAlert, Check } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'sonner';

export const SettingsPage = () => {
  const [settings, setSettings] = useState({
    institutionName: '',
    academicYear: '',
    minimumAttendancePercentage: 75,
    criticalAttendancePercentage: 65,
    allowTeacherEditDays: 7,
    enableShortageAlerts: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Announcement state
  const [announcement, setAnnouncement] = useState({
    title: '',
    message: '',
    role: 'all',
    type: 'info'
  });
  const [broadcasting, setBroadcasting] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      if (res.data.success) {
        setSettings(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.put('/settings', settings);
      if (res.data.success) {
        toast.success('System configuration updated successfully');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating settings');
    } finally {
      setSaving(false);
    }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!announcement.title || !announcement.message) {
      toast.error('Please enter announcement title and message');
      return;
    }

    try {
      setBroadcasting(true);
      const res = await api.post('/notifications/announce', announcement);
      if (res.data.success) {
        toast.success('Campus announcement broadcasted successfully');
        setAnnouncement({ title: '', message: '', role: 'all', type: 'info' });
      }
    } catch (err) {
      toast.error('Failed to dispatch announcement');
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Institution & Policy Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure attendance eligibility thresholds, faculty edit windows, and broadcast announcements
        </p>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Sliders className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-800">Attendance Policies & Thresholds</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Institution Name
            </label>
            <input
              type="text"
              required
              value={settings.institutionName}
              onChange={(e) => setSettings({ ...settings, institutionName: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Active Academic Year
            </label>
            <input
              type="text"
              required
              value={settings.academicYear}
              onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Minimum Attendance Eligibility Percentage (%)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={100}
                required
                value={settings.minimumAttendancePercentage}
                onChange={(e) => setSettings({ ...settings, minimumAttendancePercentage: Number(e.target.value) })}
                className="w-24 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-600"
              />
              <span className="text-xs text-slate-500">Students below this mark receive shortage warnings</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Critical Shortage Percentage (%)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={100}
                required
                value={settings.criticalAttendancePercentage}
                onChange={(e) => setSettings({ ...settings, criticalAttendancePercentage: Number(e.target.value) })}
                className="w-24 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-rose-700 outline-none focus:border-rose-600"
              />
              <span className="text-xs text-slate-500">Immediate dean notification and exam disbarment</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Faculty Edit Window (Days)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={30}
                required
                value={settings.allowTeacherEditDays}
                onChange={(e) => setSettings({ ...settings, allowTeacherEditDays: Number(e.target.value) })}
                className="w-24 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-600"
              />
              <span className="text-xs text-slate-500">Days after session date during which teachers can edit</span>
            </div>
          </div>

          <div className="flex items-center pt-5">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableShortageAlerts}
                onChange={(e) => setSettings({ ...settings, enableShortageAlerts: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs font-semibold text-slate-700">
                Enable Automated In-App Low Attendance Alerts
              </span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-2xs hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving Changes...' : 'Save System Settings'}
          </button>
        </div>
      </form>

      {/* Broadcast Campus Announcement */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <BellRing className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-800">Broadcast Campus Announcement</h3>
        </div>

        <form onSubmit={handleBroadcast} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Announcement Title *
              </label>
              <input
                type="text"
                required
                value={announcement.title}
                onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
                placeholder="Semester Exam Eligibility Circular"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Audience Role *
              </label>
              <select
                value={announcement.role}
                onChange={(e) => setAnnouncement({ ...announcement, role: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-600 bg-white"
              >
                <option value="all">Everyone (All Roles)</option>
                <option value="student">Students Only</option>
                <option value="teacher">Faculty Only</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Message Content *
            </label>
            <textarea
              rows={3}
              required
              value={announcement.message}
              onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })}
              placeholder="Important notice details regarding attendance requirements..."
              className="w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-blue-600"
            />
          </div>

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={broadcasting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-indigo-700 disabled:opacity-50"
            >
              <BellRing className="w-3.5 h-3.5" />
              {broadcasting ? 'Broadcasting...' : 'Dispatch Announcement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
