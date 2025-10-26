import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaWallet, FaArrowLeft, FaInfoCircle, FaCheck,
  FaUniversity, FaPaypal, FaCreditCard
} from 'react-icons/fa';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const VendorWithdrawalsRequest = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const [withdrawalData, setWithdrawalData] = useState({
    balance: {
      available: 0,
      total: 0,
      netEarnings: 0,
      pending: 0,
      minimumWithdrawal: 10,
      commissionRate: 15
    },
    paymentMethods: [],
    withdrawals: []
  });

  const [formData, setFormData] = useState({
    amount: '',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    note: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchWithdrawalData();
  }, []);

  const fetchWithdrawalData = async () => {
    try {
      setDataLoading(true);

      // Fetch both earnings and withdrawal data
      const [earningsResponse, withdrawalsResponse] = await Promise.all([
        api.get('/vendors/earnings?period=30'),
        api.get('/vendors/withdrawals')
      ]);

      // Debug logs removed for production

      let balanceData = {
        available: 0,
        total: 0,
        netEarnings: 0,
        pending: 0,
        minimumWithdrawal: 10,
        commissionRate: 15
      };

      let paymentMethods = [];

      // Get balance from earnings API (has real data)
      if (earningsResponse.data.success && earningsResponse.data.data) {
        const earnings = earningsResponse.data.data;
        balanceData = {
          available: earnings.availableBalance || earnings.netEarnings || 0,
          total: earnings.totalEarnings || 0,
          netEarnings: earnings.netEarnings || 0,
          pending: 0, // Will be updated from withdrawals API
          minimumWithdrawal: 10,
          commissionRate: earnings.commissionRate || 15
        };
      }

      // Get payment methods and pending withdrawals from withdrawals API
      if (withdrawalsResponse.data.success && withdrawalsResponse.data.data) {
        const withdrawals = withdrawalsResponse.data.data;
        paymentMethods = withdrawals.paymentMethods || [];

        // Update pending amount if available
        if (withdrawals.balance && withdrawals.balance.pending !== undefined) {
          balanceData.pending = withdrawals.balance.pending;
          balanceData.available = Math.max(0, balanceData.netEarnings - balanceData.pending);
        }
      }

      setWithdrawalData({
        balance: balanceData,
        paymentMethods: paymentMethods,
        withdrawals: []
      });

      // Debug logs removed for production

    } catch (error) {
      console.error('Error fetching withdrawal data:', error);
      toast.error('Failed to load withdrawal data');

      // Set fallback data
      setWithdrawalData({
        balance: {
          available: 0,
          total: 0,
          netEarnings: 0,
          pending: 0,
          minimumWithdrawal: 10,
          commissionRate: 15
        },
        paymentMethods: [],
        withdrawals: []
      });
    } finally {
      setDataLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Amount validation
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    } else if (parseFloat(formData.amount) < (withdrawalData.balance?.minimumWithdrawal || 10)) {
      newErrors.amount = `Minimum withdrawal amount is $${withdrawalData.balance?.minimumWithdrawal || 10}`;
    } else if (parseFloat(formData.amount) > (withdrawalData.balance?.available || 0)) {
      newErrors.amount = 'Amount cannot exceed available balance';
    }

    // Bank details validation
    if (!formData.accountHolderName) {
      newErrors.accountHolderName = 'Account holder name is required';
    }
    
    if (!formData.accountNumber) {
      newErrors.accountNumber = 'Account number is required';
    }
    
    if (!formData.ifscCode) {
      newErrors.ifscCode = 'IFSC code is required';
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode.toUpperCase())) {
      newErrors.ifscCode = 'Please enter a valid IFSC code';
    }
    
    if (!formData.bankName) {
      newErrors.bankName = 'Bank name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      setLoading(true);

      const response = await api.post('/vendors/withdrawals', {
        amount: parseFloat(formData.amount),
        bankDetails: {
          accountHolderName: formData.accountHolderName,
          accountNumber: formData.accountNumber,
          ifscCode: formData.ifscCode.toUpperCase(),
          bankName: formData.bankName
        },
        note: formData.note,
        transferMethod: 'razorpay'
      });

      if (response.data.success) {
        toast.success('Withdrawal request submitted successfully!');
        navigate('/vendor/withdrawals');
      }
    } catch (error) {
      console.error('Error submitting withdrawal request:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit withdrawal request';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const getPaymentMethodIcon = (type) => {
    switch (type) {
      case 'bank': return <FaUniversity className="text-blue-600" />;
      case 'paypal': return <FaPaypal className="text-blue-600" />;
      default: return <FaCreditCard className="text-blue-600" />;
    }
  };

  const getPaymentMethodDisplay = (method) => {
    if (method.type === 'bank') {
      return `${method.bankName} - ****${method.accountNumber?.slice(-4)}`;
    } else if (method.type === 'paypal') {
      return `PayPal - ${method.paypalEmail}`;
    }
    return 'Payment Method';
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/vendor/withdrawals')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <FaArrowLeft className="mr-2" />
              Back to Withdrawals
            </button>
          </div>

          <div className="flex items-center gap-3">
            <FaWallet className="text-2xl text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Request Withdrawal</h1>
              <p className="text-gray-600">Submit a withdrawal request for your earnings</p>
            </div>
          </div>
        </div>

        {/* Available Balance Card */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Available Balance</h3>
              <p className="text-3xl font-bold">
                {formatCurrency(withdrawalData?.balance?.available || 0)}
              </p>
              <p className="text-blue-100 text-sm mt-1">
                After {withdrawalData?.balance?.commissionRate || 15}% commission
              </p>

            </div>
            <div className="p-3 bg-white bg-opacity-20 rounded-full">
              <FaWallet className="text-2xl" />
            </div>
          </div>
        </div>

        {/* Withdrawal Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Amount Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Withdrawal Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.amount ? 'border-red-300' : 'border-gray-300'
                    }`}
                  step="0.01"
                  min="0"
                  max={withdrawalData.balance?.available || 0}
                />
              </div>
              {errors.amount && (
                <p className="text-red-600 text-sm mt-1">{errors.amount}</p>
              )}
              <p className="text-gray-500 text-sm mt-1">
                Available: {formatCurrency(withdrawalData.balance?.available || 0)} •
                Minimum: {formatCurrency(withdrawalData.balance?.minimumWithdrawal || 10)}
              </p>
            </div>

            {/* Razorpay Bank Details Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Account Details (Razorpay Transfer)
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    name="accountHolderName"
                    value={formData.accountHolderName || ''}
                    onChange={handleChange}
                    placeholder="Enter account holder name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber || ''}
                    onChange={handleChange}
                    placeholder="Enter account number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    name="ifscCode"
                    value={formData.ifscCode || ''}
                    onChange={handleChange}
                    placeholder="Enter IFSC code"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName || ''}
                    onChange={handleChange}
                    placeholder="Enter bank name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <FaInfoCircle className="text-blue-600 mr-2 mt-0.5" />
                  <div className="text-blue-800 text-sm">
                    <p className="font-medium mb-1">🏦 Razorpay Instant Transfer</p>
                    <p>Funds will be transferred directly to your bank account via Razorpay's secure transfer system within 24 hours.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Note Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Note (Optional)
              </label>
              <textarea
                name="note"
                value={formData.note}
                onChange={handleChange}
                placeholder="Add a note for this withdrawal request..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
              />
            </div>

            {/* Razorpay Information Box */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <FaInfoCircle className="text-blue-600 mr-3 mt-0.5" />
                <div className="text-blue-800 text-sm">
                  <h4 className="font-semibold mb-2">🚀 Razorpay Instant Transfer</h4>
                  <ul className="space-y-1">
                    <li>• <strong>Fast Transfer:</strong> Funds transferred within 24 hours via Razorpay</li>
                    <li>• <strong>Processing Fee:</strong> 2% or $2 (whichever is higher)</li>
                    <li>• <strong>Secure:</strong> Bank-grade security with Razorpay's trusted platform</li>
                    <li>• <strong>Minimum:</strong> {formatCurrency(withdrawalData.balance?.minimumWithdrawal || 10)} withdrawal amount</li>
                    <li>• <strong>Status Updates:</strong> Real-time notifications via email & SMS</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/vendor/withdrawals')}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={loading || !formData.amount || parseFloat(formData.amount) <= 0}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <FaCheck className="mr-2" />
                    Submit Withdrawal Request
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VendorWithdrawalsRequest;