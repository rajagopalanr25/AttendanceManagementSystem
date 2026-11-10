const express = require('express');
const router = express.Router();
const {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  bulkImportStudents
} = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { studentValidator } = require('../validators');
const { validate } = require('../middleware/validationMiddleware');

router.use(protect);

router.get('/', getStudents);
router.get('/:id', getStudentById);
router.post('/', authorize('admin'), studentValidator, validate, createStudent);
router.post('/bulk-import', authorize('admin'), bulkImportStudents);
router.put('/:id', authorize('admin'), updateStudent);
router.delete('/:id', authorize('admin'), deleteStudent);

module.exports = router;

