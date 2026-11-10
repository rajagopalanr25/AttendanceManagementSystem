import React, { useState, useEffect } from 'react';
import {
  CalendarCheck2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BookOpen,
  Calendar,
  Download,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import dayjs from 'dayjs';

export const StudentDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/student');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return <LoadingSkeleton rows={5} />;
  }

  const student = data?.student || {};
  const overall = data?.overall || {};
  const subjects = data?.subjects || [];
  const monthly = data?.monthlyBreakdown || [];
  const lowWarnings = data?.lowAttendanceWarnings || [];
  const recentRecords = data?.recentRecords || [];

  return (
    <div className="space-y-6">
      {/* Student Welcome Hero Banner */}
      <div className="rounded-2xl bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 px-3 py-1 text-xs font-semibold mb-3">
            Student Attendance Portal
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Welcome back, {student.fullName}
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
            Register No: <strong className="text-white font-mono">{student.registerNumber}</strong> • {student.course} • Semester {student.semester} ({student.section}) • {student.department?.name}
          </p>
        </div>

        {/* Overall Percentage Ring / Pill */}
        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 shrink-0">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300">
              Overall Attendance
            </span>
            <div className="text-3xl font-extrabold tracking-tight mt-0.5">
              {overall.percentage !== null ? `${overall.percentage}%` : 'N/A'}
            </div>
            <div className="mt-1">
              <Badge
                variant={
                  overall.status === 'Eligible'
                    ? 'eligible'
                    : overall.status === 'Critical shortage'
                    ? 'critical'
                    : 'shortage'
                }
                size="sm"
              >
                {overall.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Shortage Warnings Banner if any */}
      {lowWarnings.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 shadow-2xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-xs font-bold text-amber-900">
              Attendance Shortage Notice ({lowWarnings.length} Subject{lowWarnings.length > 1 ? 's' : ''})
            </h4>
            <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
              Your attendance in{' '}
              <strong>
                {lowWarnings.map((w) => `${w.subjectName} (${w.percentage}%)`).join(', ')}
              </strong>{' '}
              is currently below the required 75% threshold. Please attend upcoming lectures to maintain examination eligibility.
            </p>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Classes"
          value={overall.total || 0}
          subtitle="Conducted sessions"
          icon={CalendarCheck2}
          color="blue"
        />

        <StatCard
          title="Classes Attended"
          value={overall.attended || 0}
          subtitle={`${overall.present || 0} Present + ${overall.onDuty || 0} OD`}
          icon={CheckCircle2}
          color="green"
        />

        <StatCard
          title="Classes Absent"
          value={overall.absent || 0}
          subtitle="Missed lectures"
          icon={AlertTriangle}
          color="rose"
        />

        <StatCard
          title="On Duty (OD)"
          value={overall.onDuty || 0}
          subtitle="Approved duty sessions"
          icon={Clock}
          color="indigo"
        />
      </div>

      {/* Subject-wise Attendance Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">Subject-wise Attendance Status</h3>
            <p className="text-xs text-slate-500">Breakdown per registered course with eligibility progress</p>
          </div>
          <Link
            to="/student/calendar"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Monthly Calendar <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjects.map((sub) => {
            const pct = sub.percentage !== null ? sub.percentage : 0;
            const progressColor =
              pct >= 85 ? 'bg-emerald-500' : pct >= 75 ? 'bg-amber-500' : 'bg-rose-500';

            return (
              <div
                key={sub.subjectId}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                      {sub.subjectCode}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1.5 line-clamp-1">
                      {sub.subjectName}
                    </h4>
                    <p className="text-[11px] text-slate-400 capitalize">{sub.subjectType} Course</p>
                  </div>

                  <div className="text-right">
                    <span className="text-xl font-bold text-slate-900">
                      {sub.percentage !== null ? `${sub.percentage}%` : 'N/A'}
                    </span>
                    <div className="mt-0.5">
                      <Badge
                        variant={pct >= 75 ? 'eligible' : pct >= 65 ? 'shortage' : 'critical'}
                        size="sm"
                      >
                        {sub.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Sub statistics breakdown */}
                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-4 text-center text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase">Total</span>
                    <p className="font-semibold text-slate-800">{sub.totalClasses}</p>
                  </div>
                  <div>
                    <span className="text-emerald-600 text-[10px] uppercase">Present</span>
                    <p className="font-semibold text-emerald-700">{sub.presentCount}</p>
                  </div>
                  <div>
                    <span className="text-rose-600 text-[10px] uppercase">Absent</span>
                    <p className="font-semibold text-rose-700">{sub.absentCount}</p>
                  </div>
                  <div>
                    <span className="text-blue-600 text-[10px] uppercase">On Duty</span>
                    <p className="font-semibold text-blue-700">{sub.onDutyCount}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Recent Log & Monthly Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Attendance Activity */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Recent Attendance Logs</h3>
              <p className="text-[11px] text-slate-400">Your latest marked lectures</p>
            </div>
            <Link
              to="/student/calendar"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Calendar View &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/60 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3">Faculty</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentRecords.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-400">
                      No recent records available
                    </td>
                  </tr>
                ) : (
                  recentRecords.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 text-slate-600">
                        {dayjs(r.date).format('YYYY-MM-DD')}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {r.subject?.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {r.teacher?.fullName || 'Faculty'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Badge
                          variant={
                            r.status === 'Present'
                              ? 'present'
                              : r.status === 'On Duty'
                              ? 'onDuty'
                              : 'absent'
                          }
                          size="sm"
                        >
                          {r.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Monthly Summary */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Monthly Attendance History</h3>
              <p className="text-[11px] text-slate-400">Monthly aggregates for current semester</p>
            </div>
            <Link
              to="/student/report"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Full Report &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {monthly.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No monthly history recorded yet.</p>
            ) : (
              monthly.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-800">{m.month}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {m.present} Present • {m.absent} Absent • {m.onDuty} On Duty
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 text-sm">{m.percentage}%</span>
                    <div className="mt-0.5">
                      <Badge variant={m.percentage >= 75 ? 'eligible' : 'shortage'} size="sm">
                        {m.percentage >= 75 ? 'Good' : 'Shortage'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

