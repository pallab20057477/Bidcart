const express = require('express');
const { auth, adminAuth } = require('../middleware/auth');
const notificationService = require('../services/notificationService');

const router = express.Router();

/**
 * Get notifications for current user
 * GET /api/notifications/my
 */
router.get('/my', auth, async (req, res) => {
  try {
    const { limit = 20, category } = req.query;
    const userId = req.user._id;
    const userRole = req.user.role;

    console.log('📋 Fetching notifications for user:', {
      userId: userId.toString(),
      role: userRole,
      limit
    });

    const Notification = require('../models/Notification');

    // Debug: Check all notifications in database
    const allNotifications = await Notification.find({}).limit(5);
    console.log('📋 Sample notifications in DB:', allNotifications.map(n => ({
      id: n.notificationId,
      recipients: n.recipients,
      user: n.user
    })));

    let notifications = await Notification.getForUser(userId, { limit: parseInt(limit) });

    console.log('📋 Found user notifications:', notifications.length);

    // Filter by category if specified
    if (category) {
      notifications = notifications.filter(n => n.category === category);
    }

    const unreadCount = await Notification.getUnreadCountForUser(userId);

    res.json({
      success: true,
      notifications,
      unreadCount,
      total: notifications.length
    });
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
});

/**
 * Get recent notifications for admin
 * GET /api/notifications
 */
router.get('/', async (req, res) => {
  try {
    const { limit = 20, category } = req.query;

    console.log('📋 Fetching notifications - limit:', limit, 'category:', category);

    let notifications = await notificationService.getRecentNotifications(parseInt(limit));

    console.log('📋 Found notifications:', notifications.length);
    console.log('📋 Sample notification:', notifications[0] ? {
      id: notifications[0].notificationId,
      type: notifications[0].type,
      title: notifications[0].title,
      timestamp: notifications[0].createdAt
    } : 'None');

    // Filter by category if specified
    if (category) {
      notifications = notifications.filter(n => n.category === category);
      console.log('📋 After category filter:', notifications.length);
    }

    const unreadCount = await notificationService.getUnreadCount();

    const response = {
      success: true,
      notifications,
      unreadCount,
      total: notifications.length
    };

    console.log('📋 Sending response:', {
      success: response.success,
      notificationCount: response.notifications.length,
      unreadCount: response.unreadCount,
      total: response.total
    });

    res.json(response);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
});

/**
 * Delete a single notification
 * DELETE /api/notifications/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Deleting notification:', id);

    const Notification = require('../models/Notification');
    const result = await Notification.findOneAndDelete({
      $or: [
        { notificationId: id },
        { _id: id }
      ]
    });

    if (result) {
      console.log('✅ Notification deleted successfully');
      res.json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
});

/**
 * Delete all notifications
 * DELETE /api/notifications
 */
router.delete('/', async (req, res) => {
  try {
    console.log('🗑️ Deleting all notifications...');

    const Notification = require('../models/Notification');
    const result = await Notification.deleteMany({});

    console.log('✅ Deleted notifications:', result.deletedCount);

    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} notifications`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notifications'
    });
  }
});

/**
 * Delete multiple notifications
 * POST /api/notifications/delete-multiple
 */
router.post('/delete-multiple', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of notification IDs'
      });
    }

    console.log('🗑️ Deleting multiple notifications:', ids.length);

    const Notification = require('../models/Notification');
    const result = await Notification.deleteMany({
      $or: [
        { notificationId: { $in: ids } },
        { _id: { $in: ids } }
      ]
    });

    console.log('✅ Deleted notifications:', result.deletedCount);

    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} notifications`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting multiple notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notifications'
    });
  }
});

/**
 * Mark all notifications as read for current user
 * PUT /api/notifications/mark-all-read
 */
router.put('/mark-all-read', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    console.log('📝 Marking all notifications as read for user:', userId);

    const Notification = require('../models/Notification');

    // Update all unread notifications for this user
    const result = await Notification.updateMany(
      {
        $or: [
          { 'recipients.userId': userId },
          { user: userId }
        ],
        $or: [
          { read: false },
          { read: { $exists: false } }
        ]
      },
      {
        $set: {
          read: true,
          readAt: new Date()
        }
      }
    );

    console.log('✅ Marked notifications as read:', result.modifiedCount);

    res.json({
      success: true,
      message: `Marked ${result.modifiedCount} notifications as read`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read'
    });
  }
});

/**
 * Mark notification as read
 * PUT /api/notifications/:id/read
 */
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    notificationService.markAsRead(id);

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
});

/**
 * Get notification statistics
 * GET /api/notifications/stats
 */
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const notifications = notificationService.getRecentNotifications(100);

    const stats = {
      total: notifications.length,
      unread: notificationService.getUnreadCount(),
      byCategory: {},
      byType: {},
      recent: notifications.slice(0, 5)
    };

    // Count by category and type
    notifications.forEach(n => {
      stats.byCategory[n.category] = (stats.byCategory[n.category] || 0) + 1;
      stats.byType[n.type] = (stats.byType[n.type] || 0) + 1;
    });

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification statistics'
    });
  }
});

/**
 * Test notification (for development)
 * POST /api/notifications/test
 */
router.post('/test', async (req, res) => {
  try {
    console.log('🧪 Creating test notification...');

    const testNotification = await notificationService.notifyPaymentConfirmed({
      orderId: `test_order_${Date.now()}`,
      orderNumber: `ORD-TEST${Date.now()}`,
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      amount: 1500,
      currency: 'INR',
      paymentId: `pay_test_${Date.now()}`,
      paidAt: new Date(),
      products: [
        {
          name: 'Test Product',
          quantity: 2,
          price: 750
        }
      ]
    });

    console.log('🧪 Test notification created:', testNotification.notificationId);

    // Get current count from database
    const totalCount = await notificationService.getRecentNotifications(100);
    console.log('🧪 Total notifications in database:', totalCount.length);

    res.json({
      success: true,
      message: 'Test notification sent',
      notification: testNotification,
      totalNotifications: totalCount.length
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification',
      error: error.message
    });
  }
});

/**
 * Debug endpoint to see raw notifications
 * GET /api/notifications/debug
 */
router.get('/debug', async (req, res) => {
  try {
    const Notification = require('../models/Notification');

    console.log('🔍 Debug endpoint called');

    // Get all notifications
    const allNotifications = await Notification.find({}).sort({ createdAt: -1 }).limit(10);
    console.log('🔍 Total notifications found:', allNotifications.length);

    // Get admin notifications using our method
    const adminNotifications = await Notification.getForAdmin({ limit: 10 });
    console.log('🔍 Admin notifications found:', adminNotifications.length);

    // Get unread count
    const unreadCount = await Notification.getUnreadCount('admin');
    console.log('🔍 Unread count:', unreadCount);

    res.json({
      success: true,
      debug: {
        totalInDatabase: allNotifications.length,
        adminNotifications: adminNotifications.length,
        unreadCount,
        sampleAll: allNotifications.slice(0, 3).map(n => ({
          id: n.notificationId || n._id,
          type: n.type,
          title: n.title,
          message: n.message,
          category: n.category,
          recipients: n.recipients,
          read: n.read,
          createdAt: n.createdAt
        })),
        sampleAdmin: adminNotifications.slice(0, 3).map(n => ({
          id: n.notificationId || n._id,
          type: n.type,
          title: n.title,
          message: n.message,
          category: n.category,
          recipients: n.recipients,
          read: n.read,
          createdAt: n.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;