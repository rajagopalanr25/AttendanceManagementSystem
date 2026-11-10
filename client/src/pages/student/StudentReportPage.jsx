import React, { useState, useEffect } from 'react';
import { Download, FileSpreadsheet, Printer, Award, CalendarCheck2 } from 'lucide-react';
import api from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { toast } from 'sonner';
import dayjs from 'dayjs';

export const StudentReportPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/student');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      toast.error('Failed to load student report');
    } finally {
      setLoading(false);
    }
  };

  const student = data?.student || {};
  const overall = data?.overall || {};
  const subjects = data?.subjects || [];
  const recentRecords = data?.recentRecords || [];

  const handleDownloadPDF = () => {
    const headers = ['Course Code', 'Subject Name', 'Type', 'Total', 'Attended', 'Attendance %', 'Status'];
    const rows = subjects.map((s) => [
      s.subjectCode,
      s.subjectName,
      s.subjectType,
      s.totalClasses,
      s.attendedClasses,
      `${s.percentage !== null ? s.percentage : 0}%`,
      s.status
    ]);

    exportToPDF({
      title: `OFFICIAL STUDENT ATTENDANCE REPORT`,
      subtitle: `${student.fullName} (Reg: ${student.registerNumber}) | ${student.course} - ${student.department?.name}`,
      headers,
      rows,
      filename: `${student.registerNumber}_attendance_report.pdf`
    });
    toast.success('PDF report exported');
  };

  const handleDownloadExcel = () => {
    const rows = subjects.map((s) => ({
      'Course Code': s.subjectCode,
      'Course Name': s.subjectName,
      'Total Classes': s.totalClasses,
      'Attended Classes': s.attendedClasses,
      'Present Count': s.presentCount,
      'Absent Count': s.absentCount,
      'On Duty Count': s.onDutyCount,
      'Attendance Percentage': `${s.percentage !== null ? s.percentage : 0}%`,
      'Eligibility Status': s.status
    }));

    exportToExcel(rows, `${student.registerNumber}_report.xlsx`, 'My Attendance');
    toast.success('Excel spreadsheet downloaded');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Student Attendance Transcript
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Official institutional transcript of semester attendance performance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadExcel}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Excel
          </button>
          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-blue-700"
          >
            <Printer className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Printable Sheet View */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        {/* Institutional Letterhead */}
        <div className="border-b border-slate-200 pb-5 text-center">
          <h2 className="text-lg font-extrabold uppercase tracking-wide text-slate-900">
            Apex Institute of Technology & Science
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Department of Academic Administration • Office of the Registrar
          </p>
          <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
            Semester Attendance Record (AY 2026-2027)
          </div>
        </div>

        {/* Student Dossier Bio Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold">Student Name</span>
            <p className="font-bold text-slate-900 mt-0.5">{student.fullName}</p>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold">Register Number</span>
            <p className="font-mono font-bold text-blue-700 mt-0.5">{student.registerNumber}</p>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold">Program / Dept</span>
            <p className="font-medium text-slate-800 mt-0.5">{student.course} • {student.department?.code}</p>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold">Semester / Class</span>
            <p className="font-medium text-slate-800 mt-0.5">{student.class?.name}</p>
          </div>
        </div>

        {/* Overall Summary Bar */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-blue-200 bg-blue-50/60">
          <div>
            <span className="text-xs font-semibold text-blue-900">Overall Attendance Percentage:</span>
            <div className="text-2xl font-black text-blue-900 mt-0.5">
              {overall.percentage !== null ? `${overall.percentage}%` : 'N/A'}
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 block mb-1">Examination Eligibility:</span>
            <Badge
              variant={
                overall.status === 'Eligible'
                  ? 'eligible'
                  : overall.status === 'Critical shortage'
                  ? 'critical'
                  : 'shortage'
              }
              size="md"
            >
              {overall.status}
            </Badge>
          </div>
        </div>

        {/* Subject-Wise Attendance Transcript Table */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
            Course Performance Breakdown
          </h4>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Course Title</th>
                  <th className="py-2.5 px-3 text-center">Total</th>
                  <th className="py-2.5 px-3 text-center">Attended</th>
                  <th className="py-2.5 px-3 text-center">Absent</th>
                  <th className="py-2.5 px-3 text-right">Percentage</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjects.map((sub, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono font-medium text-blue-700">{sub.subjectCode}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{sub.subjectName}</td>
                    <td className="py-2.5 px-3 text-center text-slate-600">{sub.totalClasses}</td>
                    <td className="py-2.5 px-3 text-center font-semibold text-emerald-600">{sub.attendedClasses}</td>
                    <td className="py-2.5 px-3 text-center font-semibold text-rose-600">{sub.absentCount}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {sub.percentage !== null ? `${sub.percentage}%` : 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Badge
                        variant={sub.percentage >= 75 ? 'eligible' : sub.percentage >= 65 ? 'shortage' : 'critical'}
                        size="sm"
                      >
                        {sub.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legal Footer Note */}
        <div className="border-t border-slate-100 pt-4 text-[11px] text-slate-400 flex items-center justify-between">
          <span>* Generated automatically by AttendIQ ERP • Minimum 75% required for examination hall ticket</span>
          <span>Date: {dayjs().format('DD/MM/YYYY')}</span>
        </div>
      </div>
    </div>
  );
};
