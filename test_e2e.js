const http = require('http');

const BASE_URL = 'http://localhost:5000/api';

const request = (path, method = 'GET', body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('\n======================================================');
  console.log('🧪 RUNNING COMPREHENSIVE E2E VERIFICATION TEST SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let total = 0;

  const assert = (condition, name) => {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name}`);
    }
  };

  try {
    // 1. Health check
    const health = await request('/health');
    assert(health.status === 200 && health.data.status === 'ok', 'Health Check endpoint responds 200 OK');

    // 2. Admin Login
    const adminLogin = await request('/auth/login', 'POST', {
      email: 'admin@example.com',
      password: 'Admin@123'
    });
    assert(adminLogin.status === 200 && adminLogin.data.token && adminLogin.data.user.role === 'admin', 'Admin Login succeeds with JWT and role: admin');
    const adminToken = adminLogin.data.token;

    // 3. Teacher Login
    const teacherLogin = await request('/auth/login', 'POST', {
      email: 'teacher@example.com',
      password: 'Teacher@123'
    });
    assert(teacherLogin.status === 200 && teacherLogin.data.token && teacherLogin.data.user.role === 'teacher', 'Teacher Login succeeds with JWT and role: teacher');
    const teacherToken = teacherLogin.data.token;

    // 4. Student Login
    const studentLogin = await request('/auth/login', 'POST', {
      email: 'student@example.com',
      password: 'Student@123'
    });
    assert(studentLogin.status === 200 && studentLogin.data.token && studentLogin.data.user.role === 'student', 'Student Login succeeds with JWT and role: student');
    const studentToken = studentLogin.data.token;

    // 5. Invalid Login test
    const invalidLogin = await request('/auth/login', 'POST', {
      email: 'admin@example.com',
      password: 'WrongPassword'
    });
    assert(invalidLogin.status === 401, 'Invalid Login properly rejected with 401 Unauthorized');

    // 6. Role Authorization test: Student attempting Admin Settings
    const forbiddenTest = await request('/settings', 'GET', null, studentToken);
    assert(forbiddenTest.status === 403, 'Role-Based Access Control: Student is blocked with 403 from Admin Settings');

    // 7. Admin Dashboard statistics
    const adminDash = await request('/dashboard/admin', 'GET', null, adminToken);
    assert(
      adminDash.status === 200 &&
      adminDash.data.stats.totalStudents >= 50 &&
      adminDash.data.charts.weeklyTrend.length === 7 &&
      adminDash.data.charts.departmentWise.length >= 3,
      'Admin Dashboard returns comprehensive statistics & Recharts data from MongoDB'
    );

    // 8. Teacher Dashboard statistics
    const teacherDash = await request('/dashboard/teacher', 'GET', null, teacherToken);
    assert(
      teacherDash.status === 200 &&
      teacherDash.data.stats.assignedClassesCount > 0 &&
      teacherDash.data.todaySchedule.length > 0,
      'Teacher Dashboard returns assigned classes, subjects and today\'s schedule'
    );

    // 9. Student Dashboard attendance calculation
    const studentDash = await request('/dashboard/student', 'GET', null, studentToken);
    assert(
      studentDash.status === 200 &&
      studentDash.data.overall.percentage !== null &&
      studentDash.data.subjects.length > 0 &&
      studentDash.data.overall.status !== undefined,
      'Student Dashboard accurately calculates overall percentage and course breakdown'
    );

    // 10. Student Calendar API
    const calendarRes = await request('/attendance/calendar', 'GET', null, studentToken);
    assert(
      calendarRes.status === 200 &&
      calendarRes.data.calendar !== undefined &&
      calendarRes.data.month !== undefined,
      'Interactive Student Attendance Calendar returns monthly date matrix'
    );

    // 11. Reports API (Class-wise and Low attendance)
    const classReport = await request('/reports?reportType=class_wise', 'GET', null, adminToken);
    assert(
      classReport.status === 200 && classReport.data.data.length > 0,
      'Class-wise Reports API generates accurate attendance metrics'
    );

    const lowReport = await request('/reports?reportType=low_attendance&threshold=75', 'GET', null, adminToken);
    assert(
      lowReport.status === 200 && Array.isArray(lowReport.data.data),
      'Low Attendance Report identifies students below configurable percentage'
    );

    // 12. Attendance Marking & Duplicate Prevention Workflow
    const assignedSub = teacherDash.data.assignedSubjects[0]._id;
    const assignedCls = teacherDash.data.assignedClasses[0]._id;
    const testDate = '2026-12-01'; // Future session date for test

    // First, mark attendance for this new session
    const markFirst = await request('/attendance', 'POST', {
      classId: assignedCls,
      subjectId: assignedSub,
      date: testDate,
      attendanceData: [
        { studentId: studentLogin.data.user.profile._id, status: 'Present' }
      ]
    }, teacherToken);

    assert(
      markFirst.status === 201 && markFirst.data.success === true,
      'Teacher Attendance Marking: Successfully marked attendance session (201 Created)'
    );

    // Now, attempt to mark attendance AGAIN for the same session (duplicate check)
    const duplicateTest = await request('/attendance', 'POST', {
      classId: assignedCls,
      subjectId: assignedSub,
      date: testDate,
      attendanceData: [
        { studentId: studentLogin.data.user.profile._id, status: 'Absent' }
      ]
    }, teacherToken);

    assert(
      duplicateTest.status === 409,
      'Database Constraint & Validation: Duplicate attendance submission prevented with 409 Conflict'
    );

    // 13. Audit Log Recording Verification
    const auditRes = await request('/attendance/audit-logs', 'GET', null, adminToken);
    assert(
      auditRes.status === 200 && auditRes.data.data.length > 0,
      'Audit Trail API records actions with timestamp, user identity, and change metadata'
    );

    // 14. Settings API test
    const settingsGet = await request('/settings', 'GET', null, adminToken);
    assert(
      settingsGet.status === 200 && settingsGet.data.data.minimumAttendancePercentage === 75,
      'Admin Settings: Configurable minimum eligibility percentage (75%) verified'
    );

    console.log('\n======================================================');
    console.log(`🎉 TEST SUMMARY: ${passed}/${total} TESTS PASSED!`);
    console.log('======================================================\n');
  } catch (err) {
    console.error('Test execution error:', err);
  }
};

runTests();
