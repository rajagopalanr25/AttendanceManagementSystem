const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    institutionName: {
      type: String,
      default: 'College of Engineering & Technology'
    },
    academicYear: {
      type: String,
      default: '2026-2027'
    },
    minimumAttendancePercentage: {
      type: Number,
      default: 75,
      min: 0,
      max: 100
    },
    criticalAttendancePercentage: {
      type: Number,
      default: 65,
      min: 0,
      max: 100
    },
    allowTeacherEditDays: {
      type: Number,
      default: 7
    },
    enableShortageAlerts: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Setting', settingSchema);

