import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiUser, FiMail, FiPhone, FiTruck, FiCreditCard } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const AdminOrderDetail = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    fetchOrderDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const fetchOrderDetail = async () => {
    try {
      console.log('Fetching admin order detail...');
      const response = await api.get(`/admin/orders/${orderId}`);
      console.log('Admin order detail response:', response.data);
      setOrder(response.data);
    } catch (error) {
      console.error('Error fetching order detail:', error);
      toast.error('Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (statusToUpdate = null) => {
    const status = statusToUpdate || newStatus;
    
    if (!status) {
      toast.error('Please select a status');
      return;
    }
    
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      toast.success('Order status updated successfully');
      setEditingStatus(false);
      setNewStatus('');
      fetchOrderDetail();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
      processing: 'bg-blue-50 text-blue-700 border-blue-200',
      shipped: 'bg-purple-50 text-purple-700 border-purple-200',
      delivered: 'bg-green-50 text-green-700 border-green-200',
      cancelled: 'bg-red-50 text-red-700 border-red-200',
      refunded: 'bg-gray-50 text-gray-700 border-gray-200'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium border ${statusStyles[status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
        {status}
      </span>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const statusStyles = {
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      completed: 'bg-green-50 text-green-700 border-green-200',
      failed: 'bg-red-50 text-red-700 border-red-200',
      refunded: 'bg-gray-50 text-gray-700 border-gray-200'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium border ${statusStyles[status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
        {status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Order Not Found</h1>
          <Link to="/admin/orders" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <FiArrowLeft className="mr-2" />
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link to="/admin/orders" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2">
              <FiArrowLeft className="mr-1" />
              Back to Orders
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Order #{order._id.slice(-8)}</h1>
            <p className="text-sm text-gray-500 mt-1">{formatDate(order.createdAt)}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{formatPrice(order.totalAmount)}</div>
            <div className="flex items-center gap-2 mt-1 justify-end">
              {getStatusBadge(order.status)}
              {getPaymentStatusBadge(order.paymentStatus)}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h2>
          <div className="flex flex-wrap gap-2">
            {order.status === 'pending' && (
              <button
                onClick={() => updateOrderStatus('confirmed')}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Confirm Order
              </button>
            )}
            
            {order.status === 'confirmed' && (
              <button
                onClick={() => updateOrderStatus('processing')}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Processing
              </button>
            )}
            
            {order.status === 'processing' && (
              <button
                onClick={() => updateOrderStatus('shipped')}
                className="px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Mark as Shipped
              </button>
            )}
            
            {order.status === 'shipped' && (
              <button
                onClick={() => updateOrderStatus('delivered')}
                className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Mark as Delivered
              </button>
            )}
            
            {order.paymentStatus === 'pending' && (
              <button
                onClick={async () => {
                  try {
                    console.log('Confirming payment for order:', orderId);
                    const response = await api.put(`/orders/${orderId}/payment-status`, { paymentStatus: 'completed' });
                    console.log('Payment confirmation response:', response.data);
                    toast.success('Payment confirmed successfully');
                    await fetchOrderDetail();
                  } catch (error) {
                    console.error('Payment confirmation error:', error);
                    console.error('Error response:', error.response?.data);
                    const errorMessage = error.response?.data?.message || 'Failed to confirm payment';
                    toast.error(errorMessage);
                  }
                }}
                className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Confirm Payment
              </button>
            )}
            
            {!['cancelled', 'delivered'].includes(order.status) && (
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to cancel this order?')) {
                    updateOrderStatus('cancelled');
                  }
                }}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Cancel Order
              </button>
            )}
            
            {/* Manual Status Update */}
            <button
              onClick={() => setEditingStatus(!editingStatus)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {editingStatus ? 'Close' : 'Custom Status'}
            </button>
          </div>
          
          {editingStatus && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Set custom status</p>
              <div className="flex items-center gap-2">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button
                  onClick={updateOrderStatus}
                  disabled={!newStatus}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  Update
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-5">

            {/* Order Items */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Order Items ({order.products.length})</h2>
              <div className="space-y-3">
                {order.products.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                    <img
                      src={item.product?.images?.[0] || '/placeholder-image.jpg'}
                      alt={item.product?.name}
                      className="w-16 h-16 object-cover rounded-md border border-gray-200"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{item.product?.name}</h3>
                      <p className="text-xs text-gray-500">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                      {item.vendor && (
                        <p className="text-xs text-gray-500">Vendor: {item.vendor.businessName || 'N/A'}</p>
                      )}
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Customer Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center mb-3">
                <FiUser className="mr-2 w-4 h-4" />
                Customer
              </h2>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-500">Name</p>
                  <p className="font-medium text-gray-900">{order.user?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500 flex items-center">
                    <FiMail className="mr-1 w-3 h-3" />
                    Email
                  </p>
                  <p className="font-medium text-gray-900">{order.user?.email || 'N/A'}</p>
                </div>
                {order.user?.phone && (
                  <div>
                    <p className="text-gray-500 flex items-center">
                      <FiPhone className="mr-1 w-3 h-3" />
                      Phone
                    </p>
                    <p className="font-medium text-gray-900">{order.user.phone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Information */}
            {order.shippingAddress && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h2 className="text-sm font-semibold text-gray-900 flex items-center mb-3">
                  <FiTruck className="mr-2 w-4 h-4" />
                  Shipping
                </h2>
                <div className="text-sm text-gray-900 space-y-1">
                  <p>{order.shippingAddress.street}</p>
                  <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                  <p>{order.shippingAddress.country}</p>
                  {order.shippingMethod && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500">Method</p>
                      <p className="font-medium">{order.shippingMethod}</p>
                    </div>
                  )}
                  {order.trackingNumber && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500">Tracking</p>
                      <p className="font-medium font-mono">{order.trackingNumber}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center mb-3">
                <FiCreditCard className="mr-2 w-4 h-4" />
                Payment
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-900">{formatPrice(order.totalAmount - (order.shippingCost || 0) - (order.taxAmount || 0))}</span>
                </div>
                {order.shippingCost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Shipping</span>
                    <span className="text-gray-900">{formatPrice(order.shippingCost)}</span>
                  </div>
                )}
                {order.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tax</span>
                    <span className="text-gray-900">{formatPrice(order.taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-base border-t border-gray-200 pt-2">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">{formatPrice(order.totalAmount)}</span>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500">Method</p>
                  <p className="font-medium text-gray-900">{order.paymentMethod || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetail; 