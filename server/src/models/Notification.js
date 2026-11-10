const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null // null indicates broadcast to matching role
    },
    role: {
      type: String,
      enum: ['admin', 'teacher', 'student', 'all'],
      default: 'all'
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['info', 'warning', 'alert', 'success'],
      default: 'info'
    },
    isRead: {
      type: Boolean,
      default: false
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ role: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

