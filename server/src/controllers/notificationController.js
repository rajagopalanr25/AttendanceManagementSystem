const Notification = require('../models/Notification');

const getNotifications = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    const userId = req.user._id;

    const query = {
      $or: [
        { recipient: userId },
        { recipient: null, role: { $in: [userRole, 'all'] } }
      ]
    };

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      ...query,
      isRead: false
    });

    return res.status(200).json({
      success: true,
      unreadCount,
      count: notifications.length,
      data: notifications
    });
  } catch (err) {
    next(err);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { isRead: true });
    return res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    next(err);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    await Notification.updateMany(
      {
        $or: [
          { recipient: userId },
          { recipient: null, role: { $in: [userRole, 'all'] } }
        ],
        isRead: false
      },
      { isRead: true }
    );

    return res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};

const createAnnouncement = async (req, res, next) => {
  try {
    const { title, message, role = 'all', type = 'info' } = req.body;

    const notification = await Notification.create({
      title,
      message,
      role,
      type,
      recipient: null
    });

    return res.status(201).json({ success: true, message: 'Announcement dispatched', data: notification });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createAnnouncement
};
