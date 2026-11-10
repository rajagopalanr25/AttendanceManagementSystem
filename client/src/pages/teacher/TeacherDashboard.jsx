import React, { useState, useEffect } from 'react';
import {
  CalendarCheck2,
  BookOpen,
  Layers,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import dayjs from 'dayjs';

export const TeacherDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/teacher');
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

  const teacher = data?.teacher || {};
  const stats = data?.stats || {};
  const todaySchedule = data?.todaySchedule || [];
  const lowStudents = data?.lowAttendanceStudents || [];
  const recentSessions = data?.recentSessions || [];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="rounded-2xl bg-linear-to-r from-blue-700 to-indigo-800 p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-xs mb-3">
            Faculty Attendance Portal
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Welcome, {teacher.fullName}
          </h1>
          <p className="text-xs text-blue-100 mt-1 max-w-xl">
            {teacher.designation} • ID: {teacher.teacherId} • Select a scheduled class below to record or review attendance
          </p>
        </div>

        <Link
          to="/teacher/mark"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-blue-700 shadow-sm hover:bg-blue-50 transition-colors shrink-0"
        >
          <CalendarCheck2 className="w-4 h-4" />
          Mark Attendance Now
        </Link>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Classes"
          value={stats.assignedClassesCount || 0}
          subtitle="Class sections taught"
          icon={Layers}
          color="blue"
        />

        <StatCard
          title="Assigned Subjects"
          value={stats.assignedSubjectsCount || 0}
          subtitle="Theory & lab courses"
          icon={BookOpen}
          color="indigo"
        />

        <StatCard
          title="Students Taught"
          value={stats.totalStudentsTaught || 0}
          subtitle="Total enrolled students"
          icon={Users}
          color="green"
        />

        <StatCard
          title="Average Attendance"
          value={stats.overallTaughtRate !== null ? `${stats.overallTaughtRate}%` : 'N/A'}
          subtitle="Across your courses"
          icon={TrendingUp}
          color={stats.overallTaughtRate >= 75 ? 'green' : 'amber'}
        />
      </div>

      {/* Today's Marking Schedule Status */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Today's Class Schedule & Status</h3>
            <p className="text-[11px] text-slate-400">
              {dayjs().format('dddd, MMMM DD, YYYY')} — Real-time recording status
            </p>
          </div>
          <Link
            to="/teacher/mark"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Mark Session <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {todaySchedule.length === 0 ? (
            <div className="col-span-full py-6 text-center text-xs text-slate-400">
              No classes assigned to your faculty profile
            </div>
          ) : (
            todaySchedule.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-blue-700">{item.subjectCode}</span>
                    <span className="text-xs font-semibold text-slate-800 truncate max-w-[150px]">{item.subjectName}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{item.className}</p>
                </div>

                <div>
                  {item.isMarkedToday ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold">
                      <CheckCircle2 className="w-3 h-3" />
                      Marked
                    </span>
                  ) : (
                    <Link
                      to={`/teacher/mark?classId=${item.classId}&subjectId=${item.subjectId}`}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-600 text-white px-2.5 py-1 text-[11px] font-semibold hover:bg-blue-700 shadow-2xs"
                    >
                      <Clock className="w-3 h-3" />
                      Mark Now
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Grid: Low Attendance Alert & Recent Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Students with Low Attendance in Teacher's Courses */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                Students Requiring Attendance Attention
              </h3>
              <p className="text-[11px] text-slate-400">Enrolled students below 75% in your subjects</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/60 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Course</th>
                  <th className="py-2.5 px-3">Class</th>
                  <th className="py-2.5 px-3 text-right">Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lowStudents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-400">
                      All students are maintaining good attendance!
                    </td>
                  </tr>
                ) : (
                  lowStudents.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800">{item.student?.fullName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{item.student?.registerNumber}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 font-medium">
                        {item.subject?.code}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {item.student?.class?.name}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Badge variant={item.percentage < 65 ? 'critical' : 'shortage'} size="sm">
                          {item.percentage}%
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Sessions Marked */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Recent Sessions Recorded</h3>
              <p className="text-[11px] text-slate-400">Your recent attendance submissions</p>
            </div>
            <Link
              to="/teacher/history"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Full Log <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/60 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3">Class</th>
                  <th className="py-2.5 px-3 text-right">P / A / OD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentSessions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-400">
                      No sessions recorded yet
                    </td>
                  </tr>
                ) : (
                  recentSessions.map((rec, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 text-slate-600">
                        {dayjs(rec.date).format('DD MMM YYYY')}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {rec.subject?.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {rec.class?.name}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="font-semibold text-emerald-600">{rec.present}</span>
                        <span className="text-slate-300 mx-1">/</span>
                        <span className="font-semibold text-rose-600">{rec.absent}</span>
                        <span className="text-slate-300 mx-1">/</span>
                        <span className="font-semibold text-blue-600">{rec.onDuty}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

