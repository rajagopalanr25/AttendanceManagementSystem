const Teacher = require('../models/Teacher');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const { hashPassword, logAudit } = require('../utils/helpers');

const getTeachers = async (req, res, next) => {
  try {
    const { department, search, isActive } = req.query;
    const filter = {};

    if (department) filter.department = department;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { teacherId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const teachers = await Teacher.find(filter)
      .populate('department', 'name code')
      .populate('assignedSubjects', 'name code semester type')
      .populate('assignedClasses', 'name semester section')
      .populate('user', 'status lastLogin')
      .sort({ fullName: 1 });

    return res.status(200).json({ success: true, count: teachers.length, data: teachers });
  } catch (err) {
    next(err);
  }
};

const getTeacherById = async (req, res, next) => {
  try {
    const teacher = await Teacher.findById(req.params.id)
      .populate('department')
      .populate('assignedSubjects')
      .populate('assignedClasses')
      .populate('user', 'status lastLogin email');

    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    // Fetch recent attendance marking history
    const recentActivity = await Attendance.aggregate([
      { $match: { teacher: teacher._id } },
      {
        $group: {
          _id: {
            date: '$date',
            subject: '$subject',
            class: '$class'
          },
          totalMarked: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
          onDuty: { $sum: { $cond: [{ $eq: ['$status', 'On Duty'] }, 1, 0] } }
        }
      },
      { $sort: { '_id.date': -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'subjects',
          localField: '_id.subject',
          foreignField: '_id',
          as: 'subjectDetails'
        }
      },
      {
        $lookup: {
          from: 'classes',
          localField: '_id.class',
          foreignField: '_id',
          as: 'classDetails'
        }
      },
      {
        $project: {
          date: '$_id.date',
          subject: { $arrayElemAt: ['$subjectDetails', 0] },
          class: { $arrayElemAt: ['$classDetails', 0] },
          totalMarked: 1,
          present: 1,
          absent: 1,
          onDuty: 1
        }
      }
    ]);

    return res.status(200).json({
      success: true,
      data: {
        ...teacher.toObject(),
        recentActivity
      }
    });
  } catch (err) {
    next(err);
  }
};

const createTeacher = async (req, res, next) => {
  try {
    const { teacherId, fullName, email, phoneNumber, department, designation, password, assignedSubjects, assignedClasses } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const existingTeacherId = await Teacher.findOne({ teacherId: teacherId.toUpperCase().trim() });
    if (existingTeacherId) {
      return res.status(400).json({ success: false, message: 'Teacher ID already exists' });
    }

    const hashedPassword = await hashPassword(password || 'Teacher@123');

    const newUser = await User.create({
      name: fullName,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'teacher',
      status: 'active'
    });

    const teacher = await Teacher.create({
      user: newUser._id,
      teacherId: teacherId.toUpperCase().trim(),
      fullName,
      email: email.toLowerCase().trim(),
      phoneNumber: phoneNumber || '',
      department,
      designation: designation || 'Assistant Professor',
      assignedSubjects: assignedSubjects || [],
      assignedClasses: assignedClasses || []
    });

    await logAudit({
      action: 'CREATE',
      entityType: 'Teacher',
      entityId: teacher._id,
      performedBy: req.user._id,
      performedByRole: req.user.role,
      performedByName: req.user.name,
      details: `Created teacher ${teacher.fullName} (${teacher.teacherId})`,
      newValue: teacher
    });

    const populated = await Teacher.findById(teacher._id)
      .populate('department')
      .populate('assignedSubjects')
      .populate('assignedClasses');

    return res.status(201).json({ success: true, message: 'Teacher created successfully', data: populated });
  } catch (err) {
    next(err);
  }
};

const updateTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;
    const oldTeacher = await Teacher.findById(id);
    if (!oldTeacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    const updated = await Teacher.findByIdAndUpdate(id, req.body, { new: true, runValidators: true })
      .populate('department')
      .populate('assignedSubjects')
      .populate('assignedClasses');

    if (req.body.fullName) {
      await User.findByIdAndUpdate(oldTeacher.user, { name: req.body.fullName });
    }

    await logAudit({
      action: 'UPDATE',
      entityType: 'Teacher',
      entityId: id,
      performedBy: req.user._id,
      performedByRole: req.user.role,
      performedByName: req.user.name,
      details: `Updated teacher ${updated.fullName}`,
      oldValue: oldTeacher,
      newValue: updated
    });

    return res.status(200).json({ success: true, message: 'Teacher updated successfully', data: updated });
  } catch (err) {
    next(err);
  }
};

const assignTeacherSubjectsClasses = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assignedSubjects, assignedClasses } = req.body;

    const teacher = await Teacher.findById(id);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    teacher.assignedSubjects = assignedSubjects || teacher.assignedSubjects;
    teacher.assignedClasses = assignedClasses || teacher.assignedClasses;
    await teacher.save();

    const populated = await Teacher.findById(id)
      .populate('department')
      .populate('assignedSubjects')
      .populate('assignedClasses');

    await logAudit({
      action: 'UPDATE',
      entityType: 'Teacher',
      entityId: id,
      performedBy: req.user._id,
      performedByRole: req.user.role,
      performedByName: req.user.name,
      details: `Updated subject & class assignments for teacher ${teacher.fullName}`,
      newValue: { assignedSubjects, assignedClasses }
    });

    return res.status(200).json({ success: true, message: 'Assignments updated successfully', data: populated });
  } catch (err) {
    next(err);
  }
};

const deleteTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;
    const teacher = await Teacher.findById(id);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    await User.findByIdAndDelete(teacher.user);
    await Teacher.findByIdAndDelete(id);

    await logAudit({
      action: 'DELETE',
      entityType: 'Teacher',
      entityId: id,
      performedBy: req.user._id,
      performedByRole: req.user.role,
      performedByName: req.user.name,
      details: `Deleted teacher ${teacher.fullName}`,
      oldValue: teacher
    });

    return res.status(200).json({ success: true, message: 'Teacher and associated user account removed successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  assignTeacherSubjectsClasses,
  deleteTeacher
};

