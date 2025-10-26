// Example structure for order controller
const Order = require('../models/Order');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const Notification = require('../models/Notification');

const createOrder = async (req, res) => {
  try {
    const {
      products,
      shippingAddress,
      billingAddress,
      paymentMethod,
      shippingMethod = 'standard'
    } = req.body;
    if (!products || products.length === 0) {
      return res.status(400).json({ message: 'No products in order' });
    }
    let totalAmount = 0;
    const orderProducts = [];
    for (const item of products) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.productId} not found` });
      }
      if (!product.isActive) {
        return res.status(400).json({ message: `Product ${product.name} is not available` });
      }
      // Check if product is cancelled (for auction products)
      if (product.mode === 'auction' && product.auction?.status === 'cancelled') {
        return res.status(400).json({ message: `Product ${product.name} has been cancelled by admin and is no longer available for purchase` });
      }
      if (product.mode === 'buy-now') {
        if (product.stock < item.quantity) {
          return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
        }
        totalAmount += product.price * item.quantity;
      } else if (product.mode === 'auction') {
        if (product.auction.winner?.toString() !== req.user._id.toString()) {
          return res.status(400).json({ message: 'You are not the winner of this auction' });
        }
        totalAmount += product.auction.currentBid * item.quantity;
      }
      orderProducts.push({
        product: item.productId,
        quantity: item.quantity,
        price: product.mode === 'auction' ? product.auction.currentBid : product.price,
        mode: product.mode
      });
    }
    const shippingCost = shippingMethod === 'express' ? 15 : 5;
    const order = new Order({
      user: req.user._id,
      products: orderProducts,
      totalAmount,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentMethod,
      shippingMethod,
      shippingCost,
      taxAmount: totalAmount * 0.1,
      auctionDetails: products.find(p => p.mode === 'auction') ? {
        productId: products.find(p => p.mode === 'auction').productId,
        winningBid: totalAmount,
        auctionEndTime: new Date()
      } : undefined
    });
    const savedOrder = await order.save();
    
    // Create notification for user
    try {
      console.log('📧 Creating order notification for user:', req.user._id);
      const notification = await Notification.create({
        notificationId: `order-created-${savedOrder._id}-${Date.now()}`,
        type: 'ORDER_STATUS_UPDATE',
        title: 'Order Placed Successfully',
        message: `Your order #${savedOrder._id} has been placed successfully!`,
        category: 'order',
        data: {
          orderId: savedOrder._id.toString(),
          orderNumber: savedOrder._id.toString(),
          amount: savedOrder.totalAmount
        },
        recipients: [{
          userId: req.user._id,
          role: 'user'
        }]
      });
      console.log('✅ Order notification created:', notification.notificationId);
      
      // Emit socket event for real-time notification update
      const io = req.app.get('io');
      if (io) {
        io.to(req.user._id.toString()).emit('notification:update', {
          type: 'new',
          notification: notification
        });
      }
    } catch (notifError) {
      console.error('❌ Error creating order notification:', notifError);
      console.error('❌ Error details:', notifError.message);
    }
    // Populate the order with product details before sending the response
    const populatedOrder = await Order.findById(savedOrder._id)
      .populate('products.product', 'name price images')
      .populate('user', 'name email');
    for (const item of products) {
      if (item.mode === 'buy-now') {
        const product = await Product.findById(item.productId);
        product.stock -= item.quantity;
        await product.save();
        
        // Check for low stock and notify vendor
        if (product.stock <= 10 && product.vendor) {
          const vendor = await Vendor.findById(product.vendor);
          if (vendor && vendor.user) {
            const io = req.app.get('io');
            if (io) {
              io.to(vendor.user.toString()).emit('vendor:stock-alert', {
                productId: product._id,
                productName: product.name,
                stock: product.stock,
                threshold: 10
              });
            }
          }
        }
      }
    }
    // Emit real-time event to all admins
    const io = req.app.get('io');
    if (io) {
      io.to('admins').emit('order:new', populatedOrder);
      
      // Notify vendors of new orders containing their products
      const vendorProducts = await Product.find({
        _id: { $in: order.products.map(p => p.productId) }
      }).populate('vendor', 'user');
      
      const vendorNotifications = {};
      vendorProducts.forEach(product => {
        if (product.vendor && product.vendor.user) {
          const vendorUserId = product.vendor.user.toString();
          if (!vendorNotifications[vendorUserId]) {
            vendorNotifications[vendorUserId] = {
              orderId: order._id,
              orderNumber: order._id.toString().slice(-6),
              total: 0,
              products: []
            };
          }
          
          const orderItem = order.products.find(p => p.productId.toString() === product._id.toString());
          if (orderItem) {
            vendorNotifications[vendorUserId].total += orderItem.price * orderItem.quantity;
            vendorNotifications[vendorUserId].products.push({
              productId: product._id,
              name: product.name,
              quantity: orderItem.quantity,
              price: orderItem.price
            });
          }
        }
      });
      
      // Create database notifications and emit socket events to each vendor
      for (const vendorUserId of Object.keys(vendorNotifications)) {
        const vendorData = vendorNotifications[vendorUserId];
        
        // Create database notification for vendor
        await Notification.create({
          notificationId: `vendor-new-order-${order._id}-${vendorUserId}-${Date.now()}`,
          type: 'ORDER_STATUS_UPDATE',
          title: 'New Order Received!',
          message: `You have a new order #${vendorData.orderNumber} with ${vendorData.products.length} item(s). Total: $${vendorData.total.toFixed(2)}`,
          category: 'order',
          priority: 'high',
          data: {
            orderId: order._id.toString(),
            orderNumber: vendorData.orderNumber,
            total: vendorData.total,
            products: vendorData.products
          },
          recipients: [{
            userId: vendorUserId,
            role: 'vendor'
          }],
          actions: [{
            label: 'View Order',
            url: `/vendor/orders/${order._id}`,
            type: 'primary'
          }]
        });
        
        // Emit socket events for real-time updates
        io.to(vendorUserId).emit('vendor:new-order', vendorData);
        io.to(vendorUserId).emit('notification:update', { type: 'new' });
      }
      
      // Notify vendors of earnings when payment is completed
      if (order.paymentStatus === 'completed') {
        Object.keys(vendorNotifications).forEach(vendorUserId => {
          const vendorData = vendorNotifications[vendorUserId];
          io.to(vendorUserId).emit('vendor:earnings-update', {
            orderId: order._id,
            amount: vendorData.total,
            commission: vendorData.total * 0.1, // 10% commission
            netEarnings: vendorData.total * 0.9
          });
        });
      }
      
      // Notify user of order creation
      io.to(order.user.toString()).emit('order:created', {
        orderId: order._id,
        orderNumber: order._id.toString().slice(-6),
        total: order.totalAmount,
        status: order.status,
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });
      
      // Notify users tracking this order
      io.to(`order-${order._id}`).emit('order:update', {
        orderId: order._id,
        status: order.status,
        message: 'Order has been created successfully'
      });
    }
    // Send response with the populated order
    res.status(201).json({
      message: 'Order created successfully',
      order: populatedOrder
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.getUserOrders(req.user._id);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('products.product', 'name images price')
      .populate('user', 'name email');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    // Update main order status
    order.status = status;
    
    // If order is being marked as delivered or cancelled, update all product statuses
    if (['delivered', 'cancelled'].includes(status)) {
      order.products = order.products.map(product => ({
        ...product.toObject(),
        status: status
      }));
    }
    
    await order.save();
    const userNotification = await Notification.create({
      notificationId: `order-status-${order._id}-${Date.now()}`,
      type: 'ORDER_STATUS_UPDATE',
      title: 'Order Status Updated',
      message: `Your order #${order._id} status has been updated to ${status}.`,
      category: 'order',
      data: {
        orderId: order._id.toString(),
        orderNumber: order._id.toString(),
        amount: order.totalAmount
      },
      recipients: [{
        userId: order.user,
        role: 'user'
      }]
    });
    
    const io = req.app.get('io');
    if (io && order.user) {
      // Emit order status update
      io.to(order.user.toString()).emit('order:status', {
        orderId: order._id.toString(),
        status,
        userId: order.user.toString()
      });
      
      // Emit notification update for real-time notification center
      io.to(order.user.toString()).emit('notification:update', {
        type: 'new',
        notification: userNotification
      });
      io.to('admins').emit('order:update', order);
      // Real-time admin notification
      io.to('admins').emit('notification:new', {
        message: `Order #${order._id} status updated to ${status} by admin.`,
        type: 'order',
        createdAt: new Date(),
        read: false
      });
      
      // Notify vendors of order status updates
      const Product = require('../models/Product');
      const vendorProducts = await Product.find({
        _id: { $in: order.products.map(p => p.product) }
      }).populate('vendor', 'user');
      
      const vendorNotifications = {};
      vendorProducts.forEach(product => {
        if (product.vendor && product.vendor.user) {
          const vendorUserId = product.vendor.user.toString();
          if (!vendorNotifications[vendorUserId]) {
            vendorNotifications[vendorUserId] = {
              orderId: order._id,
              orderNumber: order._id.toString().slice(-6),
              status,
              products: []
            };
          }
          
          const orderItem = order.products.find(p => p.product.toString() === product._id.toString());
          if (orderItem) {
            vendorNotifications[vendorUserId].products.push({
              productId: product._id,
              name: product.name,
              quantity: orderItem.quantity,
              price: orderItem.price,
              status: orderItem.status || status
            });
          }
        }
      });
      
      // Create database notifications and emit socket events to each vendor
      for (const vendorUserId of Object.keys(vendorNotifications)) {
        const vendorData = vendorNotifications[vendorUserId];
        
        // Create database notification for vendor
        await Notification.create({
          notificationId: `vendor-order-status-${order._id}-${vendorUserId}-${Date.now()}`,
          type: 'ORDER_STATUS_UPDATE',
          title: 'Order Status Updated',
          message: `Order #${vendorData.orderNumber} status has been updated to ${status}. ${vendorData.products.length} item(s) affected.`,
          category: 'order',
          priority: 'high',
          data: {
            orderId: order._id.toString(),
            orderNumber: vendorData.orderNumber,
            status: status,
            products: vendorData.products
          },
          recipients: [{
            userId: vendorUserId,
            role: 'vendor'
          }],
          actions: [{
            label: 'View Order',
            url: `/vendor/orders/${order._id}`,
            type: 'primary'
          }]
        });
        
        // Emit socket events for real-time updates
        io.to(vendorUserId).emit('vendor:order-update', vendorData);
        io.to(vendorUserId).emit('notification:update', { type: 'new' });
      }
    }
    res.json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, paymentId } = req.body;
    const order = await Order.findById(req.params.id).populate('products.product');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }
    
    order.paymentStatus = paymentStatus;
    if (paymentId) order.paymentId = paymentId;
    if (paymentStatus === 'completed' && order.status === 'pending') {
      order.status = 'confirmed';
    }
    
    await order.save();
    
    // Note: Vendor earnings are now handled by PaymentService.processSuccessfulPayment()
    // to avoid duplicate calculations
    
    res.json({
      message: 'Payment status updated successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updatePaymentStatusAdmin = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const previousPaymentStatus = order.paymentStatus;
    order.paymentStatus = paymentStatus;
    if (paymentStatus === 'completed' && order.status === 'pending') {
      order.status = 'confirmed';
    }
    await order.save();
    // Create notification for the customer
    const notificationMessage = paymentStatus === 'completed' 
      ? `Great news! Your payment for order #${order._id.toString().slice(-8)} has been confirmed successfully. Your order is now being processed.`
      : `Your payment status for order #${order._id.toString().slice(-8)} has been updated to ${paymentStatus}.`;
    
    const notificationTitle = paymentStatus === 'completed'
      ? 'Payment Confirmed Successfully!'
      : 'Payment Status Updated';
    
    await Notification.create({
      notificationId: `payment-status-${order._id}-${Date.now()}`,
      type: 'PAYMENT_CONFIRMED',
      title: notificationTitle,
      message: notificationMessage,
      category: 'payment',
      priority: paymentStatus === 'completed' ? 'high' : 'medium',
      data: {
        orderId: order._id.toString(),
        orderNumber: order._id.toString(),
        amount: order.totalAmount,
        paymentStatus: paymentStatus
      },
      recipients: [{
        userId: order.user,
        role: 'user'
      }],
      actions: [{
        label: 'View Order',
        url: `/orders/${order._id}`,
        type: 'primary'
      }]
    });
    const io = req.app.get('io');
    if (io && order.user) {
      // Emit payment status update to customer
      io.to(order.user.toString()).emit('payment:status', {
        orderId: order._id.toString(),
        paymentStatus,
        userId: order.user.toString()
      });
      
      // Send real-time notification to customer
      if (paymentStatus === 'completed') {
        io.to(order.user.toString()).emit('notification:new', {
          title: 'Payment Confirmed!',
          message: `Your payment for order #${order._id.toString().slice(-8)} has been confirmed successfully.`,
          type: 'PAYMENT_CONFIRMED',
          category: 'payment',
          createdAt: new Date(),
          read: false,
          data: {
            orderId: order._id.toString(),
            amount: order.totalAmount
          }
        });
      }
      io.to('admins').emit('order:update', order);
      // Real-time admin notification
      io.to('admins').emit('notification:new', {
        message: `Payment for order #${order._id.toString().slice(-8)} updated to ${paymentStatus} by admin.`,
        type: 'payment',
        createdAt: new Date(),
        read: false
      });
    }
    res.json({
      message: 'Payment status updated successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ message: 'Order cannot be cancelled at this stage' });
    }
    order.status = 'cancelled';
    await order.save();
    for (const item of order.products) {
      if (item.mode === 'buy-now') {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock += item.quantity;
          await product.save();
        }
      }
    }
    const io = req.app.get('io');
    if (io && order.user) {
      io.to(order.user.toString()).emit('order:status', {
        orderId: order._id.toString(),
        status: 'cancelled',
        userId: order.user.toString()
      });
    }
    res.json({
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getOrderStatsOverview = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const completedOrders = await Order.countDocuments({ status: 'delivered' });
    const totalRevenue = await Order.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    res.json({
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  updatePaymentStatusAdmin,
  cancelOrder,
  getOrderStatsOverview,
}; 