import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useSocketEvents } from '../../hooks/useSocketEvents';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  FaChartLine,
  FaGavel,
  FaTrophy,
  FaBell,
  FaShoppingCart,
  FaBox,
  FaPlus,
  FaEye,
  FaDollarSign
} from 'react-icons/fa';
import api from '../../utils/api';
import toast from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const VendorDashboard = () => {
  const { user } = useAuth();
  const { joinVendorAnalytics } = useSocket();
  const { isConnected } = useSocketEvents();
  const [overview, setOverview] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [productStats, setProductStats] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  const fetchDashboardData = useCallback(async () => {
    try {
      console.log('Fetching vendor dashboard data...');
      const [
        overviewRes,
        salesRes,
        productStatsRes,
        categoryRes,
        topProductsRes,
        ordersRes,
        productsRes
      ] = await Promise.all([
        api.get(`/vendors/dashboard?period=${period}`),
        api.get(`/vendors/analytics/sales?period=${period}`),
        api.get(`/vendors/analytics/products?period=${period}`),
        api.get('/vendors/analytics/categories'),
        api.get(`/vendors/analytics/top-products?period=${period}`),
        api.get('/vendors/orders?limit=5'),
        api.get('/vendors/products?limit=5')
      ]);

      // Ensure productStats is always an array
      const productStatsData = productStatsRes.data?.data || productStatsRes.data || [];
      console.log('Product Stats Response:', productStatsRes.data);
      console.log('Product Stats Data:', productStatsData);
      const normalizedProductStats = Array.isArray(productStatsData)
        ? productStatsData
        : Object.entries(productStatsData).map(([status, count]) => ({ status, count }));
      console.log('Normalized Product Stats:', normalizedProductStats);

      setOverview(overviewRes.data);
      // Backend returns { success, salesAnalytics } for /vendors/analytics/sales
      const salesAnalyticsData = salesRes.data?.salesAnalytics || salesRes.data?.dailyEarnings || [];
      console.log('Sales Analytics Response:', salesRes.data);
      console.log('Sales Analytics Data:', salesAnalyticsData);
      setSalesData(salesAnalyticsData);
      setProductStats(normalizedProductStats);

      const categoriesData = categoryRes.data?.data || categoryRes.data || [];
      console.log('Categories Response:', categoryRes.data);
      console.log('Categories Data:', categoriesData);
      setCategoryData(categoriesData);
      // Backend returns { success, topProducts }
      const topProductsData = topProductsRes.data?.topProducts || topProductsRes.data?.data || topProductsRes.data || [];
      console.log('Top Products Response:', topProductsRes.data);
      console.log('Top Products Data:', topProductsData);
      setTopProducts(Array.isArray(topProductsData) ? topProductsData : []);
      setRecentOrders(ordersRes.data?.orders || []);
      setRecentProducts(productsRes.data?.products || []);
    } catch (error) {
      console.error('Failed to fetch vendor dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 300000); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Socket.IO integration for real-time updates
  useEffect(() => {
    if (isConnected) {
      joinVendorAnalytics();
      console.log('Vendor dashboard connected to real-time updates');
    }
  }, [isConnected, joinVendorAnalytics]);

  const salesChartData = {
    // salesAnalytics items have _id as date string
    labels: salesData.map(item => {
      const date = item._id || item.date || 'Unknown';
      // Format date to be more readable
      if (date !== 'Unknown') {
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      return date;
    }),
    datasets: [
      {
        label: 'Daily Revenue ($)',
        data: salesData.map(item => item.revenue || 0),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#3B82F6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4
      }
    ]
  };

  const productChartData = {
    labels: productStats.map(item => {
      const status = item.status || 'Unknown';
      const count = item.count || 0;
      return `${status.charAt(0).toUpperCase() + status.slice(1)} (${count})`;
    }),
    datasets: [
      {
        data: productStats.map(item => item.count || 0),
        backgroundColor: [
          '#FFA726', // Orange for pending
          '#66BB6A', // Green for approved  
          '#EF5350', // Red for rejected
          '#42A5F5', // Blue for others
          '#AB47BC'  // Purple for others
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  const categoryChartData = {
    labels: categoryData.map(item => {
      const category = item._id || 'Unknown';
      const count = item.count || 0;
      return `${category} (${count})`;
    }),
    datasets: [
      {
        label: 'Products by Category',
        data: categoryData.map(item => item.count || 0),
        backgroundColor: [
          '#FF6B6B', // Red
          '#4ECDC4', // Teal
          '#45B7D1', // Blue
          '#96CEB4', // Green
          '#FFEAA7', // Yellow
          '#DDA0DD', // Plum
          '#98D8C8', // Mint
          '#F7DC6F', // Light Yellow
          '#BB8FCE', // Light Purple
          '#85C1E9'  // Light Blue
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vendor dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between">
              <div className="flex items-center mb-4 lg:mb-0">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl mr-4">
                  {user?.name?.[0]?.toUpperCase() || 'V'}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Welcome back{user?.name ? `, ${user.name}` : ''}!
                  </h1>
                  <p className="text-gray-600">Manage your store and track your business performance</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Link
                  to="/vendor/products/add"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  <FaPlus className="mr-2 w-4 h-4" />
                  Add Product
                </Link>
                <Link
                  to="/vendor/orders"
                  className="inline-flex items-center px-4 py-2 bg-white text-gray-700 font-medium border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <FaShoppingCart className="mr-2 w-4 h-4" />
                  View Orders
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                to="/vendor/products/add"
                className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <FaPlus className="text-white w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Add Product</h3>
                  <p className="text-sm text-gray-600">Create new listing</p>
                </div>
              </Link>

              <Link
                to="/vendor/products"
                className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
              >
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mr-3">
                  <FaBox className="text-white w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Manage Products</h3>
                  <p className="text-sm text-gray-600">Edit your catalog</p>
                </div>
              </Link>

              <Link
                to="/vendor/orders"
                className="flex items-center p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
              >
                <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center mr-3">
                  <FaShoppingCart className="text-white w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">View Orders</h3>
                  <p className="text-sm text-gray-600">Manage sales</p>
                </div>
              </Link>

              <Link
                to="/vendor/auction-requests/create"
                className="flex items-center p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <FaGavel className="text-white w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Request Auction</h3>
                  <p className="text-sm text-gray-600">Submit for approval</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Analytics Overview</h2>
          <select
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>

        {/* Overview Cards */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Revenue */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <FaDollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${overview.stats?.totalEarnings?.toFixed(2) ?? '0'}</p>
                  <p className="text-sm text-gray-500">{overview.stats?.totalSales ?? 0} sales</p>
                </div>
              </div>
            </div>

            {/* Total Products */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <FaBox className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900">{overview.stats?.totalProducts ?? 0}</p>
                  <p className="text-sm text-gray-500">{overview.stats?.pendingProducts ?? 0} pending</p>
                </div>
              </div>
            </div>

            {/* Active Products */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <FaEye className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Products</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.max(0, (overview.stats?.totalProducts ?? 0) - (overview.stats?.pendingProducts ?? 0))}</p>
                  <p className="text-sm text-gray-500">Currently selling</p>
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                  <FaShoppingCart className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Recent Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{recentOrders.length}</p>
                  <p className="text-sm text-gray-500">Last 5 orders</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FaChartLine className="w-5 h-5 mr-2 text-blue-600" />
              Sales Performance
            </h3>
            {salesData && salesData.length > 0 && salesData.some(item => item.revenue > 0) ? (
              <Line data={salesChartData} options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                    labels: {
                      usePointStyle: true,
                      padding: 20
                    }
                  },
                  title: { display: false },
                  tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                      label: function (context) {
                        return `Revenue: $${context.parsed.y.toFixed(2)}`;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function (value) {
                        return '$' + value.toFixed(0);
                      }
                    }
                  },
                  x: {
                    grid: {
                      display: false
                    }
                  }
                },
                interaction: {
                  mode: 'nearest',
                  axis: 'x',
                  intersect: false
                }
              }} />
            ) : (
              <div className="text-center py-12">
                <FaChartLine className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Sales Data</h4>
                <p className="text-gray-500 mb-4">
                  Your sales performance will appear here once you start making sales.
                </p>
                <div className="text-sm text-gray-400">
                  Add products and start selling to see your revenue trends
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FaBox className="w-5 h-5 mr-2 text-green-600" />
              Product Status
            </h3>
            {productStats && productStats.length > 0 && productStats.some(item => item.count > 0) ? (
              <Doughnut data={productChartData} options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      padding: 20,
                      usePointStyle: true
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: function (context) {
                        const label = context.label || '';
                        const value = context.parsed || 0;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        return `${label}: ${percentage}%`;
                      }
                    }
                  }
                }
              }} />
            ) : (
              <div className="text-center py-12">
                <FaBox className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Products Yet</h4>
                <p className="text-gray-500 mb-4">
                  Add your first product to see status distribution here.
                </p>
                <Link
                  to="/vendor/products/add"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  <FaPlus className="mr-2 w-4 h-4" />
                  Add Product
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FaBox className="w-5 h-5 mr-2 text-purple-600" />
              Product Categories
            </h3>
            {categoryData && categoryData.length > 0 && categoryData.some(item => item.count > 0) ? (
              <Doughnut data={categoryChartData} options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      padding: 20,
                      usePointStyle: true
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: function (context) {
                        const label = context.label || '';
                        const value = context.parsed || 0;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        return `${label}: ${percentage}%`;
                      }
                    }
                  }
                }
              }} />
            ) : (
              <div className="text-center py-12">
                <FaBox className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Categories Data</h4>
                <p className="text-gray-500 mb-4">
                  Your product category distribution will appear here.
                </p>
                <Link
                  to="/vendor/products/add"
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 transition-colors"
                >
                  <FaPlus className="mr-2 w-4 h-4" />
                  Add Products
                </Link>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FaTrophy className="w-5 h-5 mr-2 text-yellow-600" />
              Top Performing Products
            </h3>
            <div className="space-y-3">
              {topProducts && topProducts.length > 0 ? (
                topProducts.slice(0, 5).map((product, index) => {
                  // Better data handling with multiple possible field names
                  const productName = product.name || product.productName || product.title || 'Unknown Product';
                  const productCategory = product.category || product.productCategory || product.categoryName || 'No Category';
                  const productPrice = parseFloat(product.price || product.productPrice || 0);
                  const salesCount = parseInt(
                    product.sales ||
                    product.totalSales ||
                    product.orderCount ||
                    product.soldCount ||
                    product.quantity ||
                    0
                  );
                  // Use totalRevenue from backend if available, otherwise calculate
                  const totalRevenue = parseFloat(product.totalRevenue || (productPrice * salesCount) || 0);

                  console.log(`Product ${index + 1}:`, {
                    name: productName,
                    price: productPrice,
                    sales: salesCount,
                    revenue: totalRevenue,
                    rawProduct: product
                  });

                  return (
                    <div key={product._id || product.id || index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center mb-2">
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full mr-3">
                              {index + 1}
                            </span>
                            <h4 className="font-semibold text-gray-900 truncate">{productName}</h4>
                          </div>
                          <div className="ml-9">
                            <p className="text-sm text-gray-500 mb-1">{productCategory}</p>
                            <p className="text-sm text-gray-600">Price: ${productPrice.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          {salesCount > 0 ? (
                            <>
                              <div className="font-bold text-lg text-green-600">
                                ${totalRevenue.toFixed(2)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {salesCount} sold
                              </div>
                              <div className="text-xs text-blue-600 mt-1">
                                Total Revenue
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="font-bold text-lg text-gray-400">
                                $0.00
                              </div>
                              <div className="text-sm text-gray-500">
                                No sales yet
                              </div>
                              <div className="text-xs text-orange-600 mt-1">
                                Listed Product
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : recentProducts && recentProducts.length > 0 ? (
                // Fallback: Show recent products if no top products data
                <div className="space-y-3">
                  <div className="text-sm text-gray-600 mb-3 p-2 bg-blue-50 rounded-lg">
                    <span className="font-medium">📊 Showing your recent products</span> - Sales data will appear here once customers start purchasing.
                  </div>
                  {recentProducts.slice(0, 5).map((product, index) => (
                    <div key={product._id || index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center mb-2">
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 text-xs font-bold rounded-full mr-3">
                              {index + 1}
                            </span>
                            <h4 className="font-semibold text-gray-900 truncate">{product.name || 'Unknown Product'}</h4>
                          </div>
                          <div className="ml-9">
                            <p className="text-sm text-gray-500 mb-1">{product.category || 'No Category'}</p>
                            <p className="text-sm text-gray-600">Price: ${parseFloat(product.price || 0).toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-bold text-lg text-gray-400">
                            $0.00
                          </div>
                          <div className="text-sm text-gray-500">
                            No sales yet
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${product.approvalStatus === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {product.approvalStatus || 'pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FaTrophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Sales Data Yet</h4>
                  <p className="text-gray-500 mb-4">
                    Your top performing products will appear here once you start making sales.
                  </p>
                  <Link
                    to="/vendor/products/add"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <FaPlus className="mr-2 w-4 h-4" />
                    Add Your First Product
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FaShoppingCart className="w-5 h-5 mr-2 text-blue-600" />
                Recent Orders
              </h3>
              <Link
                to="/vendor/orders"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {recentOrders && recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div key={order._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">Order #{order._id?.slice(-8)}</div>
                      <div className="text-sm text-gray-500">${order.totalAmount}</div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {order.status}
                      </span>
                      <div className="text-sm text-gray-500 mt-1">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No recent orders</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Products */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FaBox className="w-5 h-5 mr-2 text-green-600" />
                Recent Products
              </h3>
              <Link
                to="/vendor/products"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {recentProducts && recentProducts.length > 0 ? (
                recentProducts.map((product) => (
                  <div key={product._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">${product.price}</div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.approvalStatus === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {product.approvalStatus}
                      </span>
                      <div className="text-sm text-gray-500 mt-1">
                        {new Date(product.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No recent products</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
