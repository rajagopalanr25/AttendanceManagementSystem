const Student = require('../models/Student');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Class = require('../models/Class');
const Department = require('../models/Department');
const { hashPassword, logAudit, calculateAttendance } = require('../utils/helpers');

const getStudents = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      department,
      classId,
      year,
      semester,
      section,
      isActive
    } = req.query;

    const query = {};

    if (department) query.department = department;
    if (classId) query.class = classId;
    if (year) query.year = Number(year);
    if (semester) query.semester = Number(semester);
    if (section) query.section = section.toUpperCase();
    if (isActive !== undefined) query.isActive = isActive === 'true';

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { registerNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Student.countDocuments(query);

    const students = await Student.find(query)
      .populate('department', 'name code')
      .populate('class', 'name semester section')
      .populate('user', 'status lastLogin')
      .sort({ registerNumber: 1 })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      data: students,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    next(err);
  }
};

const getStudentById = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('department')
      .populate('class')
      .populate('user', 'status lastLogin email');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Calculate overall attendance and subject-wise breakdown for this student
    const attendanceRecords = await Attendance.find({ student: student._id })
      .populate('subject', 'name code')
      .sort({ date: -1 });

    const overallMetrics = calculateAttendance(attendanceRecords);

    // Group by subject
    const subjectMap = {};
    attendanceRecords.forEach((rec) => {
      if (!rec.subject) return;
      const subId = rec.subject._id.toString();
      if (!subjectMap[subId]) {
        subjectMap[subId] = {
          subject: rec.subject,
          records: []
        };
      }
      subjectMap[subId].records.push(rec);
    });

    const subjectBreakdown = Object.values(subjectMap).map(({ subject, records }) => {
      const stats = calculateAttendance(records);
      return {
        subjectId: subject._id,
        subjectName: subject.name,
        subjectCode: subject.code,
        ...stats
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        ...student.toObject(),
        attendance: {
          overall: overallMetrics,
          subjects: subjectBreakdown,
          recentRecords: attendanceRecords.slice(0, 15)
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

const createStudent = async (req, res, next) => {
  try {
    const {
      registerNumber,
      fullName,
      email,
      phoneNumber,
      department,
      class: classId,
      course,
      year,
      semester,
      section,
      dateOfBirth,
      gender,
      admissionYear,
      password
    } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const existingReg = await Student.findOne({ registerNumber: registerNumber.toUpperCase().trim() });
    if (existingReg) {
      return res.status(400).json({ success: false, message: 'Student with this register number already exists' });
    }

    const hashedPassword = await hashPassword(password || 'Student@123');

    const newUser = await User.create({
      name: fullName,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'student',
      status: 'active'
    });

    const student = await Student.create({
      user: newUser._id,
      registerNumber: registerNumber.toUpperCase().trim(),
      fullName,
      email: email.toLowerCase().trim(),
      phoneNumber: phoneNumber || '',
      department,
      class: classId,
      course: course || 'B.Tech',
      year: Number(year),
      semester: Number(semester),
      section: section.toUpperCase(),
      dateOfBirth: dateOfBirth || null,
      gender: gender || 'Male',
      admissionYear: admissionYear || new Date().getFullYear()
    });

    await logAudit({
      action: 'CREATE',
      entityType: 'Student',
      entityId: student._id,
      performedBy: req.user._id,
      performedByRole: req.user.role,
      performedByName: req.user.name,
      details: `Created student ${student.fullName} (${student.registerNumber})`,
      newValue: student
    });

    const populated = await Student.findById(student._id).populate('department class');
    return res.status(201).json({ success: true, message: 'Student created successfully', data: populated });
  } catch (err) {
    next(err);
  }
};

const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const oldStudent = await Student.findById(id);
    if (!oldStudent) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const updated = await Student.findByIdAndUpdate(id, req.body, { new: true, runValidators: true })
      .populate('department class');

    if (req.body.fullName) {
      await User.findByIdAndUpdate(oldStudent.user, { name: req.body.fullName });
    }

    await logAudit({
      action: 'UPDATE',
      entityType: 'Student',
      entityId: id,
      performedBy: req.user._id,
      performedByRole: req.user.role,
      performedByName: req.user.name,
      details: `Updated student details for ${updated.fullName}`,
      oldValue: oldStudent,
      newValue: updated
    });

    return res.status(200).json({ success: true, message: 'Student updated successfully', data: updated });
  } catch (err) {
    next(err);
  }
};

const deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    await User.findByIdAndDelete(student.user);
    await Attendance.deleteMany({ student: id });
    await Student.findByIdAndDelete(id);

    await logAudit({
      action: 'DELETE',
      entityType: 'Student',
      entityId: id,
      performedBy: req.user._id,
      performedByRole: req.user.role,
      performedByName: req.user.name,
      details: `Deleted student ${student.fullName} (${student.registerNumber})`,
      oldValue: student
    });

    return res.status(200).json({ success: true, message: 'Student deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// Bulk import students from JSON array (parsed from CSV upload on client or server)
const bulkImportStudents = async (req, res, next) => {
  try {
    const { students } = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ success: false, message: 'Array of student records is required' });
    }

    const createdList = [];
    const errorsList = [];

    const defaultPassword = await hashPassword('Student@123');

    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      try {
        if (!s.registerNumber || !s.fullName || !s.email || !s.department || !s.class) {
          errorsList.push({ row: i + 1, registerNumber: s.registerNumber, error: 'Missing required fields' });
          continue;
        }

        const existingReg = await Student.findOne({ registerNumber: s.registerNumber.toUpperCase().trim() });
        if (existingReg) {
          errorsList.push({ row: i + 1, registerNumber: s.registerNumber, error: 'Register number already exists' });
          continue;
        }

        const existingUser = await User.findOne({ email: s.email.toLowerCase().trim() });
        if (existingUser) {
          errorsList.push({ row: i + 1, registerNumber: s.registerNumber, error: 'Email already exists' });
          continue;
        }

        const user = await User.create({
          name: s.fullName,
          email: s.email.toLowerCase().trim(),
          password: defaultPassword,
          role: 'student',
          status: 'active'
        });

        const createdStudent = await Student.create({
          user: user._id,
          registerNumber: s.registerNumber.toUpperCase().trim(),
          fullName: s.fullName,
          email: s.email.toLowerCase().trim(),
          phoneNumber: s.phoneNumber || '',
          department: s.department,
          class: s.class,
          course: s.course || 'B.Tech',
          year: Number(s.year || 1),
          semester: Number(s.semester || 1),
          section: (s.section || 'A').toUpperCase(),
          gender: s.gender || 'Male',
          admissionYear: Number(s.admissionYear || new Date().getFullYear())
        });

        createdList.push(createdStudent);
      } catch (err) {
        errorsList.push({ row: i + 1, registerNumber: s.registerNumber, error: err.message });
      }
    }

    await logAudit({
      action: 'BULK_IMPORT',
      entityType: 'Student',
      performedBy: req.user._id,
      performedByRole: req.user.role,
      performedByName: req.user.name,
      details: `Bulk imported ${createdList.length} students (${errorsList.length} failures)`
    });

    return res.status(200).json({
      success: true,
      message: `Successfully imported ${createdList.length} students`,
      importedCount: createdList.length,
      failedCount: errorsList.length,
      errors: errorsList
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  bulkImportStudents
};
