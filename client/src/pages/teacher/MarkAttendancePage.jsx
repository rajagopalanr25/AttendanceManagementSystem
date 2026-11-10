import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  CalendarCheck2,
  Check,
  X,
  Clock,
  Search,
  Filter,
  Save,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Edit3
} from 'lucide-react';
import api from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { toast } from 'sonner';
import dayjs from 'dayjs';

export const MarkAttendancePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Selected parameters
  const [selectedClass, setSelectedClass] = useState(searchParams.get('classId') || '');
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subjectId') || '');
  const [attendanceDate, setAttendanceDate] = useState(dayjs().format('YYYY-MM-DD'));

  // Assigned options for teacher
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(true);

  // Student list & attendance rows
  // format: [{ studentId, registerNumber, fullName, status: 'Present' | 'Absent' | 'On Duty', remarks: '', attendanceId?: string }]
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Local UI filters
  const [studentSearch, setStudentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Confirmation Modal
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTeacherAssignments();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedSubject && attendanceDate) {
      loadSessionStudents();
    }
  }, [selectedClass, selectedSubject, attendanceDate]);

  const fetchTeacherAssignments = async () => {
    try {
      setLoadingMeta(true);
      const res = await api.get('/dashboard/teacher');
      if (res.data.success) {
        const classes = res.data.assignedClasses || [];
        const subjects = res.data.assignedSubjects || [];
        setAssignedClasses(classes);
        setAssignedSubjects(subjects);

        // Preselect if not selected from URL query
        if (!selectedClass && classes.length > 0) setSelectedClass(classes[0]._id);
        if (!selectedSubject && subjects.length > 0) setSelectedSubject(subjects[0]._id);
      }
    } catch (err) {
      toast.error('Failed to load assigned subjects');
    } finally {
      setLoadingMeta(false);
    }
  };

  const loadSessionStudents = async () => {
    try {
      setLoadingStudents(true);

      // Check if session attendance already exists for this class + subject + date
      const sessionRes = await api.get('/attendance/session', {
        params: {
          classId: selectedClass,
          subjectId: selectedSubject,
          date: attendanceDate
        }
      });

      if (sessionRes.data.exists && sessionRes.data.count > 0) {
        // Edit mode with existing records
        setIsEditMode(true);
        const mapped = sessionRes.data.data.map((r) => ({
          studentId: r.student?._id || r.student,
          registerNumber: r.student?.registerNumber || '',
          fullName: r.student?.fullName || '',
          status: r.status,
          remarks: r.remarks || '',
          attendanceId: r._id
        }));
        setStudents(mapped);
      } else {
        // Fresh marking mode: fetch enrolled students from class
        setIsEditMode(false);
        const classRes = await api.get(`/classes/${selectedClass}`);
        if (classRes.data.success) {
          const enrolled = classRes.data.data.students || [];
          const initialRows = enrolled.map((st) => ({
            studentId: st._id,
            registerNumber: st.registerNumber,
            fullName: st.fullName,
            status: 'Present', // default to Present for convenience
            remarks: ''
          }));
          setStudents(initialRows);
        }
      }
    } catch (err) {
      toast.error('Failed to load class students');
    } finally {
      setLoadingStudents(false);
    }
  };

  // Bulk status setters
  const markAllStatus = (newStatus) => {
    setStudents((prev) =>
      prev.map((s) => ({
        ...s,
        status: newStatus
      }))
    );
    toast.info(`Marked all ${students.length} students as ${newStatus}`);
  };

  // Individual status changer
  const setStudentStatus = (studentId, status) => {
    setStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status } : s))
    );
  };

  const setStudentRemarks = (studentId, remarks) => {
    setStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, remarks } : s))
    );
  };

  // Submission handler
  const handleSubmitAttendance = async () => {
    try {
      setSubmitting(true);

      if (isEditMode) {
        // PUT update session
        const updates = students.map((s) => ({
          attendanceId: s.attendanceId,
          status: s.status,
          remarks: s.remarks
        }));

        const res = await api.put('/attendance/session', {
          classId: selectedClass,
          subjectId: selectedSubject,
          date: attendanceDate,
          updates
        });

        if (res.data.success) {
          toast.success(res.data.message || 'Attendance updated successfully');
          setConfirmModalOpen(false);
          loadSessionStudents();
        }
      } else {
        // POST mark attendance
        const attendanceData = students.map((s) => ({
          studentId: s.studentId,
          status: s.status,
          remarks: s.remarks
        }));

        const res = await api.post('/attendance', {
          classId: selectedClass,
          subjectId: selectedSubject,
          date: attendanceDate,
          attendanceData
        });

        if (res.data.success) {
          toast.success('Attendance recorded and confirmed successfully!');
          setConfirmModalOpen(false);
          setIsEditMode(true);
          loadSessionStudents();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit attendance');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter students for UI display
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.registerNumber.toLowerCase().includes(studentSearch.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const presentCount = students.filter((s) => s.status === 'Present').length;
  const absentCount = students.filter((s) => s.status === 'Absent').length;
  const onDutyCount = students.filter((s) => s.status === 'On Duty').length;
  const totalCount = students.length;
  const presentRate = totalCount > 0 ? Number((((presentCount + onDutyCount) / totalCount) * 100).toFixed(1)) : 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Attendance Marking Interface
            </h1>
            {isEditMode ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold">
                <Edit3 className="w-3 h-3" />
                Edit Mode
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 text-xs font-semibold">
                New Session
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Select course, class cohort, and session date to record or modify student attendance
          </p>
        </div>

        {students.length > 0 && (
          <button
            onClick={() => setConfirmModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors shrink-0 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {isEditMode ? 'Update Session Attendance' : 'Save & Submit Attendance'}
          </button>
        )}
      </div>

      {/* Session Selection Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Assigned Class Cohort *
          </label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-600 bg-white"
          >
            {assignedClasses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Subject Course *
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-600 bg-white"
          >
            {assignedSubjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.code} - {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Attendance Session Date *
          </label>
          <input
            type="date"
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-600 bg-white"
          />
        </div>
      </div>

      {/* Live Session Metrics & Quick Action Bar */}
      {students.length > 0 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          {/* Real-time counters */}
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-slate-400">Total:</span>{' '}
              <strong className="text-slate-800">{totalCount}</strong>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-slate-600">Present:</span>{' '}
              <strong className="text-emerald-700">{presentCount}</strong>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span className="text-slate-600">Absent:</span>{' '}
              <strong className="text-rose-700">{absentCount}</strong>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-slate-600">On Duty:</span>{' '}
              <strong className="text-blue-700">{onDutyCount}</strong>
            </div>
            <div className="hidden sm:block text-slate-300">|</div>
            <div className="hidden sm:block font-bold text-slate-800">
              Session Rate: {presentRate}%
            </div>
          </div>

          {/* Quick Mark All Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => markAllStatus('Present')}
              className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              Mark All Present
            </button>
            <button
              type="button"
              onClick={() => markAllStatus('Absent')}
              className="rounded-xl border border-rose-200 bg-rose-50/70 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
            >
              Mark All Absent
            </button>
          </div>
        </div>
      )}

      {/* Filter & Search inside Table */}
      {students.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Filter students by name or register number..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-1.5 text-xs text-slate-900 outline-none focus:bg-white focus:border-blue-600"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {['ALL', 'Present', 'Absent', 'On Duty'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  statusFilter === st
                    ? 'bg-slate-800 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Attendance Interactive Marking Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-12">#</th>
                <th className="py-3 px-4 w-36">Register Number</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4 text-center w-64">Attendance Status</th>
                <th className="py-3 px-4">Session Remarks (Optional)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingStudents ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-slate-400">
                    Loading student roster for selected class...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8">
                    <EmptyState
                      title="No students found"
                      description="Please verify that the selected class has active student enrollments."
                    />
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => (
                  <tr
                    key={student.studentId}
                    className={`transition-colors ${
                      student.status === 'Absent'
                        ? 'bg-rose-50/30'
                        : student.status === 'On Duty'
                        ? 'bg-blue-50/30'
                        : 'hover:bg-slate-50/60'
                    }`}
                  >
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">
                      {student.registerNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {student.fullName}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 gap-1">
                        <button
                          type="button"
                          onClick={() => setStudentStatus(student.studentId, 'Present')}
                          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                            student.status === 'Present'
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-emerald-700'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          Present
                        </button>

                        <button
                          type="button"
                          onClick={() => setStudentStatus(student.studentId, 'Absent')}
                          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                            student.status === 'Absent'
                              ? 'bg-rose-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-rose-700'
                          }`}
                        >
                          <X className="w-3.5 h-3.5" />
                          Absent
                        </button>

                        <button
                          type="button"
                          onClick={() => setStudentStatus(student.studentId, 'On Duty')}
                          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                            student.status === 'On Duty'
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-blue-700'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          On Duty
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={student.remarks}
                        onChange={(e) => setStudentRemarks(student.studentId, e.target.value)}
                        placeholder="e.g. Approved medical / event leave..."
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-700 outline-none focus:border-blue-600 bg-white"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title={isEditMode ? 'Confirm Attendance Update' : 'Confirm Attendance Submission'}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Session Date:</span>
              <strong className="text-slate-800">{dayjs(attendanceDate).format('YYYY-MM-DD')}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Enrolled:</span>
              <strong className="text-slate-800">{totalCount} Students</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Present Count:</span>
              <strong className="text-emerald-700">{presentCount}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Absent Count:</span>
              <strong className="text-rose-700">{absentCount}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">On Duty Count:</span>
              <strong className="text-blue-700">{onDutyCount}</strong>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {isEditMode
              ? 'This action will update the attendance records in the database. All modifications will be permanently recorded in the institution audit log.'
              : 'Please confirm that the attendance statuses recorded above are accurate. Once submitted, records are accessible by college administration.'}
          </p>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setConfirmModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmitAttendance}
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 shadow-2xs"
            >
              {submitting ? 'Saving Records...' : 'Confirm and Save'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
