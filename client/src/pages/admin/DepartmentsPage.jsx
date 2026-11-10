import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { Modal } from '../../components/common/Modal';
import { toast } from 'sonner';

export const DepartmentsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', description: '', headOfDepartment: '' });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/departments');
      if (res.data.success) {
        setDepartments(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingDept(null);
    setFormData({ name: '', code: '', description: '', headOfDepartment: '' });
    setModalOpen(true);
  };

  const handleOpenEdit = (dept) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      description: dept.description || '',
      headOfDepartment: dept.headOfDepartment || ''
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingDept) {
        await api.put(`/departments/${editingDept._id}`, formData);
        toast.success('Department updated successfully');
      } else {
        await api.post('/departments', formData);
        toast.success('Department created successfully');
      }
      setModalOpen(false);
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving department');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    try {
      await api.delete(`/departments/${id}`);
      toast.success('Department deleted');
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting department');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Departments
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage academic divisions and heads of departments
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Department
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {departments.map((dept) => (
          <div
            key={dept._id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 font-bold text-sm border border-blue-100">
                  {dept.code}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(dept)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(dept._id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-base font-bold text-slate-900">{dept.name}</h3>
              <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                {dept.description || 'No description provided'}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 text-xs">
              <span className="text-slate-400">Head of Dept:</span>
              <p className="font-semibold text-slate-800">{dept.headOfDepartment || 'Not assigned'}</p>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingDept ? 'Edit Department' : 'Create New Department'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Department Code *</label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="CSE"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-mono uppercase outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Department Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Computer Science & Engineering"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Head of Department</label>
            <input
              type="text"
              value={formData.headOfDepartment}
              onChange={(e) => setFormData({ ...formData, headOfDepartment: e.target.value })}
              placeholder="Dr. Alan Turing"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Academic department information..."
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-blue-600"
            />
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
              {editingDept ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
