const express = require('express');
const router = express.Router();
const {
  getTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  assignTeacherSubjectsClasses,
  deleteTeacher
} = require('../controllers/teacherController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { teacherValidator } = require('../validators');
const { validate } = require('../middleware/validationMiddleware');

router.use(protect);

router.get('/', getTeachers);
router.get('/:id', getTeacherById);
router.post('/', authorize('admin'), teacherValidator, validate, createTeacher);
router.put('/:id', authorize('admin'), updateTeacher);
router.put('/:id/assign', authorize('admin'), assignTeacherSubjectsClasses);
router.delete('/:id', authorize('admin'), deleteTeacher);

module.exports = router;

