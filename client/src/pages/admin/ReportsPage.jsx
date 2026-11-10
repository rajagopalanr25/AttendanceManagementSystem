import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Filter,
  Printer,
  FileText,
  Calendar,
  Layers,
  BookOpen,
  Users,
  AlertTriangle
} from 'lucide-react';
import api from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { toast } from 'sonner';
import dayjs from 'dayjs';

export const ReportsPage = () => {
  const [reportType, setReportType] = useState('class_wise');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter options
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Selected filters
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [startDate, setStartDate] = useState(dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [threshold, setThreshold] = useState(75);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    generateReport();
  }, [reportType, selectedDept, selectedClass, selectedSubject, startDate, endDate, threshold]);

  const fetchFilterOptions = async () => {
    try {
      const [deptRes, classRes, subRes] = await Promise.all([
        api.get('/departments'),
        api.get('/classes'),
        api.get('/subjects')
      ]);
      if (deptRes.data.success) setDepartments(deptRes.data.data);
      if (classRes.data.success) setClasses(classRes.data.data);
      if (subRes.data.success) setSubjects(subRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      const params = {
        reportType,
        departmentId: selectedDept || undefined,
        classId: selectedClass || undefined,
        subjectId: selectedSubject || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        threshold: threshold || undefined
      };

      const res = await api.get('/reports', { params });
      if (res.data.success) {
        setReportData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  // Export handlers
  const handleCSV = () => {
    if (!reportData.length) return;
    exportToCSV(reportData, `${reportType}_report.csv`);
    toast.success('CSV downloaded');
  };

  const handleExcel = () => {
    if (!reportData.length) return;
    exportToExcel(reportData, `${reportType}_report.xlsx`, 'Attendance');
    toast.success('Excel workbook downloaded');
  };

  const handlePDF = () => {
    if (!reportData.length) return;

    let headers = [];
    let rows = [];

    if (reportType === 'class_wise') {
      headers = ['Class Name', 'Department', 'Semester', 'Students', 'Total Sessions', 'Attendance %', 'Status'];
      rows = reportData.map((d) => [
        d.className,
        d.departmentCode || d.department,
        `Sem ${d.semester}`,
        d.studentCount,
        d.totalSessions,
        `${d.percentage || 0}%`,
        d.status
      ]);
    } else if (reportType === 'subject_wise') {
      headers = ['Subject Code', 'Subject Name', 'Faculty', 'Classes', 'Present', 'Absent', 'Attendance %'];
      rows = reportData.map((d) => [
        d.code,
        d.name,
        d.teacher,
        d.totalClassesConducted,
        d.presentCount,
        d.absentCount,
        `${d.percentage || 0}%`
      ]);
    } else if (reportType === 'student_wise') {
      headers = ['Reg No', 'Student Name', 'Dept', 'Class', 'Total Classes', 'Attended', 'Attendance %', 'Status'];
      rows = reportData.map((d) => [
        d.registerNumber,
        d.fullName,
        d.department,
        d.class,
        d.totalClasses,
        d.attendedClasses,
        `${d.percentage || 0}%`,
        d.eligibility
      ]);
    } else if (reportType === 'low_attendance') {
      headers = ['Reg No', 'Student Name', 'Dept / Class', 'Classes Attended', 'Absent Sessions', 'Percentage', 'Alert Severity'];
      rows = reportData.map((d) => [
        d.registerNumber,
        d.fullName,
        `${d.department} - ${d.class}`,
        d.attendedClasses,
        d.absentClasses,
        `${d.percentage}%`,
        d.severity
      ]);
    } else {
      headers = Object.keys(reportData[0] || {}).slice(0, 6);
      rows = reportData.map((d) => headers.map((h) => String(d[h] || '')));
    }

    exportToPDF({
      title: `${reportType.replace(/_/g, ' ').toUpperCase()} REPORT`,
      subtitle: `Date Range: ${startDate} to ${endDate} | Threshold: ${threshold}%`,
      headers,
      rows,
      filename: `${reportType}_report.pdf`
    });
    toast.success('PDF report exported');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Attendance Reports & Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Institutional summaries, low-attendance alerts, and compliance exports
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCSV}
            disabled={reportData.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            CSV
          </button>

          <button
            onClick={handleExcel}
            disabled={reportData.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Excel
          </button>

          <button
            onClick={handlePDF}
            disabled={reportData.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-blue-700 disabled:opacity-50"
          >
            <Printer className="w-3.5 h-3.5" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Report Type Selector Pills */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'class_wise', label: 'Class-Wise Report' },
          { id: 'subject_wise', label: 'Subject-Wise Report' },
          { id: 'student_wise', label: 'Student-Wise Report' },
          { id: 'low_attendance', label: 'Low Attendance Alert Report' },
          { id: 'daily', label: 'Daily Session Report' },
          { id: 'teacher_activity', label: 'Faculty Activity Report' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id)}
            className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
              reportType === tab.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dynamic Filters Bar */}
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
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-blue-600 bg-white"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d._id} value={d._id}>
              {d.code} - {d.name}
            </option>
          ))}
        </select>

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

        {reportType === 'low_attendance' && (
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Threshold %:</span>
            <input
              type="number"
              min={1}
              max={100}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-16 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-600 font-semibold"
            />
          </div>
        )}
      </div>

      {/* Report Data Display Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          {reportType === 'class_wise' && (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Semester & Sec</th>
                  <th className="py-3 px-4">Enrolled Students</th>
                  <th className="py-3 px-4">Total Sessions</th>
                  <th className="py-3 px-4">P / A / OD</th>
                  <th className="py-3 px-4 text-right">Attendance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.map((d, i) => (
                  <tr key={i} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-semibold text-slate-900">{d.className}</td>
                    <td className="py-3 px-4 text-slate-600">{d.departmentCode || d.department}</td>
                    <td className="py-3 px-4 text-slate-600">Sem {d.semester} - {d.section}</td>
                    <td className="py-3 px-4 font-medium text-slate-700">{d.studentCount}</td>
                    <td className="py-3 px-4 text-slate-600">{d.totalSessions}</td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="text-emerald-600 font-semibold">{d.presentCount}</span> /{' '}
                      <span className="text-rose-600 font-semibold">{d.absentCount}</span> /{' '}
                      <span className="text-blue-600 font-semibold">{d.onDutyCount}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Badge variant={d.percentage >= 75 ? 'eligible' : 'shortage'} size="sm">
                        {d.percentage !== null ? `${d.percentage}%` : 'N/A'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'subject_wise' && (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Course Code</th>
                  <th className="py-3 px-4">Subject Name</th>
                  <th className="py-3 px-4">Assigned Faculty</th>
                  <th className="py-3 px-4">Classes Conducted</th>
                  <th className="py-3 px-4">Total Present</th>
                  <th className="py-3 px-4">Total Absent</th>
                  <th className="py-3 px-4 text-right">Attendance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.map((d, i) => (
                  <tr key={i} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-medium text-blue-700">{d.code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{d.name}</td>
                    <td className="py-3 px-4 text-slate-700">{d.teacher}</td>
                    <td className="py-3 px-4 text-slate-600">{d.totalClassesConducted}</td>
                    <td className="py-3 px-4 font-semibold text-emerald-600">{d.presentCount}</td>
                    <td className="py-3 px-4 font-semibold text-rose-600">{d.absentCount}</td>
                    <td className="py-3 px-4 text-right">
                      <Badge variant={d.percentage >= 75 ? 'eligible' : 'shortage'} size="sm">
                        {d.percentage !== null ? `${d.percentage}%` : 'N/A'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'student_wise' && (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Reg No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Total Classes</th>
                  <th className="py-3 px-4">Attended (P+OD)</th>
                  <th className="py-3 px-4 text-right">Percentage</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.map((d, i) => (
                  <tr key={i} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">{d.registerNumber}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{d.fullName}</td>
                    <td className="py-3 px-4 text-slate-600">{d.department}</td>
                    <td className="py-3 px-4 text-slate-600">{d.class}</td>
                    <td className="py-3 px-4 text-slate-600">{d.totalClasses}</td>
                    <td className="py-3 px-4 font-semibold text-emerald-600">{d.attendedClasses}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {d.percentage !== null ? `${d.percentage}%` : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Badge
                        variant={
                          d.percentage >= 75
                            ? 'eligible'
                            : d.percentage >= 65
                            ? 'shortage'
                            : 'critical'
                        }
                        size="sm"
                      >
                        {d.eligibility}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'low_attendance' && (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Reg No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Dept / Class</th>
                  <th className="py-3 px-4">Attended / Total</th>
                  <th className="py-3 px-4">Absent</th>
                  <th className="py-3 px-4 text-right">Attendance %</th>
                  <th className="py-3 px-4 text-right">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.map((d, i) => (
                  <tr key={i} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">{d.registerNumber}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{d.fullName}</td>
                    <td className="py-3 px-4 text-slate-500">{d.email} • {d.phoneNumber}</td>
                    <td className="py-3 px-4 text-slate-600">{d.department} - {d.class}</td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {d.attendedClasses} / {d.totalClasses}
                    </td>
                    <td className="py-3 px-4 font-semibold text-rose-600">{d.absentClasses}</td>
                    <td className="py-3 px-4 text-right font-bold text-rose-700">{d.percentage}%</td>
                    <td className="py-3 px-4 text-right">
                      <Badge variant={d.severity === 'Critical' ? 'critical' : 'shortage'} size="sm">
                        {d.severity}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'teacher_activity' && (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Faculty ID</th>
                  <th className="py-3 px-4">Faculty Name</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Assigned Courses</th>
                  <th className="py-3 px-4">Total Sessions Conducted</th>
                  <th className="py-3 px-4 text-right">Last Marking Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.map((d, i) => (
                  <tr key={i} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">{d.teacherId}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{d.fullName}</td>
                    <td className="py-3 px-4 text-slate-600">{d.department}</td>
                    <td className="py-3 px-4 text-slate-600">{d.assignedSubjectsCount} courses</td>
                    <td className="py-3 px-4 font-semibold text-blue-700">{d.sessionsConducted} sessions</td>
                    <td className="py-3 px-4 text-right text-slate-500 font-mono">{d.lastActivity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportData.length === 0 && (
            <div className="py-8">
              <EmptyState title="No records match the report criteria" description="Try broadening the date range or removing department filters." />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
