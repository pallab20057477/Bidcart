import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
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
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { 
  FaChartLine, 
  FaUsers, 
  FaGavel, 
  FaStore,
  FaTrophy,
  FaFire,
  FaBell,
  FaCalendarAlt,
  FaClipboardList,
  FaClock,
  FaCheck,
  FaTimes,
  FaShoppingCart,
  FaBox,
  FaShieldAlt,
  FaPlus,
  FaEye,
  FaDollarSign
} from 'react-icons/fa';
import AdminNavigation from '../../components/admin/AdminNavigation';
import { useAdminData } from '../../contexts/AdminDataContext';

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

const Dashboard = () => {
  const navigate = useNavigate();
  const { totalUsers } = useAdminData();
  const { joinAnalytics, joinSystemMonitoring } = useSocket();
  const { isConnected, userRole } = useSocketEvents();
  const [overview, setOverview] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [userGrowth, setUserGrowth] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [auctionData, setAuctionData] = useState(null);
  const [activityFeed, setActivityFeed] = useState(null);
  const [vendorRequests, setVendorRequests] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [auctionRequests, setAuctionRequests] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [dailyStats, setDailyStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  const fetchDashboardData = useCallback(async () => {
    try {
      console.log('Fetching dashboard data...');
      const timestamp = Date.now(); // Cache buster
      const [
        overviewRes,
        salesRes,
        userGrowthRes,
        categoryRes,
        topProductsRes,
        auctionRes,
        activityRes,
        vendorRequestsRes,
        auctionRequestsRes,
        dailyStatsRes
      ] = await Promise.all([
        api.get(`/admin/dashboard/overview?period=${period}&_t=${timestamp}`),
        api.get(`/admin/dashboard/sales-chart?period=${period}&_t=${timestamp}`),
        api.get(`/admin/dashboard/user-growth?period=${period}&_t=${timestamp}`),
        api.get(`/admin/dashboard/category-distribution?_t=${timestamp}`),
        api.get(`/admin/dashboard/top-products?period=${period}&_t=${timestamp}`),
        api.get(`/admin/dashboard/auction-performance?period=${period}&_t=${timestamp}`),
        api.get(`/admin/dashboard/activity-feed?_t=${timestamp}`),
        api.get(`/vendor-requests/stats/overview?_t=${timestamp}`),
        api.get(`/auction-requests/admin/stats?_t=${timestamp}`),
        api.get(`/admin/orders/daily-stats?_t=${timestamp}`)
      ]);

      console.log('Dashboard API Response:');
      console.log('Overview:', overviewRes.data);
      console.log('Total Users from API:', overviewRes.data?.overview?.totalUsers);
      console.log('Total Vendors from API:', overviewRes.data?.overview?.totalVendors);
      console.log('Daily stats response:', dailyStatsRes.data);
      
      setOverview(overviewRes.data);
      setSalesData(salesRes.data);
      setUserGrowth(userGrowthRes.data);
      setCategoryData(categoryRes.data);
      setTopProducts(topProductsRes.data);
      setAuctionData(auctionRes.data);
      setActivityFeed(activityRes.data);
      setVendorRequests(vendorRequestsRes.data);
      setAuctionRequests(auctionRequestsRes.data);
      setDailyStats(dailyStatsRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds

    // Listen for userDeleted and vendorDeleted events to refresh dashboard data immediately
    const handleUserDeleted = () => {
      console.log('User deleted, refreshing dashboard...');
      fetchDashboardData();
    };
    
    const handleVendorDeleted = () => {
      console.log('Vendor deleted, refreshing dashboard...');
      fetchDashboardData();
    };
    
    window.addEventListener('userDeleted', handleUserDeleted);
    window.addEventListener('vendorDeleted', handleVendorDeleted);

    return () => {
      clearInterval(interval);
      window.removeEventListener('userDeleted', handleUserDeleted);
      window.removeEventListener('vendorDeleted', handleVendorDeleted);
    };
  }, [fetchDashboardData]);

  // Socket.IO integration for real-time updates
  useEffect(() => {
    if (isConnected && userRole === 'admin') {
      // Join analytics and system monitoring rooms
      joinAnalytics();
      joinSystemMonitoring();
      
      console.log('Admin dashboard connected to real-time updates');
    }
  }, [isConnected, userRole, joinAnalytics, joinSystemMonitoring]);

  useEffect(() => {
    if (overview) {
      console.log('Admin Dashboard Overview:', overview);
    }
  }, [overview]);

  const salesChartData = {
    labels: salesData.map(item => item._id || 'Unknown'),
    datasets: [
      {
        label: 'Revenue',
        data: salesData.map(item => item.revenue || 0),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Orders',
        data: salesData.map(item => item.orders || 0),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const userGrowthData = {
    labels: userGrowth.map(item => item._id || 'Unknown'),
    datasets: [
      {
        label: 'New Users',
        data: userGrowth.map(item => item.newUsers || 0),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const categoryChartData = {
    labels: categoryData.map(item => item._id || 'Unknown'),
    datasets: [
      {
        data: categoryData.map(item => item.count || 0),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#FF6384',
          '#36A2EB'
        ]
      }
    ]
  };

  const dailyStatsChartData = {
    labels: dailyStats.map(item => new Date(item._id).toLocaleDateString()),
    datasets: [
      {
        label: 'Orders',
        data: dailyStats.map(item => item.orderCount || 0),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y'
      },
      {
        label: 'Revenue ($)',
        data: dailyStats.map(item => item.revenue || 0),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y1'
      }
    ]
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <AdminNavigation />
        </div>

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Overview of your platform</p>
          </div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Link
              to="/admin/vendors/add"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <FaStore className="text-2xl text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-900 text-center">Add Vendor</span>
            </Link>

            <Link
              to="/admin/users/add"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <FaUsers className="text-2xl text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-900 text-center">Add User</span>
            </Link>

            <Link
              to="/admin/products/add"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <FaBox className="text-2xl text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-900 text-center">Add Product</span>
            </Link>

            <Link
              to="/admin/auctions/active"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <FaGavel className="text-2xl text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-900 text-center">View Auctions</span>
            </Link>

            <button
              onClick={() => navigate('/admin/products/auction/add')}
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <FaPlus className="text-2xl text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-900 text-center">Add Auction</span>
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Revenue */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Total Revenue</span>
                <FaDollarSign className="text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">${overview.revenue?.totalRevenue?.toFixed(2) ?? '0'}</div>
              <p className="text-sm text-gray-500 mt-1">{overview.revenue?.orderCount ?? 0} orders</p>
            </div>

            {/* Total Users */}
            <div 
              className="bg-white rounded-lg shadow-sm border p-6 cursor-pointer hover:border-blue-500 transition-colors"
              onClick={() => navigate('/admin/accounts?tab=users')}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Total Users</span>
                <FaUsers className="text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{overview?.overview?.totalUsers ?? 0}</div>
              <p className="text-sm text-gray-500 mt-1">Registered users</p>
            </div>

            {/* Total Vendors */}
            <div 
              className="bg-white rounded-lg shadow-sm border p-6 cursor-pointer hover:border-blue-500 transition-colors"
              onClick={() => navigate('/admin/accounts?tab=vendors')}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Total Vendors</span>
                <FaStore className="text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{overview?.overview?.totalVendors ?? 0}</div>
              <p className="text-sm text-gray-500 mt-1">Active vendors</p>
            </div>

            {/* Active Auctions */}
            <div 
              className="bg-white rounded-lg shadow-sm border p-6 cursor-pointer hover:border-blue-500 transition-colors"
              onClick={() => navigate('/admin/auctions/active')}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Active Auctions</span>
                <FaGavel className="text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{overview.auctions?.activeAuctions ?? 0}</div>
              <p className="text-sm text-gray-500 mt-1">{overview.auctions?.totalAuctions ?? 0} total</p>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <FaChartLine className="mr-2 text-blue-600" />
              Sales & Revenue
            </h2>
            <Line data={salesChartData} options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' },
                title: { display: false }
              },
              scales: {
                y: { beginAtZero: true }
              }
            }} />
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <FaUsers className="mr-2 text-blue-600" />
              User Growth
            </h2>
            <Line data={userGrowthData} options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' },
                title: { display: false }
              },
              scales: {
                y: { beginAtZero: true }
              }
            }} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <FaStore className="mr-2 text-blue-600" />
              Product Categories
            </h2>
            <Doughnut data={categoryChartData} options={{
              responsive: true,
              plugins: {
                legend: { position: 'bottom' }
              }
            }} />
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <FaTrophy className="mr-2 text-blue-600" />
              Top Products
            </h2>
            <div className="space-y-3">
              {topProducts && topProducts.length > 0 ? (
                topProducts.slice(0, 5).map((product, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{product.name || 'Unknown Product'}</div>
                      <div className="text-sm text-gray-500">{product.category || 'No Category'}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">${(product.totalRevenue || 0).toFixed(2)}</div>
                      <div className="text-sm text-gray-500">{product.totalSold || 0} sold</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No product data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Daily Orders & Revenue Chart */}
        {dailyStats.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <FaCalendarAlt className="mr-2 text-blue-600" />
              Daily Orders & Revenue
            </h2>
            <Line data={dailyStatsChartData} options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' },
                title: { display: false }
              },
              scales: {
                y: {
                  type: 'linear',
                  display: true,
                  position: 'left',
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Orders'
                  }
                },
                y1: {
                  type: 'linear',
                  display: true,
                  position: 'right',
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Revenue ($)'
                  },
                  grid: {
                    drawOnChartArea: false,
                  },
                }
              }
            }} />
          </div>
        )}

        {/* Auction Stats */}
        {auctionData && auctionData.performance && auctionData.performance.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <FaGavel className="mr-2 text-blue-600" />
              Auction Performance
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {auctionData.performance.map((stat, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">{stat._id || 'Unknown'}</div>
                  <div className="text-2xl font-bold text-gray-900">{stat.count || 0}</div>
                  <div className="text-sm text-gray-500">Avg: ${(stat.avgFinalPrice || 0).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vendor Requests Overview */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <FaClipboardList className="mr-2 text-blue-600" />
              Vendor Requests
            </h2>
            <Link to="/admin/vendor-requests" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-yellow-800">Pending</span>
                <FaClock className="text-yellow-600" />
              </div>
              <div className="text-2xl font-bold text-yellow-900">{vendorRequests.pending}</div>
              <p className="text-xs text-yellow-700 mt-1">Awaiting review</p>
            </div>
            
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-800">Approved</span>
                <FaCheck className="text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-900">{vendorRequests.approved}</div>
              <p className="text-xs text-green-700 mt-1">This month</p>
            </div>
            
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-red-800">Rejected</span>
                <FaTimes className="text-red-600" />
              </div>
              <div className="text-2xl font-bold text-red-900">{vendorRequests.rejected}</div>
              <p className="text-xs text-red-700 mt-1">This month</p>
            </div>
          </div>
        </div>

        {/* Auction Requests Overview */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <FaGavel className="mr-2 text-blue-600" />
              Auction Requests
            </h2>
            <Link to="/admin/auction-requests" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Review Requests →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Total</span>
                <FaChartLine className="text-gray-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{auctionRequests.total || 0}</div>
              <p className="text-xs text-gray-600 mt-1">All time</p>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-yellow-800">Pending</span>
                <FaClock className="text-yellow-600" />
              </div>
              <div className="text-2xl font-bold text-yellow-900">{auctionRequests.byStatus?.pending || 0}</div>
              <p className="text-xs text-yellow-700 mt-1">Awaiting approval</p>
            </div>
            
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-800">Approved</span>
                <FaCheck className="text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-900">{auctionRequests.byStatus?.approved || 0}</div>
              <p className="text-xs text-green-700 mt-1">Scheduled</p>
            </div>
            
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-red-800">Rejected</span>
                <FaTimes className="text-red-600" />
              </div>
              <div className="text-2xl font-bold text-red-900">{auctionRequests.byStatus?.rejected || 0}</div>
              <p className="text-xs text-red-700 mt-1">Declined</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 