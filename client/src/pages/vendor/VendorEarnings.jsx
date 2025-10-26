import { useState, useEffect, useCallback } from 'react';
import {
  FaCoins, FaWallet, FaChartLine, FaDownload,
  FaDollarSign, FaShoppingCart, FaCalendar,
  FaInfoCircle, FaClock, FaSync, FaArrowUp, FaArrowDown
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const VendorEarnings = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState('30');

  const [earnings, setEarnings] = useState({
    totalEarnings: 0,
    netEarnings: 0,
    availableBalance: 0,
    commissionRate: 15,
    totalOrders: 0,
    averageOrderValue: 0,
    growthRate: 0,
    recentTransactions: [],
    monthlyData: []
  });

  const fetchEarnings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/vendors/earnings?period=${period}`);

      if (response.data.success) {
        setEarnings(response.data.data || response.data);
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
      toast.error('Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatPercentage = (value) => {
    if (value === undefined || value === null || isNaN(value)) return '0.0%';
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEarnings();
    setRefreshing(false);
    toast.success('Data refreshed successfully');
  };

  const exportData = () => {
    if (!earnings.recentTransactions || earnings.recentTransactions.length === 0) {
      toast.error('No data available to export');
      return;
    }

    const csvContent = "data:text/csv;charset=utf-8," +
      "Date,Order ID,Amount,Status\n" +
      earnings.recentTransactions.map(row => 
        `${new Date(row.createdAt).toLocaleDateString()},${row.orderNumber || 'N/A'},${row.amount || 0},${row.status || 'completed'}`
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `earnings_${period}days.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Earnings data exported successfully');
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
                <FaCoins className="text-2xl text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Earnings Overview</h1>
                  <p className="text-gray-600">Track your financial performance and growth</p>
                </div>
              </div>
              
              {earnings.growthRate !== 0 && (
                <div className="flex items-center gap-2 mt-3">
                  <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    earnings.growthRate >= 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {earnings.growthRate >= 0 ? <FaArrowUp className="mr-1" /> : <FaArrowDown className="mr-1" />}
                    {formatPercentage(earnings.growthRate)} vs last period
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <FaClock />
                  Last updated: {new Date().toLocaleTimeString()}
                </span>
                <span className="flex items-center gap-1">
                  <FaInfoCircle />
                  Commission: {earnings.commissionRate}%
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-3">
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
                <option value="365">Last Year</option>
              </select>

              <button
                onClick={handleRefresh}
                className="flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={refreshing}
              >
                <FaSync className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              <button
                onClick={exportData}
                className="flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FaDownload className="mr-2" />
                Export
              </button>

              <Link
                to="/vendor/withdrawals"
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <FaWallet className="mr-2" />
                Manage Withdrawals
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Earnings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(earnings.totalEarnings)}</p>
                <p className="text-sm text-gray-500">Before commission</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <FaCoins className="text-xl text-blue-600" />
              </div>
            </div>
          </div>

          {/* Net Earnings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Earnings</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(earnings.netEarnings)}</p>
                <p className="text-sm text-gray-500">After {earnings.commissionRate}% commission</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <FaWallet className="text-xl text-green-600" />
              </div>
            </div>
          </div>

          {/* Total Orders */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{earnings.totalOrders}</p>
                <p className="text-sm text-gray-500">Orders completed</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <FaShoppingCart className="text-xl text-purple-600" />
              </div>
            </div>
          </div>

          {/* Average Order Value */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(earnings.averageOrderValue)}</p>
                <p className="text-sm text-gray-500">Per order average</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <FaChartLine className="text-xl text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FaDollarSign className="mr-2 text-green-600" />
              Recent Transactions
            </h3>
            <Link 
              to="/vendor/orders"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All Orders
            </Link>
          </div>
          
          {earnings.recentTransactions && earnings.recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {earnings.recentTransactions.slice(0, 10).map((transaction, index) => (
                <div key={transaction._id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <FaShoppingCart className="text-green-600 text-sm" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {transaction.orderNumber || `Order #${transaction._id?.slice(-6) || `ORD-${index + 1}`}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.createdAt || Date.now()).toLocaleDateString()} • 
                        {transaction.user?.name || 'Customer'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      +{formatCurrency(transaction.vendorAmount || transaction.totalAmount || transaction.amount || 0)}
                    </p>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {transaction.status || 'Completed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <FaDollarSign className="text-4xl mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No transactions yet</p>
              <p className="text-sm">Your transaction history will appear here once you start making sales</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorEarnings;