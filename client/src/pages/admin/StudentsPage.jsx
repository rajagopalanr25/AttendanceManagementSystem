import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Edit2,
  Trash2,
  Eye,
  FileSpreadsheet,
  X,
  Check
} from 'lucide-react';
import api from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { exportToCSV, exportToExcel } from '../../utils/exportUtils';
import { toast } from 'sonner';
import dayjs from 'dayjs';

export const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const [currentStudent, setCurrentStudent] = useState(null);
  const [studentProfileData, setStudentProfileData] = useState(null);

  // Form State
  const initialForm = {
    registerNumber: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    department: '',
    class: '',
    course: 'B.Tech',
    year: 1,
    semester: 1,
    section: 'A',
    gender: 'Male',
    admissionYear: 2024,
    password: 'Student@123'
  };
  const [formData, setFormData] = useState(initialForm);

  // CSV Import State
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [pagination.page, selectedDept, selectedClass, selectedSemester]);

  const fetchMetadata = async () => {
    try {
      const [deptRes, classRes] = await Promise.all([
        api.get('/departments'),
        api.get('/classes')
      ]);
      if (deptRes.data.success) setDepartments(deptRes.data.data);
      if (classRes.data.success) setClasses(classRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        department: selectedDept || undefined,
        classId: selectedClass || undefined,
        semester: selectedSemester || undefined
      };
      const res = await api.get('/students', { params });
      if (res.data.success) {
        setStudents(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchStudents();
  };

  // Open Create Modal
  const openAddModal = () => {
    setFormData({
      ...initialForm,
      department: departments[0]?._id || '',
      class: classes[0]?._id || ''
    });
    setAddModalOpen(true);
  };

  // Save Create Student
  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/students', formData);
      if (res.data.success) {
        toast.success('Student created successfully');
        setAddModalOpen(false);
        fetchStudents();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating student');
    }
  };

  // Open Edit Modal
  const openEditModal = (student) => {
    setCurrentStudent(student);
    setFormData({
      registerNumber: student.registerNumber,
      fullName: student.fullName,
      email: student.email,
      phoneNumber: student.phoneNumber || '',
      department: student.department?._id || student.department,
      class: student.class?._id || student.class,
      course: student.course || 'B.Tech',
      year: student.year,
      semester: student.semester,
      section: student.section,
      gender: student.gender,
      admissionYear: student.admissionYear
    });
    setEditModalOpen(true);
  };

  // Save Edit Student
  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/students/${currentStudent._id}`, formData);
      if (res.data.success) {
        toast.success('Student updated successfully');
        setEditModalOpen(false);
        fetchStudents();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating student');
    }
  };

  // Delete Student
  const handleDeleteStudent = async () => {
    if (!currentStudent) return;
    try {
      const res = await api.delete(`/students/${currentStudent._id}`);
      if (res.data.success) {
        toast.success('Student removed successfully');
        setDeleteConfirmOpen(false);
        fetchStudents();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting student');
    }
  };

  // View Profile Modal
  const openProfileModal = async (student) => {
    setCurrentStudent(student);
    setProfileModalOpen(true);
    setStudentProfileData(null);
    try {
      const res = await api.get(`/students/${student._id}`);
      if (res.data.success) {
        setStudentProfileData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load full student profile');
    }
  };

  // Export List
  const handleExportCSV = () => {
    const rows = students.map((s) => ({
      'Register Number': s.registerNumber,
      'Full Name': s.fullName,
      'Email': s.email,
      'Phone': s.phoneNumber,
      'Department': s.department?.name || '',
      'Class': s.class?.name || '',
      'Year': s.year,
      'Semester': s.semester,
      'Section': s.section,
      'Gender': s.gender,
      'Admission Year': s.admissionYear
    }));
    exportToCSV(rows, 'students_list.csv');
  };

  const handleExportExcel = () => {
    const rows = students.map((s) => ({
      'Register Number': s.registerNumber,
      'Full Name': s.fullName,
      'Email': s.email,
      'Phone': s.phoneNumber,
      'Department': s.department?.name || '',
      'Class': s.class?.name || '',
      'Year': s.year,
      'Semester': s.semester,
      'Section': s.section,
      'Gender': s.gender,
      'Admission Year': s.admissionYear
    }));
    exportToExcel(rows, 'students_list.xlsx', 'Students');
  };

  // Bulk CSV Import
  const handleBulkImport = async () => {
    if (!csvText.trim()) {
      toast.error('Please enter CSV data or paste records');
      return;
    }

    try {
      setImporting(true);
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        toast.error('CSV must have a header row and at least 1 record');
        return;
      }

      // Expected headers: registerNumber,fullName,email,department,class,year,semester,section
      const headers = lines[0].split(',').map((h) => h.trim());
      const studentsToImport = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const vals = line.split(',').map((v) => v.trim());
        const item = {};
        headers.forEach((h, idx) => {
          item[h] = vals[idx] || '';
        });

        // Resolve department and class IDs if code/name was supplied
        if (item.department && item.department.length !== 24) {
          const foundDept = departments.find((d) => d.code === item.department || d.name === item.department);
          if (foundDept) item.department = foundDept._id;
        }
        if (item.class && item.class.length !== 24) {
          const foundClass = classes.find((c) => c.name === item.class);
          if (foundClass) item.class = foundClass._id;
        }

        // Fallback default department/class if still unset
        if (!item.department && departments.length) item.department = departments[0]._id;
        if (!item.class && classes.length) item.class = classes[0]._id;

        studentsToImport.push(item);
      }

      const res = await api.post('/students/bulk-import', { students: studentsToImport });
      if (res.data.success) {
        toast.success(res.data.message);
        setImportModalOpen(false);
        setCsvText('');
        fetchStudents();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk import failed');
    } finally {
      setImporting(false);
    }
  };

  const sampleCsvExample = `registerNumber,fullName,email,department,class,year,semester,section\n2024CS2001,John Doe,johndoe@example.com,${departments[0]?.code || 'CSE'},${classes[0]?.name || 'CSE - 4th Sem (Sec A)'},2,4,A\n2024CS2002,Jane Smith,janesmith@example.com,${departments[0]?.code || 'CSE'},${classes[0]?.name || 'CSE - 4th Sem (Sec A)'},2,4,A`;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Student Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage student registrations, enrollments, credentials, and records
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            Bulk CSV Import
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Excel
          </button>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student by name, register number or email..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-blue-600"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedDept}
            onChange={(e) => {
              setSelectedDept(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-blue-600"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.code}
              </option>
            ))}
          </select>

          <select
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-blue-600"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedSemester}
            onChange={(e) => {
              setSelectedSemester(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-blue-600"
          >
            <option value="">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Reg Number</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Sem & Sec</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8">
                    <EmptyState
                      title="No students match criteria"
                      description="Adjust your search filters or click Add Student."
                    />
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      {student.registerNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{student.fullName}</div>
                      <div className="text-[11px] text-slate-400">{student.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="default" size="sm">
                        {student.department?.code || 'N/A'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {student.class?.name || 'Unassigned'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      Sem {student.semester} - {student.section}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {student.phoneNumber || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openProfileModal(student)}
                          title="View Attendance & Profile"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(student)}
                          title="Edit Details"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setCurrentStudent(student);
                            setDeleteConfirmOpen(true);
                          }}
                          title="Delete Student"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 bg-slate-50/50">
          <span className="text-xs text-slate-500">
            Showing {students.length} of {pagination.total} students
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

      {/* Add Student Modal */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Register New Student" maxWidth="max-w-2xl">
        <form onSubmit={handleCreateStudent} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Register Number *
              </label>
              <input
                type="text"
                required
                value={formData.registerNumber}
                onChange={(e) => setFormData({ ...formData, registerNumber: e.target.value })}
                placeholder="2024CS1051"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-mono outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Alex Morgan"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="alex.m@college.edu"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="+1-555-0199"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department *
              </label>
              <select
                required
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-blue-600 bg-white"
              >
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Class *
              </label>
              <select
                required
                value={formData.class}
                onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-blue-600 bg-white"
              >
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Semester & Section *
              </label>
              <div className="flex gap-2">
                <select
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                  className="w-1/2 rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-600 bg-white"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>
                      Sem {s}
                    </option>
                  ))}
                </select>
                <select
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  className="w-1/2 rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-600 bg-white"
                >
                  {['A', 'B', 'C', 'D'].map((sec) => (
                    <option key={sec} value={sec}>
                      Sec {sec}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Initial Account Password
              </label>
              <input
                type="text"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-mono outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-2xs"
            >
              Save Student
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Student Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Student Profile" maxWidth="max-w-xl">
        <form onSubmit={handleUpdateStudent} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Register Number</label>
              <input
                type="text"
                disabled
                value={formData.registerNumber}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-mono text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Class</label>
              <select
                value={formData.class}
                onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-blue-600 bg-white"
              >
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-blue-600 bg-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-2xs"
            >
              Update Student
            </button>
          </div>
        </form>
      </Modal>

      {/* Student Profile & Attendance Overview Modal */}
      <Modal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} title="Student Profile & Attendance Record" maxWidth="max-w-2xl">
        {studentProfileData ? (
          <div className="space-y-5">
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white font-bold text-lg uppercase">
                {studentProfileData.fullName?.slice(0, 2)}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{studentProfileData.fullName}</h3>
                <p className="text-xs text-slate-500 font-mono">Reg: {studentProfileData.registerNumber}</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  {studentProfileData.department?.name} • {studentProfileData.class?.name}
                </p>
              </div>
            </div>

            {/* Attendance Performance Metrics */}
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Total Classes</span>
                <p className="text-lg font-bold text-slate-800 mt-1">{studentProfileData.attendance?.overall?.total || 0}</p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                <span className="text-[10px] uppercase font-semibold text-emerald-600">Present</span>
                <p className="text-lg font-bold text-emerald-700 mt-1">{studentProfileData.attendance?.overall?.present || 0}</p>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3">
                <span className="text-[10px] uppercase font-semibold text-blue-600">On Duty</span>
                <p className="text-lg font-bold text-blue-700 mt-1">{studentProfileData.attendance?.overall?.onDuty || 0}</p>
              </div>
              <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3">
                <span className="text-[10px] uppercase font-semibold text-rose-600">Overall %</span>
                <p className="text-lg font-bold text-rose-700 mt-1">
                  {studentProfileData.attendance?.overall?.percentage !== null ? `${studentProfileData.attendance?.overall?.percentage}%` : 'N/A'}
                </p>
              </div>
            </div>

            {/* Subject Breakdown Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Subject-wise Breakdown</h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Subject</th>
                      <th className="py-2 px-3">Total</th>
                      <th className="py-2 px-3">Attended</th>
                      <th className="py-2 px-3 text-right">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {studentProfileData.attendance?.subjects?.map((sub, i) => (
                      <tr key={i}>
                        <td className="py-2 px-3 font-medium text-slate-800">
                          {sub.subjectName} ({sub.subjectCode})
                        </td>
                        <td className="py-2 px-3 text-slate-600">{sub.total}</td>
                        <td className="py-2 px-3 text-slate-600">{sub.attended}</td>
                        <td className="py-2 px-3 text-right">
                          <Badge variant={sub.percentage >= 75 ? 'present' : sub.percentage >= 65 ? 'shortage' : 'critical'} size="sm">
                            {sub.percentage}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-500">Loading student attendance history...</div>
        )}
      </Modal>

      {/* Bulk CSV Import Modal */}
      <Modal isOpen={importModalOpen} onClose={() => setImportModalOpen(false)} title="Bulk Student CSV Import" maxWidth="max-w-2xl">
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Paste CSV text with columns: <code className="bg-slate-100 p-1 rounded font-mono text-[11px]">registerNumber,fullName,email,department,class,year,semester,section</code>
          </p>

          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase text-slate-400">CSV Data</span>
            <button
              type="button"
              onClick={() => setCsvText(sampleCsvExample)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Fill Sample Template
            </button>
          </div>

          <textarea
            rows={7}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={sampleCsvExample}
            className="w-full rounded-xl border border-slate-200 p-3 text-xs font-mono text-slate-800 outline-none focus:border-blue-600"
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setImportModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={importing}
              onClick={handleBulkImport}
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-2xs disabled:opacity-50"
            >
              {importing ? 'Importing Students...' : 'Execute Import'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} title="Confirm Deletion" maxWidth="max-w-sm">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Remove Student Record?</h4>
            <p className="mt-1 text-xs text-slate-500">
              Are you sure you want to remove <strong>{currentStudent?.fullName}</strong> ({currentStudent?.registerNumber})? This will also remove login access and recorded attendance.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => setDeleteConfirmOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteStudent}
              className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 shadow-2xs"
            >
              Yes, Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
