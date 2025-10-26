import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FaChartLine, 
  FaBox, 
  FaUsers, 
  FaStore, 
  FaGavel, 
  FaTicketAlt,
  FaClipboardList,
  FaCheckCircle,
  FaShoppingCart,
  FaUser,
  FaSignOutAlt,
  FaExclamationTriangle
} from 'react-icons/fa';

const AdminNavigation = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { path: '/admin', icon: FaChartLine, label: 'Dashboard' },
    { path: '/admin/orders', icon: FaShoppingCart, label: 'Orders' },
    { path: '/admin/disputes', icon: FaExclamationTriangle, label: 'Manage Disputes' },
    { path: '/admin/products', icon: FaBox, label: 'Products' },
    { path: '/admin/product-approval', icon: FaCheckCircle, label: 'Product Approval' },
    { path: '/admin/users', icon: FaUsers, label: 'Users' },
    { path: '/admin/vendors', icon: FaStore, label: 'Vendors' },
    { path: '/admin/vendor-requests', icon: FaClipboardList, label: 'Vendor Requests' },
    { path: '/admin/auctions', icon: FaGavel, label: 'Auctions' },
    { path: '/admin/auction-requests', icon: FaClipboardList, label: 'Auction Requests' },
    { path: '/admin/auctions/active', icon: FaGavel, label: 'Active Auctions' },
    { path: '/admin/coupons', icon: FaTicketAlt, label: 'Coupons' }
  ];

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg font-bold">
            {user?.name ? user.name.charAt(0).toUpperCase() : <FaUser />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 truncate">{user?.name || 'Admin'}</div>
            <div className="text-sm text-gray-600 truncate">{user?.email || ''}</div>
          </div>
          <div className="flex gap-2">
            <Link 
              to="/profile" 
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Profile
            </Link>
            <button 
              onClick={logout} 
              className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1"
            >
              <FaSignOutAlt />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center p-4 rounded-lg border transition-colors ${
                active
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <Icon className="text-2xl mb-2" />
              <span className="text-xs font-medium text-center">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default AdminNavigation;
