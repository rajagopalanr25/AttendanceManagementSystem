const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AuditLog = require('../models/AuditLog');

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const comparePassword = async (candidatePassword, hashedPassword) => {
  return bcrypt.compare(candidatePassword, hashedPassword);
};

const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'attendance_super_secret_jwt_key_2026';
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    secret,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }
  );
};

/**
 * Calculates attendance metrics according to institution rules:
 * Formula: Attendance Percentage = (Attended Classes / Total Countable Classes) * 100
 * Present and approved On Duty count as attended. Absent counts as not attended.
 */
const calculateAttendance = (records = [], minThreshold = 75, criticalThreshold = 65) => {
  const total = records.length;
  if (total === 0) {
    return {
      total: 0,
      present: 0,
      absent: 0,
      onDuty: 0,
      attended: 0,
      percentage: null,
      status: 'No attendance records'
    };
  }

  let present = 0;
  let absent = 0;
  let onDuty = 0;

  for (const r of records) {
    if (r.status === 'Present') present++;
    else if (r.status === 'On Duty') onDuty++;
    else if (r.status === 'Absent') absent++;
  }

  const attended = present + onDuty;
  const percentage = Number(((attended / total) * 100).toFixed(2));

  let status = 'Eligible';
  if (percentage < criticalThreshold) {
    status = 'Critical shortage';
  } else if (percentage < minThreshold) {
    status = 'Shortage';
  }

  return {
    total,
    present,
    absent,
    onDuty,
    attended,
    percentage,
    status
  };
};

const logAudit = async ({
  action,
  entityType,
  entityId = null,
  performedBy,
  performedByRole,
  performedByName,
  details,
  oldValue = null,
  newValue = null,
  ipAddress = ''
}) => {
  try {
    await AuditLog.create({
      action,
      entityType,
      entityId,
      performedBy,
      performedByRole,
      performedByName,
      details,
      oldValue,
      newValue,
      ipAddress
    });
  } catch (err) {
    console.error('Audit Log recording failed:', err.message);
  }
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  calculateAttendance,
  logAudit
};

