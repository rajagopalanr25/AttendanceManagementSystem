import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Building2,
  BookOpen,
  Layers,
  CalendarCheck2,
  FileSpreadsheet,
  Settings,
  CalendarDays,
  UserCheck,
  CheckCircle2,
  ClipboardList,
  LogOut,
  X
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, role, logout } = useAuth();

  const adminNav = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Students', path: '/admin/students', icon: Users },
    { name: 'Teachers', path: '/admin/teachers', icon: GraduationCap },
    { name: 'Departments', path: '/admin/departments', icon: Building2 },
    { name: 'Classes', path: '/admin/classes', icon: Layers },
    { name: 'Subjects', path: '/admin/subjects', icon: BookOpen },
    { name: 'Attendance Hub', path: '/admin/attendance', icon: CalendarCheck2 },
    { name: 'Reports & Analytics', path: '/admin/reports', icon: FileSpreadsheet },
    { name: 'Settings', path: '/admin/settings', icon: Settings }
  ];

  const teacherNav = [
    { name: 'Dashboard', path: '/teacher', icon: LayoutDashboard },
    { name: 'Mark Attendance', path: '/teacher/mark', icon: UserCheck },
    { name: 'Attendance History', path: '/teacher/history', icon: ClipboardList },
    { name: 'Subject Reports', path: '/teacher/reports', icon: FileSpreadsheet }
  ];

  const studentNav = [
    { name: 'My Dashboard', path: '/student', icon: LayoutDashboard },
    { name: 'Attendance Calendar', path: '/student/calendar', icon: CalendarDays },
    { name: 'Attendance Report', path: '/student/report', icon: FileSpreadsheet },
    { name: 'My Profile', path: '/student/profile', icon: Users }
  ];

  let navItems = studentNav;
  if (role === 'admin') navItems = adminNav;
  else if (role === 'teacher') navItems = teacherNav;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-base shadow-sm">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-none">
                ATTENDIQ
              </h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase mt-1">
                College Attendance ERP
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {role?.toUpperCase()} MENU
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin' || item.path === '/teacher' || item.path === '/student'}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </div>

        {/* User Pill / Footer */}
        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
            <div className="flex items-center gap-2.5 truncate">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs uppercase">
                {user?.name?.slice(0, 2) || 'U'}
              </div>
              <div className="truncate text-left">
                <p className="text-xs font-semibold text-slate-800 truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">{role}</p>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

