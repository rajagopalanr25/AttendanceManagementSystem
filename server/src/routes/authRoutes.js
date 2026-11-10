const express = require('express');
const router = express.Router();
const {
  login,
  getMe,
  logout,
  forgotPassword,
  resetPassword,
  changePassword
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { loginLimiter } = require('../middleware/rateLimiter');
const {
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator
} = require('../validators');
const { validate } = require('../middleware/validationMiddleware');

router.post('/login', loginLimiter, loginValidator, validate, login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.post('/forgot-password', forgotPasswordValidator, validate, forgotPassword);
router.post('/reset-password', resetPasswordValidator, validate, resetPassword);
router.put('/change-password', protect, changePasswordValidator, validate, changePassword);

module.exports = router;

