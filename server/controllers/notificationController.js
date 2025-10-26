const Notification = require('../models/Notification');

const getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    const io = req.app.get('io');
    if (io) {
      io.to(req.user._id.toString()).emit('notification:update', { type: 'read', notificationId: req.params.id });
    }
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true }
    );
    const io = req.app.get('io');
    if (io) {
      io.to(req.user._id.toString()).emit('notification:update', { type: 'readAll' });
    }
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    const io = req.app.get('io');
    if (io) {
      io.to(req.user._id.toString()).emit('notification:update', { type: 'deleted', notificationId: req.params.id });
    }
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user._id });
    const io = req.app.get('io');
    if (io) {
      io.to(req.user._id.toString()).emit('notification:update', { type: 'deletedAll' });
    }
    res.json({ message: 'All notifications deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteReadNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({ 
      user: req.user._id, 
      read: true 
    });
    const io = req.app.get('io');
    if (io) {
      io.to(req.user._id.toString()).emit('notification:update', { type: 'deletedRead' });
    }
    res.json({ 
      message: `${result.deletedCount} read notifications deleted successfully` 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
  deleteReadNotifications,
}; 