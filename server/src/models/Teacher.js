const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    teacherId: {
      type: String,
      required: [true, 'Teacher ID is required'],
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
    designation: {
      type: String,
      default: 'Assistant Professor'
    },
    assignedSubjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
      }
    ],
    assignedClasses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
      }
    ],
    joiningDate: {
      type: Date,
      default: Date.now
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

teacherSchema.index({ department: 1 });

module.exports = mongoose.model('Teacher', teacherSchema);
