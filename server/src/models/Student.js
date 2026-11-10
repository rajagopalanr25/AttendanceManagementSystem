const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    registerNumber: {
      type: String,
      required: [true, 'Register number is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    phoneNumber: {
      type: String,
      default: ''
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required']
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class is required']
    },
    course: {
      type: String,
      default: 'B.Tech'
    },
    year: {
      type: Number,
      required: true,
      min: 1,
      max: 4
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8
    },
    section: {
      type: String,
      required: true,
      uppercase: true
    },
    dateOfBirth: {
      type: Date
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      default: 'Male'
    },
    admissionYear: {
      type: Number,
      default: () => new Date().getFullYear()
    },
    profilePicture: {
      type: String,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

studentSchema.index({ department: 1, year: 1, semester: 1, section: 1 });
studentSchema.index({ class: 1 });

module.exports = mongoose.model('Student', studentSchema);
