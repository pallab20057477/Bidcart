import { useState, useEffect, useCallback } from 'react';
import {
  FaWallet, FaPlus, FaClock, FaCheck, FaTimes,
  FaDownload, FaSync, FaInfoCircle, FaChartLine,
  FaCreditCard, FaUniversity, FaPaypal
} from 'react-icons/fa';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const VendorWithdrawals = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  
  const [withdrawalData, setWithdrawalData] = useState({
    balance: {
      available: 0,
      pending: 0,
      total: 0,
      netEarnings: 0,
      minimumWithdrawal: 10,
      commissionRate: 15
    },
    withdrawals: [],
    paymentMethods: []
  });

  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    paymentMethodId: '',
    note: ''
  });

  const fetchWithdrawalData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/vendors/withdrawals');
      
      if (response.data.success) {
        setWithdrawalData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching withdrawal data:', error);
      toast.error('Failed to load withdrawal data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWithdrawalData();
  }, [fetchWithdrawalData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchWithdrawalData();
    setRefreshing(false);
    toast.success('Data refreshed successfully');
  };

  const handleWithdraw = async () => {
    if (!withdrawForm.amount || parseFloat(withdrawForm.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (parseFloat(withdrawForm.amount) < withdrawalData.balance.minimumWithdrawal) {
      toast.error(`Minimum withdrawal amount is $${withdrawalData.balance.minimumWithdrawal}`);
      return;
    }

    if (parseFloat(withdrawForm.amount) > withdrawalData.balance.available) {
      toast.error('Withdrawal amount cannot exceed available balance');
      return;
    }

    if (!withdrawForm.paymentMethodId) {
      toast.error('Please select a payment method');
      return;
    }

    try {
      setWithdrawing(true);
      const response = await api.post('/vendors/withdrawals', {
        amount: parseFloat(withdrawForm.amount),
        paymentMethodId: withdrawForm.paymentMethodId,
        note: withdrawForm.note
      });

      if (response.data.success) {
        toast.success('Withdrawal request submitted successfully');
        setShowWithdrawModal(false);
        setWithdrawForm({ amount: '', paymentMethodId: '', note: '' });
        fetchWithdrawalData();
      }
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      toast.error(error.response?.data?.message || 'Failed to process withdrawal');
    } finally {
      setWithdrawing(false);
    }
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
      case 'failed': return <FaTimes className="mr-1" />;
      default: return <FaInfoCircle className="mr-1" />;
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
                <FaWallet className="text-2xl text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Withdrawals</h1>
                  <p className="text-gray-600">Manage your earnings withdrawals</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <FaClock />
                  Last updated: {new Date().toLocaleTimeString()}
                </span>
                <span className="flex items-center gap-1">
                  <FaInfoCircle />
                  Min withdrawal: {formatCurrency(withdrawalData.balance.minimumWithdrawal)}
                </span>
                <span className="flex items-center gap-1">
                  <FaInfoCircle />
                  Commission: {withdrawalData.balance.commissionRate}%
                </span>
              </div>
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
                onClick={() => setShowWithdrawModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={withdrawalData.balance.available < withdrawalData.balance.minimumWithdrawal}
              >
                <FaPlus className="mr-2" />
                Request Withdrawal
              </button>
            </div>
          </div>
        </div>

        {/* Balance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Earnings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(withdrawalData.balance.total)}</p>
                <p className="text-sm text-gray-500">Before commission</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <FaChartLine className="text-xl text-blue-600" />
              </div>
            </div>
          </div>

          {/* Net Earnings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Earnings</p>
                <p className="text-2xl font-bold text-indigo-600">{formatCurrency(withdrawalData.balance.netEarnings)}</p>
                <p className="text-sm text-gray-500">After {withdrawalData.balance.commissionRate}% commission</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-full">
                <FaChartLine className="text-xl text-indigo-600" />
              </div>
            </div>
          </div>

          {/* Available Balance */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available Balance</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(withdrawalData.balance.available)}</p>
                <p className="text-sm text-gray-500">Ready to withdraw</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <FaWallet className="text-xl text-green-600" />
              </div>
            </div>
          </div>

          {/* Pending Withdrawals */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Withdrawals</p>
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(withdrawalData.balance.pending)}</p>
                <p className="text-sm text-gray-500">Being processed</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <FaClock className="text-xl text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Withdrawals */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Withdrawals</h3>
          </div>
          
          {withdrawalData.withdrawals && withdrawalData.withdrawals.length > 0 ? (
            <div className="space-y-4">
              {withdrawalData.withdrawals.slice(0, 10).map((withdrawal) => (
                <div key={withdrawal._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-white rounded-full shadow-sm">
                      {getPaymentMethodIcon(withdrawal.paymentMethod?.type)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{formatCurrency(withdrawal.amount)}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(withdrawal.createdAt).toLocaleDateString()} • 
                        {withdrawal.paymentMethod?.type?.charAt(0).toUpperCase() + withdrawal.paymentMethod?.type?.slice(1) || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(withdrawal.status)}`}>
                      {getStatusIcon(withdrawal.status)}
                      {withdrawal.status?.charAt(0).toUpperCase() + withdrawal.status?.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <FaWallet className="text-4xl mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No withdrawals yet</p>
              <p className="text-sm">Your withdrawal history will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Request Withdrawal</h3>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter amount"
                  value={withdrawForm.amount}
                  onChange={(e) => setWithdrawForm({...withdrawForm, amount: e.target.value})}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Available: {formatCurrency(withdrawalData.balance.available)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={withdrawForm.paymentMethodId}
                  onChange={(e) => setWithdrawForm({...withdrawForm, paymentMethodId: e.target.value})}
                >
                  <option value="">Select payment method</option>
                  {withdrawalData.paymentMethods?.map((method) => (
                    <option key={method._id} value={method._id}>
                      {method.type === 'bank' ? method.bankName : 
                       method.type === 'paypal' ? 'PayPal' : 'Payment Method'} 
                      {method.isDefault && ' (Default)'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note (Optional)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Add a note..."
                  value={withdrawForm.note}
                  onChange={(e) => setWithdrawForm({...withdrawForm, note: e.target.value})}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                disabled={withdrawing}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                {withdrawing ? 'Processing...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorWithdrawals;