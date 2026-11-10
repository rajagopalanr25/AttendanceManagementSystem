const Setting = require('../models/Setting');
const { logAudit } = require('../utils/helpers');

const getSettings = async (req, res, next) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = await Setting.create({
        institutionName: 'Apex Institute of Technology',
        academicYear: '2026-2027',
        minimumAttendancePercentage: 75,
        criticalAttendancePercentage: 65,
        allowTeacherEditDays: 7,
        enableShortageAlerts: true
      });
    }
    return res.status(200).json({ success: true, data: setting });
  } catch (err) {
    next(err);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = await Setting.create(req.body);
    } else {
      const oldVal = setting.toObject();
      setting = await Setting.findByIdAndUpdate(setting._id, req.body, { new: true });
      await logAudit({
        action: 'UPDATE',
        entityType: 'Setting',
        entityId: setting._id,
        performedBy: req.user._id,
        performedByRole: req.user.role,
        performedByName: req.user.name,
        details: 'Updated institutional settings',
        oldValue: oldVal,
        newValue: setting
      });
    }

    return res.status(200).json({ success: true, message: 'Settings updated successfully', data: setting });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSettings, updateSettings };
