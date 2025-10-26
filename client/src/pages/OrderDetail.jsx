import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { FaArrowLeft, FaBox, FaShippingFast, FaMapMarkerAlt, FaHome, FaCreditCard, FaTruck, FaExclamationTriangle, FaRedo, FaExclamationCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../utils/api';
import PaymentButton from '../components/PaymentButton';

const OrderDetail = () => {
  const { orderId } = useParams();
  const { subscribeOrderStatus, subscribeDeliveryUpdate } = useSocket();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentRetry, setShowPaymentRetry] = useState(false);

  const fetchOrderDetailMemoized = React.useCallback(async () => {
    if (!orderId || orderId === 'undefined') {
      const errorMsg = 'No order ID found in URL';
      console.error(errorMsg);
      toast.error('Invalid order ID');
      setOrder({
        error: true,
        message: errorMsg,
        status: 'error',
        code: 'MISSING_ORDER_ID'
      });
      setLoading(false);
      return;
    }

    console.log('Fetching order with ID:', orderId);

    console.log('Order ID from URL:', orderId);
    setLoading(true);

    // Retry mechanism with exponential backoff
    const retryFetch = async (attempt = 1) => {
      try {
        console.log(`Fetching order detail... Attempt ${attempt}`);
        console.log('Making API call to:', `/orders/${orderId}`);
        const response = await api.get(`/orders/${orderId}`);
        console.log('Order detail response status:', response.status);
        console.log('Order detail response data:', response.data);

        if (!response) {
          throw new Error('No response received from server');
        }

        if (!response.data) {
          throw new Error('No data in response from server');
        }

        // Check for error response from server
        if (response.data.error) {
          throw new Error(response.data.message || 'Server returned an error');
        }

        // Handle case where order is not found (404)
        if (response.status === 404) {
          throw new Error('Order not found');
        }

        // The actual order data might be nested in a data property or at the root
        const orderData = response.data.order || response.data;

        if (!orderData) {
          throw new Error('No order data in response');
        }

        // Validate required fields in the response
        if (!orderData._id) {
          console.error('Invalid order data structure - missing _id:', orderData);
          throw new Error('Invalid order data: missing order ID');
        }

        if (!orderData.products || !Array.isArray(orderData.products)) {
          console.error('Invalid order data structure - missing products array:', orderData);
          throw new Error('Invalid order data: missing products');
        }

        setOrder(orderData);
        return orderData;
      } catch (error) {
        console.error(`Error fetching order detail (attempt ${attempt}):`, error);

        let errorMessage = 'Failed to fetch order details';
        let statusCode = error.response?.status;

        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error('Error response data:', error.response.data);
          console.error('Error status:', error.response.status);
          console.error('Error headers:', error.response.headers);

          errorMessage = error.response.data?.message ||
            error.response.data?.error ||
            error.message ||
            `Server responded with status ${statusCode}`;
        } else if (error.request) {
          // The request was made but no response was received
          console.error('No response received:', error.request);
          errorMessage = 'No response from server. Please check your connection.';
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('Error setting up request:', error.message);
          errorMessage = `Request setup error: ${error.message}`;
        }

        // Only show error after 3 attempts or if it's a 404
        if (attempt >= 3 || statusCode === 404) {
          toast.error(errorMessage);
          // Set a minimal order object to prevent infinite loading
          setOrder({
            _id: orderId,
            error: true,
            message: errorMessage,
            status: 'error',
            statusCode: statusCode || 'unknown'
          });
          return null;
        }

        // Wait before retry (exponential backoff with jitter)
        const delay = Math.min(Math.pow(2, attempt) * 1000, 10000); // Max 10s delay
        const jitter = Math.random() * 1000; // Add some jitter
        await new Promise(resolve => setTimeout(resolve, delay + jitter));
        return retryFetch(attempt + 1);
      } finally {
        setLoading(false);
      }
    };

    await retryFetch();
  }, [orderId]);

  useEffect(() => {
    fetchOrderDetailMemoized();
  }, [fetchOrderDetailMemoized]);

  useEffect(() => {
    if (!orderId) return;

    // Subscribe to real-time order status and delivery updates for this order
    const unsubOrder = subscribeOrderStatus((data) => {
      if (data.orderId === orderId) {
        fetchOrderDetailMemoized(); // Refetch full order details
      }
    });

    const unsubDelivery = subscribeDeliveryUpdate((data) => {
      if (data.orderId === orderId) {
        fetchOrderDetailMemoized(); // Refetch full order details
      }
    });

    return () => {
      unsubOrder();
      unsubDelivery();
    };
  }, [orderId, subscribeOrderStatus, subscribeDeliveryUpdate, fetchOrderDetailMemoized]);

  // Format date to a readable string
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };



  const getStatusIcon = (status) => {
    const icons = {
      pending: <FaBox className="text-warning" />,
      processing: <FaBox className="text-info" />,
      shipped: <FaShippingFast className="text-primary" />,
      'out for delivery': <FaTruck className="text-secondary" />,
      'nearest area': <FaMapMarkerAlt className="text-accent" />,
      delivered: <FaHome className="text-success" />,
      cancelled: <FaBox className="text-error" />
    };
    return icons[status] || <FaBox />;
  };

  // formatDate function is already defined above

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <div className="loading loading-spinner loading-lg text-primary"></div>
        <p className="text-lg text-gray-600">Loading order details...</p>
      </div>
    );
  }

  if (!order || order.error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {order?.error ? 'Error Loading Order' : 'Order Not Found'}
          </h1>
          <p className="text-gray-600 mb-6">
            {order?.message || 'We couldn\'t find the order you\'re looking for.'}
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/orders" className="btn btn-primary">
              View My Orders
            </Link>
            <Link to="/" className="btn btn-outline">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/orders"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors mb-4"
          >
            <FaArrowLeft className="mr-2 w-4 h-4" />
            Back to Orders
          </Link>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  Order #{order._id.slice(-8)}
                </h1>
                <p className="text-gray-600">
                  Placed on {formatDate(order.createdAt)}
                </p>
              </div>

              <div className="mt-4 md:mt-0 flex flex-col md:flex-row items-start md:items-center space-y-3 md:space-y-0 md:space-x-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{formatPrice(order.totalAmount)}</div>
                  <div className="text-sm text-gray-500">Total Amount</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{order.products.length}</div>
                  <div className="text-sm text-gray-500">Items</div>
                </div>
                {order.status !== 'cancelled' && (
                  <Link
                    to="/disputes/new"
                    className="btn btn-sm btn-outline btn-error gap-2"
                  >
                    <FaExclamationCircle className="w-4 h-4" />
                    Create Dispute
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Order Status Card */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    order.status === 'shipped' || order.status === 'out for delivery' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                  }`}>
                  {getStatusIcon(order.status)}
                  <span className="ml-2 capitalize">{order.status}</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">Order Status</div>
              </div>

              <div className="text-center">
                <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${order.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                    order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                  }`}>
                  <FaCreditCard className="w-4 h-4 mr-2" />
                  {order.paymentStatus}
                </div>
                <div className="text-sm text-gray-500 mt-1">Payment Status</div>
              </div>

              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {order.paymentMethod || 'Not specified'}
                </div>
                <div className="text-sm text-gray-500 mt-1">Payment Method</div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Retry Section */}
        {(order.paymentStatus === 'failed' || order.paymentStatus === 'pending') && order.paymentMethod !== 'cod' && (
          <div className="mb-6">
            <div className={`rounded-lg shadow-sm p-6 border-2 ${
              order.paymentStatus === 'failed' 
                ? 'bg-red-50 border-red-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-start">
                <FaExclamationTriangle className={`w-6 h-6 mr-3 mt-1 ${
                  order.paymentStatus === 'failed' ? 'text-red-600' : 'text-yellow-600'
                }`} />
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold mb-2 ${
                    order.paymentStatus === 'failed' ? 'text-red-900' : 'text-yellow-900'
                  }`}>
                    {order.paymentStatus === 'failed' 
                      ? 'Payment Failed' 
                      : 'Payment Pending'}
                  </h3>
                  <p className={`mb-4 ${
                    order.paymentStatus === 'failed' ? 'text-red-800' : 'text-yellow-800'
                  }`}>
                    {order.paymentStatus === 'failed'
                      ? 'Your payment could not be processed. Please try again to complete your order.'
                      : 'Your payment is still pending. Complete the payment to process your order.'}
                  </p>
                  
                  {!showPaymentRetry ? (
                    <button
                      onClick={() => setShowPaymentRetry(true)}
                      className={`btn btn-sm gap-2 ${
                        order.paymentStatus === 'failed' 
                          ? 'btn-error' 
                          : 'btn-warning'
                      }`}
                    >
                      <FaRedo className="w-4 h-4" />
                      {order.paymentStatus === 'failed' ? 'Retry Payment' : 'Complete Payment'}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm font-medium text-gray-700">Order Total:</span>
                          <span className="text-lg font-bold text-gray-900">{formatPrice(order.totalAmount)}</span>
                        </div>
                        <PaymentButton
                          orderId={order._id}
                          amount={order.totalAmount}
                          paymentMethod={order.paymentMethod}
                          onSuccess={(data) => {
                            toast.success('Payment successful!');
                            setShowPaymentRetry(false);
                            fetchOrderDetailMemoized();
                          }}
                          onError={(error) => {
                            toast.error('Payment failed. Please try again.');
                            console.error('Payment error:', error);
                          }}
                        />
                      </div>
                      <button
                        onClick={() => setShowPaymentRetry(false)}
                        className="btn btn-ghost btn-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm p-6 border">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.products.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <img
                        src={item.product?.images?.[0] || '/placeholder-image.jpg'}
                        alt={item.product?.name}
                        className="w-20 h-20 object-cover rounded-md border"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1">{item.product?.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>Qty: {item.quantity}</span>
                          <span>×</span>
                          <span>{formatPrice(item.price)}</span>
                        </div>
                        {item.status && (
                          <div className="mt-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${item.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                item.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                  item.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                              }`}>
                              {item.status}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          {formatPrice(item.price * item.quantity)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Timeline */}
            <div className="bg-white rounded-lg shadow-sm p-6 border">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Timeline</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3 mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">Order Placed</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                </div>

                {order.status !== 'pending' && (
                  <div className="flex items-start">
                    <div className={`w-3 h-3 rounded-full mr-3 mt-2 ${['processing', 'shipped', 'out for delivery', 'nearest area', 'delivered'].includes(order.status)
                        ? 'bg-blue-500'
                        : 'bg-gray-300'
                      }`}></div>
                    <div>
                      <p className="font-medium text-gray-900">Processing Started</p>
                      <p className="text-sm text-gray-600">Items being prepared</p>
                    </div>
                  </div>
                )}

                {['shipped', 'out for delivery', 'nearest area', 'delivered'].includes(order.status) && (
                  <div className="flex items-start">
                    <div className={`w-3 h-3 rounded-full mr-3 mt-2 ${['shipped', 'out for delivery', 'nearest area', 'delivered'].includes(order.status)
                        ? 'bg-indigo-500'
                        : 'bg-gray-300'
                      }`}></div>
                    <div>
                      <p className="font-medium text-gray-900">Shipped</p>
                      <p className="text-sm text-gray-600">On the way to you</p>
                    </div>
                  </div>
                )}

                {['out for delivery', 'nearest area', 'delivered'].includes(order.status) && (
                  <div className="flex items-start">
                    <div className={`w-3 h-3 rounded-full mr-3 mt-2 ${['out for delivery', 'nearest area', 'delivered'].includes(order.status)
                        ? 'bg-orange-500'
                        : 'bg-gray-300'
                      }`}></div>
                    <div>
                      <p className="font-medium text-gray-900">Out for Delivery</p>
                      <p className="text-sm text-gray-600">Package is on its way</p>
                    </div>
                  </div>
                )}

                {order.status === 'delivered' && (
                  <div className="flex items-start">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3 mt-2"></div>
                    <div>
                      <p className="font-medium text-gray-900">Delivered</p>
                      <p className="text-sm text-gray-600">Order completed successfully</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Information */}
            {order.shippingAddress && (
              <div className="bg-white rounded-lg shadow-sm p-6 border">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FaTruck className="mr-2 w-5 h-5 text-blue-600" />
                  Shipping Address
                </h2>
                <div className="space-y-2">
                  <p className="font-medium text-gray-900">{order.shippingAddress.street}</p>
                  <p className="text-gray-600">
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                  </p>
                  <p className="text-gray-600">{order.shippingAddress.country}</p>
                  {order.shippingAddress.phone && (
                    <p className="text-gray-600">Phone: {order.shippingAddress.phone}</p>
                  )}
                  {order.shippingMethod && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-500">Shipping Method</p>
                      <p className="font-medium text-gray-900 capitalize">{order.shippingMethod}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6 border">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FaCreditCard className="mr-2 w-5 h-5 text-green-600" />
                Payment Summary
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>{formatPrice(order.totalAmount - (order.shippingCost || 0) - (order.taxAmount || 0))}</span>
                </div>

                {order.shippingCost > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping:</span>
                    <span>{formatPrice(order.shippingCost)}</span>
                  </div>
                )}

                {order.taxAmount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Tax:</span>
                    <span>{formatPrice(order.taxAmount)}</span>
                  </div>
                )}

                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-{formatPrice(order.discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between font-semibold text-lg text-gray-900 border-t border-gray-200 pt-3">
                  <span>Total:</span>
                  <span>{formatPrice(order.totalAmount)}</span>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Payment Method:</span>
                    <span className="font-medium text-gray-900 capitalize">
                      {order.paymentMethod || 'Not specified'}
                    </span>
                  </div>
                  {order.paymentId && (
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-500">Transaction ID:</span>
                      <span className="font-mono text-sm text-gray-700">
                        {order.paymentId}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail; 