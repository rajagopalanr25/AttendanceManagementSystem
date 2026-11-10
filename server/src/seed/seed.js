require('dotenv').config();
const mongoose = require('mongoose');
const dayjs = require('dayjs');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Department = require('../models/Department');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Setting = require('../models/Setting');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { hashPassword } = require('../utils/helpers');

const seedData = async () => {
  try {
    console.log('Seeding Database with institutional dataset...');

    // Clear existing collections
    await Promise.all([
      User.deleteMany(),
      Department.deleteMany(),
      Class.deleteMany(),
      Subject.deleteMany(),
      Teacher.deleteMany(),
      Student.deleteMany(),
      Attendance.deleteMany(),
      Setting.deleteMany(),
      Notification.deleteMany(),
      AuditLog.deleteMany()
    ]);

    // 1. Create Default Settings
    const setting = await Setting.create({
      institutionName: 'Apex Institute of Technology & Science',
      academicYear: '2026-2027',
      minimumAttendancePercentage: 75,
      criticalAttendancePercentage: 65,
      allowTeacherEditDays: 7,
      enableShortageAlerts: true
    });
    console.log('Institutional settings initialized.');

    // 2. Create Admin User
    const adminPassword = await hashPassword('Admin@123');
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin',
      status: 'active'
    });
    console.log('Admin account created: admin@example.com / Admin@123');

    // 3. Create 3 Departments
    const departmentsData = [
      { name: 'Computer Science & Engineering', code: 'CSE', description: 'Department of Computer Science and Computing Systems', headOfDepartment: 'Dr. Alan Turing' },
      { name: 'Electronics & Communication', code: 'ECE', description: 'Department of Electronics and Signal Systems', headOfDepartment: 'Dr. Claude Shannon' },
      { name: 'Information Technology', code: 'IT', description: 'Department of Information Technology & Cloud', headOfDepartment: 'Dr. Grace Hopper' }
    ];
    const departments = await Department.insertMany(departmentsData);
    const cseDept = departments[0];
    const eceDept = departments[1];
    const itDept = departments[2];
    console.log('3 Departments created.');

    // 4. Create 5 Classes
    const classesData = [
      { name: 'CSE - 4th Sem (Sec A)', department: cseDept._id, academicYear: '2026-2027', semester: 4, section: 'A', roomNumber: 'CS-101' },
      { name: 'CSE - 4th Sem (Sec B)', department: cseDept._id, academicYear: '2026-2027', semester: 4, section: 'B', roomNumber: 'CS-102' },
      { name: 'ECE - 4th Sem (Sec A)', department: eceDept._id, academicYear: '2026-2027', semester: 4, section: 'A', roomNumber: 'EC-201' },
      { name: 'IT - 4th Sem (Sec A)', department: itDept._id, academicYear: '2026-2027', semester: 4, section: 'A', roomNumber: 'IT-301' },
      { name: 'CSE - 6th Sem (Sec A)', department: cseDept._id, academicYear: '2026-2027', semester: 6, section: 'A', roomNumber: 'CS-304' }
    ];
    const classes = await Class.insertMany(classesData);
    const cseA = classes[0];
    const cseB = classes[1];
    const eceA = classes[2];
    const itA = classes[3];
    const cse6A = classes[4];
    console.log('5 Classes created.');

    // 5. Create 5 Teachers & Users
    const teacherPassword = await hashPassword('Teacher@123');
    const teacherProfilesData = [
      { name: 'Prof. Marcus Vance', email: 'teacher@example.com', teacherId: 'TCH-101', dept: cseDept._id, desig: 'Professor & Lead' },
      { name: 'Dr. Elena Rostova', email: 'teacher2@example.com', teacherId: 'TCH-102', dept: cseDept._id, desig: 'Associate Professor' },
      { name: 'Prof. David Chen', email: 'teacher3@example.com', teacherId: 'TCH-103', dept: eceDept._id, desig: 'Assistant Professor' },
      { name: 'Dr. Sarah Jenkins', email: 'teacher4@example.com', teacherId: 'TCH-104', dept: itDept._id, desig: 'Assistant Professor' },
      { name: 'Prof. Rajesh Sharma', email: 'teacher5@example.com', teacherId: 'TCH-105', dept: cseDept._id, desig: 'Senior Lecturer' }
    ];

    const teachers = [];
    for (const tp of teacherProfilesData) {
      const user = await User.create({
        name: tp.name,
        email: tp.email,
        password: teacherPassword,
        role: 'teacher',
        status: 'active'
      });

      const teacher = await Teacher.create({
        user: user._id,
        teacherId: tp.teacherId,
        fullName: tp.name,
        email: tp.email,
        phoneNumber: '+1-555-01' + Math.floor(10 + Math.random() * 89),
        department: tp.dept,
        designation: tp.desig,
        assignedSubjects: [],
        assignedClasses: []
      });
      teachers.push(teacher);
    }
    console.log('5 Teachers created. Primary demo: teacher@example.com / Teacher@123');

    // 6. Create 10 Subjects and link to Teachers & Classes
    const subjectsData = [
      { name: 'Database Management Systems', code: 'CS401', department: cseDept._id, semester: 4, type: 'Theory', teacher: teachers[0]._id, classes: [cseA._id, cseB._id] },
      { name: 'Operating Systems', code: 'CS402', department: cseDept._id, semester: 4, type: 'Theory', teacher: teachers[1]._id, classes: [cseA._id, cseB._id] },
      { name: 'Computer Networks', code: 'CS403', department: cseDept._id, semester: 4, type: 'Theory', teacher: teachers[0]._id, classes: [cseA._id] },
      { name: 'Design and Analysis of Algorithms', code: 'CS404', department: cseDept._id, semester: 4, type: 'Theory', teacher: teachers[4]._id, classes: [cseA._id, cseB._id] },
      { name: 'DBMS & Query Lab', code: 'CS405L', department: cseDept._id, semester: 4, type: 'Practical', teacher: teachers[0]._id, classes: [cseA._id] },
      { name: 'Digital Signal Processing', code: 'EC401', department: eceDept._id, semester: 4, type: 'Theory', teacher: teachers[2]._id, classes: [eceA._id] },
      { name: 'Microprocessors & Interfacing', code: 'EC402', department: eceDept._id, semester: 4, type: 'Theory', teacher: teachers[2]._id, classes: [eceA._id] },
      { name: 'Web Technology & Frameworks', code: 'IT401', department: itDept._id, semester: 4, type: 'Theory', teacher: teachers[3]._id, classes: [itA._id] },
      { name: 'Cloud Infrastructure & DevOps', code: 'IT402', department: itDept._id, semester: 4, type: 'Theory', teacher: teachers[3]._id, classes: [itA._id] },
      { name: 'Artificial Intelligence & Machine Learning', code: 'CS601', department: cseDept._id, semester: 6, type: 'Theory', teacher: teachers[1]._id, classes: [cse6A._id] }
    ];

    const subjects = await Subject.insertMany(subjectsData);
    console.log('10 Subjects created and assigned.');

    // Update teacher assignedSubjects and assignedClasses
    for (const sub of subjects) {
      if (sub.teacher) {
        await Teacher.findByIdAndUpdate(sub.teacher, {
          $addToSet: {
            assignedSubjects: sub._id,
            assignedClasses: { $each: sub.classes }
          }
        });
      }
    }

    // 7. Create 50 Students distributed across classes
    const studentPassword = await hashPassword('Student@123');
    const firstNames = ['Liam', 'Olivia', 'Noah', 'Emma', 'Oliver', 'Ava', 'Elijah', 'Charlotte', 'William', 'Sophia', 'James', 'Amelia', 'Benjamin', 'Isabella', 'Lucas', 'Mia', 'Henry', 'Evelyn', 'Alexander', 'Harper', 'Sebastian', 'Camila', 'Jack', 'Gianna', 'Owen', 'Abigail', 'Samuel', 'Luna', 'Matthew', 'Ella', 'Joseph', 'Elizabeth', 'Levi', 'Sofia', 'David', 'Emily', 'John', 'Avery', 'Wyatt', 'Mila', 'Carter', 'Arya', 'Julian', 'Chloe', 'Luke', 'Layla', 'Grayson', 'Penelope', 'Isaac', 'Riley'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'];

    const students = [];
    for (let i = 0; i < 50; i++) {
      const isFirst = i === 0;
      const email = isFirst ? 'student@example.com' : `student${i + 1}@example.com`;
      const regNo = `2024CS${String(1001 + i).padStart(4, '0')}`;
      const fullName = `${firstNames[i]} ${lastNames[i]}`;
      const gender = i % 2 === 0 ? 'Male' : 'Female';

      // Assign to classes: first 20 to CSE-A (Sem 4), next 15 to CSE-B (Sem 4), next 5 to ECE-A, next 5 to IT-A, last 5 to CSE-6A
      let assignedClass = cseA;
      let assignedDept = cseDept;
      let sem = 4;
      let sec = 'A';

      if (i >= 20 && i < 35) {
        assignedClass = cseB;
        assignedDept = cseDept;
        sem = 4;
        sec = 'B';
      } else if (i >= 35 && i < 40) {
        assignedClass = eceA;
        assignedDept = eceDept;
        sem = 4;
        sec = 'A';
      } else if (i >= 40 && i < 45) {
        assignedClass = itA;
        assignedDept = itDept;
        sem = 4;
        sec = 'A';
      } else if (i >= 45) {
        assignedClass = cse6A;
        assignedDept = cseDept;
        sem = 6;
        sec = 'A';
      }

      const user = await User.create({
        name: fullName,
        email,
        password: studentPassword,
        role: 'student',
        status: 'active'
      });

      const student = await Student.create({
        user: user._id,
        registerNumber: regNo,
        fullName,
        email,
        phoneNumber: '+1-555-02' + Math.floor(10 + Math.random() * 89),
        department: assignedDept._id,
        class: assignedClass._id,
        course: 'B.Tech',
        year: sem === 6 ? 3 : 2,
        semester: sem,
        section: sec,
        gender,
        admissionYear: 2024,
        dateOfBirth: new Date(2004, (i % 12), (i % 25) + 1)
      });
      students.push(student);
    }
    console.log('50 Students created. Primary demo: student@example.com / Student@123');

    // 8. Generate at least 30 Days of realistic attendance
    console.log('Generating 30 days of historical attendance sessions...');
    const attendanceRecords = [];

    // Filter students belonging to CSE-A (first 20 students)
    const cseAStudents = students.filter((s) => s.class.toString() === cseA._id.toString());
    const cseBStudents = students.filter((s) => s.class.toString() === cseB._id.toString());

    // CSE-A subjects: DBMS (sub 0), OS (sub 1), Networks (sub 2), DAA (sub 3), Lab (sub 4)
    const cseASubjects = [subjects[0], subjects[1], subjects[2], subjects[3], subjects[4]];

    // Create 30 days history (excluding Sundays)
    let daysCount = 0;
    let dayOffset = 0;

    while (daysCount < 30) {
      const d = dayjs().subtract(dayOffset, 'day');
      dayOffset++;

      // Skip Sunday (0)
      if (d.day() === 0) continue;

      const sessionDate = d.startOf('day').toDate();
      daysCount++;

      // For each day, conduct 2-3 subject classes for CSE-A
      const dailySubjects = daysCount % 2 === 0
        ? [cseASubjects[0], cseASubjects[1], cseASubjects[2]]
        : [cseASubjects[0], cseASubjects[3], cseASubjects[4]];

      for (const sub of dailySubjects) {
        for (const st of cseAStudents) {
          // Determine attendance status:
          // Student 0 (student@example.com) has a high 88% attendance
          // A few students have shortage for realistic dashboard testing
          let status = 'Present';
          const rand = Math.random();

          if (st.email === 'student@example.com') {
            if (rand < 0.12) status = 'Absent';
            else if (rand < 0.18) status = 'On Duty';
          } else if (st.registerNumber === '2024CS1003' || st.registerNumber === '2024CS1007') {
            // Low attendance students below 75% for dashboard alert testing
            if (rand < 0.45) status = 'Absent';
            else if (rand < 0.52) status = 'On Duty';
          } else {
            if (rand < 0.15) status = 'Absent';
            else if (rand < 0.22) status = 'On Duty';
          }

          attendanceRecords.push({
            student: st._id,
            teacher: sub.teacher,
            class: cseA._id,
            subject: sub._id,
            date: sessionDate,
            status,
            remarks: status === 'On Duty' ? 'College Tech Fest / Lab Duty' : '',
            markedBy: admin._id,
            createdAt: sessionDate,
            updatedAt: sessionDate
          });
        }
      }

      // Also mark attendance for CSE-B for at least 15 days
      if (daysCount <= 15) {
        const sub = subjects[0]; // DBMS
        for (const st of cseBStudents) {
          const rand = Math.random();
          let status = 'Present';
          if (rand < 0.16) status = 'Absent';
          else if (rand < 0.22) status = 'On Duty';

          attendanceRecords.push({
            student: st._id,
            teacher: sub.teacher,
            class: cseB._id,
            subject: sub._id,
            date: sessionDate,
            status,
            remarks: status === 'On Duty' ? 'Sports Event' : '',
            markedBy: admin._id,
            createdAt: sessionDate,
            updatedAt: sessionDate
          });
        }
      }
    }

    await Attendance.insertMany(attendanceRecords);
    console.log(`Generated ${attendanceRecords.length} attendance records across 30 days.`);

    // 9. Create Seed Notifications
    await Notification.insertMany([
      {
        title: 'Welcome to the Attendance Management Portal',
        message: 'The new semester attendance tracking system is now active. Daily attendance must be marked before 5:00 PM.',
        role: 'all',
        type: 'info'
      },
      {
        title: 'Faculty Notice: Mid-Term Attendance Audit',
        message: 'All faculty members are requested to review and verify class logs for the previous 30 days.',
        role: 'teacher',
        type: 'info'
      },
      {
        title: 'Attendance Policy Reminder',
        message: 'Minimum 75% attendance is required to appear for semester end examinations.',
        role: 'student',
        type: 'warning'
      }
    ]);
    console.log('Seed notifications created.');

    // 10. Create initial Audit Log
    await AuditLog.create({
      action: 'BULK_IMPORT',
      entityType: 'Attendance',
      performedBy: admin._id,
      performedByRole: 'admin',
      performedByName: admin.name,
      details: `Initialized database with institutional seed dataset (${attendanceRecords.length} historical attendance entries, 50 students, 5 teachers, 10 subjects).`
    });

    console.log('\n=========================================');
    console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
    console.log('=========================================');
    console.log('Demo Credentials:');
    console.log('Admin:   admin@example.com   / Admin@123');
    console.log('Teacher: teacher@example.com / Teacher@123');
    console.log('Student: student@example.com / Student@123');
    console.log('=========================================\n');
  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
};

// If run directly via node seed.js
if (require.main === module) {
  connectDB().then(async () => {
    await seedData();
    process.exit(0);
  });
}

module.exports = seedData;

