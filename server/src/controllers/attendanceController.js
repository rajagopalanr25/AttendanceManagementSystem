const dayjs = require('dayjs');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const Setting = require('../models/Setting');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const { calculateAttendance, logAudit } = require('../utils/helpers');

// Helper to normalize date to start of UTC day
const normalizeDate = (d) => {
  return dayjs(d).startOf('day').toDate();
};

// @desc    Mark attendance for a class session
// @route   POST /api/attendance
// @access  Teacher (assigned only) or Admin
const markAttendance = async (req, res, next) => {
  try {
    const { classId, subjectId, date, attendanceData } = req.body;
    // attendanceData: [{ studentId, status: 'Present' | 'Absent' | 'On Duty', remarks?: string }]

    if (!classId || !subjectId || !date || !Array.isArray(attendanceData) || attendanceData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Class, Subject, Date and attendance list are required'
      });
    }

    const sessionDate = normalizeDate(date);

    // Verify Teacher Authorization if teacher is making request
    let teacherProfile = null;
    if (req.user.role === 'teacher') {
      teacherProfile = await Teacher.findOne({ user: req.user._id });
      if (!teacherProfile) {
        return res.status(403).json({ success: false, message: 'Teacher profile not found' });
      }

      // Check if teacher is assigned to this subject
      const isAssignedSubject = teacherProfile.assignedSubjects.some(
        (s) => s.toString() === subjectId.toString()
      );
      if (!isAssignedSubject) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: You are not assigned to teach this subject.'
        });
      }
    } else if (req.user.role === 'admin') {
      // If admin is marking, find assigned teacher for the subject, or use first teacher
      const subj = await Subject.findById(subjectId);
      if (subj && subj.teacher) {
        teacherProfile = await Teacher.findById(subj.teacher);
      }
      if (!teacherProfile) {
        teacherProfile = await Teacher.findOne();
      }
    } else {
      return res.status(403).json({ success: false, message: 'Unauthorized role to mark attendance' });
    }

    // Check if attendance already exists for any student in this subject on this date
    const existing = await Attendance.find({
      subject: subjectId,
      date: sessionDate,
      class: classId
    });

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Attendance has already been marked for this subject and class on ${dayjs(sessionDate).format('YYYY-MM-DD')}. Please use the edit feature instead.`,
        existingRecordsCount: existing.length
      });
    }

    const docsToInsert = attendanceData.map((item) => ({
      student: item.studentId,
      teacher: teacherProfile._id,
      class: classId,
      subject: subjectId,
      date: sessionDate,
      status: item.status || 'Present',
      remarks: item.remarks || '',
      markedBy: req.user._id
    }));

    const inserted = await Attendance.insertMany(docsToInsert);

    // Increment total scheduled/taken classes on Subject
    await Subject.findByIdAndUpdate(subjectId, { $inc: { totalScheduledClasses: 1 } });

    // Create Audit Log
    const presentCount = attendanceData.filter((a) => a.status === 'Present').length;
    const absentCount = attendanceData.filter((a) => a.status === 'Absent').length;
    const onDutyCount = attendanceData.filter((a) => a.status === 'On Duty').length;

    await logAudit({
      action: 'CREATE',
      entityType: 'Attendance',
      performedBy: req.user._id,
      performedByRole: req.user.role,
      performedByName: req.user.name,
      details: `Marked attendance on ${dayjs(sessionDate).format('YYYY-MM-DD')}: ${presentCount} Present, ${absentCount} Absent, ${onDutyCount} On Duty (${inserted.length} total)`,
      newValue: { classId, subjectId, date: sessionDate, count: inserted.length }
    });

    // Check if any student now falls below minimum threshold and create low attendance alert
    const setting = (await Setting.findOne()) || { minimumAttendancePercentage: 75 };
    for (const item of attendanceData) {
      if (item.status === 'Absent') {
        const studentHistory = await Attendance.find({ student: item.studentId, subject: subjectId });
        const metrics = calculateAttendance(studentHistory, setting.minimumAttendancePercentage);
        if (metrics.percentage !== null && metrics.percentage < setting.minimumAttendancePercentage) {
          const studentDoc = await Student.findById(item.studentId);
          if (studentDoc) {
            await Notification.create({
              recipient: studentDoc.user,
              role: 'student',
              title: 'Attendance Shortage Alert',
              message: `Your attendance in this subject has dropped to ${metrics.percentage}%, which is below the required ${setting.minimumAttendancePercentage}%.`,
              type: 'warning'
            });
          }
        }
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Attendance recorded successfully',
      recordsCount: inserted.length,
      summary: {
        present: presentCount,
        absent: absentCount,
        onDuty: onDutyCount,
        total: inserted.length
      }
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate attendance record detected. Attendance was already recorded for this subject on this date.'
      });
    }
    next(err);
  }
};

// @desc    Get attendance records for a specific session (class + subject + date)
// @route   GET /api/attendance/session
// @access  Private (Teacher / Admin)
const getAttendanceSession = async (req, res, next) => {
  try {
    const { classId, subjectId, date } = req.query;

    if (!classId || !subjectId || !date) {
      return res.status(400).json({ success: false, message: 'Class, Subject, and Date are required' });
    }

    const sessionDate = normalizeDate(date);

    const records = await Attendance.find({
      class: classId,
      subject: subjectId,
      date: sessionDate
    })
      .populate('student', 'registerNumber fullName email')
      .populate('markedBy', 'name role')
      .sort({ 'student.registerNumber': 1 });

    return res.status(200).json({
      success: true,
      exists: records.length > 0,
      count: records.length,
      data: records
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update/Edit attendance records for a session
// @route   PUT /api/attendance/session
// @access  Teacher (assigned within allowed edit window) or Admin
const updateAttendanceSession = async (req, res, next) => {
  try {
    const { classId, subjectId, date, updates } = req.body;
    // updates: [{ attendanceId, status, remarks }]

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ success: false, message: 'List of record updates is required' });
    }

    const sessionDate = normalizeDate(date);

    // Permission checks
    const setting = (await Setting.findOne()) || { allowTeacherEditDays: 7 };
    const diffDays = dayjs().diff(dayjs(sessionDate), 'day');

    if (req.user.role === 'teacher') {
      const teacherProfile = await Teacher.findOne({ user: req.user._id });
      if (!teacherProfile) {
        return res.status(403).json({ success: false, message: 'Teacher profile not found' });
      }

      const isAssigned = teacherProfile.assignedSubjects.some(
        (s) => s.toString() === subjectId.toString()
      );
      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: You are not assigned to teach this subject.'
        });
      }

      if (diffDays > setting.allowTeacherEditDays) {
        return res.status(403).json({
          success: false,
          message: `Editing period expired. Teachers can only edit attendance within ${setting.allowTeacherEditDays} days of the session date.`
        });
      }
    }

    let modifiedCount = 0;
    const auditChanges = [];

    for (const update of updates) {
      const existing = await Attendance.findById(update.attendanceId).populate('student', 'registerNumber fullName');
      if (existing && (existing.status !== update.status || existing.remarks !== (update.remarks || ''))) {
        auditChanges.push({
          student: existing.student ? existing.student.fullName : existing.student,
          registerNumber: existing.student ? existing.student.registerNumber : '',
          from: existing.status,
          to: update.status
        });

        existing.status = update.status;
        if (update.remarks !== undefined) existing.remarks = update.remarks;
        existing.markedBy = req.user._id;
        await existing.save();
        modifiedCount++;
      }
    }

    if (modifiedCount > 0) {
      await logAudit({
        action: 'UPDATE',
        entityType: 'Attendance',
        performedBy: req.user._id,
        performedByRole: req.user.role,
        performedByName: req.user.name,
        details: `Updated ${modifiedCount} student attendance statuses for session on ${dayjs(sessionDate).format('YYYY-MM-DD')}`,
        oldValue: auditChanges
      });
    }

    return res.status(200).json({
      success: true,
      message: `Updated ${modifiedCount} attendance records successfully`,
      modifiedCount
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get attendance records with comprehensive query filters
// @route   GET /api/attendance
// @access  Private
const getAttendanceRecords = async (req, res, next) => {
  try {
    const {
      classId,
      subjectId,
      teacherId,
      studentId,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;

    const filter = {};

    if (classId) filter.class = classId;
    if (subjectId) filter.subject = subjectId;
    if (teacherId) filter.teacher = teacherId;
    if (studentId) filter.student = studentId;
    if (status) filter.status = status;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = normalizeDate(startDate);
      if (endDate) filter.date.$lte = dayjs(endDate).endOf('day').toDate();
    }

    // Role restrictions: students can only query their own
    if (req.user.role === 'student') {
      const studentProfile = await Student.findOne({ user: req.user._id });
      if (!studentProfile) {
        return res.status(404).json({ success: false, message: 'Student profile not found' });
      }
      filter.student = studentProfile._id;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Attendance.countDocuments(filter);

    const records = await Attendance.find(filter)
      .populate('student', 'registerNumber fullName email department class')
      .populate('subject', 'name code semester type')
      .populate('class', 'name semester section')
      .populate('teacher', 'fullName teacherId')
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      count: records.length,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      },
      data: records
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get monthly calendar representation of student attendance
// @route   GET /api/attendance/calendar
// @access  Private
const getAttendanceCalendar = async (req, res, next) => {
  try {
    const { month, year, studentId, subjectId } = req.query;
    // Default to current year and month if not provided
    const targetYear = year ? Number(year) : dayjs().year();
    const targetMonth = month ? Number(month) : dayjs().month() + 1; // 1-indexed

    const startOfMonth = dayjs(`${targetYear}-${String(targetMonth).padStart(2, '0')}-01`).startOf('month').toDate();
    const endOfMonth = dayjs(`${targetYear}-${String(targetMonth).padStart(2, '0')}-01`).endOf('month').toDate();

    let targetStudentId = studentId;
    if (req.user.role === 'student') {
      const studentProfile = await Student.findOne({ user: req.user._id });
      if (!studentProfile) {
        return res.status(404).json({ success: false, message: 'Student profile not found' });
      }
      targetStudentId = studentProfile._id;
    }

    if (!targetStudentId) {
      return res.status(400).json({ success: false, message: 'Student ID is required' });
    }

    const query = {
      student: targetStudentId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    };

    if (subjectId) {
      query.subject = subjectId;
    }

    const records = await Attendance.find(query)
      .populate('subject', 'name code')
      .sort({ date: 1 });

    // Group records by day string YYYY-MM-DD
    const calendarMap = {};
    records.forEach((r) => {
      const dateKey = dayjs(r.date).format('YYYY-MM-DD');
      if (!calendarMap[dateKey]) {
        calendarMap[dateKey] = [];
      }
      calendarMap[dateKey].push({
        id: r._id,
        subjectId: r.subject ? r.subject._id : null,
        subjectName: r.subject ? r.subject.name : 'Unknown',
        subjectCode: r.subject ? r.subject.code : '',
        status: r.status,
        remarks: r.remarks
      });
    });

    const summary = calculateAttendance(records);

    return res.status(200).json({
      success: true,
      month: targetMonth,
      year: targetYear,
      summary,
      calendar: calendarMap
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get attendance audit logs
// @route   GET /api/attendance/audit-logs
// @access  Admin only
const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 30, entityType = 'Attendance' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query = {};
    if (entityType) query.entityType = entityType;

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .populate('performedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      data: logs,
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

module.exports = {
  markAttendance,
  getAttendanceSession,
  updateAttendanceSession,
  getAttendanceRecords,
  getAttendanceCalendar,
  getAuditLogs
};
