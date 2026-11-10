import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit2, Trash2, GraduationCap } from 'lucide-react';
import api from '../../services/api';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { toast } from 'sonner';

export const SubjectsPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    department: '',
    semester: 1,
    type: 'Theory',
    teacher: '',
    classes: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subRes, deptRes, teachRes, classRes] = await Promise.all([
        api.get('/subjects'),
        api.get('/departments'),
        api.get('/teachers'),
        api.get('/classes')
      ]);
      if (subRes.data.success) setSubjects(subRes.data.data);
      if (deptRes.data.success) setDepartments(deptRes.data.data);
      if (teachRes.data.success) setTeachers(teachRes.data.data);
      if (classRes.data.success) setClasses(classRes.data.data);
    } catch (err) {
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingSubject(null);
    setFormData({
      name: '',
      code: '',
      department: departments[0]?._id || '',
      semester: 1,
      type: 'Theory',
      teacher: '',
      classes: []
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (s) => {
    setEditingSubject(s);
    setFormData({
      name: s.name,
      code: s.code,
      department: s.department?._id || s.department,
      semester: s.semester,
      type: s.type,
      teacher: s.teacher?._id || s.teacher || '',
      classes: (s.classes || []).map((c) => c._id || c)
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingSubject) {
        await api.put(`/subjects/${editingSubject._id}`, formData);
        toast.success('Subject updated successfully');
      } else {
        await api.post('/subjects', formData);
        toast.success('Subject created successfully');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving subject');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      await api.delete(`/subjects/${id}`);
      toast.success('Course deleted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting course');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Subject & Course Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure theoretical and practical courses, semester schedules, and faculty assignments
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Subject
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {subjects.map((sub) => (
          <div
            key={sub._id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg">
                  {sub.code}
                </span>
                <div className="flex items-center gap-1">
                  <Badge variant={sub.type === 'Practical' ? 'onDuty' : 'default'} size="sm">
                    {sub.type}
                  </Badge>
                  <button
                    onClick={() => handleOpenEdit(sub)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(sub._id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-base font-bold text-slate-900">{sub.name}</h3>
              <p className="text-xs text-slate-500 mt-1">
                {sub.department?.name} • Semester {sub.semester}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Assigned Faculty:</span>
                <span className="font-semibold text-slate-800">
                  {sub.teacher?.fullName || 'Unassigned'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Scheduled Classes:</span>
                <span className="font-semibold text-slate-700">
                  {sub.classes?.length || 0} classes assigned
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSubject ? 'Edit Course Details' : 'Create Course'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Course Code *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="CS401"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-mono uppercase outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Course Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-blue-600 bg-white"
              >
                <option value="Theory">Theory</option>
                <option value="Practical">Practical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Database Management Systems"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
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
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Teacher</label>
            <select
              value={formData.teacher}
              onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-blue-600 bg-white"
            >
              <option value="">-- No Teacher Assigned --</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.fullName} ({t.teacherId})
                </option>
              ))}
            </select>
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
              {editingSubject ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
