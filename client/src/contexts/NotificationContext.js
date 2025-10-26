import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within a NotificationProvider');
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!user) {
      console.log('🔔 NotificationContext: No user, skipping fetch');
      return;
    }
    
    console.log('🔔 NotificationContext: Fetching notifications for user:', user.name, 'role:', user.role);
    setLoading(true);
    
    try {
      // Use different endpoints based on user role
      const endpoint = user.role === 'admin' ? '/notifications' : '/notifications/my';
      console.log('🔔 NotificationContext: Using endpoint:', endpoint);
      
      const res = await api.get(endpoint);
      console.log('🔔 NotificationContext: API response:', res.data);
      
      // Ensure we get the notifications array from the response
      const notificationsData = res.data?.notifications || res.data || [];
      console.log('🔔 NotificationContext: Extracted notifications:', notificationsData);
      console.log('🔔 NotificationContext: Is array?', Array.isArray(notificationsData));
      
      const finalNotifications = Array.isArray(notificationsData) ? notificationsData : [];
      setNotifications(finalNotifications);
      
      console.log('🔔 NotificationContext: Set notifications count:', finalNotifications.length);
    } catch (error) {
      console.error('🔔 NotificationContext: Error fetching notifications:', error);
      console.error('🔔 NotificationContext: Error response:', error.response?.data);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Listen for real-time notifications
  useEffect(() => {
    if (!user) return;
    fetchNotifications();
  }, [user, fetchNotifications]);

  useEffect(() => {
    if (!socket || !user) return;
    const handleNewNotification = (data) => {
      fetchNotifications();
      toast(data.message, { icon: '🔔' });
    };
    const handleOrderStatus = (data) => {
      fetchNotifications();
      toast(`Order #${data.orderId ? data.orderId.slice(-6) : ''} status updated to ${data.status}`, { icon: '📦' });
    };
    const handlePaymentStatus = (data) => {
      fetchNotifications();
      toast(`Payment status: ${data.paymentStatus}`, { icon: '💳' });
    };
    socket.on('notification:new', handleNewNotification);
    socket.on('order:status', handleOrderStatus);
    socket.on('payment:status', handlePaymentStatus);
    return () => {
      socket.off('notification:new', handleNewNotification);
      socket.off('order:status', handleOrderStatus);
      socket.off('payment:status', handlePaymentStatus);
    };
  }, [socket, user, fetchNotifications]);

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await api.put('/notifications/mark-all-read');
      console.log('🔔 Mark all as read response:', response.data);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      fetchNotifications(); // Refresh from server
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Mark single as read
  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // Delete all notifications
  const deleteAllNotifications = async () => {
    try {
      const response = await api.delete('/notifications');
      console.log('🗑️ Delete all response:', response.data);
      setNotifications([]);
      fetchNotifications(); // Refresh from server
      return response.data;
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      throw error;
    }
  };

  // Delete single notification
  const deleteNotification = async (notificationId) => {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      console.log('🗑️ Delete notification response:', response.data);
      setNotifications((prev) => prev.filter(n => n._id !== notificationId && n.notificationId !== notificationId));
      return response.data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  };

  // Get unread count
  const getUnreadCount = () => Array.isArray(notifications) ? notifications.filter((n) => !n.read).length : 0;

  const value = {
    notifications,
    loading,
    fetchNotifications,
    markAllAsRead,
    markAsRead,
    deleteAllNotifications,
    deleteNotification,
    getUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 