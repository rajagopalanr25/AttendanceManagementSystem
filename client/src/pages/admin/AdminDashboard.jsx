import React, { useState, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  Building2,
  Layers,
  CalendarCheck2,
  AlertTriangle,
  UserX,
  TrendingUp,
  Filter,
  ArrowUpRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import api from '../../services/api';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [selectedDept]);

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      if (res.data.success) {
        setDepartments(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedDept) params.departmentId = selectedDept;

      const res = await api.get('/dashboard/admin', { params });
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
    return <LoadingSkeleton rows={6} />;
  }

  const stats = data?.stats || {};
  const charts = data?.charts || {};
  const lowAttendance = data?.lowAttendanceStudents || [];
  const recentSessions = data?.recentActivity || [];

  return (
    <div className="space-y-6">
      {/* Top Header & Department Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            College Attendance Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time institutional attendance overview and compliance tracking
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs outline-none focus:border-blue-600"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.code} - {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={stats.totalStudents || 0}
          subtitle="Enrolled active students"
          icon={Users}
          color="blue"
        />

        <StatCard
          title="Total Teachers"
          value={stats.totalTeachers || 0}
          subtitle="Faculty members across depts"
          icon={GraduationCap}
          color="indigo"
        />

        <StatCard
          title="Today's Attendance"
          value={`${stats.todayPercentage || 0}%`}
          subtitle={`${stats.todayPresent || 0} Present • ${stats.todayAbsent || 0} Absent • ${stats.todayOnDuty || 0} On Duty`}
          icon={CalendarCheck2}
          color={stats.todayPercentage >= 75 ? 'green' : 'amber'}
        />

        <StatCard
          title="Shortage Alert (<75%)"
          value={stats.studentsBelowThreshold || 0}
          subtitle="Students below eligibility mark"
          icon={AlertTriangle}
          color="rose"
        />
      </div>

      {/* Secondary KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <span className="text-[11px] font-semibold uppercase text-slate-400">Total Departments</span>
          <p className="text-lg font-bold text-slate-800 mt-0.5">{stats.totalDepartments || 0}</p>
        </div>
        <div>
          <span className="text-[11px] font-semibold uppercase text-slate-400">Total Classes</span>
          <p className="text-lg font-bold text-slate-800 mt-0.5">{stats.totalClasses || 0}</p>
        </div>
        <div>
          <span className="text-[11px] font-semibold uppercase text-slate-400">Today Present</span>
          <p className="text-lg font-bold text-emerald-600 mt-0.5">{stats.todayPresent || 0}</p>
        </div>
        <div>
          <span className="text-[11px] font-semibold uppercase text-slate-400">Today Absent</span>
          <p className="text-lg font-bold text-rose-600 mt-0.5">{stats.todayAbsent || 0}</p>
        </div>
      </div>

      {/* Charts Section: Weekly Trend & Status Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Trend Line Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Weekly Attendance Trend</h3>
              <p className="text-[11px] text-slate-400">Daily overall institution percentage</p>
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              Past 7 Days
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.weeklyTrend || []} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value) => [`${value}%`, 'Attendance Rate']}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="percentage"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#2563eb' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs flex flex-col">
          <h3 className="text-sm font-bold text-slate-800">Overall Status Distribution</h3>
          <p className="text-[11px] text-slate-400 mb-2">Total cumulative marked status</p>

          <div className="h-56 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.statusPie || []}
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {(charts.statusPie || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [value, name]}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Department-wise Bar Chart */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Department-wise Attendance Performance</h3>
            <p className="text-[11px] text-slate-400">Comparison across academic departments</p>
          </div>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts.departmentWise || []} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="code" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value) => [`${value}%`, 'Average Rate']}
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              />
              <Bar dataKey="percentage" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Low Attendance Alert Table & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Students with Low Attendance */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                Students With Low Attendance (&lt;75%)
              </h3>
              <p className="text-[11px] text-slate-400">Requires academic warning or counseling</p>
            </div>
            <Link
              to="/admin/reports?reportType=low_attendance"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
            >
              Full Report <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/60 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Reg No</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Dept / Class</th>
                  <th className="py-2.5 px-3 text-right">Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lowAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-400">
                      No students currently below threshold
                    </td>
                  </tr>
                ) : (
                  lowAttendance.map((item, idx) => {
                    const st = item.studentId;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-700">
                          {st?.registerNumber}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {st?.fullName}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {st?.department?.code} - {st?.class?.name}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Badge variant={item.percentage < 65 ? 'critical' : 'shortage'} size="sm">
                            {item.percentage}%
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Attendance Activity */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Recent Attendance Sessions</h3>
              <p className="text-[11px] text-slate-400">Latest class sessions recorded by faculty</p>
            </div>
            <Link
              to="/admin/attendance"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
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
                      No attendance sessions recorded yet
                    </td>
                  </tr>
                ) : (
                  recentSessions.map((rec, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 text-slate-600">
                        {dayjs(rec.date).format('DD MMM YYYY')}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {rec.subject?.name || 'Subject'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {rec.class?.name || 'Class'}
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

