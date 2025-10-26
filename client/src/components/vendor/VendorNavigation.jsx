import { Link, useLocation } from 'react-router-dom';
import {
  FaHome,
  FaBox,
  FaShoppingCart,
  FaCoins,
  FaWallet,
  FaTruck,
  FaChartBar,
  FaCog,
  FaGavel,
  FaExclamationTriangle
} from 'react-icons/fa';

const VendorNavigation = () => {
  const location = useLocation();

  const navItems = [
    {
      path: '/vendor/dashboard',
      icon: FaHome,
      label: 'Dashboard'
    },
    {
      path: '/vendor/products',
      icon: FaBox,
      label: 'Products'
    },
    {
      path: '/vendor/orders',
      icon: FaShoppingCart,
      label: 'Orders'
    },
    {
      path: '/disputes',
      icon: FaExclamationTriangle,
      label: 'Disputes'
    },
    {
      path: '/vendor/auction-requests',
      icon: FaGavel,
      label: 'Auction Requests'
    },
    {
      path: '/vendor/earnings',
      icon: FaCoins,
      label: 'Earnings'
    },
    {
      path: '/vendor/withdrawals',
      icon: FaWallet,
      label: 'Withdrawals',
      subLinks: [
        { path: '/vendor/withdrawals/request', label: 'Request Withdrawal' },
        { path: '/vendor/withdrawals/history', label: 'History' }
      ]
    },
    {
      path: '/vendor/shipping',
      icon: FaTruck,
      label: 'Shipping'
    },
    {
      path: '/vendor/analytics',
      icon: FaChartBar,
      label: 'Analytics'
    },
    {
      path: '/vendor/settings',
      icon: FaCog,
      label: 'Settings'
    }
  ];

  const isActive = (path) => {
    if (path === '/vendor/dashboard') {
      return location.pathname === '/vendor' || location.pathname === '/vendor/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bg-white shadow-sm border-r border-gray-200 h-full">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Vendor Panel</h2>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${active
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                  <Icon className={`mr-3 h-5 w-5 ${active ? 'text-blue-700' : 'text-gray-400'}`} />
                  {item.label}
                </Link>

                {/* Sub-navigation for withdrawals */}
                {item.subLinks && active && (
                  <ul className="ml-8 mt-2 space-y-1">
                    {item.subLinks.map((subItem) => (
                      <li key={subItem.path}>
                        <Link
                          to={subItem.path}
                          className={`block px-3 py-2 text-sm rounded-md transition-colors ${location.pathname === subItem.path
                            ? 'text-blue-700 bg-blue-50 font-medium'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                          {subItem.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};

export default VendorNavigation;
