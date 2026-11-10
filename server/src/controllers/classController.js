const Class = require('../models/Class');
const Student = require('../models/Student');
const { logAudit } = require('../utils/helpers');

const getClasses = async (req, res, next) => {
  try {
    const { department, semester, academicYear } = req.query;
    const filter = { isActive: true };

    if (department) filter.department = department;
    if (semester) filter.semester = Number(semester);
    if (academicYear) filter.academicYear = academicYear;

    const classes = await Class.find(filter)
      .populate('department', 'name code')
      .sort({ semester: 1, section: 1 });

    // Attach student count to each class
    const classIds = classes.map((c) => c._id);
    const counts = await Student.aggregate([
      { $match: { class: { $in: classIds }, isActive: true } },
      { $group: { _id: '$class', count: { $sum: 1 } } }
    ]);

    const countMap = {};
    counts.forEach((item) => {
      countMap[item._id.toString()] = item.count;
    });

    const result = classes.map((c) => ({
      ...c.toObject(),
      studentCount: countMap[c._id.toString()] || 0
    }));

    return res.status(200).json({ success: true, count: result.length, data: result });
  } catch (err) {
    next(err);
  }
};

const getClassById = async (req, res, next) => {
  try {
    const classData = await Class.findById(req.params.id).populate('department');
    if (!classData) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    const students = await Student.find({ class: classData._id, isActive: true })
      .sort({ registerNumber: 1 });

    return res.status(200).json({
      success: true,
      data: {
        ...classData.toObject(),
        students
      }
    });
  } catch (err) {
    next(err);
  }
};

const createClass = async (req, res, next) => {
  try {
    const { name, department, academicYear, semester, section, roomNumber } = req.body;

    const existing = await Class.findOne({ department, semester, section: section.toUpperCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Class already exists for department, semester ${semester}, and section ${section}`
      });
    }

    const newClass = await Class.create({
      name,
      department,
      academicYear,
      semester,
      section: section.toUpperCase(),
      roomNumber
    });

    await logAudit({
      action: 'CREATE',
      entityType: 'Class',
      entityId: newClass._id,
      performedBy: req.user._id,
      performedByRole: req.user.role,
      performedByName: req.user.name,
      details: `Created class ${newClass.name} (Semester ${newClass.semester}-${newClass.section})`,
      newValue: newClass
    });

    const populated = await Class.findById(newClass._id).populate('department');
    return res.status(201).json({ success: true, message: 'Class created successfully', data: populated });
  } catch (err) {
    next(err);
  }
};

const updateClass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const oldClass = await Class.findById(id);
    if (!oldClass) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    const updated = await Class.findByIdAndUpdate(id, req.body, { new: true, runValidators: true }).populate('department');

    await logAudit({
      action: 'UPDATE',
      entityType: 'Class',
      entityId: id,
      performedBy: req.user._id,
      performedByRole: req.user.role,
      performedByName: req.user.name,
      details: `Updated class ${updated.name}`,
      oldValue: oldClass,
      newValue: updated
    });

    return res.status(200).json({ success: true, message: 'Class updated successfully', data: updated });
  } catch (err) {
    next(err);
  }
};

const deleteClass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const classObj = await Class.findById(id);
    if (!classObj) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    // Check if students exist in class
    const studentCount = await Student.countDocuments({ class: id });
    if (studentCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete class. There are ${studentCount} students currently enrolled in this class.`
      });
    }

    await Class.findByIdAndDelete(id);

    await logAudit({
      action: 'DELETE',
      entityType: 'Class',
      entityId: id,
      performedBy: req.user._id,
      performedByRole: req.user.role,
      performedByName: req.user.name,
      details: `Deleted class ${classObj.name}`,
      oldValue: classObj
    });

    return res.status(200).json({ success: true, message: 'Class deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass
};

