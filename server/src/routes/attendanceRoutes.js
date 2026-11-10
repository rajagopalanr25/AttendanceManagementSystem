const express = require('express');
const router = express.Router();
const {
  markAttendance,
  getAttendanceSession,
  updateAttendanceSession,
  getAttendanceRecords,
  getAttendanceCalendar,
  getAuditLogs
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { attendanceMarkValidator } = require('../validators');
const { validate } = require('../middleware/validationMiddleware');

router.use(protect);

router.post('/', authorize('admin', 'teacher'), attendanceMarkValidator, validate, markAttendance);
router.get('/', getAttendanceRecords);
router.get('/session', authorize('admin', 'teacher'), getAttendanceSession);
router.put('/session', authorize('admin', 'teacher'), updateAttendanceSession);
router.get('/calendar', getAttendanceCalendar);
router.get('/audit-logs', authorize('admin'), getAuditLogs);

module.exports = router;
