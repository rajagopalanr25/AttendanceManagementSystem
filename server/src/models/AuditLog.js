const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ['CREATE', 'UPDATE', 'DELETE', 'BULK_IMPORT'],
      required: true
    },
    entityType: {
      type: String,
      enum: ['Attendance', 'Student', 'Teacher', 'Subject', 'Class', 'Department', 'Setting'],
      required: true
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    performedByRole: {
      type: String,
      required: true
    },
    performedByName: {
      type: String,
      required: true
    },
    details: {
      type: String,
      required: true
    },
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    ipAddress: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

auditLogSchema.index({ entityType: 1, createdAt: -1 });
auditLogSchema.index({ performedBy: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

