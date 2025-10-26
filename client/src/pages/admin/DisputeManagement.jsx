import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import socketService from '../../utils/socket';
import { toast } from 'react-hot-toast';
import { 
  FaExclamationTriangle, 
  FaEye, 
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaFlag,
  FaClock,
  FaGavel,
  FaSearch,
  FaFilter,
  FaUser
} from 'react-icons/fa';

const DisputeManagement = () => {
  const [disputes, setDisputes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    search: ''
  });
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [resolutionData, setResolutionData] = useState({
    resolution: '',
    resolutionAmount: '',
    resolutionNotes: ''
  });

  useEffect(() => {
    fetchDisputes();
    fetchStats();
    
    // Initialize Socket.IO for admin monitoring
    socketService.connect();
    socketService.joinDisputesMonitoring();
    
    // Set up real-time event listeners
    socketService.onDisputeActivity(handleDisputeActivity);
    socketService.onDisputeNotification(handleDisputeNotification);
    
    // Cleanup on unmount
    return () => {
      socketService.leaveDisputesMonitoring();
      socketService.offDisputeActivity();
      socketService.offDisputeNotification();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filters]);

  const fetchDisputes = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...filters
      });

      const response = await api.get(`/disputes/admin/all?${params}`);
      setDisputes(response.data.disputes);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      toast.error('Failed to fetch disputes');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/disputes/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dispute stats:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ status: '', priority: '', category: '', search: '' });
    setCurrentPage(1);
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== '').length;
  };

  // Socket.IO event handlers for admin monitoring
  const handleDisputeActivity = (data) => {
    // Show toast notification for dispute activity
    toast(`${data.activity}`, {
      duration: 4000,
      position: 'top-right'
    });
    
    // Refresh disputes list to show updated data
    fetchDisputes();
    fetchStats();
  };

  const handleDisputeNotification = (data) => {
    // Show notification for dispute updates
    toast.success(data.message, {
      duration: 3000,
      position: 'top-right'
    });
    
    // Refresh data if needed
    if (data.type === 'resolved' || data.type === 'escalated') {
      fetchDisputes();
      fetchStats();
    }
  };



  const handleResolve = async (e) => {
    e.preventDefault();
    
    if (!resolutionData.resolution) {
      toast.error('Please select a resolution');
      return;
    }

    try {
      await api.put(`/disputes/${selectedDispute._id}/resolve`, resolutionData);
      toast.success('Dispute resolved successfully');
      setShowResolutionModal(false);
      setSelectedDispute(null);
      setResolutionData({ resolution: '', resolutionAmount: '', resolutionNotes: '' });
      fetchDisputes();
      fetchStats();
    } catch (error) {
      toast.error('Failed to resolve dispute');
    }
  };

  const handleEscalate = async (disputeId, reason) => {
    try {
      await api.put(`/disputes/${disputeId}/escalate`, { escalationReason: reason });
      toast.success('Dispute escalated successfully');
      fetchDisputes();
    } catch (error) {
      toast.error('Failed to escalate dispute');
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
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Dispute Management</h1>
              <p className="text-gray-600">Manage and resolve platform disputes efficiently</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search disputes..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  showFilters || getActiveFiltersCount() > 0
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FaFilter className="w-4 h-4" />
                Filters
                {getActiveFiltersCount() > 0 && (
                  <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {getActiveFiltersCount()}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 mb-1">Total Disputes</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalDisputes}</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <FaGavel className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 mb-1">Open</p>
                  <p className="text-3xl font-bold text-amber-600">{stats.openDisputes}</p>
                </div>
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                  <FaClock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 mb-1">Resolved</p>
                  <p className="text-3xl font-bold text-green-600">{stats.resolvedDisputes}</p>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                  <FaCheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 mb-1">Urgent</p>
                  <p className="text-3xl font-bold text-red-600">{stats.overdueDisputes}</p>
                </div>
                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                  <FaExclamationTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Filter Disputes</h3>
              {getActiveFiltersCount() > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear all filters
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={filters.priority}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            </div>
          </div>
        )}

        {/* Disputes Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              All Disputes ({disputes.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Dispute</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Complainant</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {disputes.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <FaGavel className="w-12 h-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No disputes found</h3>
                        <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  disputes.map((dispute) => (
                    <tr key={dispute._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 mb-1">{dispute.title}</div>
                          <div className="text-xs text-gray-500 font-mono">#{dispute.disputeId}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <FaUser className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{dispute.complainant?.name || 'Unknown User'}</div>
                            <div className="text-xs text-gray-500">{dispute.complainant?.email || 'No email'}</div>
                            {dispute.respondent && (
                              <div className="text-xs text-gray-400 mt-1">
                                vs {dispute.respondent.name}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {getCategoryLabel(dispute.category)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          dispute.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                          dispute.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                          dispute.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {dispute.priority?.charAt(0).toUpperCase() + dispute.priority?.slice(1) || 'Medium'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(dispute.status)}
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            dispute.status === 'open' ? 'bg-amber-100 text-amber-700' :
                            dispute.status === 'under_review' ? 'bg-blue-100 text-blue-700' :
                            dispute.status === 'resolved' ? 'bg-green-100 text-green-700' :
                            dispute.status === 'closed' ? 'bg-gray-100 text-gray-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {dispute.status.replace('_', ' ').charAt(0).toUpperCase() + dispute.status.replace('_', ' ').slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(dispute.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-3">
                          <Link
                            to={`/disputes/${dispute._id}`}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <FaEye className="w-4 h-4" />
                          </Link>
                          

                          
                          {dispute.status !== 'resolved' && dispute.status !== 'closed' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedDispute(dispute);
                                  setShowResolutionModal(true);
                                }}
                                className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                                title="Resolve Dispute"
                              >
                                <FaGavel className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => handleEscalate(dispute._id, 'Manual escalation')}
                                className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition-colors"
                                title="Escalate Dispute"
                              >
                                <FaFlag className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                
                <div className="flex items-center gap-1">
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
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          currentPage === pageNum
                            ? 'text-white bg-blue-600 border border-blue-600'
                            : 'text-gray-600 bg-white border border-gray-300 hover:bg-gray-50'
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
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Resolution Modal */}
        {showResolutionModal && selectedDispute && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Resolve Dispute</h3>
                    <p className="text-sm text-gray-600 mt-1">#{selectedDispute.disputeId}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowResolutionModal(false);
                      setSelectedDispute(null);
                      setResolutionData({ resolution: '', resolutionAmount: '', resolutionNotes: '' });
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FaTimesCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2">{selectedDispute.title}</h4>
                  <p className="text-sm text-gray-600">{selectedDispute.description}</p>
                </div>

                <form onSubmit={handleResolve} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Resolution Type *
                    </label>
                    <select
                      value={resolutionData.resolution}
                      onChange={(e) => setResolutionData(prev => ({ ...prev, resolution: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select resolution type</option>
                      <option value="refund_full">Full Refund</option>
                      <option value="refund_partial">Partial Refund</option>
                      <option value="replacement">Replacement</option>
                      <option value="compensation">Compensation</option>
                      <option value="warning_issued">Warning Issued</option>
                      <option value="account_suspended">Account Suspended</option>
                      <option value="dispute_dismissed">Dispute Dismissed</option>
                      <option value="mediation_required">Mediation Required</option>
                    </select>
                  </div>

                  {(resolutionData.resolution === 'refund_partial' || resolutionData.resolution === 'compensation') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={resolutionData.resolutionAmount}
                        onChange={(e) => setResolutionData(prev => ({ ...prev, resolutionAmount: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Resolution Notes
                    </label>
                    <textarea
                      value={resolutionData.resolutionNotes}
                      onChange={(e) => setResolutionData(prev => ({ ...prev, resolutionNotes: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24 resize-none"
                      placeholder="Provide detailed explanation of the resolution decision..."
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowResolutionModal(false);
                        setSelectedDispute(null);
                        setResolutionData({ resolution: '', resolutionAmount: '', resolutionNotes: '' });
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <FaGavel className="w-4 h-4" />
                      Resolve Dispute
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}


      </div>
    </div>
  );
};

export default DisputeManagement; 