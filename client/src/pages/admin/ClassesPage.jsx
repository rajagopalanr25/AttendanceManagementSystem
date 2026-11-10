import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Trash2, Users } from 'lucide-react';
import api from '../../services/api';
import { Modal } from '../../components/common/Modal';
import { toast } from 'sonner';

export const ClassesPage = () => {
  const [classes, setClasses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [studentsModalOpen, setStudentsModalOpen] = useState(false);
  const [classStudents, setClassStudents] = useState([]);
  const [selectedClassName, setSelectedClassName] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    department: '',
    academicYear: '2026-2027',
    semester: 1,
    section: 'A',
    roomNumber: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [clsRes, deptRes] = await Promise.all([
        api.get('/classes'),
        api.get('/departments')
      ]);
      if (clsRes.data.success) setClasses(clsRes.data.data);
      if (deptRes.data.success) setDepartments(deptRes.data.data);
    } catch (err) {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingClass(null);
    setFormData({
      name: '',
      department: departments[0]?._id || '',
      academicYear: '2026-2027',
      semester: 1,
      section: 'A',
      roomNumber: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingClass(c);
    setFormData({
      name: c.name,
      department: c.department?._id || c.department,
      academicYear: c.academicYear,
      semester: c.semester,
      section: c.section,
      roomNumber: c.roomNumber || ''
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingClass) {
        await api.put(`/classes/${editingClass._id}`, formData);
        toast.success('Class updated successfully');
      } else {
        await api.post('/classes', formData);
        toast.success('Class created successfully');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving class');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this class?')) return;
    try {
      await api.delete(`/classes/${id}`);
      toast.success('Class deleted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting class');
    }
  };

  const handleViewStudents = async (c) => {
    setSelectedClassName(c.name);
    setStudentsModalOpen(true);
    setClassStudents([]);
    try {
      const res = await api.get(`/classes/${c._id}`);
      if (res.data.success) {
        setClassStudents(res.data.data.students || []);
      }
    } catch (err) {
      toast.error('Failed to load class students');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Classes & Sections
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage academic classes, assigned semesters, rooms, and enrolled cohorts
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Class
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {classes.map((cls) => (
          <div
            key={cls._id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="bg-blue-50 text-blue-700 font-semibold text-xs px-2.5 py-1 rounded-lg border border-blue-100">
                  {cls.department?.code} • Sem {cls.semester}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(cls)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cls._id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-base font-bold text-slate-900">{cls.name}</h3>
              <p className="text-xs text-slate-500 mt-1">
                Room: {cls.roomNumber || 'TBA'} • AY: {cls.academicYear}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">
                {cls.studentCount || 0} Students enrolled
              </span>
              <button
                onClick={() => handleViewStudents(cls)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                <Users className="w-3.5 h-3.5" />
                View Students
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingClass ? 'Edit Class' : 'Create New Class'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Class Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="CSE - 4th Sem (Sec A)"
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Semester *</label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-blue-600 bg-white"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Section *</label>
              <input
                type="text"
                required
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value.toUpperCase() })}
                placeholder="A"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs uppercase outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Room Number</label>
              <input
                type="text"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                placeholder="CS-101"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Year</label>
              <input
                type="text"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
              {editingClass ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Enrolled Students Modal */}
      <Modal
        isOpen={studentsModalOpen}
        onClose={() => setStudentsModalOpen(false)}
        title={`Enrolled Students: ${selectedClassName}`}
        maxWidth="max-w-2xl"
      >
        <div className="max-h-80 overflow-y-auto">
          {classStudents.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No students currently enrolled in this class.</p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2 px-3">Reg No</th>
                  <th className="py-2 px-3">Full Name</th>
                  <th className="py-2 px-3">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classStudents.map((st) => (
                  <tr key={st._id}>
                    <td className="py-2 px-3 font-mono font-medium text-slate-700">{st.registerNumber}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">{st.fullName}</td>
                    <td className="py-2 px-3 text-slate-500">{st.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Modal>
    </div>
  );
};

