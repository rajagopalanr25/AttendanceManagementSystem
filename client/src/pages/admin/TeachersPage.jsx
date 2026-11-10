import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  BookOpen,
  Layers,
  Edit2,
  Trash2,
  History,
  Check,
  X
} from 'lucide-react';
import api from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { toast } from 'sonner';
import dayjs from 'dayjs';

export const TeachersPage = () => {
  const [teachers, setTeachers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const [currentTeacher, setCurrentTeacher] = useState(null);
  const [teacherDetailData, setTeacherDetailData] = useState(null);

  // Form State
  const initialForm = {
    teacherId: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    department: '',
    designation: 'Assistant Professor',
    password: 'Teacher@123'
  };
  const [formData, setFormData] = useState(initialForm);

  // Assignment Modal State
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);
  const [selectedClassIds, setSelectedClassIds] = useState([]);

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [selectedDept]);

  const fetchMetadata = async () => {
    try {
      const [deptRes, subRes, classRes] = await Promise.all([
        api.get('/departments'),
        api.get('/subjects'),
        api.get('/classes')
      ]);
      if (deptRes.data.success) setDepartments(deptRes.data.data);
      if (subRes.data.success) setAllSubjects(subRes.data.data);
      if (classRes.data.success) setAllClasses(classRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const params = {
        search: search || undefined,
        department: selectedDept || undefined
      };
      const res = await api.get('/teachers', { params });
      if (res.data.success) {
        setTeachers(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load faculty list');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTeachers();
  };

  const openAddModal = () => {
    setFormData({
      ...initialForm,
      department: departments[0]?._id || ''
    });
    setAddModalOpen(true);
  };

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/teachers', formData);
      if (res.data.success) {
        toast.success('Teacher created successfully');
        setAddModalOpen(false);
        fetchTeachers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating teacher');
    }
  };

  const openEditModal = (t) => {
    setCurrentTeacher(t);
    setFormData({
      teacherId: t.teacherId,
      fullName: t.fullName,
      email: t.email,
      phoneNumber: t.phoneNumber || '',
      department: t.department?._id || t.department,
      designation: t.designation || 'Assistant Professor'
    });
    setEditModalOpen(true);
  };

  const handleUpdateTeacher = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/teachers/${currentTeacher._id}`, formData);
      if (res.data.success) {
        toast.success('Teacher updated successfully');
        setEditModalOpen(false);
        fetchTeachers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating teacher');
    }
  };

  // Open Assignments Modal
  const openAssignModal = (t) => {
    setCurrentTeacher(t);
    setSelectedSubjectIds((t.assignedSubjects || []).map((s) => s._id || s));
    setSelectedClassIds((t.assignedClasses || []).map((c) => c._id || c));
    setAssignModalOpen(true);
  };

  const handleSaveAssignments = async () => {
    try {
      const res = await api.put(`/teachers/${currentTeacher._id}/assign`, {
        assignedSubjects: selectedSubjectIds,
        assignedClasses: selectedClassIds
      });
      if (res.data.success) {
        toast.success('Subject & class assignments updated');
        setAssignModalOpen(false);
        fetchTeachers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update assignments');
    }
  };

  // View Attendance History for Teacher
  const openHistoryModal = async (t) => {
    setCurrentTeacher(t);
    setHistoryModalOpen(true);
    setTeacherDetailData(null);
    try {
      const res = await api.get(`/teachers/${t._id}`);
      if (res.data.success) {
        setTeacherDetailData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load teacher history');
    }
  };

  // Delete Teacher
  const handleDeleteTeacher = async () => {
    try {
      const res = await api.delete(`/teachers/${currentTeacher._id}`);
      if (res.data.success) {
        toast.success('Teacher removed');
        setDeleteConfirmOpen(false);
        fetchTeachers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting teacher');
    }
  };

  const toggleSubjectSelection = (subId) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(subId) ? prev.filter((id) => id !== subId) : [...prev, subId]
    );
  };

  const toggleClassSelection = (clsId) => {
    setSelectedClassIds((prev) =>
      prev.includes(clsId) ? prev.filter((id) => id !== clsId) : [...prev, clsId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Faculty & Teacher Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage instructors, course assignments, schedules, and attendance activity
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Faculty Member
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teacher by name, ID, or email..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-blue-600"
          />
        </form>

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-blue-600"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d._id} value={d._id}>
              {d.code} - {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Teachers Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Faculty ID</th>
                <th className="py-3 px-4">Name & Designation</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Assigned Courses</th>
                <th className="py-3 px-4">Assigned Classes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teachers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8">
                    <EmptyState
                      title="No faculty members found"
                      description="Click Add Faculty Member to register a teacher."
                    />
                  </td>
                </tr>
              ) : (
                teachers.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      {t.teacherId}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{t.fullName}</div>
                      <div className="text-[11px] text-slate-400">
                        {t.designation} • {t.email}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="teacher" size="sm">
                        {t.department?.code || 'N/A'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(t.assignedSubjects || []).length === 0 ? (
                          <span className="text-slate-400 text-[11px]">None assigned</span>
                        ) : (
                          t.assignedSubjects.map((sub) => (
                            <span
                              key={sub._id}
                              className="bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-semibold px-2 py-0.5 rounded-md"
                              title={sub.name}
                            >
                              {sub.code}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(t.assignedClasses || []).length === 0 ? (
                          <span className="text-slate-400 text-[11px]">None</span>
                        ) : (
                          t.assignedClasses.map((cls) => (
                            <span
                              key={cls._id}
                              className="bg-slate-100 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded-md"
                            >
                              {cls.name}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openAssignModal(t)}
                          title="Assign Subjects & Classes"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <BookOpen className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openHistoryModal(t)}
                          title="View Marking History"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(t)}
                          title="Edit Details"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setCurrentTeacher(t);
                            setDeleteConfirmOpen(true);
                          }}
                          title="Delete Faculty Account"
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
      </div>

      {/* Add Teacher Modal */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Register New Faculty Member" maxWidth="max-w-xl">
        <form onSubmit={handleCreateTeacher} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Faculty ID *</label>
              <input
                type="text"
                required
                value={formData.teacherId}
                onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                placeholder="TCH-106"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-mono outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Dr. Katherine Johnson"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="katherine@college.edu"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="+1-555-0188"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department *</label>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
              <input
                type="text"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                placeholder="Assistant Professor"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-blue-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Password</label>
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
              Create Account
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Teacher Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Faculty Profile" maxWidth="max-w-xl">
        <form onSubmit={handleUpdateTeacher} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Faculty ID</label>
              <input
                type="text"
                disabled
                value={formData.teacherId}
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-blue-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
              <input
                type="text"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-blue-600"
              />
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
              Update Faculty
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Subjects & Classes Modal */}
      <Modal isOpen={assignModalOpen} onClose={() => setAssignModalOpen(false)} title={`Assign Courses: ${currentTeacher?.fullName}`} maxWidth="max-w-2xl">
        <div className="space-y-5">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Select Subjects to Assign
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-200 rounded-xl">
              {allSubjects.map((sub) => {
                const isSelected = selectedSubjectIds.includes(sub._id);
                return (
                  <div
                    key={sub._id}
                    onClick={() => toggleSubjectSelection(sub._id)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer border text-xs transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-900 font-semibold'
                        : 'border-slate-100 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <p className="font-mono text-[11px] text-blue-700">{sub.code}</p>
                      <p className="truncate max-w-[200px]">{sub.name}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Select Classes to Assign
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-200 rounded-xl">
              {allClasses.map((cls) => {
                const isSelected = selectedClassIds.includes(cls._id);
                return (
                  <div
                    key={cls._id}
                    onClick={() => toggleClassSelection(cls._id)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer border text-xs transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-900 font-semibold'
                        : 'border-slate-100 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{cls.name}</p>
                      <p className="text-[10px] text-slate-400">Sem {cls.semester} - Sec {cls.section}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setAssignModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAssignments}
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-2xs"
            >
              Save Course Assignments
            </button>
          </div>
        </div>
      </Modal>

      {/* Teacher Marking History Modal */}
      <Modal isOpen={historyModalOpen} onClose={() => setHistoryModalOpen(false)} title={`Faculty Activity: ${currentTeacher?.fullName}`} maxWidth="max-w-2xl">
        {teacherDetailData ? (
          <div className="space-y-4">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
              <span className="font-semibold text-slate-800">{teacherDetailData.fullName}</span> ({teacherDetailData.teacherId})
              <p className="text-slate-500 mt-0.5">{teacherDetailData.designation} • {teacherDetailData.department?.name}</p>
            </div>

            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Recent Attendance Sessions Marked</h4>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Subject</th>
                    <th className="py-2 px-3">Class</th>
                    <th className="py-2 px-3 text-right">P / A / OD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(teacherDetailData.recentActivity || []).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-400">
                        No sessions recorded yet by this faculty member
                      </td>
                    </tr>
                  ) : (
                    teacherDetailData.recentActivity.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 text-slate-600">{dayjs(item.date).format('YYYY-MM-DD')}</td>
                        <td className="py-2 px-3 font-medium text-slate-800">{item.subject?.name}</td>
                        <td className="py-2 px-3 text-slate-600">{item.class?.name}</td>
                        <td className="py-2 px-3 text-right">
                          <span className="text-emerald-600 font-semibold">{item.present}</span>
                          <span className="text-slate-300 mx-1">/</span>
                          <span className="text-rose-600 font-semibold">{item.absent}</span>
                          <span className="text-slate-300 mx-1">/</span>
                          <span className="text-blue-600 font-semibold">{item.onDuty}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-400">Loading activity...</div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} title="Confirm Deletion" maxWidth="max-w-sm">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Remove Faculty Account?</h4>
            <p className="mt-1 text-xs text-slate-500">
              Are you sure you want to remove <strong>{currentTeacher?.fullName}</strong> ({currentTeacher?.teacherId})?
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
              onClick={handleDeleteTeacher}
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
