import { useState, useEffect, useCallback } from 'react';
import {
  FaChartLine, FaChartBar, FaChartPie, FaDownload, FaShoppingCart,
  FaStar, FaUsers, FaSync, FaArrowUp, FaArrowDown, FaCalendar,
  FaFileExport, FaEye, FaPercent, FaLevelUpAlt, FaLevelDownAlt
} from 'react-icons/fa';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const VendorAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState('30');
  const [viewMode, setViewMode] = useState('overview');
  const [analytics, setAnalytics] = useState({
    salesData: [],
    productPerformance: [],
    customerMetrics: {},
    revenueTrends: [],
    topProducts: [],
    customerSegments: [],
    conversionRate: 0,
    averageOrderValue: 0,
    totalRevenue: 0,
    totalOrders: 0,
    growthMetrics: {}
  });
  const [selectedMetric, setSelectedMetric] = useState('sales');

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/vendors/analytics?period=${period}`);

      if (response.data.success) {
        setAnalytics({
          salesData: response.data.salesData || [],
          productPerformance: response.data.productPerformance || [],
          customerMetrics: response.data.customerMetrics || {},
          revenueTrends: response.data.revenueTrends || [],
          topProducts: response.data.topProducts || [],
          customerSegments: response.data.customerSegments || [],
          conversionRate: response.data.conversionRate || 0,
          averageOrderValue: response.data.averageOrderValue || 0,
          totalRevenue: response.data.totalRevenue || 0,
          totalOrders: response.data.totalOrders || 0,
          growthMetrics: response.data.growthMetrics || {}
        });
      } else {
        setAnalytics({
          salesData: [],
          productPerformance: [],
          customerMetrics: {},
          revenueTrends: [],
          topProducts: [],
          customerSegments: [],
          conversionRate: 0,
          averageOrderValue: 0,
          totalRevenue: 0,
          totalOrders: 0,
          growthMetrics: {}
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
      setAnalytics({
        salesData: [],
        productPerformance: [],
        customerMetrics: {},
        revenueTrends: [],
        topProducts: [],
        customerSegments: [],
        conversionRate: 0,
        averageOrderValue: 0,
        totalRevenue: 0,
        totalOrders: 0,
        growthMetrics: {}
      });
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const formatPercentage = (value) => {
    if (value === undefined || value === null || isNaN(value)) return '0.0%';
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getPeriodLabel = (period) => {
    const labels = {
      '7': 'Last 7 Days',
      '30': 'Last 30 Days',
      '90': 'Last 90 Days',
      '365': 'Last Year'
    };
    return labels[period] || 'Last 30 Days';
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
    toast.success('Analytics data refreshed successfully');
  };

  const getGrowthIcon = (value) => {
    if (value > 0) return <FaLevelUpAlt className="text-green-500" />;
    if (value < 0) return <FaLevelDownAlt className="text-red-500" />;
    return <FaChartLine className="text-gray-500" />;
  };

  const getGrowthColor = (value) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const renderSalesChart = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <FaChartLine className="mr-2 text-blue-600" />
          Sales Trends
        </h3>
        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center">
          <FaDownload className="mr-1" />
          Export
        </button>
      </div>
      {analytics.salesData && analytics.salesData.length > 0 ? (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Order</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.salesData.map((day, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {new Date(day._id || day.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(day.orders || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                      {formatCurrency(day.revenue || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency((day.revenue || 0) / (day.orders || 1))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <FaChartLine className="text-4xl mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No sales data available</p>
          <p className="text-sm">Sales data will appear here once you start making sales</p>
        </div>
      )}
    </div>
  );

  const renderProductPerformance = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <FaChartBar className="mr-2 text-purple-600" />
          Top Performing Products
        </h3>
        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          View All Products
        </button>
      </div>
      {analytics.topProducts && analytics.topProducts.length > 0 ? (
        <div className="space-y-4">
          {analytics.topProducts.slice(0, 5).map((product, index) => (
            <div key={product._id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-bold">
                #{index + 1}
              </div>
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200">
                <img
                  src={product.image || '/placeholder.jpg'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 truncate">{product.name}</h4>
                <p className="text-sm text-gray-500">{product.category}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    {product.sales || 0} sold
                  </span>
                  {product.rating && (
                    <span className="flex items-center text-xs text-yellow-600">
                      <FaStar className="mr-1" />
                      {product.rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">{formatCurrency(product.revenue || 0)}</p>
                <p className="text-xs text-gray-500">Revenue</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <FaChartBar className="text-4xl mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No product sales yet</p>
          <p className="text-sm">Your top-selling products will appear here once you start making sales</p>
        </div>
      )}
    </div>
  );

  const renderCustomerMetrics = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
        <FaUsers className="mr-2 text-green-600" />
        Customer Insights
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Total Customers</p>
              <p className="text-2xl font-bold text-blue-900">{formatNumber(analytics.customerMetrics.totalCustomers || 0)}</p>
              <p className="text-xs text-blue-600 mt-1">Unique customers</p>
            </div>
            <div className="p-3 bg-blue-200 rounded-full">
              <FaUsers className="text-xl text-blue-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-6 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-700">Average Rating</p>
              <p className="text-2xl font-bold text-yellow-900">{(analytics.customerMetrics.averageRating || 0).toFixed(1)}</p>
              <p className="text-xs text-yellow-600 mt-1">Customer satisfaction</p>
            </div>
            <div className="p-3 bg-yellow-200 rounded-full">
              <FaStar className="text-xl text-yellow-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Repeat Customers</p>
              <p className="text-2xl font-bold text-green-900">{formatNumber(analytics.customerMetrics.repeatCustomers || 0)}</p>
              <p className="text-xs text-green-600 mt-1">Loyal customers</p>
            </div>
            <div className="p-3 bg-green-200 rounded-full">
              <FaShoppingCart className="text-xl text-green-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Customer Growth</p>
              <p className="text-2xl font-bold text-purple-900">{formatPercentage(analytics.customerMetrics.growthRate || 0)}</p>
              <p className="text-xs text-purple-600 mt-1">Monthly growth</p>
            </div>
            <div className="p-3 bg-purple-200 rounded-full">
              <FaLevelUpAlt className="text-xl text-purple-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Customer Segments */}
      {analytics.customerSegments && analytics.customerSegments.length > 0 && (
        <div className="mt-8">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Customer Segments</h4>
          <div className="space-y-3">
            {analytics.customerSegments.map((segment, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{segment.name}</p>
                  <p className="text-sm text-gray-500">{segment.description}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatNumber(segment.count)}</p>
                  <p className="text-sm text-gray-500">{segment.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderRevenueTrends = () => (
    <div className="bg-base-100 shadow-xl rounded-2xl p-6">
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <FaChartPie className="mr-2" />
        Revenue Analysis
      </h3>
      {analytics.revenueTrends && analytics.revenueTrends.length > 0 ? (
        <div className="space-y-4">
          {analytics.revenueTrends.map((trend, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
              <div>
                <p className="font-semibold">{trend.period}</p>
                <p className="text-sm text-base-content/60">{trend.description}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary">{formatCurrency(trend.revenue || 0)}</p>
                <p className={`text-xs ${trend.change >= 0 ? 'text-success' : 'text-error'}`}>
                  {trend.change >= 0 ? '+' : ''}{trend.change}% change
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-base-content/60">
          <FaChartPie className="text-4xl mx-auto mb-4" />
          <p>No revenue trend data</p>
        </div>
      )}
    </div>
  );

  const exportAnalytics = () => {
    const data = {
      exportDate: new Date().toISOString(),
      period: getPeriodLabel(period),
      summary: {
        totalRevenue: analytics.totalRevenue,
        totalOrders: analytics.totalOrders,
        averageOrderValue: analytics.averageOrderValue,
        conversionRate: analytics.conversionRate
      },
      salesData: analytics.salesData,
      topProducts: analytics.topProducts,
      customerMetrics: analytics.customerMetrics,
      revenueTrends: analytics.revenueTrends,
      growthMetrics: analytics.growthMetrics,
      customerSegments: analytics.customerSegments
    };

    // Create CSV format for better compatibility
    const csvContent = [
      ['Analytics Export Report'],
      ['Export Date:', new Date().toLocaleDateString()],
      ['Period:', getPeriodLabel(period)],
      [''],
      ['Summary Metrics'],
      ['Total Revenue:', formatCurrency(analytics.totalRevenue)],
      ['Total Orders:', formatNumber(analytics.totalOrders)],
      ['Average Order Value:', formatCurrency(analytics.averageOrderValue)],
      ['Conversion Rate:', `${analytics.conversionRate.toFixed(1)}%`],
      [''],
      ['Daily Sales Data'],
      ['Date', 'Orders', 'Revenue', 'Avg Order Value'],
      ...analytics.salesData.map(day => [
        new Date(day._id || day.date).toLocaleDateString(),
        day.orders || 0,
        day.revenue || 0,
        ((day.revenue || 0) / (day.orders || 1)).toFixed(2)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendor-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Analytics data exported successfully');
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 lg:px-12">
        <div className="flex justify-center items-center h-64">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 lg:px-12 flex flex-col gap-8">

      {/* Enhanced Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">Analytics & Insights</h1>
              {analytics.growthMetrics.revenueGrowth !== undefined && (
                <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${analytics.growthMetrics.revenueGrowth >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                  {analytics.growthMetrics.revenueGrowth >= 0 ? <FaArrowUp className="mr-1" /> : <FaArrowDown className="mr-1" />}
                  {formatPercentage(analytics.growthMetrics.revenueGrowth)}
                </div>
              )}
            </div>
            <p className="text-gray-600">Deep dive into your business performance and growth metrics</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <FaCalendar />
                {getPeriodLabel(period)}
              </span>
              <span className="flex items-center gap-1">
                <FaEye />
                Last updated: {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* View Mode Selector */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {[
                { key: 'overview', label: 'Overview', icon: FaChartLine },
                { key: 'detailed', label: 'Detailed', icon: FaChartBar },
                { key: 'trends', label: 'Trends', icon: FaLevelUpAlt }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setViewMode(key)}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === key
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <Icon className="mr-1.5 text-xs" />
                  {label}
                </button>
              ))}
            </div>

            {/* Period Selector */}
            <div className="relative">
              <FaCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
                <option value="365">Last Year</option>
              </select>
            </div>

            {/* Action Buttons */}
            <button
              onClick={handleRefresh}
              className="flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={refreshing}
            >
              <FaSync className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <button
              onClick={exportAnalytics}
              className="flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FaFileExport className="mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mb-2">{formatCurrency(analytics.totalRevenue)}</p>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-500">{getPeriodLabel(period)}</p>
                {analytics.growthMetrics.revenueGrowth !== undefined && (
                  <span className={`flex items-center text-xs px-2 py-1 rounded-full ${
                    analytics.growthMetrics.revenueGrowth >= 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {getGrowthIcon(analytics.growthMetrics.revenueGrowth)}
                    <span className="ml-1">{Math.abs(analytics.growthMetrics.revenueGrowth).toFixed(1)}%</span>
                  </span>
                )}
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FaChartLine className="text-xl text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900 mb-2">{formatNumber(analytics.totalOrders)}</p>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-500">Orders processed</p>
                {analytics.growthMetrics.ordersGrowth !== undefined && (
                  <span className={`flex items-center text-xs px-2 py-1 rounded-full ${
                    analytics.growthMetrics.ordersGrowth >= 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {getGrowthIcon(analytics.growthMetrics.ordersGrowth)}
                    <span className="ml-1">{Math.abs(analytics.growthMetrics.ordersGrowth).toFixed(1)}%</span>
                  </span>
                )}
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <FaShoppingCart className="text-xl text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900 mb-2">{formatCurrency(analytics.averageOrderValue)}</p>
              <p className="text-sm text-gray-500">Per order average</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <FaChartPie className="text-xl text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900 mb-2">{analytics.conversionRate.toFixed(1)}%</p>
              <p className="text-sm text-gray-500">Visitor to customer</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <FaPercent className="text-xl text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Metric Selector */}
      {viewMode === 'detailed' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Analytics</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'sales', label: 'Sales Trends', icon: FaChartLine },
              { key: 'products', label: 'Product Performance', icon: FaChartBar },
              { key: 'customers', label: 'Customer Insights', icon: FaUsers },
              { key: 'revenue', label: 'Revenue Analysis', icon: FaChartPie }
            ].map((metric) => (
              <button
                key={metric.key}
                onClick={() => setSelectedMetric(metric.key)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedMetric === metric.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <metric.icon className="mr-2" />
                {metric.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Content */}
      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {renderSalesChart()}
          {renderProductPerformance()}
          {renderCustomerMetrics()}
          {renderRevenueTrends()}
        </div>
      )}

      {viewMode === 'detailed' && (
        <div className="mb-8">
          {selectedMetric === 'sales' && renderSalesChart()}
          {selectedMetric === 'products' && renderProductPerformance()}
          {selectedMetric === 'customers' && renderCustomerMetrics()}
          {selectedMetric === 'revenue' && renderRevenueTrends()}
        </div>
      )}

      {viewMode === 'trends' && (
        <div className="grid grid-cols-1 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <FaLevelUpAlt className="mr-2 text-green-600" />
              Growth Trends & Forecasting
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                <div className="flex justify-center mb-3">
                  <div className="p-2 bg-green-200 rounded-full">
                    <FaLevelUpAlt className="text-green-700" />
                  </div>
                </div>
                <p className="text-sm font-medium text-green-700 mb-1">Revenue Growth</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatPercentage(analytics.growthMetrics.revenueGrowth || 0)}
                </p>
                <p className="text-xs text-green-600 mt-1">vs previous period</p>
              </div>

              <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                <div className="flex justify-center mb-3">
                  <div className="p-2 bg-blue-200 rounded-full">
                    <FaShoppingCart className="text-blue-700" />
                  </div>
                </div>
                <p className="text-sm font-medium text-blue-700 mb-1">Order Growth</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatPercentage(analytics.growthMetrics.ordersGrowth || 0)}
                </p>
                <p className="text-xs text-blue-600 mt-1">vs previous period</p>
              </div>

              <div className="text-center p-6 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                <div className="flex justify-center mb-3">
                  <div className="p-2 bg-purple-200 rounded-full">
                    <FaUsers className="text-purple-700" />
                  </div>
                </div>
                <p className="text-sm font-medium text-purple-700 mb-1">Customer Growth</p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatPercentage(analytics.growthMetrics.customerGrowth || 0)}
                </p>
                <p className="text-xs text-purple-600 mt-1">vs previous period</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorAnalytics;
