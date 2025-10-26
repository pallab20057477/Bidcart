import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaEye, FaTruck, FaCheck, FaTimes, FaClock, FaBox, FaShippingFast, FaMapMarkerAlt, FaHome, FaStar, FaShoppingBag, FaReceipt, FaChevronRight, FaCreditCard } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useSocket } from '../contexts/SocketContext';
import ReviewForm from '../components/ReviewForm';
import DisputeButton from '../components/DisputeButton';
import DisputeStatus from '../components/DisputeStatus';

const Orders = () => {
  const { user } = useAuth();
  const { subscribeOrderStatus, subscribePaymentStatus } = useSocket();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [reviewedProducts, setReviewedProducts] = useState(new Set());
  const [orderDisputes, setOrderDisputes] = useState({});

  useEffect(() => {
    fetchOrders();
    fetchReviewedProducts();
  }, []);

  // Subscribe to real-time order status updates
  useEffect(() => {
    const unsubOrder = subscribeOrderStatus((data) => {
      toast(`Order status updated to ${data.status}`);
      
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === data.orderId
            ? { ...order, status: data.status }
            : order
        )
      );
    });

    const unsubPayment = subscribePaymentStatus((data) => {
      toast(`Payment status updated to ${data.paymentStatus}`);
      
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === data.orderId
            ? { ...order, paymentStatus: data.paymentStatus }
            : order
        )
      );
    });

    return () => {
      unsubOrder();
      unsubPayment();
    };
  }, [subscribeOrderStatus, subscribePaymentStatus]);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders/user');
      const ordersData = response.data.orders || response.data || [];
      setOrders(ordersData);
      
      // Fetch disputes for these orders
      if (ordersData.length > 0) {
        fetchOrderDisputes(ordersData.map(order => order._id));
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDisputes = async (orderIds) => {
    try {
      const response = await api.get(`/disputes/by-orders?orderIds=${orderIds.join(',')}`);
      const disputesMap = {};
      
      if (response.data.success && response.data.disputes) {
        response.data.disputes.forEach(dispute => {
          disputesMap[dispute.orderId] = dispute;
        });
      }
      
      setOrderDisputes(disputesMap);
    } catch (error) {
      console.error('Error fetching order disputes:', error);
      // Don't show error toast for disputes as it's not critical
    }
  };

  const fetchReviewedProducts = async () => {
    try {
      const response = await api.get('/reviews/user/my-reviews');
      const reviewedIds = new Set(response.data.reviews.map(review => review.product));
      setReviewedProducts(reviewedIds);
    } catch (error) {
      console.error('Error fetching reviewed products:', error);
    }
  };

  const handleLeaveReview = (product) => {
    setSelectedProduct(product);
    setShowReviewModal(true);
  };

  const handleReviewSubmitted = (review) => {
    setShowReviewModal(false);
    setSelectedProduct(null);
    setReviewedProducts(prev => new Set([...prev, review.product]));
    toast.success('Review submitted successfully!');
  };

  const canReviewProduct = (productId) => {
    return !reviewedProducts.has(productId);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'out for delivery':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FaClock className="w-4 h-4" />;
      case 'processing':
        return <FaBox className="w-4 h-4" />;
      case 'shipped':
        return <FaShippingFast className="w-4 h-4" />;
      case 'out for delivery':
        return <FaTruck className="w-4 h-4" />;
      case 'delivered':
        return <FaHome className="w-4 h-4" />;
      case 'cancelled':
        return <FaTimes className="w-4 h-4" />;
      default:
        return <FaClock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Simple Header */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">My Orders</h1>
                <p className="text-gray-600">Track and manage your orders</p>
              </div>
              
              {/* Simple Stats */}
              <div className="mt-4 md:mt-0 flex gap-6">
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">{orders.length}</div>
                  <div className="text-sm text-gray-500">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">{orders.filter(o => o.status === 'delivered').length}</div>
                  <div className="text-sm text-gray-500">Delivered</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600">{orders.filter(o => ['shipped', 'out for delivery'].includes(o.status)).length}</div>
                  <div className="text-sm text-gray-500">In Transit</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Simple Filter Tabs */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="flex flex-wrap gap-2">
              <button
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setFilter('all')}
              >
                All Orders ({orders.length})
              </button>
              <button
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'pending' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setFilter('pending')}
              >
                Pending ({orders.filter(o => o.status === 'pending').length})
              </button>
              <button
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'processing' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setFilter('processing')}
              >
                Processing ({orders.filter(o => o.status === 'processing').length})
              </button>
              <button
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'shipped' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setFilter('shipped')}
              >
                Shipped ({orders.filter(o => o.status === 'shipped').length})
              </button>
              <button
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'delivered' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setFilter('delivered')}
              >
                Delivered ({orders.filter(o => o.status === 'delivered').length})
              </button>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center border">
            <FaShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h2>
            <p className="text-gray-500 mb-6">
              {filter === 'all'
                ? "You haven't placed any orders yet. Start shopping to see your orders here."
                : `No ${filter} orders found.`
              }
            </p>
            {filter === 'all' ? (
              <Link
                to="/products"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                <FaShoppingBag className="mr-2" />
                Start Shopping
              </Link>
            ) : (
              <button
                onClick={() => setFilter('all')}
                className="inline-flex items-center px-6 py-3 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700 transition-colors"
              >
                View All Orders
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                {/* Order Header */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                    <div className="flex items-center mb-2 sm:mb-0">
                      <FaReceipt className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            Order #{order._id.slice(-8)}
                          </h3>
                          {/* Auction Winner Badge */}
                          {order.auctionDetails && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                              🏆 Auction Win
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {order.auctionDetails 
                            ? `Won on ${formatDate(order.auctionDetails.auctionEndTime || order.createdAt)}`
                            : `Placed on ${formatDate(order.createdAt)}`
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-2 capitalize">{order.status}</span>
                      </span>
                    </div>
                  </div>
                  
                  {/* Auction Details Banner */}
                  {order.auctionDetails && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-2xl mr-2">🎉</span>
                          <div>
                            <p className="text-sm font-semibold text-amber-900">
                              Congratulations! You won this auction
                            </p>
                            <p className="text-xs text-amber-700">
                              Winning Bid: {formatPrice(order.auctionDetails.winningBid)}
                            </p>
                          </div>
                        </div>
                        {order.paymentStatus === 'pending' && (
                          <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded">
                            Complete payment to confirm
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Order Items */}
                <div className="p-4">
                  <div className="space-y-3">
                    {order.products.map((item, index) => (
                      <div key={index} className="flex items-center space-x-4">
                        <div className="relative">
                          <img
                            src={item.product?.images?.[0] || '/placeholder-image.jpg'}
                            alt={item.product?.name || 'Product'}
                            className="w-16 h-16 object-cover rounded-md border"
                          />
                          {/* Auction Badge on Image */}
                          {item.mode === 'auction' && (
                            <div className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                              🏆
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900 truncate">
                              {item.product?.name || 'Product'}
                            </h4>
                            {item.mode === 'auction' && (
                              <span className="text-xs font-semibold text-amber-600">
                                (Auction)
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            Qty: {item.quantity} × {formatPrice(item.price)}
                            {item.mode === 'auction' && (
                              <span className="ml-2 text-amber-600 font-medium">
                                • Winning Bid
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {formatPrice(item.quantity * item.price)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                    <div className="flex items-center space-x-4 mb-3 sm:mb-0">
                      <div>
                        <span className="text-sm text-gray-500">Total: </span>
                        <span className="font-bold text-lg text-gray-900">
                          {formatPrice(order.totalAmount)}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 mr-2">Payment:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          order.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                          order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {/* Quick Payment Button for Pending/Failed Payments */}
                      {(order.paymentStatus === 'pending' || order.paymentStatus === 'failed') && order.paymentMethod !== 'cod' && (
                        <Link
                          to={`/orders/${order._id}`}
                          className={`inline-flex items-center px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md transition-colors ${
                            order.auctionDetails 
                              ? 'bg-amber-600 hover:bg-amber-700 animate-pulse' 
                              : 'bg-orange-600 hover:bg-orange-700'
                          }`}
                        >
                          <FaCreditCard className="mr-2 w-4 h-4" />
                          {order.auctionDetails 
                            ? '🏆 Pay to Claim Win' 
                            : order.paymentStatus === 'failed' ? 'Retry Payment' : 'Complete Payment'
                          }
                        </Link>
                      )}
                      
                      <Link
                        to={`/orders/${order._id}`}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        <FaEye className="mr-2 w-4 h-4" />
                        View Details
                      </Link>
                      
                      {/* Dispute Status or Button */}
                      {orderDisputes[order._id] ? (
                        <DisputeStatus dispute={orderDisputes[order._id]} />
                      ) : (
                        <DisputeButton 
                          order={order} 
                          onDisputeCreated={(dispute) => {
                            toast.success('Dispute created successfully');
                            // Update local state to show the new dispute
                            setOrderDisputes(prev => ({
                              ...prev,
                              [order._id]: dispute
                            }));
                          }}
                        />
                      )}
                      
                      {order.status === 'delivered' && order.products.map((item, index) => (
                        <div key={index}>
                          {canReviewProduct(item.product?._id) ? (
                            <button
                              onClick={() => handleLeaveReview(item.product)}
                              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
                            >
                              <FaStar className="mr-2 w-4 h-4" />
                              Review
                            </button>
                          ) : (
                            <span className="inline-flex items-center px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-md">
                              <FaCheck className="mr-2 w-4 h-4" />
                              Reviewed
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Review Modal */}
        {showReviewModal && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Write a Review</h3>
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <img
                      src={selectedProduct.images?.[0] || '/placeholder-image.jpg'}
                      alt={selectedProduct.name}
                      className="w-16 h-16 object-cover rounded-md mr-4"
                    />
                    <div>
                      <h4 className="font-medium text-gray-900">{selectedProduct.name}</h4>
                      <p className="text-sm text-gray-500">{selectedProduct.category}</p>
                    </div>
                  </div>
                </div>
                
                <ReviewForm
                  productId={selectedProduct._id}
                  onReviewSubmitted={handleReviewSubmitted}
                  onCancel={() => setShowReviewModal(false)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;