const Department = require('../models/Department');
const { logAudit } = require('../utils/helpers');

const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    return res.status(200).json({ success: true, count: departments.length, data: departments });
  } catch (err) {
    next(err);
  }
};

const createDepartment = async (req, res, next) => {
  try {
    const { name, code, description, headOfDepartment } = req.body;

    const existingCode = await Department.findOne({ code: code.toUpperCase() });
    if (existingCode) {
      return res.status(400).json({ success: false, message: 'Department code already exists' });
    }

    const department = await Department.create({
      name,
      code: code.toUpperCase(),
      description,
      headOfDepartment
    });

    await logAudit({
      action: 'CREATE',
      entityType: 'Department',
      entityId: department._id,
      performedBy: req.user._id,
      performedByRole: req.user.role,
      performedByName: req.user.name,
      details: `Created department ${department.name} (${department.code})`,
      newValue: department
    });

    return res.status(201).json({ success: true, message: 'Department created successfully', data: department });
  } catch (err) {
    next(err);
  }
};

const updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const oldDept = await Department.findById(id);
    if (!oldDept) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    const department = await Department.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

    await logAudit({
      action: 'UPDATE',
      entityType: 'Department',
      entityId: department._id,
      performedBy: req.user._id,
      performedByRole: req.user.role,
      performedByName: req.user.name,
      details: `Updated department ${department.name}`,
      oldValue: oldDept,
      newValue: department
    });

    return res.status(200).json({ success: true, message: 'Department updated successfully', data: department });
  } catch (err) {
    next(err);
  }
};

const deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    await Department.findByIdAndDelete(id);

    await logAudit({
      action: 'DELETE',
      entityType: 'Department',
      entityId: id,
      performedBy: req.user._id,
      performedByRole: req.user.role,
      performedByName: req.user.name,
      details: `Deleted department ${department.name}`,
      oldValue: department
    });

    return res.status(200).json({ success: true, message: 'Department deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment
};

