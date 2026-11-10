const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Class name is required'],
      trim: true
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department reference is required']
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      trim: true
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: 1,
      max: 8
    },
    section: {
      type: String,
      required: [true, 'Section is required'],
      uppercase: true,
      trim: true
    },
    roomNumber: {
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

classSchema.index({ department: 1, semester: 1, section: 1 }, { unique: true });

module.exports = mongoose.model('Class', classSchema);

