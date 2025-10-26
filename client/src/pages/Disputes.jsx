import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import { 
  FaExclamationTriangle, 
  FaPlus, 
  FaEye, 
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaFlag,
  FaComments
} from 'react-icons/fa';

const Disputes = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    category: ''
  });

  useEffect(() => {
    fetchDisputes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filters]);

  const fetchDisputes = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...filters
      });

      const response = await api.get(`/disputes?${params}`);
      setDisputes(response.data.disputes);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      toast.error('Failed to fetch disputes');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <FaExclamationTriangle className="text-warning" />;
      case 'under_review':
        return <FaHourglassHalf className="text-info" />;
      case 'resolved':
        return <FaCheckCircle className="text-success" />;
      case 'closed':
        return <FaTimesCircle className="text-error" />;
      case 'escalated':
        return <FaFlag className="text-error" />;
      default:
        return <FaClock className="text-gray-500" />;
    }
  };



  const getCategoryLabel = (category) => {
    const labels = {
      delivery_issue: 'Delivery Issue',
      fake_bidding: 'Fake Bidding',
      item_not_as_described: 'Item Not As Described',
      payment_issue: 'Payment Issue',
      refund_request: 'Refund Request',
      seller_misconduct: 'Seller Misconduct',
      buyer_misconduct: 'Buyer Misconduct',
      technical_issue: 'Technical Issue',
      other: 'Other'
    };
    return labels[category] || category;
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

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">My Disputes</h1>
              <p className="text-gray-600">Manage your dispute cases and track their progress</p>
            </div>
            <Link 
              to="/disputes/new" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaPlus className="mr-2 w-4 h-4" />
              New Dispute
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="under_review">Under Review</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
                <option value="escalated">Escalated</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                <option value="delivery_issue">Delivery Issue</option>
                <option value="fake_bidding">Fake Bidding</option>
                <option value="item_not_as_described">Item Not As Described</option>
                <option value="payment_issue">Payment Issue</option>
                <option value="refund_request">Refund Request</option>
                <option value="seller_misconduct">Seller Misconduct</option>
                <option value="buyer_misconduct">Buyer Misconduct</option>
                <option value="technical_issue">Technical Issue</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="md:col-span-2 flex items-end">
              <button
                onClick={() => setFilters({ status: '', category: '' })}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Disputes List */}
        {disputes.length > 0 ? (
          <div className="space-y-4">
            {disputes.map((dispute) => (
              <div key={dispute._id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {getStatusIcon(dispute.status)}
                        <h3 className="text-lg font-semibold text-gray-900">{dispute.title}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          dispute.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                          dispute.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
                          dispute.status === 'resolved' ? 'bg-green-100 text-green-800' :
                          dispute.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {dispute.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          dispute.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                          dispute.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                          dispute.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {dispute.priority?.toUpperCase() || 'MEDIUM'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <span>ID: {dispute.disputeId}</span>
                        <span>•</span>
                        <span>{getCategoryLabel(dispute.category)}</span>
                        <span>•</span>
                        <span>{formatDate(dispute.createdAt)}</span>
                      </div>

                      <p className="text-gray-700 mb-4 line-clamp-2">
                        {dispute.description}
                      </p>

                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <FaComments className="w-4 h-4" />
                          <span>{dispute.messages?.length || 0} messages</span>
                        </div>
                        {dispute.evidence?.length > 0 && (
                          <div className="flex items-center gap-1">
                            <FaFlag className="w-4 h-4" />
                            <span>{dispute.evidence.length} evidence</span>
                          </div>
                        )}
                        {(dispute.order || dispute.product) && (
                          <div className="flex items-center gap-1">
                            <FaExclamationTriangle className="w-4 h-4" />
                            <span>
                              {dispute.order && dispute.product ? 'Order & Product' :
                               dispute.order ? 'Order linked' : 'Product linked'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="ml-6">
                      <Link
                        to={`/disputes/${dispute._id}`}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <FaEye className="mr-2 w-4 h-4" />
                        View Details
                      </Link>
                    </div>
                  </div>

                  {/* Related Information */}
                  {(dispute.order || dispute.product) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {dispute.order && (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="font-medium text-gray-900">Order {dispute.order.orderNumber}</span>
                            <span className="text-gray-500">• ${dispute.order.totalAmount}</span>
                          </div>
                        )}
                        {dispute.product && (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span className="font-medium text-gray-900">{dispute.product.name}</span>
                            <span className="text-gray-500">• ${dispute.product.price}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <FaExclamationTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No disputes found</h3>
            <p className="text-gray-500 mb-6">
              {filters.status || filters.category 
                ? 'Try adjusting your filters or create a new dispute.'
                : 'You haven\'t created any disputes yet.'
              }
            </p>
            <Link 
              to="/disputes/new" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaPlus className="mr-2 w-4 h-4" />
              Create New Dispute
            </Link>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-lg shadow-sm border p-4 mt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          currentPage === pageNum
                            ? 'text-blue-600 bg-blue-50 border border-blue-300'
                            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Disputes; 