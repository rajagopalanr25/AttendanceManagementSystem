const { body, query, param } = require('express-validator');

const loginValidator = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
];

const forgotPasswordValidator = [
  body('email').isEmail().withMessage('Please provide a valid email')
];

const resetPasswordValidator = [
  body('token').notEmpty().withMessage('Token is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
];

const studentValidator = [
  body('registerNumber').trim().notEmpty().withMessage('Register number is required'),
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('class').notEmpty().withMessage('Class is required'),
  body('year').isInt({ min: 1, max: 4 }).withMessage('Year must be between 1 and 4'),
  body('semester').isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1 and 8'),
  body('section').trim().notEmpty().withMessage('Section is required')
];

const teacherValidator = [
  body('teacherId').trim().notEmpty().withMessage('Teacher ID is required'),
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('department').notEmpty().withMessage('Department is required')
];

const classValidator = [
  body('name').trim().notEmpty().withMessage('Class name is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('academicYear').trim().notEmpty().withMessage('Academic year is required'),
  body('semester').isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1 and 8'),
  body('section').trim().notEmpty().withMessage('Section is required')
];

const subjectValidator = [
  body('name').trim().notEmpty().withMessage('Subject name is required'),
  body('code').trim().notEmpty().withMessage('Subject code is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('semester').isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1 and 8')
];

const attendanceMarkValidator = [
  body('classId').notEmpty().withMessage('Class ID is required'),
  body('subjectId').notEmpty().withMessage('Subject ID is required'),
  body('date').isISO8601().withMessage('Valid attendance date is required'),
  body('attendanceData')
    .isArray({ min: 1 })
    .withMessage('Attendance data array is required')
];

module.exports = {
  loginValidator,
  changePasswordValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  studentValidator,
  teacherValidator,
  classValidator,
  subjectValidator,
  attendanceMarkValidator
};

