const express = require('express');
const router = express.Router();
const { getAttendanceReports } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/', authorize('admin', 'teacher'), getAttendanceReports);

module.exports = router;

