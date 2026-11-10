const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  getTeacherDashboard,
  getStudentDashboard
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/admin', authorize('admin'), getAdminDashboard);
router.get('/teacher', authorize('teacher'), getTeacherDashboard);
router.get('/student', authorize('student'), getStudentDashboard);

module.exports = router;
