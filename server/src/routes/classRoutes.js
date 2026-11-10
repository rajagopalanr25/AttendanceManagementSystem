const express = require('express');
const router = express.Router();
const {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass
} = require('../controllers/classController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { classValidator } = require('../validators');
const { validate } = require('../middleware/validationMiddleware');

router.use(protect);

router.get('/', getClasses);
router.get('/:id', getClassById);
router.post('/', authorize('admin'), classValidator, validate, createClass);
router.put('/:id', authorize('admin'), updateClass);
router.delete('/:id', authorize('admin'), deleteClass);

module.exports = router;
