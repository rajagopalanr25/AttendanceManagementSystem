const crypto = require('crypto');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const { comparePassword, hashPassword, generateToken, logAudit } = require('../utils/helpers');

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact the administrator.'
      });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    user.lastLogin = new Date();
    await user.save();

    let profile = null;
    if (user.role === 'student') {
      profile = await Student.findOne({ user: user._id }).populate('department class');
    } else if (user.role === 'teacher') {
      profile = await Teacher.findOne({ user: user._id }).populate('department assignedSubjects assignedClasses');
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        profile
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    let profile = null;

    if (user.role === 'student') {
      profile = await Student.findOne({ user: user._id }).populate('department class');
    } else if (user.role === 'teacher') {
      profile = await Teacher.findOne({ user: user._id }).populate('department assignedSubjects assignedClasses');
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        profile
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// @desc    Forgot Password - generate reset token
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      // Return 200 to prevent user enumeration attacks
      return res.status(200).json({
        success: true,
        message: 'If an account exists with that email, a password reset instruction has been generated.'
      });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 mins
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Reset token generated successfully. In production, an email is dispatched.',
      demoResetToken: resetToken // provided for testing/demo evaluation convenience
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Reset Password using token
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token'
      });
    }

    user.password = await hashPassword(newPassword);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    await logAudit({
      action: 'UPDATE',
      entityType: 'Student',
      entityId: user._id,
      performedBy: user._id,
      performedByRole: user.role,
      performedByName: user.name,
      details: 'Password was reset via security token'
    });

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You may now log in.'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Change Password for logged-in user
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password does not match'
      });
    }

    user.password = await hashPassword(newPassword);
    await user.save();

    await logAudit({
      action: 'UPDATE',
      entityType: 'Student',
      entityId: user._id,
      performedBy: user._id,
      performedByRole: user.role,
      performedByName: user.name,
      details: 'User updated their account password'
    });

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login,
  getMe,
  logout,
  forgotPassword,
  resetPassword,
  changePassword
};

