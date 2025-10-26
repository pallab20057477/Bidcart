import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import { io } from 'socket.io-client';
import {
  FaArrowLeft,
  FaBox,
  FaShippingFast,
  FaMapMarkerAlt,
  FaHome,
  FaUser,
  FaMapPin,
  FaCheckCircle,
  FaInfoCircle,
  FaClock,
  FaPhone,
  FaEnvelope,
  FaCreditCard,
  FaTruck
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const VendorOrderDetail = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  const fetchOrderDetail = useCallback(async () => {
    if (!orderId) return;

    try {
      setLoading(true);
      const response = await api.get(`/vendors/orders/${orderId}`);
      setOrder(response.data);
    } catch (error) {
      console.error('Error fetching order detail:', error);
      toast.error('Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrderDetail();

    // Set up socket listener for real-time updates
    const handleStatusUpdate = (data) => {
      if (data.orderId === orderId) {
        // If the main order status was updated
        if (data.status) {
          setOrder(prev => ({
            ...prev,
            status: data.status,
            // Update all products status if order is delivered/cancelled
            products: prev.products.map(item => ({
              ...item,
              status: ['delivered', 'cancelled'].includes(data.status) ? data.status : item.status
            }))
          }));
        }
        // If an item status was updated
        else if (data.itemId) {
          setOrder(prev => ({
            ...prev,
            products: prev.products.map(item =>
              item._id === data.itemId ? { ...item, status: data.status } : item
            )
          }));
        }
      }
    };

    // Connect to Socket.IO with proper configuration
    const token = localStorage.getItem('token');
    const socket = io(process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      auth: {
        token: token
      }
    });

    socket.on('connect', () => {
      console.log('Socket.IO connected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
    });

    // Handle admin order status updates
    const handleVendorOrderUpdate = (data) => {
      console.log('Vendor order update received:', data);
      if (data.orderId === orderId || data.orderId.toString() === orderId) {
        // Refresh order details when admin updates the order
        fetchOrderDetail();
        toast.success(`Order #${data.orderNumber} has been updated by admin`);
      }
    };

    socket.on('order:status', handleStatusUpdate);
    socket.on('order:item-status', handleStatusUpdate);
    socket.on('vendor:order-update', handleVendorOrderUpdate);

    return () => {
      socket.off('order:status', handleStatusUpdate);
      socket.off('order:item-status', handleStatusUpdate);
      socket.off('vendor:order-update', handleVendorOrderUpdate);
      socket.disconnect();
    };
  }, [fetchOrderDetail, orderId]);

  const updateItemStatus = useCallback(async (itemId, newStatus) => {
    try {
      setUpdatingStatus(itemId);
      console.log('Updating item status:', { orderId, itemId, newStatus });
      console.log('API URL:', `/vendors/orders/${orderId}/item/${itemId}/status`);

      const response = await api.patch(`/vendors/orders/${orderId}/item/${itemId}/status`, {
        status: newStatus
      });

      console.log('Update response:', response.data);
      toast.success('Item status updated successfully');
      await fetchOrderDetail();
    } catch (error) {
      console.error('Error updating item status:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error(error.response?.data?.message || 'Failed to update item status');
    } finally {
      setUpdatingStatus(null);
    }
  }, [orderId, fetchOrderDetail]);

  const formatPrice = useCallback((price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }, []);

  const getStatusBadge = useCallback((status, isMainOrder = false) => {
    const statusClasses = {
      pending: 'badge-warning',
      processing: 'badge-info',
      shipped: 'badge-primary',
      'out-for-delivery': 'badge-secondary',
      'nearest-area': 'badge-accent',
      delivered: 'badge-success',
      cancelled: 'badge-error'
    };

    // If this is the main order status and it's delivered/cancelled, 
    // ensure all items show the same status
    const displayStatus = isMainOrder && ['delivered', 'cancelled'].includes(status) ?
      status : status;

    return (
      <span className={`badge ${statusClasses[displayStatus] || 'badge-neutral'}`}>
        {displayStatus}
      </span>
    );
  }, []);

  const getStatusIcon = useCallback((status) => {
    const icons = {
      pending: <FaBox className="text-warning" />,
      processing: <FaBox className="text-info" />,
      shipped: <FaShippingFast className="text-primary" />,
      'out-for-delivery': <FaShippingFast className="text-secondary" />,
      'nearest-area': <FaMapMarkerAlt className="text-accent" />,
      delivered: <FaHome className="text-success" />,
      cancelled: <FaBox className="text-error" />
    };
    return icons[status] || <FaBox />;
  }, []);

  const getNextStatus = useCallback((currentStatus) => {
    const statusFlow = {
      pending: 'processing',
      processing: 'shipped',
      shipped: 'out-for-delivery',
      'out-for-delivery': 'nearest-area',
      'nearest-area': 'delivered'
    };
    return statusFlow[currentStatus];
  }, []);

  const getVendorProducts = useCallback(() => {
    if (!order?.products) return [];

    // Ensure product status matches the order status if the order is delivered/cancelled
    return order.products.map(item => {
      // If order is delivered/cancelled, but product status is not updated yet
      if (['delivered', 'cancelled'].includes(order.status) && item.status !== order.status) {
        return { ...item, status: order.status };
      }
      return item;
    });
  }, [order]);

  const getVendorTotal = useCallback(() => {
    const vendorProducts = getVendorProducts();
    return vendorProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [getVendorProducts]);

  const renderLoading = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading order details...</p>
      </div>
    </div>
  );

  const renderNotFound = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaBox className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
        <p className="text-gray-600 mb-6">The order you're looking for doesn't exist or you don't have access to it.</p>
        <Link
          to="/vendor/orders"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
        >
          <FaArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Link>
      </div>
    </div>
  );

  if (loading) return renderLoading();
  if (!order) return renderNotFound();

  const vendorProducts = getVendorProducts();
  const vendorTotal = getVendorTotal();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/vendor/orders"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <FaArrowLeft className="w-4 h-4 mr-2" />
                Back to Orders
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Order #{order._id.slice(-8)}
                </h1>
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <FaClock className="w-4 h-4 mr-1" />
                  Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                </div>
              </div>
            </div>
            {order.status !== 'cancelled' && (
              <Link
                to={`/disputes/new?orderId=${order._id}`}
                className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg hover:bg-orange-200 transition-colors inline-flex items-center text-sm font-medium"
              >
                <FaInfoCircle className="w-4 h-4 mr-2" />
                Report Issue
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-start">
            <FaInfoCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">Vendor Order Management</h3>
              <p className="text-sm text-blue-700">
                You can only view and manage products that belong to your store in this order.
                Other vendor products are not shown here.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaBox className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Your Items</p>
                <p className="text-2xl font-bold text-gray-900">{vendorProducts.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FaCreditCard className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Your Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatPrice(vendorTotal)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                {getStatusIcon(order.status)}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Order Status</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">{order.status}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FaCreditCard className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Payment</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">{order.paymentStatus}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">

            {/* Products Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FaBox className="w-5 h-5 mr-2 text-gray-600" />
                  Your Products ({vendorProducts.length})
                </h2>
              </div>
              <div className="p-6">
                {vendorProducts.length > 0 ? (
                  <div className="space-y-6">
                    {vendorProducts.map((item) => {
                      const nextStatus = getNextStatus(item.status);
                      return (
                        <div key={item._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
                          <div className="flex items-start space-x-4">
                            <img
                              src={item.product?.images?.[0] || '/placeholder-image.jpg'}
                              alt={item.product?.name}
                              className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                              onError={(e) => {
                                e.target.src = '/placeholder-image.jpg';
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.product?.name}</h3>
                                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                                    <div>
                                      <span className="font-medium">Quantity:</span> {item.quantity}
                                    </div>
                                    <div>
                                      <span className="font-medium">Unit Price:</span> {formatPrice(item.price)}
                                    </div>
                                    <div>
                                      <span className="font-medium">SKU:</span> {item.product?.sku || 'N/A'}
                                    </div>
                                    <div>
                                      <span className="font-medium">Total:</span> <span className="font-semibold text-gray-900">{formatPrice(item.price * item.quantity)}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end space-y-3">
                                  <div className="flex items-center">
                                    {item.status === 'delivered' ? (
                                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                        <FaCheckCircle className="w-4 h-4 mr-1" />
                                        Delivered
                                      </span>
                                    ) : item.status === 'cancelled' ? (
                                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                        Cancelled
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 capitalize">
                                        {item.status.replace('-', ' ')}
                                      </span>
                                    )}
                                  </div>
                                  {nextStatus && (
                                    <button
                                      onClick={() => updateItemStatus(item._id, nextStatus)}
                                      disabled={updatingStatus === item._id}
                                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {updatingStatus === item._id ? (
                                        <>
                                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                          Updating...
                                        </>
                                      ) : (
                                        <>
                                          {getStatusIcon(nextStatus)}
                                          <span className="ml-2">Mark as {nextStatus.replace('-', ' ')}</span>
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaBox className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Found</h3>
                    <p className="text-gray-600">This order doesn't contain any products from your store.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FaUser className="w-5 h-5 mr-2 text-gray-600" />
                  Customer Information
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center">
                  <FaUser className="w-4 h-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Full Name</p>
                    <p className="font-medium text-gray-900">{order.user?.name}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <FaEnvelope className="w-4 h-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Email Address</p>
                    <p className="font-medium text-gray-900">{order.user?.email}</p>
                  </div>
                </div>
                {order.user?.phone && (
                  <div className="flex items-center">
                    <FaPhone className="w-4 h-4 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Phone Number</p>
                      <p className="font-medium text-gray-900">{order.user.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FaMapPin className="w-5 h-5 mr-2 text-gray-600" />
                  Shipping Address
                </h2>
              </div>
              <div className="p-6">
                <div className="flex items-start">
                  <FaMapMarkerAlt className="w-4 h-4 text-gray-400 mr-3 mt-1" />
                  <div className="space-y-1">
                    <p className="font-medium text-gray-900">{order.shippingAddress?.name}</p>
                    <p className="text-gray-600">{order.shippingAddress?.street}</p>
                    <p className="text-gray-600">
                      {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}
                    </p>
                    <p className="text-gray-600">{order.shippingAddress?.country}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Order Details</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <FaBox className="w-4 h-4 text-gray-400 mr-3" />
                    <span className="text-gray-600">Order Status</span>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                    }`}>
                    {order.status.replace('-', ' ')}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <FaCreditCard className="w-4 h-4 text-gray-400 mr-3" />
                    <span className="text-gray-600">Payment Status</span>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${order.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                    {order.paymentStatus}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <FaTruck className="w-4 h-4 text-gray-400 mr-3" />
                    <span className="text-gray-600">Shipping Method</span>
                  </div>
                  <span className="font-medium text-gray-900 capitalize">{order.shippingMethod}</span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <FaCreditCard className="w-4 h-4 text-gray-400 mr-3" />
                    <span className="text-gray-600">Payment Method</span>
                  </div>
                  <span className="font-medium text-gray-900 capitalize">{order.paymentMethod}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorOrderDetail;
