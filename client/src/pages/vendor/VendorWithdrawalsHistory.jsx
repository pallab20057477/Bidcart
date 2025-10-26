import { useState, useEffect, useCallback } from 'react';
import {
  FaHistory, FaSearch, FaDownload, FaEye, FaTimes,
  FaCheck, FaClock, FaExclamationTriangle, FaSync, FaCalendar,
  FaUniversity, FaPaypal, FaCreditCard, FaArrowLeft
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const VendorWithdrawalsHistory = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [withdrawals, setWithdrawals] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });

  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: '30',
    searchTerm: ''
  });

  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchWithdrawals = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: 15,
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.dateRange && { dateRange: filters.dateRange }),
        ...(filters.searchTerm && { search: filters.searchTerm })
      });

      const response = await api.get(`/vendors/withdrawals?${params}`);
      
      if (response.data.success) {
        setWithdrawals(response.data.data.withdrawals || []);
        setPagination(response.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          total: 0
        });
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      toast.error('Failed to load withdrawal history');
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, filters]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchWithdrawals();
    setRefreshing(false);
    toast.success('History refreshed successfully');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    fetchWithdrawals();
  };

  const handleCancelWithdrawal = async (withdrawalId) => {
    if (!window.confirm('Are you sure you want to cancel this withdrawal?')) return;

    try {
      const response = await api.patch(`/vendors/withdrawals/${withdrawalId}/cancel`);
      
      if (response.data.success) {
        toast.success('Withdrawal cancelled successfully');
        fetchWithdrawals();
      }
    } catch (error) {
      console.error('Error cancelling withdrawal:', error);
      toast.error('Failed to cancel withdrawal');
    }
  };

  const exportHistory = () => {
    if (withdrawals.length === 0) {
      toast.error('No data to export');
      return;
    }

    const csvData = withdrawals.map(withdrawal => ({
      Date: new Date(withdrawal.createdAt).toLocaleDateString(),
      'Transaction ID': withdrawal.withdrawalTransactionId || 'N/A',
      Amount: withdrawal.amount,
      'Processing Fee': withdrawal.processingFee || 0,
      'Net Amount': withdrawal.netAmount || withdrawal.amount,
      Status: withdrawal.status,
      'Payment Method': withdrawal.paymentMethod?.type || 'N/A',
      Note: withdrawal.note || ''
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `withdrawal-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('History exported successfully');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <FaCheck className="mr-1" />;
      case 'pending': return <FaClock className="mr-1" />;
      case 'processing': return <FaSync className="mr-1 animate-spin" />;
      case 'cancelled': return <FaTimes className="mr-1" />;
      case 'failed': return <FaExclamationTriangle className="mr-1" />;
      default: return <FaClock className="mr-1" />;
    }
  };

  const getPaymentMethodIcon = (type) => {
    switch (type) {
      case 'bank': return <FaUniversity className="text-blue-600" />;
      case 'paypal': return <FaPaypal className="text-blue-600" />;
      default: return <FaCreditCard className="text-blue-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Link 
                  to="/vendor/withdrawals"
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FaArrowLeft />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Withdrawal History</h1>
                <div className="flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <FaHistory className="mr-1" />
                  {pagination.total} Total
                </div>
              </div>
              <p className="text-gray-600">Complete history of all your withdrawal requests</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleRefresh}
                className="flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={refreshing}
              >
                <FaSync className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              <button
                onClick={exportHistory}
                className="flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={withdrawals.length === 0}
              >
                <FaDownload className="mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by transaction ID, amount, or note..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                />
              </div>
            </form>
            
            <div className="flex gap-3">
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="failed">Failed</option>
              </select>

              <div className="relative">
                <FaCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filters.dateRange}
                  onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="365">Last year</option>
                  <option value="all">All time</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Withdrawals Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {withdrawals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Processing Fee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Net Amount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {withdrawals.map((withdrawal) => (
                    <tr key={withdrawal._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {withdrawal.withdrawalTransactionId || `WD${withdrawal._id.slice(-6)}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div>{new Date(withdrawal.createdAt).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(withdrawal.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(withdrawal.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          {getPaymentMethodIcon(withdrawal.paymentMethod?.type)}
                          <span className="ml-2">
                            {withdrawal.paymentMethod?.type?.charAt(0).toUpperCase() + 
                             withdrawal.paymentMethod?.type?.slice(1) || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(withdrawal.status)}`}>
                          {getStatusIcon(withdrawal.status)}
                          {withdrawal.status?.charAt(0).toUpperCase() + withdrawal.status?.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(withdrawal.processingFee || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        {formatCurrency(withdrawal.netAmount || withdrawal.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedWithdrawal(withdrawal);
                              setShowDetailModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-700"
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                          {withdrawal.status === 'pending' && (
                            <button
                              onClick={() => handleCancelWithdrawal(withdrawal._id)}
                              className="text-red-600 hover:text-red-700"
                              title="Cancel Withdrawal"
                            >
                              <FaTimes />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <FaHistory className="text-4xl mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No withdrawals found</h3>
              <p className="text-gray-500 mb-6">
                {filters.searchTerm || filters.status !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Your withdrawal history will appear here once you make withdrawal requests'
                }
              </p>
              {(filters.searchTerm || filters.status !== 'all') && (
                <button
                  onClick={() => {
                    setFilters({ status: 'all', dateRange: '30', searchTerm: '' });
                    setPagination(prev => ({ ...prev, currentPage: 1 }));
                  }}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{((pagination.currentPage - 1) * 15) + 1}</span> to{' '}
                <span className="font-medium">{Math.min(pagination.currentPage * 15, pagination.total)}</span> of{' '}
                <span className="font-medium">{pagination.total}</span> withdrawals
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                  disabled={pagination.currentPage === 1}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPagination(prev => ({ ...prev, currentPage: pageNum }))}
                        className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          pagination.currentPage === pageNum
                            ? 'bg-blue-600 text-white border border-blue-600'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedWithdrawal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Withdrawal Details</h3>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Transaction ID</p>
                      <p className="text-sm font-mono text-gray-900">
                        {selectedWithdrawal.withdrawalTransactionId || `WD${selectedWithdrawal._id.slice(-6)}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Status</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedWithdrawal.status)}`}>
                        {getStatusIcon(selectedWithdrawal.status)}
                        {selectedWithdrawal.status?.charAt(0).toUpperCase() + selectedWithdrawal.status?.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Requested Amount</p>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(selectedWithdrawal.amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Net Amount</p>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(selectedWithdrawal.netAmount || selectedWithdrawal.amount)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-600">Processing Fee</p>
                    <p className="text-sm text-gray-900">{formatCurrency(selectedWithdrawal.processingFee || 0)}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-600">Payment Method</p>
                    <div className="flex items-center mt-1">
                      {getPaymentMethodIcon(selectedWithdrawal.paymentMethod?.type)}
                      <span className="ml-2 text-sm text-gray-900">
                        {selectedWithdrawal.paymentMethod?.type === 'bank' 
                          ? `${selectedWithdrawal.paymentMethod.bankName} - ****${selectedWithdrawal.paymentMethod.accountNumber?.slice(-4)}`
                          : selectedWithdrawal.paymentMethod?.type === 'paypal'
                          ? `PayPal - ${selectedWithdrawal.paymentMethod.paypalEmail}`
                          : 'Unknown Method'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-600">Request Date</p>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedWithdrawal.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {selectedWithdrawal.processedAt && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Processed Date</p>
                      <p className="text-sm text-gray-900">
                        {new Date(selectedWithdrawal.processedAt).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {selectedWithdrawal.note && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Note</p>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                        {selectedWithdrawal.note}
                      </p>
                    </div>
                  )}

                  {selectedWithdrawal.failureReason && (
                    <div>
                      <p className="text-sm font-medium text-red-600">Failure Reason</p>
                      <p className="text-sm text-red-900 bg-red-50 p-3 rounded-lg">
                        {selectedWithdrawal.failureReason}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  {selectedWithdrawal.status === 'pending' && (
                    <button
                      onClick={() => {
                        handleCancelWithdrawal(selectedWithdrawal._id);
                        setShowDetailModal(false);
                      }}
                      className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Cancel Withdrawal
                    </button>
                  )}
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorWithdrawalsHistory;