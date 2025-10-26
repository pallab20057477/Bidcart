import React, { useState, useEffect } from 'react';
import { FaBell, FaTrash, FaCheck, FaEye, FaSearch, FaTimes, FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaGift } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useSocket } from '../contexts/SocketContext';
import { useNotification } from '../contexts/NotificationContext';
import api from '../utils/api';

const Notifications = () => {
  const {
    notifications,
    loading,
    markAllAsRead,
    markAsRead,
    fetchNotifications
  } = useNotification();
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const { socket } = useSocket();

  // Listen for notification:update events and refetch notifications
  useEffect(() => {
    if (!socket) return;
    const handler = () => {
      fetchNotifications();
    };
    socket.on('notification:update', handler);
    return () => {
      socket.off('notification:update', handler);
    };
  }, [socket, fetchNotifications]);

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      fetchNotifications();
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const deleteSelectedNotifications = async () => {
    if (selectedNotifications.length === 0) {
      toast.error('Please select notifications to delete');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete ${selectedNotifications.length} notification(s)?`)) {
      return;
    }
    try {
      for (const id of selectedNotifications) {
        await api.delete(`/notifications/${id}`);
      }
      fetchNotifications();
      setSelectedNotifications([]);
      setSelectAll(false);
      toast.success(`${selectedNotifications.length} notification(s) deleted`);
    } catch (error) {
      toast.error('Failed to delete notifications');
    }
  };

  const deleteAllNotifications = async () => {
    if (!window.confirm('Are you sure you want to delete all notifications?')) {
      return;
    }
    try {
      await api.delete('/notifications');
      fetchNotifications();
      setSelectedNotifications([]);
      setSelectAll(false);
      toast.success('All notifications deleted');
    } catch (error) {
      toast.error('Failed to delete all notifications');
    }
  };

  const handleSelectNotification = (notificationId) => {
    setSelectedNotifications(prev =>
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedNotifications([]);
      setSelectAll(false);
    } else {
      const filteredNotifications = getFilteredNotifications();
      setSelectedNotifications(filteredNotifications.map(n => n._id));
      setSelectAll(true);
    }
  };

  const getFilteredNotifications = () => {
    // Ensure notifications is an array
    if (!Array.isArray(notifications)) {
      return [];
    }
    
    let filtered = notifications;
    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.read);
    } else if (filter === 'read') {
      filtered = filtered.filter(n => n.read);
    }
    if (searchTerm) {
      filtered = filtered.filter(n =>
        (n.message && n.message.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (n.type && n.type.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    return filtered;
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'win': return <FaGift className="w-5 h-5 text-yellow-500" />;
      case 'order': return <FaCheckCircle className="w-5 h-5 text-blue-500" />;
      case 'product': return <FaInfoCircle className="w-5 h-5 text-green-500" />;
      case 'vendor': return <FaExclamationTriangle className="w-5 h-5 text-orange-500" />;
      case 'auction': return <FaBell className="w-5 h-5 text-purple-500" />;
      default: return <FaBell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'win': return 'bg-yellow-100 text-yellow-800';
      case 'order': return 'bg-blue-100 text-blue-800';
      case 'product': return 'bg-green-100 text-green-800';
      case 'vendor': return 'bg-orange-100 text-orange-800';
      case 'auction': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getNotificationBg = (type, isRead) => {
    if (isRead) return 'bg-white';
    switch (type) {
      case 'win': return 'bg-yellow-50 border-l-4 border-yellow-400';
      case 'order': return 'bg-blue-50 border-l-4 border-blue-400';
      case 'product': return 'bg-green-50 border-l-4 border-green-400';
      case 'vendor': return 'bg-orange-50 border-l-4 border-orange-400';
      case 'auction': return 'bg-purple-50 border-l-4 border-purple-400';
      default: return 'bg-gray-50 border-l-4 border-gray-400';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredNotifications = getFilteredNotifications();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div className="mb-4 md:mb-0">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Notifications</h1>
                <p className="text-gray-600">Stay updated with your latest activities</p>
              </div>
              
              {/* Stats */}
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">{Array.isArray(notifications) ? notifications.length : 0}</div>
                  <div className="text-sm text-gray-500">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600">{Array.isArray(notifications) ? notifications.filter(n => !n.read).length : 0}</div>
                  <div className="text-sm text-gray-500">Unread</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                {/* Search */}
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search notifications..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                {/* Filter */}
                <select
                  className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All Notifications</option>
                  <option value="unread">Unread Only</option>
                  <option value="read">Read Only</option>
                </select>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={markAllAsRead}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!Array.isArray(notifications) || notifications.filter(n => !n.read).length === 0}
                >
                  <FaCheck className="mr-2 w-4 h-4" />
                  Mark All Read
                </button>
                <button
                  onClick={deleteAllNotifications}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!Array.isArray(notifications) || notifications.length === 0}
                >
                  <FaTrash className="mr-2 w-4 h-4" />
                  Delete All
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Notifications List */}
        {filteredNotifications.length > 0 ? (
          <div className="space-y-3">
            {/* Selection Header */}
            {selectedNotifications.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-blue-800 font-medium">
                    {selectedNotifications.length} notification(s) selected
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={deleteSelectedNotifications}
                      className="inline-flex items-center px-3 py-1 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 transition-colors"
                    >
                      <FaTrash className="mr-1 w-3 h-3" />
                      Delete Selected
                    </button>
                    <button
                      onClick={() => {
                        setSelectedNotifications([]);
                        setSelectAll(false);
                      }}
                      className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <FaTimes className="mr-1 w-3 h-3" />
                      Clear Selection
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Select All */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  checked={selectAll}
                  onChange={handleSelectAll}
                />
                <span className="ml-3 text-sm font-medium text-gray-700">
                  Select all notifications
                </span>
              </label>
            </div>

            {/* Notifications */}
            {filteredNotifications.map(notification => (
              <div
                key={notification._id}
                className={`rounded-lg shadow-sm border transition-all hover:shadow-md ${
                  getNotificationBg(notification.type, notification.read)
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                      checked={selectedNotifications.includes(notification._id)}
                      onChange={() => handleSelectNotification(notification._id)}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        {getTypeIcon(notification.type)}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(notification.type)}`}>
                          {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                        </span>
                        {!notification.read && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            New
                          </span>
                        )}
                        <span className="text-sm text-gray-500 ml-auto">
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>
                      
                      <p className={`text-sm leading-relaxed ${
                        notification.read ? 'text-gray-600' : 'text-gray-900 font-medium'
                      }`}>
                        {notification.message}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification._id)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Mark as read"
                        >
                          <FaEye className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification._id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete notification"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <FaBell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || filter !== 'all' ? 'No notifications found' : 'No notifications yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'You\'ll receive notifications here for orders, auctions, and other activities'
              }
            </p>
            {(searchTerm || filter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilter('all');
                }}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications; 