const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required']
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: [true, 'Teacher reference is required']
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class reference is required']
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject reference is required']
    },
    date: {
      type: Date,
      required: [true, 'Attendance date is required']
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'On Duty'],
      required: [true, 'Status is required']
    },
    remarks: {
      type: String,
      default: '',
      trim: true
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Unique compound index: One attendance record per student, subject, and date
attendanceSchema.index({ student: 1, subject: 1, date: 1 }, { unique: true });
// Fast lookup indices
attendanceSchema.index({ class: 1, subject: 1, date: 1 });
attendanceSchema.index({ student: 1, date: 1 });
attendanceSchema.index({ teacher: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);

