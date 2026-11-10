const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false
    },
    role: {
      type: String,
      enum: ['admin', 'teacher', 'student'],
      required: true,
      default: 'student'
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    },
    avatar: {
      type: String,
      default: ''
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    lastLogin: Date
  },
  {
    timestamps: true
  }
);

userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
