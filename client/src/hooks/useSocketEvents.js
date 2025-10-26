/**
 * Professional Socket.IO Events Hook
 * Manages real-time events for users, vendors, and admins
 */
import { useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export const useSocketEvents = () => {
  const { socket, connected } = useSocket();
  const { user } = useAuth();
  const eventListeners = useRef(new Map());

  // ===== USER EVENTS =====

  const setupUserEvents = useCallback(() => {
    if (!socket || !connected || !user) return;

    // Product tracking events
    const productNewListener = (data) => {
      toast.success(`New product in ${data.category}: ${data.name}`, {
        duration: 4000,
        icon: '🆕'
      });
    };

    // Order events
    const orderCreatedListener = (data) => {
      toast.success(`Order #${data.orderNumber} created successfully!`, {
        duration: 5000,
        icon: '📦'
      });
    };

    const orderUpdateListener = (data) => {
      toast.success(`Order #${data.orderNumber} status: ${data.status}`, {
        duration: 4000,
        icon: '🔄'
      });
    };

    // Payment events
    const paymentStatusListener = (data) => {
      toast.success(`Payment ${data.paymentStatus}`, {
        duration: 4000,
        icon: '💳'
      });
    };

    // Delivery events
    const deliveryUpdateListener = (data) => {
      toast.success(`Delivery: ${data.status}`, {
        duration: 4000,
        icon: '🚚'
      });
    };

    // Register listeners
    socket.on('product:new', productNewListener);
    socket.on('order:created', orderCreatedListener);
    socket.on('order:status', orderUpdateListener);
    socket.on('payment:status', paymentStatusListener);
    socket.on('delivery:update', deliveryUpdateListener);

    // Store listeners for cleanup
    eventListeners.current.set('product:new', productNewListener);
    eventListeners.current.set('order:created', orderCreatedListener);
    eventListeners.current.set('order:status', orderUpdateListener);
    eventListeners.current.set('payment:status', paymentStatusListener);
    eventListeners.current.set('delivery:update', deliveryUpdateListener);
  }, [socket, connected, user]);

  // ===== VENDOR EVENTS =====

  const setupVendorEvents = useCallback(() => {
    if (!socket || !connected || user?.role !== 'vendor') return;

    // New order notifications
    const vendorNewOrderListener = (data) => {
      toast.success(`New order received! Order #${data.orderNumber}`, {
        duration: 4000,
        icon: '📦'
      });
    };

    // Order update notifications
    const vendorOrderUpdateListener = (data) => {
      toast.success(`Order #${data.orderNumber} status updated to ${data.status}`, {
        duration: 4000,
        icon: '🔄'
      });
    };

    // Product approval notifications
    const vendorProductApprovedListener = (data) => {
      toast.success(`Product "${data.productName}" has been approved!`, {
        duration: 5000,
        icon: '✅'
      });
    };

    // Product rejection notifications
    const vendorProductRejectedListener = (data) => {
      toast.error(`Product "${data.productName}" was rejected: ${data.reason}`, {
        duration: 6000,
        icon: '❌'
      });
    };

    // Stock alert notifications
    const vendorStockAlertListener = (data) => {
      toast(`Low stock alert: ${data.productName} (${data.stock} remaining)`, {
        duration: 5000,
        icon: '⚠️'
      });
    };

    // Earnings update notifications
    const vendorEarningsUpdateListener = (data) => {
      toast.success(`Earnings updated: +$${data.netEarnings} (Commission: $${data.commission})`, {
        duration: 4000,
        icon: '💵'
      });
    };

    // Withdrawal notifications
    const vendorWithdrawalSubmittedListener = (data) => {
      toast.success(`Withdrawal request submitted for $${data.amount}`, {
        duration: 4000,
        icon: '💰'
      });
    };

    // Dashboard update notifications
    let dashboardToastTimeout = null;
    const vendorDashboardUpdateListener = (data) => {
      if (dashboardToastTimeout) return; // prevent multiple toasts within debounce period
      toast.success(`Dashboard updated: ${data.stats.totalProducts} products, $${data.stats.totalEarnings} earnings`, {
        duration: 3000,
        icon: '📈'
      });
      dashboardToastTimeout = setTimeout(() => {
        dashboardToastTimeout = null;
      }, 3000); // debounce duration same as toast duration
    };

    // Register listeners
    if (!eventListeners.current.has('vendor:new-order')) socket.on('vendor:new-order', vendorNewOrderListener);
    if (!eventListeners.current.has('vendor:order-update')) socket.on('vendor:order-update', vendorOrderUpdateListener);
    if (!eventListeners.current.has('vendor:product-approved')) socket.on('vendor:product-approved', vendorProductApprovedListener);
    if (!eventListeners.current.has('vendor:product-rejected')) socket.on('vendor:product-rejected', vendorProductRejectedListener);
    if (!eventListeners.current.has('vendor:stock-alert')) socket.on('vendor:stock-alert', vendorStockAlertListener);
    if (!eventListeners.current.has('vendor:earnings-update')) socket.on('vendor:earnings-update', vendorEarningsUpdateListener);
    if (!eventListeners.current.has('vendor:withdrawal-submitted')) socket.on('vendor:withdrawal-submitted', vendorWithdrawalSubmittedListener);
    if (!eventListeners.current.has('vendor:dashboard-update')) socket.on('vendor:dashboard-update', vendorDashboardUpdateListener);

    // Store listeners for cleanup
    eventListeners.current.set('vendor:new-order', vendorNewOrderListener);
    eventListeners.current.set('vendor:order-update', vendorOrderUpdateListener);
    eventListeners.current.set('vendor:product-approved', vendorProductApprovedListener);
    eventListeners.current.set('vendor:product-rejected', vendorProductRejectedListener);
    eventListeners.current.set('vendor:stock-alert', vendorStockAlertListener);
    eventListeners.current.set('vendor:earnings-update', vendorEarningsUpdateListener);
    eventListeners.current.set('vendor:withdrawal-submitted', vendorWithdrawalSubmittedListener);
    eventListeners.current.set('vendor:dashboard-update', vendorDashboardUpdateListener);
  }, [socket, connected, user]);

  // ===== ADMIN EVENTS =====

  const setupAdminEvents = useCallback(() => {
    if (!socket || !connected || user?.role !== 'admin') return;

    // Vendor request notifications
    const adminVendorRequestListener = (data) => {
      toast(`New vendor request from ${data.businessName}`, {
        duration: 5000,
        icon: '🏪'
      });
    };

    // Order notifications
    const adminOrderNewListener = (data) => {
      toast(`New order received: $${data.totalAmount}`, {
        duration: 4000,
        icon: '📦'
      });
    };

    const adminOrderUpdateListener = (data) => {
      toast(`Order updated: ${data.status}`, {
        duration: 4000,
        icon: '🔄'
      });
    };

    // Product notifications
    const adminProductNewListener = (data) => {
      toast(`New product: ${data.name} by ${data.seller}`, {
        duration: 4000,
        icon: '🆕'
      });
    };

    // Withdrawal request notifications
    const adminWithdrawalRequestListener = (data) => {
      toast(`New withdrawal request from ${data.vendorName} for $${data.amount}`, {
        duration: 5000,
        icon: '🏦'
      });
    };

    // Vendor order update notifications
    const adminVendorOrderUpdateListener = (data) => {
      toast(`Vendor updated order ${data.orderId} to ${data.status}`, {
        duration: 4000,
        icon: '🔄'
      });
    };

    // Dashboard update notifications
    const adminDashboardUpdateListener = (data) => {
      toast(`Dashboard updated: ${data.stats.totalOrders} orders, $${data.stats.totalRevenue} revenue`, {
        duration: 3000,
        icon: '📊'
      });
    };

    // System alert notifications
    const adminSystemAlertListener = (data) => {
      const icon = data.severity === 'high' ? '🚨' : data.severity === 'medium' ? '⚠️' : 'ℹ️';
      toast[data.severity === 'high' ? 'error' : data.severity === 'medium' ? 'warning' : 'info'](
        `System Alert: ${data.message}`,
        {
          duration: 6000,
          icon: icon
        }
      );
    };

    // Register listeners
    socket.on('vendor-request:new', adminVendorRequestListener);
    socket.on('order:new', adminOrderNewListener);
    socket.on('order:update', adminOrderUpdateListener);
    socket.on('product:new', adminProductNewListener);
    socket.on('vendor:withdrawal-request', adminWithdrawalRequestListener);
    socket.on('vendor:order-update', adminVendorOrderUpdateListener);
    socket.on('admin:dashboard-update', adminDashboardUpdateListener);
    socket.on('admin:system-alert', adminSystemAlertListener);

    // Store listeners for cleanup
    eventListeners.current.set('vendor-request:new', adminVendorRequestListener);
    eventListeners.current.set('order:new', adminOrderNewListener);
    eventListeners.current.set('order:update', adminOrderUpdateListener);
    eventListeners.current.set('product:new', adminProductNewListener);
    eventListeners.current.set('vendor:withdrawal-request', adminWithdrawalRequestListener);
    eventListeners.current.set('vendor:order-update', adminVendorOrderUpdateListener);
    eventListeners.current.set('admin:dashboard-update', adminDashboardUpdateListener);
    eventListeners.current.set('admin:system-alert', adminSystemAlertListener);
  }, [socket, connected, user]);

  // ===== AUCTION EVENTS =====

  const setupAuctionEvents = useCallback(() => {
    if (!socket || !connected) return;

    // Bid update notifications
    const bidUpdateListener = (data) => {
      toast.success(`New bid: $${data.currentBid} by ${data.bidder}`, {
        duration: 3000,
        icon: '💰'
      });
    };

    // Auction ended notifications
    const auctionEndedListener = (data) => {
      toast.success(`Auction ended! Winner: ${data.winner}`, {
        duration: 5000,
        icon: '🏆'
      });
    };

    // Register listeners
    socket.on('bid-update', bidUpdateListener);
    socket.on('auction-ended', auctionEndedListener);

    // Store listeners for cleanup
    eventListeners.current.set('bid-update', bidUpdateListener);
    eventListeners.current.set('auction-ended', auctionEndedListener);
  }, [socket, connected]);

  // ===== GENERAL NOTIFICATIONS =====

  const setupGeneralEvents = useCallback(() => {
    if (!socket || !connected) return;

    // General notification events
    const notificationListener = (data) => {
      toast(data.message, { icon: '🔔' });
    };

    // Register listeners
    socket.on('notification:new', notificationListener);

    // Store listeners for cleanup
    eventListeners.current.set('notification:new', notificationListener);
  }, [socket, connected]);

  // Setup all events based on user role
  useEffect(() => {
    if (!socket || !connected) return;

    setupUserEvents();
    setupVendorEvents();
    setupAdminEvents();
    setupAuctionEvents();
    setupGeneralEvents();

    // Cleanup function
    return () => {
      eventListeners.current.forEach((listener, event) => {
        socket.off(event, listener);
      });
      eventListeners.current.clear();
    };
  }, [
    socket,
    connected,
    user,
    setupUserEvents,
    setupVendorEvents,
    setupAdminEvents,
    setupAuctionEvents,
    setupGeneralEvents
  ]);

  // Return utility functions for manual event management
  return {
    // Check if user is connected
    isConnected: connected,
    
    // Get current user role
    userRole: user?.role,
    
    // Manual event emission helpers
    emitEvent: (event, data) => {
      if (socket && connected) {
        socket.emit(event, data);
      }
    },
    
    // Join/leave room helpers
    joinRoom: (room) => {
      if (socket && connected) {
        socket.emit('join-room', room);
      }
    },
    
    leaveRoom: (room) => {
      if (socket && connected) {
        socket.emit('leave-room', room);
      }
    }
  };
};
