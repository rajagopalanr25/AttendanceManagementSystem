import React, { useState, useEffect } from 'react';
import {
  CalendarCheck2,
  Search,
  Filter,
  History,
  Download,
  Calendar,
  Layers,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import api from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { exportToCSV } from '../../utils/exportUtils';
import dayjs from 'dayjs';

export const AdminAttendanceHub = () => {
  const [activeTab, setActiveTab] = useState('records'); // 'records' | 'audit'

  // Records state
  const [records, setRecords] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [startDate, setStartDate] = useState(dayjs().subtract(14, 'day').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [pagination, setPagination] = useState({ page: 1, limit: 30, total: 0, totalPages: 1 });

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    if (activeTab === 'records') {
      fetchRecords();
    } else {
      fetchAuditLogs();
    }
  }, [activeTab, pagination.page, selectedClass, selectedSubject, selectedStatus, startDate, endDate]);

  const fetchMetadata = async () => {
    try {
      const [classRes, subRes] = await Promise.all([
        api.get('/classes'),
        api.get('/subjects')
      ]);
      if (classRes.data.success) setClasses(classRes.data.data);
      if (subRes.data.success) setSubjects(subRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        classId: selectedClass || undefined,
        subjectId: selectedSubject || undefined,
        status: selectedStatus || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      };
      const res = await api.get('/attendance', { params });
      if (res.data.success) {
        setRecords(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setAuditLoading(true);
      const res = await api.get('/attendance/audit-logs');
      if (res.data.success) {
        setAuditLogs(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleExportCSV = () => {
    const rows = records.map((r) => ({
      Date: dayjs(r.date).format('YYYY-MM-DD'),
      'Student Name': r.student?.fullName || '',
      'Register Number': r.student?.registerNumber || '',
      Subject: r.subject?.name || '',
      Class: r.class?.name || '',
      Status: r.status,
      Remarks: r.remarks || ''
    }));
    exportToCSV(rows, 'attendance_records.csv');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Attendance Hub & Audit Logs
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Inspect raw institutional records, verify attendance entries, and review tamper-evident audit trails
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'records' && (
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Export Records
            </button>
          )}

          {/* Tab Switcher */}
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100/80 p-1">
            <button
              onClick={() => setActiveTab('records')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'records'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Attendance Records
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'audit'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Audit Trail
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'records' ? (
        <>
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-600"
              />
            </div>

            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-blue-600 bg-white"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-blue-600 bg-white"
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-blue-600 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="On Duty">On Duty</option>
            </select>
          </div>

          {/* Records Table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Reg Number</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8">
                        <EmptyState title="No attendance entries found" description="Adjust date range or class/subject filters." />
                      </td>
                    </tr>
                  ) : (
                    records.map((r) => (
                      <tr key={r._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {dayjs(r.date).format('YYYY-MM-DD')}
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-slate-700">
                          {r.student?.registerNumber || '—'}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {r.student?.fullName || '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {r.subject?.code} - {r.subject?.name}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {r.class?.name}
                        </td>
                        <td className="py-3 px-4">
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
                        <td className="py-3 px-4 text-slate-500 truncate max-w-xs">
                          {r.remarks || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 bg-slate-50/50">
              <span className="text-xs text-slate-500">
                Total {pagination.total} records recorded
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-xs font-semibold text-slate-700 px-2">
                  Page {pagination.page} of {pagination.totalPages || 1}
                </span>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Audit Trail Tab */
        <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-800">Compliance & Security Audit Trail</h3>
            <p className="text-xs text-slate-500">All attendance markings, bulk operations, and edits are permanently logged</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Performed By</th>
                  <th className="py-3 px-4">Details / Changes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8">
                      <EmptyState title="No audit logs recorded yet" />
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {dayjs(log.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-semibold text-[10px] px-2 py-0.5 rounded-full ${
                            log.action === 'CREATE'
                              ? 'bg-emerald-50 text-emerald-700'
                              : log.action === 'UPDATE'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">{log.entityType}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">{log.performedByName}</span>
                        <span className="text-slate-400 text-[10px] ml-1 uppercase">({log.performedByRole})</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-md">
                        {log.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

