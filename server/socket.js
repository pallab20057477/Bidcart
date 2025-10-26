const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const setupSocket = (httpServer, options = {}) => {
  const io = new Server(httpServer, options);

  io.on('connection', (socket) => {
    console.log('🔌 New socket connection:', socket.id);
    
    // Try to join user to their own room for targeted events
    let userId = null;
    let userRole = null;
    let userName = null;
    
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      userName = socket.handshake.auth && socket.handshake.auth.userName;
      
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        userId = decoded.userId || decoded.id || decoded._id;
        userRole = decoded.role;
        
        console.log(`✅ Socket authenticated: User ${userName} (${userId}) - Role: ${userRole}`);
        
        if (userId) {
          socket.join(userId.toString());
          
          if (userRole === 'admin') {
            socket.join('admins');
          }
          
          if (userRole === 'vendor') {
            socket.join('vendors');
          }
        }
      } else {
        console.log('⚠️ Socket connection without token');
      }
    } catch (err) {
      if (err.name !== 'TokenExpiredError' && err.name !== 'JsonWebTokenError') {
        console.log('❌ Socket auth error:', err.message);
      } else {
        console.log('⚠️ Socket token issue:', err.name);
      }
    }

    // Send connection confirmation
    socket.emit('connection-confirmed', {
      socketId: socket.id,
      userId: userId,
      userName: userName,
      userRole: userRole,
      timestamp: new Date()
    });
    
    // Join auction room
    socket.on('join-auction', (productId) => {
      socket.join(`auction-${productId}`);
      console.log(`🔌 User ${userName || userId || 'Unknown'} joined auction room: auction-${productId}`);
      
      // Get room info for debugging
      const room = io.sockets.adapter.rooms.get(`auction-${productId}`);
      console.log(`👥 Total users in auction-${productId}: ${room ? room.size : 0}`);
      
      // Send confirmation to the user
      socket.emit('auction-joined', {
        productId,
        roomSize: room ? room.size : 0,
        timestamp: new Date()
      });
    });

    // Leave auction room
    socket.on('leave-auction', (productId) => {
      socket.leave(`auction-${productId}`);
      console.log(`🔌 User ${userId} left auction room: auction-${productId}`);
      
      // Get room info for debugging
      const room = io.sockets.adapter.rooms.get(`auction-${productId}`);
      console.log(`👥 Total users in auction-${productId}: ${room ? room.size : 0}`);
    });

    // ===== USER EVENTS =====
    
    // User joins product tracking
    socket.on('track-product', (productId) => {
      socket.join(`product-${productId}`);
    });

    // User leaves product tracking
    socket.on('untrack-product', (productId) => {
      socket.leave(`product-${productId}`);
    });

    // User joins order tracking
    socket.on('track-order', (orderId) => {
      socket.join(`order-${orderId}`);
    });

    // User leaves order tracking
    socket.on('untrack-order', (orderId) => {
      socket.leave(`order-${orderId}`);
    });

    // User joins category for new product notifications
    socket.on('join-category', (category) => {
      socket.join(`category-${category}`);
    });

    // User leaves category
    socket.on('leave-category', (category) => {
      socket.leave(`category-${category}`);
    });

    // ===== VENDOR EVENTS =====
    
    // Vendor joins product management room
    socket.on('join-vendor-product', (productId) => {
      socket.join(`vendor-product-${productId}`);
    });

    // Vendor leaves product management room
    socket.on('leave-vendor-product', (productId) => {
      socket.leave(`vendor-product-${productId}`);
    });

    // Vendor joins order management room
    socket.on('join-vendor-order', (orderId) => {
      socket.join(`vendor-order-${orderId}`);
    });

    // Vendor leaves order management room
    socket.on('leave-vendor-order', (orderId) => {
      socket.leave(`vendor-order-${orderId}`);
    });

    // Vendor joins earnings tracking
    socket.on('join-vendor-earnings', () => {
      socket.join(`vendor-earnings-${userId}`);
    });

    // Vendor leaves earnings tracking
    socket.on('leave-vendor-earnings', () => {
      socket.leave(`vendor-earnings-${userId}`);
    });

    // ===== ADMIN EVENTS =====
    
    // Admin joins system monitoring
    socket.on('join-system-monitoring', () => {
      socket.join('system-monitoring');
    });

    // Admin leaves system monitoring
    socket.on('leave-system-monitoring', () => {
      socket.leave('system-monitoring');
    });

    // Admin joins vendor management
    socket.on('join-vendor-management', (vendorId) => {
      socket.join(`admin-vendor-${vendorId}`);
    });

    // Admin leaves vendor management
    socket.on('leave-vendor-management', (vendorId) => {
      socket.leave(`admin-vendor-${vendorId}`);
    });

    // Admin joins order monitoring
    socket.on('join-order-monitoring', (orderId) => {
      socket.join(`admin-order-${orderId}`);
    });

    // Admin leaves order monitoring
    socket.on('leave-order-monitoring', (orderId) => {
      socket.leave(`admin-order-${orderId}`);
    });

    // ===== CHAT & SUPPORT EVENTS =====
    
    // User joins support chat
    socket.on('join-support-chat', () => {
      socket.join(`support-${userId}`);
    });

    // User leaves support chat
    socket.on('leave-support-chat', () => {
      socket.leave(`support-${userId}`);
    });

    // Admin joins support chat
    socket.on('join-admin-support', () => {
      socket.join('admin-support');
    });

    // Admin leaves support chat
    socket.on('leave-admin-support', () => {
      socket.leave('admin-support');
    });

    // ===== ANALYTICS EVENTS =====
    
    // Admin joins analytics room
    socket.on('join-analytics', () => {
      socket.join('analytics');
    });

    // Admin leaves analytics room
    socket.on('leave-analytics', () => {
      socket.leave('analytics');
    });

    // Vendor joins analytics room
    socket.on('join-vendor-analytics', () => {
      socket.join(`vendor-analytics-${userId}`);
    });

    // Vendor leaves analytics room
    socket.on('leave-vendor-analytics', () => {
      socket.leave(`vendor-analytics-${userId}`);
    });

    // ===== AUCTION REQUEST EVENTS =====
    
    // Admin joins auction requests monitoring
    socket.on('join-auction-requests', () => {
      socket.join('auction-requests');
    });

    // Admin leaves auction requests monitoring
    socket.on('leave-auction-requests', () => {
      socket.leave('auction-requests');
    });

    // Vendor joins their auction requests tracking
    socket.on('join-vendor-auction-requests', () => {
      socket.join(`vendor-auction-requests-${userId}`);
    });

    // Vendor leaves their auction requests tracking
    socket.on('leave-vendor-auction-requests', () => {
      socket.leave(`vendor-auction-requests-${userId}`);
    });

    // ===== DISPUTE EVENTS =====
    
    // User joins specific dispute room for real-time updates
    socket.on('join-dispute', (disputeId) => {
      if (disputeId) {
        socket.join(`dispute-${disputeId}`);
        console.log(`User ${userId} joined dispute room: dispute-${disputeId}`);
      }
    });

    // User leaves dispute room
    socket.on('leave-dispute', (disputeId) => {
      if (disputeId) {
        socket.leave(`dispute-${disputeId}`);
        console.log(`User ${userId} left dispute room: dispute-${disputeId}`);
      }
    });

    // Admin joins all disputes monitoring
    socket.on('join-disputes-monitoring', () => {
      if (userRole === 'admin') {
        socket.join('disputes-monitoring');
        console.log(`Admin ${userId} joined disputes monitoring`);
      }
    });

    // Admin leaves disputes monitoring
    socket.on('leave-disputes-monitoring', () => {
      if (userRole === 'admin') {
        socket.leave('disputes-monitoring');
        console.log(`Admin ${userId} left disputes monitoring`);
      }
    });

    // User joins their disputes list for notifications
    socket.on('join-user-disputes', () => {
      if (userId) {
        socket.join(`user-disputes-${userId}`);
        console.log(`User ${userId} joined their disputes notifications`);
      }
    });

    // User leaves their disputes list
    socket.on('leave-user-disputes', () => {
      if (userId) {
        socket.leave(`user-disputes-${userId}`);
        console.log(`User ${userId} left their disputes notifications`);
      }
    });

    // Handle dispute message sending
    socket.on('send-dispute-message', (data) => {
      const { disputeId, message, attachments } = data;
      if (disputeId && message && userId) {
        // Broadcast to all users in the dispute room
        socket.to(`dispute-${disputeId}`).emit('dispute-message-received', {
          disputeId,
          message: {
            sender: {
              _id: userId,
              name: socket.handshake.auth?.userName || 'Unknown User'
            },
            message,
            attachments: attachments || [],
            createdAt: new Date()
          }
        });
        console.log(`Message sent to dispute ${disputeId} by user ${userId}`);
      }
    });

    // Handle typing indicators for disputes
    socket.on('dispute-typing', (data) => {
      const { disputeId, isTyping } = data;
      if (disputeId && userId) {
        socket.to(`dispute-${disputeId}`).emit('dispute-typing-indicator', {
          disputeId,
          userId,
          userName: socket.handshake.auth?.userName || 'Unknown User',
          userRole: userRole,
          isTyping
        });
      }
    });

    // Test connection event
    socket.on('test-connection', (data) => {
      // Send back a test response
      socket.emit('test-response', {
        message: 'Connection test successful',
        userId: userId,
        userRole: userRole,
        timestamp: new Date()
      });
    });

    socket.on('disconnect', () => {
      // Silent disconnect
    });
  });

  // ===== NOTIFICATION SERVICE INTEGRATION =====
  const notificationService = require('./services/notificationService');

  // Broadcast notification to all connected users
  notificationService.on('broadcastNotification', (notification) => {
    console.log('📢 Broadcasting notification to all users:', notification.title);
    io.emit('notification', notification);
  });

  // Send notification to specific user
  notificationService.on('userNotification', ({ userId, notification }) => {
    console.log(`📬 Sending notification to user ${userId}:`, notification.title);
    io.to(userId.toString()).emit('notification', notification);
  });

  // Send notification to all admins
  notificationService.on('adminNotification', (notification) => {
    console.log('👑 Sending notification to admins:', notification.title);
    io.to('admins').emit('notification', notification);
  });

  return io;
};

module.exports = setupSocket; 