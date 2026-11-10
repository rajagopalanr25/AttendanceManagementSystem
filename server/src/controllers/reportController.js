const dayjs = require('dayjs');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Department = require('../models/Department');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const Setting = require('../models/Setting');
const { calculateAttendance } = require('../utils/helpers');

const getAttendanceReports = async (req, res, next) => {
  try {
    const {
      reportType = 'class_wise', // 'class_wise', 'subject_wise', 'student_wise', 'low_attendance', 'daily', 'monthly', 'teacher_activity'
      startDate,
      endDate,
      departmentId,
      classId,
      subjectId,
      studentId,
      teacherId,
      threshold
    } = req.query;

    const setting = (await Setting.findOne()) || {
      minimumAttendancePercentage: 75,
      criticalAttendancePercentage: 65
    };
    const activeThreshold = threshold ? Number(threshold) : setting.minimumAttendancePercentage;

    // Date range filter
    const dateQuery = {};
    if (startDate) dateQuery.$gte = dayjs(startDate).startOf('day').toDate();
    if (endDate) dateQuery.$lte = dayjs(endDate).endOf('day').toDate();

    // 1. CLASS-WISE REPORT
    if (reportType === 'class_wise') {
      const classQuery = { isActive: true };
      if (departmentId) classQuery.department = departmentId;
      if (classId) classQuery._id = classId;

      const classes = await Class.find(classQuery).populate('department', 'name code');
      const results = [];

      for (const cls of classes) {
        const studentCount = await Student.countDocuments({ class: cls._id, isActive: true });
        const attQuery = { class: cls._id };
        if (startDate || endDate) attQuery.date = dateQuery;

        const records = await Attendance.find(attQuery);
        const metrics = calculateAttendance(records, activeThreshold);

        results.push({
          classId: cls._id,
          className: cls.name,
          department: cls.department ? cls.department.name : '',
          departmentCode: cls.department ? cls.department.code : '',
          semester: cls.semester,
          section: cls.section,
          studentCount,
          totalSessions: records.length,
          presentCount: metrics.present,
          absentCount: metrics.absent,
          onDutyCount: metrics.onDuty,
          percentage: metrics.percentage,
          status: metrics.status
        });
      }

      return res.status(200).json({ success: true, reportType, count: results.length, data: results });
    }

    // 2. SUBJECT-WISE REPORT
    if (reportType === 'subject_wise') {
      const subQuery = { isActive: true };
      if (departmentId) subQuery.department = departmentId;
      if (subjectId) subQuery._id = subjectId;

      const subjects = await Subject.find(subQuery)
        .populate('department', 'name code')
        .populate('teacher', 'fullName teacherId');

      const results = [];
      for (const sub of subjects) {
        const attQuery = { subject: sub._id };
        if (classId) attQuery.class = classId;
        if (startDate || endDate) attQuery.date = dateQuery;

        const records = await Attendance.find(attQuery);
        const metrics = calculateAttendance(records, activeThreshold);

        results.push({
          subjectId: sub._id,
          name: sub.name,
          code: sub.code,
          department: sub.department ? sub.department.name : '',
          teacher: sub.teacher ? sub.teacher.fullName : 'Not Assigned',
          semester: sub.semester,
          type: sub.type,
          totalClassesConducted: records.length,
          presentCount: metrics.present,
          absentCount: metrics.absent,
          onDutyCount: metrics.onDuty,
          percentage: metrics.percentage,
          status: metrics.status
        });
      }

      return res.status(200).json({ success: true, reportType, count: results.length, data: results });
    }

    // 3. STUDENT-WISE REPORT
    if (reportType === 'student_wise') {
      const studentQuery = { isActive: true };
      if (departmentId) studentQuery.department = departmentId;
      if (classId) studentQuery.class = classId;
      if (studentId) studentQuery._id = studentId;

      const students = await Student.find(studentQuery)
        .populate('department', 'name code')
        .populate('class', 'name semester section')
        .sort({ registerNumber: 1 });

      const results = [];
      for (const st of students) {
        const attQuery = { student: st._id };
        if (subjectId) attQuery.subject = subjectId;
        if (startDate || endDate) attQuery.date = dateQuery;

        const records = await Attendance.find(attQuery);
        const metrics = calculateAttendance(records, activeThreshold);

        results.push({
          studentId: st._id,
          registerNumber: st.registerNumber,
          fullName: st.fullName,
          department: st.department ? st.department.code : '',
          class: st.class ? st.class.name : '',
          semester: st.semester,
          section: st.section,
          totalClasses: metrics.total,
          attendedClasses: metrics.attended,
          present: metrics.present,
          absent: metrics.absent,
          onDuty: metrics.onDuty,
          percentage: metrics.percentage,
          eligibility: metrics.status
        });
      }

      return res.status(200).json({ success: true, reportType, count: results.length, data: results });
    }

    // 4. LOW ATTENDANCE REPORT
    if (reportType === 'low_attendance') {
      const studentQuery = { isActive: true };
      if (departmentId) studentQuery.department = departmentId;
      if (classId) studentQuery.class = classId;

      const students = await Student.find(studentQuery)
        .populate('department', 'name code')
        .populate('class', 'name semester section');

      const results = [];
      for (const st of students) {
        const attQuery = { student: st._id };
        if (subjectId) attQuery.subject = subjectId;
        if (startDate || endDate) attQuery.date = dateQuery;

        const records = await Attendance.find(attQuery);
        const metrics = calculateAttendance(records, activeThreshold);

        if (metrics.percentage !== null && metrics.percentage < activeThreshold) {
          results.push({
            studentId: st._id,
            registerNumber: st.registerNumber,
            fullName: st.fullName,
            email: st.email,
            phoneNumber: st.phoneNumber,
            department: st.department ? st.department.code : '',
            class: st.class ? st.class.name : '',
            totalClasses: metrics.total,
            attendedClasses: metrics.attended,
            absentClasses: metrics.absent,
            percentage: metrics.percentage,
            severity: metrics.percentage < setting.criticalAttendancePercentage ? 'Critical' : 'Shortage'
          });
        }
      }

      // Sort by lowest percentage first
      results.sort((a, b) => a.percentage - b.percentage);

      return res.status(200).json({ success: true, reportType, count: results.length, data: results });
    }

    // 5. DAILY ATTENDANCE REPORT
    if (reportType === 'daily') {
      const targetDate = startDate ? dayjs(startDate).startOf('day').toDate() : dayjs().startOf('day').toDate();
      const endTargetDate = dayjs(targetDate).endOf('day').toDate();

      const attQuery = { date: { $gte: targetDate, $lte: endTargetDate } };
      if (classId) attQuery.class = classId;
      if (subjectId) attQuery.subject = subjectId;

      const records = await Attendance.find(attQuery)
        .populate('student', 'registerNumber fullName email')
        .populate('subject', 'name code')
        .populate('class', 'name')
        .populate('teacher', 'fullName');

      return res.status(200).json({
        success: true,
        reportType,
        targetDate: dayjs(targetDate).format('YYYY-MM-DD'),
        count: records.length,
        data: records
      });
    }

    // 6. TEACHER ACTIVITY REPORT
    if (reportType === 'teacher_activity') {
      const teacherQuery = { isActive: true };
      if (departmentId) teacherQuery.department = departmentId;
      if (teacherId) teacherQuery._id = teacherId;

      const teachers = await Teacher.find(teacherQuery)
        .populate('department', 'name code')
        .populate('assignedSubjects', 'name code');

      const results = [];
      for (const t of teachers) {
        const attQuery = { teacher: t._id };
        if (startDate || endDate) attQuery.date = dateQuery;

        const markedSessions = await Attendance.aggregate([
          { $match: attQuery },
          {
            $group: {
              _id: { date: '$date', subject: '$subject', class: '$class' },
              totalStudents: { $sum: 1 },
              present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } }
            }
          }
        ]);

        results.push({
          teacherId: t.teacherId,
          fullName: t.fullName,
          department: t.department ? t.department.name : '',
          assignedSubjectsCount: t.assignedSubjects.length,
          sessionsConducted: markedSessions.length,
          lastActivity: markedSessions.length > 0 ? dayjs(markedSessions[0]._id.date).format('YYYY-MM-DD') : 'None'
        });
      }

      return res.status(200).json({ success: true, reportType, count: results.length, data: results });
    }

    return res.status(400).json({ success: false, message: 'Invalid reportType specified' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAttendanceReports };

