const EventEmitter = require('events');
const Notification = require('../models/Notification');

class NotificationService extends EventEmitter {
  constructor() {
    super();
    this.adminConnections = new Set();
    console.log('🔔 NotificationService: Database-backed service initialized');
  }

  /**
   * Add admin connection for real-time updates
   */
  addAdminConnection(connectionId) {
    this.adminConnections.add(connectionId);
    console.log(`Admin connected: ${connectionId}`);
  }

  /**
   * Remove admin connection
   */
  removeAdminConnection(connectionId) {
    this.adminConnections.delete(connectionId);
    console.log(`Admin disconnected: ${connectionId}`);
  }

  /**
   * Send payment confirmation to all admin connections
   */
  async notifyPaymentConfirmed(orderData) {
    try {
      console.log('🔔 NotificationService: Creating payment notification for order:', orderData.orderId);

      const notificationData = {
        notificationId: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'PAYMENT_CONFIRMED',
        title: '💳 Payment Received',
        message: `Payment of ₹${orderData.amount} confirmed for Order #${orderData.orderNumber}`,
        data: {
          orderId: orderData.orderId,
          orderNumber: orderData.orderNumber,
          customerName: orderData.customerName,
          customerEmail: orderData.customerEmail,
          amount: orderData.amount,
          currency: orderData.currency,
          paymentId: orderData.paymentId,
          paidAt: orderData.paidAt,
          products: orderData.products
        },
        priority: 'high',
        category: 'payment',
        read: false,
        actions: [
          {
            label: 'View Order',
            url: `/admin/orders/${orderData.orderId}`,
            type: 'primary'
          },
          {
            label: 'Process Order',
            action: 'process_order',
            type: 'success'
          }
        ],
        recipients: [] // Empty array means broadcast to all admins
      };

      // Save to database
      const notification = new Notification(notificationData);
      await notification.save();

      console.log('🔔 NotificationService: Notification saved to database:', notification.notificationId);

      // Emit to all admin connections
      this.emit('adminNotification', notification);

      console.log('🔔 Payment confirmation sent to admin dashboard');
      return notification;
    } catch (error) {
      console.error('🔔 NotificationService: Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Send order status update
   */
  notifyOrderStatusUpdate(orderData) {
    const notification = {
      id: `status_${Date.now()}`,
      type: 'ORDER_STATUS_UPDATE',
      title: '📦 Order Status Updated',
      message: `Order #${orderData.orderNumber} status changed to ${orderData.status}`,
      data: orderData,
      timestamp: new Date(),
      priority: 'medium',
      category: 'order'
    };

    this.notifications.unshift(notification);
    this.emit('adminNotification', notification);

    return notification;
  }

  /**
   * Get recent notifications
   */
  async getRecentNotifications(limit = 20) {
    try {
      console.log('🔔 NotificationService: Getting recent notifications from database. Limit:', limit);

      const notifications = await Notification.getForAdmin({ limit });

      console.log('🔔 NotificationService: Found notifications in database:', notifications.length);
      return notifications;
    } catch (error) {
      console.error('🔔 NotificationService: Error fetching notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId) {
    try {
      console.log('🔔 NotificationService: Marking notification as read:', notificationId);

      const notification = await Notification.markAsRead(notificationId);

      if (notification) {
        console.log('🔔 NotificationService: Notification marked as read');
        return notification;
      } else {
        console.log('🔔 NotificationService: Notification not found');
        return null;
      }
    } catch (error) {
      console.error('🔔 NotificationService: Error marking notification as read:', error);
      return null;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount() {
    try {
      const count = await Notification.getUnreadCount('admin');
      console.log('🔔 NotificationService: Unread count from database:', count);
      return count;
    } catch (error) {
      console.error('🔔 NotificationService: Error getting unread count:', error);
      return 0;
    }
  }

  // ==================== AUCTION NOTIFICATIONS ====================

  /**
   * Notify when user is outbid
   */
  async notifyOutbid(userId, productName, productId, newBidAmount, previousBidAmount) {
    try {
      const notification = await Notification.create({
        notificationId: `outbid-${productId}-${userId}-${Date.now()}`,
        type: 'AUCTION_OUTBID',
        title: '🔥 You\'ve Been Outbid!',
        message: `Someone outbid you on "${productName}". Current bid: ₹${newBidAmount} (Your bid: ₹${previousBidAmount})`,
        category: 'auction',
        priority: 'high',
        data: {
          productId,
          productName,
          newBidAmount,
          previousBidAmount
        },
        recipients: [{ userId, role: 'user' }],
        actions: [{
          label: 'Place Higher Bid',
          url: `/products/${productId}`,
          type: 'primary'
        }]
      });

      this.emit('userNotification', { userId, notification });
      return notification;
    } catch (error) {
      console.error('Error creating outbid notification:', error);
    }
  }

  /**
   * Notify when auction is ending soon
   */
  async notifyAuctionEndingSoon(productId, productName, currentBid, minutesLeft) {
    try {
      const Product = require('../models/Product');
      const Bid = require('../models/Bid');

      // Get all unique bidders for this auction
      const bids = await Bid.find({ product: productId }).distinct('bidder');

      const recipients = bids.map(bidderId => ({
        userId: bidderId,
        role: 'user'
      }));

      const notification = await Notification.create({
        notificationId: `ending-soon-${productId}-${Date.now()}`,
        type: 'AUCTION_ENDING_SOON',
        title: '⏰ Auction Ending Soon!',
        message: `Only ${minutesLeft} minutes left for "${productName}"! Current bid: ₹${currentBid}`,
        category: 'auction',
        priority: 'high',
        data: {
          productId,
          productName,
          currentBid,
          minutesLeft
        },
        recipients,
        actions: [{
          label: 'Bid Now',
          url: `/products/${productId}`,
          type: 'primary'
        }]
      });

      // Emit to all bidders
      bids.forEach(bidderId => {
        this.emit('userNotification', { userId: bidderId, notification });
      });

      return notification;
    } catch (error) {
      console.error('Error creating ending soon notification:', error);
    }
  }

  /**
   * Notify when auction starts
   */
  async notifyAuctionStarted(productId, productName, startingBid, vendorId) {
    try {
      const notification = await Notification.create({
        notificationId: `started-${productId}-${Date.now()}`,
        type: 'AUCTION_STARTED',
        title: '🎯 Auction Now LIVE!',
        message: `"${productName}" auction is now active! Starting bid: ₹${startingBid}`,
        category: 'auction',
        priority: 'medium',
        data: {
          productId,
          productName,
          startingBid
        },
        recipients: [], // Broadcast to all users
        actions: [{
          label: 'Place Bid',
          url: `/products/${productId}`,
          type: 'primary'
        }]
      });

      // Also notify vendor
      await Notification.create({
        notificationId: `started-vendor-${productId}-${Date.now()}`,
        type: 'AUCTION_STARTED',
        title: '🎯 Your Auction is Live!',
        message: `Your auction for "${productName}" has started! Starting bid: ₹${startingBid}`,
        category: 'auction',
        priority: 'medium',
        data: {
          productId,
          productName,
          startingBid
        },
        recipients: [{ userId: vendorId, role: 'vendor' }],
        actions: [{
          label: 'View Auction',
          url: `/vendor/products`,
          type: 'primary'
        }]
      });

      this.emit('broadcastNotification', notification);
      return notification;
    } catch (error) {
      console.error('Error creating auction started notification:', error);
    }
  }

  /**
   * Notify when auction is starting soon (1 hour before)
   */
  async notifyAuctionStartingSoon(productId, productName, startTime, startingBid) {
    try {
      const notification = await Notification.create({
        notificationId: `starting-soon-${productId}-${Date.now()}`,
        type: 'AUCTION_STARTING_SOON',
        title: '📢 Auction Starting Soon!',
        message: `"${productName}" auction starts in 1 hour! Starting bid: ₹${startingBid}`,
        category: 'auction',
        priority: 'medium',
        data: {
          productId,
          productName,
          startTime,
          startingBid
        },
        recipients: [], // Broadcast to all users
        actions: [{
          label: 'View Details',
          url: `/products/${productId}`,
          type: 'primary'
        }]
      });

      this.emit('broadcastNotification', notification);
      return notification;
    } catch (error) {
      console.error('Error creating starting soon notification:', error);
    }
  }

  /**
   * Notify vendor when first bid is received
   */
  async notifyFirstBid(vendorId, productName, productId, bidAmount, bidderName) {
    try {
      const notification = await Notification.create({
        notificationId: `first-bid-${productId}-${Date.now()}`,
        type: 'AUCTION_FIRST_BID',
        title: '💰 First Bid Received!',
        message: `Great news! ${bidderName} placed the first bid of ₹${bidAmount} on "${productName}"`,
        category: 'auction',
        priority: 'high',
        data: {
          productId,
          productName,
          bidAmount,
          bidderName
        },
        recipients: [{ userId: vendorId, role: 'vendor' }],
        actions: [{
          label: 'View Auction',
          url: `/vendor/products`,
          type: 'primary'
        }]
      });

      this.emit('userNotification', { userId: vendorId, notification });
      return notification;
    } catch (error) {
      console.error('Error creating first bid notification:', error);
    }
  }

  /**
   * Notify vendor when auction ends
   */
  async notifyAuctionEnded(vendorId, productName, productId, winnerName, finalBid, totalBids) {
    try {
      const message = winnerName
        ? `Your auction for "${productName}" ended! Winner: ${winnerName} - Final bid: ₹${finalBid} (${totalBids} total bids)`
        : `Your auction for "${productName}" ended with no bids`;

      const notification = await Notification.create({
        notificationId: `ended-vendor-${productId}-${Date.now()}`,
        type: 'AUCTION_ENDED',
        title: winnerName ? '🏆 Auction Ended - You Have a Winner!' : '📭 Auction Ended',
        message,
        category: 'auction',
        priority: 'high',
        data: {
          productId,
          productName,
          winnerName,
          finalBid,
          totalBids
        },
        recipients: [{ userId: vendorId, role: 'vendor' }],
        actions: [{
          label: 'View Details',
          url: `/vendor/products`,
          type: 'primary'
        }]
      });

      this.emit('userNotification', { userId: vendorId, notification });
      return notification;
    } catch (error) {
      console.error('Error creating auction ended notification:', error);
    }
  }

  /**
   * Notify when bid is successfully placed
   */
  async notifyBidPlaced(userId, productName, productId, bidAmount) {
    try {
      const notification = await Notification.create({
        notificationId: `bid-placed-${productId}-${userId}-${Date.now()}`,
        type: 'BID_PLACED',
        title: '✅ Bid Placed Successfully',
        message: `Your bid of ₹${bidAmount} has been placed on "${productName}"`,
        category: 'auction',
        priority: 'low',
        data: {
          productId,
          productName,
          bidAmount
        },
        recipients: [{ userId, role: 'user' }],
        actions: [{
          label: 'View Auction',
          url: `/products/${productId}`,
          type: 'primary'
        }]
      });

      this.emit('userNotification', { userId, notification });
      return notification;
    } catch (error) {
      console.error('Error creating bid placed notification:', error);
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

module.exports = notificationService;