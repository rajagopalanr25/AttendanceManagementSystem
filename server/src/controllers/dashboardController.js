const dayjs = require('dayjs');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Department = require('../models/Department');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const Setting = require('../models/Setting');
const { calculateAttendance } = require('../utils/helpers');

// @desc    Admin Dashboard Analytics
// @route   GET /api/dashboard/admin
// @access  Admin
const getAdminDashboard = async (req, res, next) => {
  try {
    const { departmentId, startDate, endDate } = req.query;

    const setting = (await Setting.findOne()) || {
      minimumAttendancePercentage: 75,
      criticalAttendancePercentage: 65
    };

    // Base counts
    const totalStudents = await Student.countDocuments({ isActive: true });
    const totalTeachers = await Teacher.countDocuments({ isActive: true });
    const totalDepartments = await Department.countDocuments({ isActive: true });
    const totalClasses = await Class.countDocuments({ isActive: true });

    // Today's Date range
    const todayStart = dayjs().startOf('day').toDate();
    const todayEnd = dayjs().endOf('day').toDate();

    const todayFilter = { date: { $gte: todayStart, $lte: todayEnd } };
    if (departmentId) {
      // Find classes in department
      const deptClasses = await Class.find({ department: departmentId }).select('_id');
      todayFilter.class = { $in: deptClasses.map((c) => c._id) };
    }

    const todayRecords = await Attendance.find(todayFilter);
    const todayPresent = todayRecords.filter((r) => r.status === 'Present').length;
    const todayAbsent = todayRecords.filter((r) => r.status === 'Absent').length;
    const todayOnDuty = todayRecords.filter((r) => r.status === 'On Duty').length;
    const todayTotal = todayRecords.length;
    const todayPercentage = todayTotal > 0 ? Number((((todayPresent + todayOnDuty) / todayTotal) * 100).toFixed(1)) : 0;

    // Weekly Attendance Trend (Last 7 Days)
    const weeklyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = dayjs().subtract(i, 'day');
      const start = d.startOf('day').toDate();
      const end = d.endOf('day').toDate();

      const dayFilter = { date: { $gte: start, $lte: end } };
      if (departmentId) {
        const deptClasses = await Class.find({ department: departmentId }).select('_id');
        dayFilter.class = { $in: deptClasses.map((c) => c._id) };
      }

      const records = await Attendance.find(dayFilter);
      const pres = records.filter((r) => r.status === 'Present').length;
      const od = records.filter((r) => r.status === 'On Duty').length;
      const abs = records.filter((r) => r.status === 'Absent').length;
      const tot = records.length;
      const rate = tot > 0 ? Number((((pres + od) / tot) * 100).toFixed(1)) : 0;

      weeklyTrend.push({
        date: d.format('ddd (DD/MM)'),
        rawDate: d.format('YYYY-MM-DD'),
        percentage: rate,
        present: pres,
        absent: abs,
        onDuty: od,
        total: tot
      });
    }

    // Department-wise Attendance
    const allDepartments = await Department.find({ isActive: true });
    const departmentWise = [];

    for (const dept of allDepartments) {
      const classes = await Class.find({ department: dept._id }).select('_id');
      const classIds = classes.map((c) => c._id);
      const studentCount = await Student.countDocuments({ department: dept._id, isActive: true });

      const deptRecords = await Attendance.find({ class: { $in: classIds } });
      const pres = deptRecords.filter((r) => r.status === 'Present').length;
      const od = deptRecords.filter((r) => r.status === 'On Duty').length;
      const tot = deptRecords.length;
      const rate = tot > 0 ? Number((((pres + od) / tot) * 100).toFixed(1)) : 0;

      departmentWise.push({
        departmentId: dept._id,
        name: dept.name,
        code: dept.code,
        studentCount,
        percentage: rate,
        totalRecords: tot
      });
    }

    // Overall Status Breakdown for Pie Chart
    const totalAllRecords = await Attendance.countDocuments();
    const presentAll = await Attendance.countDocuments({ status: 'Present' });
    const absentAll = await Attendance.countDocuments({ status: 'Absent' });
    const onDutyAll = await Attendance.countDocuments({ status: 'On Duty' });

    const statusPie = [
      { name: 'Present', value: presentAll, color: '#10b981' },
      { name: 'Absent', value: absentAll, color: '#ef4444' },
      { name: 'On Duty', value: onDutyAll, color: '#3b82f6' }
    ];

    // Students with Attendance Below Threshold (e.g. 75%)
    // Aggregate by student
    const studentAggregates = await Attendance.aggregate([
      {
        $group: {
          _id: '$student',
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
          onDuty: { $sum: { $cond: [{ $eq: ['$status', 'On Duty'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } }
        }
      },
      {
        $project: {
          studentId: '$_id',
          total: 1,
          present: 1,
          onDuty: 1,
          absent: 1,
          percentage: {
            $round: [
              {
                $multiply: [
                  { $divide: [{ $add: ['$present', '$onDuty'] }, '$total'] },
                  100
                ]
              },
              2
            ]
          }
        }
      },
      { $match: { percentage: { $lt: setting.minimumAttendancePercentage } } },
      { $sort: { percentage: 1 } },
      { $limit: 10 }
    ]);

    const lowAttendanceStudents = await Student.populate(studentAggregates, {
      path: 'studentId',
      select: 'registerNumber fullName email department class',
      populate: [
        { path: 'department', select: 'code name' },
        { path: 'class', select: 'name semester section' }
      ]
    });

    const totalStudentsBelowThreshold = await Attendance.aggregate([
      {
        $group: {
          _id: '$student',
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
          onDuty: { $sum: { $cond: [{ $eq: ['$status', 'On Duty'] }, 1, 0] } }
        }
      },
      {
        $project: {
          percentage: {
            $multiply: [
              { $divide: [{ $add: ['$present', '$onDuty'] }, '$total'] },
              100
            ]
          }
        }
      },
      { $match: { percentage: { $lt: setting.minimumAttendancePercentage } } },
      { $count: 'lowCount' }
    ]);

    const countBelowThreshold = totalStudentsBelowThreshold[0] ? totalStudentsBelowThreshold[0].lowCount : 0;

    // Recent Attendance Activity (Sessions marked)
    const recentActivity = await Attendance.aggregate([
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
          onDuty: { $sum: { $cond: [{ $eq: ['$status', 'On Duty'] }, 1, 0] } },
          lastUpdated: { $max: '$updatedAt' }
        }
      },
      { $sort: { lastUpdated: -1 } },
      { $limit: 8 },
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
          onDuty: 1,
          lastUpdated: 1
        }
      }
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        totalTeachers,
        totalDepartments,
        totalClasses,
        todayPercentage,
        todayPresent,
        todayAbsent,
        todayOnDuty,
        todayTotal,
        studentsBelowThreshold: countBelowThreshold,
        thresholdConfig: {
          minimum: setting.minimumAttendancePercentage,
          critical: setting.criticalAttendancePercentage
        }
      },
      charts: {
        weeklyTrend,
        departmentWise,
        statusPie
      },
      lowAttendanceStudents,
      recentActivity
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Teacher Dashboard Analytics
// @route   GET /api/dashboard/teacher
// @access  Teacher
const getTeacherDashboard = async (req, res, next) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user._id })
      .populate('assignedSubjects', 'name code semester type totalScheduledClasses')
      .populate('assignedClasses', 'name semester section academicYear');

    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher profile not found' });
    }

    const assignedSubjectIds = teacher.assignedSubjects.map((s) => s._id);
    const assignedClassIds = teacher.assignedClasses.map((c) => c._id);

    // Today's attendance marking status
    const todayStart = dayjs().startOf('day').toDate();
    const todayEnd = dayjs().endOf('day').toDate();

    const todayMarked = await Attendance.aggregate([
      {
        $match: {
          teacher: teacher._id,
          date: { $gte: todayStart, $lte: todayEnd }
        }
      },
      {
        $group: {
          _id: { subject: '$subject', class: '$class' },
          count: { $sum: 1 }
        }
      }
    ]);

    const markedMap = new Set(
      todayMarked.map((m) => `${m._id.subject.toString()}-${m._id.class.toString()}`)
    );

    const subjectStatusList = [];
    teacher.assignedSubjects.forEach((sub) => {
      // Find classes for this subject
      teacher.assignedClasses.forEach((cls) => {
        const key = `${sub._id.toString()}-${cls._id.toString()}`;
        subjectStatusList.push({
          subjectId: sub._id,
          subjectName: sub.name,
          subjectCode: sub.code,
          classId: cls._id,
          className: cls.name,
          isMarkedToday: markedMap.has(key)
        });
      });
    });

    // Total students taught
    const totalStudents = await Student.countDocuments({
      class: { $in: assignedClassIds },
      isActive: true
    });

    // Overall teacher attendance rate across taught subjects
    const teacherRecords = await Attendance.find({ teacher: teacher._id });
    const metrics = calculateAttendance(teacherRecords);

    // Students with low attendance in this teacher's subjects
    const setting = (await Setting.findOne()) || { minimumAttendancePercentage: 75 };
    const lowAttendanceAgg = await Attendance.aggregate([
      { $match: { teacher: teacher._id } },
      {
        $group: {
          _id: { student: '$student', subject: '$subject' },
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
          onDuty: { $sum: { $cond: [{ $eq: ['$status', 'On Duty'] }, 1, 0] } }
        }
      },
      {
        $project: {
          student: '$_id.student',
          subject: '$_id.subject',
          percentage: {
            $round: [
              {
                $multiply: [
                  { $divide: [{ $add: ['$present', '$onDuty'] }, '$total'] },
                  100
                ]
              },
              2
            ]
          },
          total: 1
        }
      },
      { $match: { percentage: { $lt: setting.minimumAttendancePercentage } } },
      { $sort: { percentage: 1 } },
      { $limit: 10 }
    ]);

    const lowStudents = await Student.populate(lowAttendanceAgg, {
      path: 'student',
      select: 'registerNumber fullName email class',
      populate: { path: 'class', select: 'name semester section' }
    });
    const lowStudentsWithSubject = await Subject.populate(lowStudents, {
      path: 'subject',
      select: 'name code'
    });

    // Recent sessions marked by this teacher
    const recentSessions = await Attendance.aggregate([
      { $match: { teacher: teacher._id } },
      {
        $group: {
          _id: { date: '$date', subject: '$subject', class: '$class' },
          totalMarked: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
          onDuty: { $sum: { $cond: [{ $eq: ['$status', 'On Duty'] }, 1, 0] } },
          lastUpdated: { $max: '$updatedAt' }
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
          onDuty: 1,
          lastUpdated: 1
        }
      }
    ]);

    return res.status(200).json({
      success: true,
      teacher: {
        id: teacher._id,
        fullName: teacher.fullName,
        teacherId: teacher.teacherId,
        designation: teacher.designation
      },
      stats: {
        assignedClassesCount: teacher.assignedClasses.length,
        assignedSubjectsCount: teacher.assignedSubjects.length,
        totalStudentsTaught: totalStudents,
        overallTaughtRate: metrics.percentage,
        totalClassesConducted: recentSessions.length
      },
      assignedClasses: teacher.assignedClasses,
      assignedSubjects: teacher.assignedSubjects,
      todaySchedule: subjectStatusList,
      recentSessions,
      lowAttendanceStudents: lowStudentsWithSubject
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Student Dashboard Analytics
// @route   GET /api/dashboard/student
// @access  Student
const getStudentDashboard = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user._id })
      .populate('department', 'name code')
      .populate('class', 'name semester section academicYear');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const setting = (await Setting.findOne()) || {
      minimumAttendancePercentage: 75,
      criticalAttendancePercentage: 65
    };

    // Get all attendance records for this student
    const allRecords = await Attendance.find({ student: student._id })
      .populate('subject', 'name code semester type')
      .populate('teacher', 'fullName')
      .sort({ date: -1 });

    const overallMetrics = calculateAttendance(
      allRecords,
      setting.minimumAttendancePercentage,
      setting.criticalAttendancePercentage
    );

    // Subject-wise attendance calculation
    const subjectMap = {};
    allRecords.forEach((r) => {
      if (!r.subject) return;
      const subId = r.subject._id.toString();
      if (!subjectMap[subId]) {
        subjectMap[subId] = {
          subjectId: r.subject._id,
          name: r.subject.name,
          code: r.subject.code,
          type: r.subject.type,
          records: []
        };
      }
      subjectMap[subId].records.push(r);
    });

    const subjectCards = Object.values(subjectMap).map((sub) => {
      const stats = calculateAttendance(
        sub.records,
        setting.minimumAttendancePercentage,
        setting.criticalAttendancePercentage
      );

      // Color coding: Green >= 85%, Yellow 75-84%, Red < 75%
      let color = 'red';
      if (stats.percentage !== null) {
        if (stats.percentage >= 85) color = 'green';
        else if (stats.percentage >= 75) color = 'yellow';
        else color = 'red';
      }

      return {
        subjectId: sub.subjectId,
        subjectName: sub.name,
        subjectCode: sub.code,
        subjectType: sub.type,
        totalClasses: stats.total,
        attendedClasses: stats.attended,
        presentCount: stats.present,
        absentCount: stats.absent,
        onDutyCount: stats.onDuty,
        percentage: stats.percentage,
        status: stats.status,
        color
      };
    });

    // Monthly attendance breakdown for the current semester/year
    const monthlySummary = {};
    allRecords.forEach((r) => {
      const monthKey = dayjs(r.date).format('MMMM YYYY');
      if (!monthlySummary[monthKey]) {
        monthlySummary[monthKey] = {
          month: monthKey,
          total: 0,
          present: 0,
          absent: 0,
          onDuty: 0
        };
      }
      monthlySummary[monthKey].total++;
      if (r.status === 'Present') monthlySummary[monthKey].present++;
      else if (r.status === 'Absent') monthlySummary[monthKey].absent++;
      else if (r.status === 'On Duty') monthlySummary[monthKey].onDuty++;
    });

    const monthlyBreakdown = Object.values(monthlySummary).map((m) => ({
      ...m,
      percentage: Number((((m.present + m.onDuty) / m.total) * 100).toFixed(1))
    }));

    // Low Attendance Warnings
    const lowAttendanceWarnings = subjectCards.filter(
      (sub) => sub.percentage !== null && sub.percentage < setting.minimumAttendancePercentage
    );

    return res.status(200).json({
      success: true,
      student: {
        id: student._id,
        fullName: student.fullName,
        registerNumber: student.registerNumber,
        email: student.email,
        course: student.course,
        year: student.year,
        semester: student.semester,
        section: student.section,
        department: student.department,
        class: student.class
      },
      overall: overallMetrics,
      subjects: subjectCards,
      monthlyBreakdown,
      lowAttendanceWarnings,
      recentRecords: allRecords.slice(0, 10),
      thresholds: {
        minimum: setting.minimumAttendancePercentage,
        critical: setting.criticalAttendancePercentage
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAdminDashboard,
  getTeacherDashboard,
  getStudentDashboard
};
