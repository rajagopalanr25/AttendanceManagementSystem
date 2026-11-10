const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const { logAudit } = require('../utils/helpers');

const getSubjects = async (req, res, next) => {
  try {
    const { department, semester, teacher, search } = req.query;
    const filter = { isActive: true };

    if (department) filter.department = department;
    if (semester) filter.semester = Number(semester);
    if (teacher) filter.teacher = teacher;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    const subjects = await Subject.find(filter)
      .populate('department', 'name code')
      .populate('teacher', 'fullName teacherId email')
      .populate('classes', 'name semester section')
      .sort({ semester: 1, name: 1 });

    return res.status(200).json({ success: true, count: subjects.length, data: subjects });
  } catch (err) {
    next(err);
  }
};

const getSubjectById = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate('department')
      .populate('teacher')
      .populate('classes');

    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    return res.status(200).json({ success: true, data: subject });
  } catch (err) {
    next(err);
  }
};

const createSubject = async (req, res, next) => {
  try {
    const { name, code, department, semester, type, teacher, classes, totalScheduledClasses } = req.body;

    const existing = await Subject.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: `Subject code '${code}' already exists` });
    }

    const subject = await Subject.create({
      name,
      code: code.toUpperCase(),
      department,
      semester,
      type: type || 'Theory',
      teacher: teacher || null,
      classes: classes || [],
      totalScheduledClasses: totalScheduledClasses || 0
    });

    if (teacher) {
      await Teacher.findByIdAndUpdate(teacher, {
        $addToSet: { assignedSubjects: subject._id, assignedClasses: { $each: classes || [] } }
      });
    }

    await logAudit({
      action: 'CREATE',
      entityType: 'Subject',
      entityId: subject._id,
      performedBy: req.user._id,
      performedByRole: req.user.role,
      performedByName: req.user.name,
      details: `Created subject ${subject.name} (${subject.code})`,
      newValue: subject
    });

    const populated = await Subject.findById(subject._id)
      .populate('department teacher classes');

    return res.status(201).json({ success: true, message: 'Subject created successfully', data: populated });
  } catch (err) {
    next(err);
  }
};

const updateSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const oldSubject = await Subject.findById(id);
    if (!oldSubject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const { teacher, classes } = req.body;

    // If teacher changed, update previous teacher's assignedSubjects and new teacher's assignedSubjects
    if (teacher && (!oldSubject.teacher || oldSubject.teacher.toString() !== teacher.toString())) {
      if (oldSubject.teacher) {
        await Teacher.findByIdAndUpdate(oldSubject.teacher, {
          $pull: { assignedSubjects: oldSubject._id }
        });
      }
      await Teacher.findByIdAndUpdate(teacher, {
        $addToSet: { assignedSubjects: oldSubject._id, assignedClasses: { $each: classes || [] } }
      });
    }

    const updated = await Subject.findByIdAndUpdate(id, req.body, { new: true, runValidators: true })
      .populate('department teacher classes');

    await logAudit({
      action: 'UPDATE',
      entityType: 'Subject',
      entityId: id,
      performedBy: req.user._id,
      performedByRole: req.user.role,
      performedByName: req.user.name,
      details: `Updated subject ${updated.name}`,
      oldValue: oldSubject,
      newValue: updated
    });

    return res.status(200).json({ success: true, message: 'Subject updated successfully', data: updated });
  } catch (err) {
    next(err);
  }
};

const deleteSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    // Remove subject reference from teachers
    if (subject.teacher) {
      await Teacher.findByIdAndUpdate(subject.teacher, {
        $pull: { assignedSubjects: id }
      });
    }

    await Subject.findByIdAndDelete(id);

    await logAudit({
      action: 'DELETE',
      entityType: 'Subject',
      entityId: id,
      performedBy: req.user._id,
      performedByRole: req.user.role,
      performedByName: req.user.name,
      details: `Deleted subject ${subject.name}`,
      oldValue: subject
    });

    return res.status(200).json({ success: true, message: 'Subject deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject
};
