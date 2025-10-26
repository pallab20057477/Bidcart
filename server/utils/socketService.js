/**
 * Professional Socket.IO Service
 * Centralized socket event management for users, vendors, and admins
 */

class SocketService {
  constructor(io) {
    this.io = io;
  }

  // ===== USER EVENTS =====

  /**
   * Notify user of new product in their tracked category
   */
  notifyNewProduct(category, productData) {
    this.io.to(`category-${category}`).emit('product:new', {
      productId: productData._id,
      name: productData.name,
      category: productData.category,
      price: productData.price,
      images: productData.images
    });
  }

  /**
   * Notify user of order creation
   */
  notifyOrderCreated(userId, orderData) {
    this.io.to(userId.toString()).emit('order:created', {
      orderId: orderData._id,
      orderNumber: orderData._id.toString().slice(-6),
      total: orderData.totalAmount,
      status: orderData.status,
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
  }

  /**
   * Notify user of order status update
   */
  notifyOrderUpdate(userId, orderData) {
    this.io.to(userId.toString()).emit('order:status', {
      orderId: orderData._id,
      status: orderData.status,
      message: `Order status updated to ${orderData.status}`
    });
  }

  /**
   * Notify user of payment status
   */
  notifyPaymentStatus(userId, orderData) {
    this.io.to(userId.toString()).emit('payment:status', {
      orderId: orderData._id,
      paymentStatus: orderData.paymentStatus,
      message: `Payment ${orderData.paymentStatus}`
    });
  }

  /**
   * Notify user of delivery update
   */
  notifyDeliveryUpdate(userId, orderData) {
    this.io.to(userId.toString()).emit('delivery:update', {
      orderId: orderData._id,
      status: orderData.deliveryStatus,
      message: `Delivery status: ${orderData.deliveryStatus}`
    });
  }

  // ===== VENDOR EVENTS =====

  /**
   * Notify vendor of new order
   */
  notifyVendorNewOrder(vendorUserId, orderData) {
    this.io.to(vendorUserId.toString()).emit('vendor:new-order', {
      orderId: orderData._id,
      orderNumber: orderData._id.toString().slice(-6),
      total: orderData.total,
      products: orderData.products
    });
  }

  /**
   * Notify vendor of order status update
   */
  notifyVendorOrderUpdate(vendorUserId, orderData) {
    this.io.to(vendorUserId.toString()).emit('vendor:order-update', {
      orderId: orderData._id,
      orderNumber: orderData._id.toString().slice(-6),
      status: orderData.status,
      products: orderData.products
    });
  }

  /**
   * Notify vendor of product approval
   */
  notifyVendorProductApproved(vendorUserId, productData) {
    this.io.to(vendorUserId.toString()).emit('vendor:product-approved', {
      productId: productData._id,
      productName: productData.name,
      message: 'Product approved successfully'
    });
  }

  /**
   * Notify vendor of product rejection
   */
  notifyVendorProductRejected(vendorUserId, productData, reason) {
    this.io.to(vendorUserId.toString()).emit('vendor:product-rejected', {
      productId: productData._id,
      productName: productData.name,
      reason: reason
    });
  }

  /**
   * Notify vendor of stock alert
   */
  notifyVendorStockAlert(vendorUserId, productData) {
    this.io.to(vendorUserId.toString()).emit('vendor:stock-alert', {
      productId: productData._id,
      productName: productData.name,
      stock: productData.stock,
      threshold: 10
    });
  }

  /**
   * Notify vendor of earnings update
   */
  notifyVendorEarningsUpdate(vendorUserId, earningsData) {
    this.io.to(vendorUserId.toString()).emit('vendor:earnings-update', {
      orderId: earningsData.orderId,
      amount: earningsData.amount,
      commission: earningsData.commission,
      netEarnings: earningsData.netEarnings
    });
  }

  /**
   * Notify vendor of withdrawal confirmation
   */
  notifyVendorWithdrawalSubmitted(vendorUserId, withdrawalData) {
    this.io.to(vendorUserId.toString()).emit('vendor:withdrawal-submitted', {
      amount: withdrawalData.amount,
      status: 'pending',
      message: 'Withdrawal request submitted successfully'
    });
  }

  /**
   * Notify vendor of dashboard update
   */
  notifyVendorDashboardUpdate(vendorUserId, dashboardData) {
    this.io.to(`vendor-analytics-${vendorUserId}`).emit('vendor:dashboard-update', {
      stats: dashboardData.stats,
      recentOrders: dashboardData.recentOrders,
      recentProducts: dashboardData.recentProducts,
      timestamp: new Date()
    });
  }

  // ===== ADMIN EVENTS =====

  /**
   * Notify admins of new vendor request
   */
  notifyAdminVendorRequest(vendorRequestData) {
    this.io.to('admins').emit('vendor-request:new', vendorRequestData);
  }

  /**
   * Notify admins of new order
   */
  notifyAdminNewOrder(orderData) {
    this.io.to('admins').emit('order:new', orderData);
  }

  /**
   * Notify admins of order update
   */
  notifyAdminOrderUpdate(orderData) {
    this.io.to('admins').emit('order:update', orderData);
  }

  /**
   * Notify admins of new product
   */
  notifyAdminNewProduct(productData, sellerName) {
    this.io.to('admins').emit('product:new', {
      productId: productData._id,
      name: productData.name,
      seller: sellerName,
      category: productData.category,
      status: 'pending'
    });
  }

  /**
   * Notify admins of vendor withdrawal request
   */
  notifyAdminWithdrawalRequest(vendorData, amount) {
    this.io.to('admins').emit('vendor:withdrawal-request', {
      vendorId: vendorData._id,
      vendorName: vendorData.businessName,
      amount: amount,
      requestedAt: new Date()
    });
  }

  /**
   * Notify admins of vendor order update
   */
  notifyAdminVendorOrderUpdate(orderData, vendorId) {
    this.io.to('admins').emit('vendor:order-update', {
      orderId: orderData._id,
      vendorId: vendorId,
      productId: orderData.productId,
      status: orderData.status,
      action: 'vendor-update'
    });
  }

  /**
   * Notify admins of dashboard update
   */
  notifyAdminDashboardUpdate(dashboardData) {
    this.io.to('analytics').emit('admin:dashboard-update', {
      stats: dashboardData.stats,
      recentOrders: dashboardData.recentOrders,
      activeAuctions: dashboardData.activeAuctions,
      timestamp: new Date()
    });
  }

  /**
   * Notify admins of system monitoring alert
   */
  notifyAdminSystemAlert(alertData) {
    this.io.to('system-monitoring').emit('admin:system-alert', {
      type: alertData.type,
      message: alertData.message,
      severity: alertData.severity,
      timestamp: new Date()
    });
  }

  // ===== BROADCAST EVENTS =====

  /**
   * Broadcast to all users
   */
  broadcastToAll(event, data) {
    this.io.emit(event, data);
  }

  /**
   * Broadcast to specific room
   */
  broadcastToRoom(room, event, data) {
    this.io.to(room).emit(event, data);
  }

  /**
   * Broadcast to multiple rooms
   */
  broadcastToRooms(rooms, event, data) {
    rooms.forEach(room => {
      this.io.to(room).emit(event, data);
    });
  }

  // ===== UTILITY METHODS =====

  /**
   * Get connected users count
   */
  getConnectedUsersCount() {
    return this.io.engine.clientsCount;
  }

  /**
   * Get room members count
   */
  getRoomMembersCount(room) {
    const roomSockets = this.io.sockets.adapter.rooms.get(room);
    return roomSockets ? roomSockets.size : 0;
  }

  /**
   * Check if user is in room
   */
  isUserInRoom(userId, room) {
    const userSockets = this.io.sockets.adapter.rooms.get(userId.toString());
    const roomSockets = this.io.sockets.adapter.rooms.get(room);
    
    if (!userSockets || !roomSockets) return false;
    
    for (const socketId of userSockets) {
      if (roomSockets.has(socketId)) return true;
    }
    return false;
  }
}

module.exports = SocketService; 