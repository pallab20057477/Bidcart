import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useNotification } from '../../contexts/NotificationContext';
import { FaShoppingCart, FaBell, FaBars, FaTimes, FaUserShield, FaUser, FaStore, FaSignOutAlt, FaExclamationCircle } from 'react-icons/fa';
import { useState, useEffect } from 'react';

const navLinks = [
  { to: '/products', label: 'Products', exactMatch: false },
  { to: '/auction', label: 'Auctions', exactMatch: true },
  { to: '/orders', label: 'Orders', exactMatch: false },
  { to: '/disputes', label: 'Disputes', exactMatch: false },
];

// UserDropdown component
function UserDropdown() {
  const {
    user,
    vendor,
    currentRole,
    isVendorApproved,
    switchRole,
    logout
  } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleRoleSwitch = (role) => {
    try {
      switchRole(role);
      setOpen(false);
      if (role === 'vendor') {
        navigate('/vendor/dashboard');
      } else {
        navigate('/');
      }
    } catch (error) {
      // Optionally show error
    }
  };

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/login');
  };

  // if (!user) return null;

  return (
    <div className="relative">
      <button
        className="avatar placeholder focus:outline-none focus:ring-2 focus:ring-primary"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="User menu"
      >
        <div className="bg-primary text-primary-content rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg shadow">
          {user.name?.charAt(0).toUpperCase()}
        </div>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-base-100 shadow-2xl rounded-xl border z-50 animate-fade-in">
          {/* User Info */}
          <div className="p-4 border-b flex items-center gap-3">
            <div className="avatar placeholder">
              <div className="bg-primary text-primary-content rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl">
                {user.name?.charAt(0).toUpperCase()}
              </div>
            </div>
            <div>
              <p className="font-semibold text-lg">{user.name}</p>
              <p className="text-sm text-base-content/60">{user.email}</p>
              <span className="badge badge-outline mt-1">{user.role === 'admin' ? 'Admin' : (currentRole === 'vendor' ? 'Vendor' : 'User')}</span>
            </div>
          </div>
          {/* Quick Links */}
          <div className="p-2 flex flex-col gap-1">
            {/* Admin Panel link for admins */}
            {user.role === 'admin' && (
              <>
                <Link to="/admin/dashboard" className="w-full text-left p-3 hover:bg-base-200 rounded-lg flex items-center gap-3 transition-colors font-semibold" onClick={() => setOpen(false)}>
                  <FaUserShield className="text-primary" />
                  <span>Admin Panel</span>
                </Link>
                <Link to="/admin/orders" className="w-full text-left p-3 hover:bg-base-200 rounded-lg flex items-center gap-3 transition-colors font-semibold" onClick={() => setOpen(false)}>
                  <FaShoppingCart className="text-primary" />
                  <span>Process Orders</span>
                </Link>
                <Link to="/admin/disputes" className="w-full text-left p-3 hover:bg-base-200 rounded-lg flex items-center gap-3 transition-colors font-semibold" onClick={() => setOpen(false)}>
                  <FaExclamationCircle className="text-warning" />
                  <span>Manage Disputes</span>
                </Link>
              </>
            )}
            <Link to="/profile" className="w-full text-left p-3 hover:bg-base-200 rounded-lg flex items-center gap-3 transition-colors" onClick={() => setOpen(false)}>
              <FaUser className="text-primary" />
              <span>Profile</span>
            </Link>
            <Link to="/orders" className="w-full text-left p-3 hover:bg-base-200 rounded-lg flex items-center gap-3 transition-colors" onClick={() => setOpen(false)}>
              <FaShoppingCart className="text-primary" />
              <span>Orders</span>
            </Link>
            <Link to="/disputes" className="w-full text-left p-3 hover:bg-base-200 rounded-lg flex items-center gap-3 transition-colors" onClick={() => setOpen(false)}>
              <FaExclamationCircle className="text-warning" />
              <span>Disputes</span>
            </Link>
            {/* Only show vendor links for non-admins */}
            {user.role !== 'admin' && !isVendorApproved && !vendor && (
              <Link to="/vendor/apply" className="w-full text-left p-3 hover:bg-base-200 rounded-lg flex items-center gap-3 transition-colors" onClick={() => setOpen(false)}>
                <FaStore className="text-warning" />
                <span>Become a Vendor</span>
              </Link>
            )}
            {user.role !== 'admin' && isVendorApproved && (
              <Link to="/vendor/dashboard" className="w-full text-left p-3 hover:bg-base-200 rounded-lg flex items-center gap-3 transition-colors" onClick={() => setOpen(false)}>
                <FaStore className="text-success" />
                <span>Vendor Dashboard</span>
              </Link>
            )}

          </div>
          {/* Role Switcher - only for non-admins */}
          {user.role !== 'admin' && isVendorApproved && (
            <div className="p-2 border-t flex flex-col gap-1">
              {currentRole === 'user' && (
                <button
                  onClick={() => handleRoleSwitch('vendor')}
                  className="w-full text-left p-3 hover:bg-base-200 rounded-lg flex items-center gap-3 transition-colors"
                >
                  <FaStore className="text-success" />
                  <span>Switch to Vendor</span>
                </button>
              )}

            </div>
          )}
          {/* Logout */}
          <div className="p-2 border-t">
            <button
              onClick={handleLogout}
              className="w-full text-left p-3 hover:bg-base-200 rounded-lg flex items-center gap-3 transition-colors text-error"
            >
              <FaSignOutAlt />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} tabIndex={-1} aria-hidden="true" />
      )}
    </div>
  );
}

const Navbar = () => {
  const { user, currentRole, logout, isVendorApproved } = useAuth();
  const { getCartCount } = useCart();
  const { getUnreadCount } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [, forceUpdate] = useState({});

  // Listen for URL updates from ProductDetail page
  useEffect(() => {
    const handleUrlUpdate = () => {
      forceUpdate({});
    };

    window.addEventListener('urlUpdated', handleUrlUpdate);
    return () => window.removeEventListener('urlUpdated', handleUrlUpdate);
  }, []);

  // Helper function to check if a nav link is active
  const isLinkActive = (link) => {
    // Use location from react-router for reactivity
    const currentPath = location.pathname;
    const urlParams = new URLSearchParams(location.search);
    const mode = urlParams.get('mode');

    // Special handling for product detail pages
    if (currentPath.startsWith('/products/')) {
      const productId = currentPath.split('/products/')[1];

      if (productId) {
        // If viewing an auction product, highlight "Auctions"
        if (link.to === '/auction' && mode === 'auction') {
          return true;
        }

        // If viewing a regular product, highlight "Products"  
        if (link.to === '/products' && (mode === 'buy-now' || (!mode && link.to === '/products'))) {
          return true;
        }

        // Don't highlight the wrong section
        if (link.to === '/auction' && mode !== 'auction') {
          return false;
        }
        if (link.to === '/products' && mode === 'auction') {
          return false;
        }

        // If no mode is set yet and we're on a product page, don't highlight anything to prevent flickering
        if (!mode && productId) {
          return false;
        }
      }
    }

    // Default behavior for other pages
    if (link.exactMatch) {
      return currentPath === link.to;
    }
    return currentPath.startsWith(link.to);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };



  const isAdmin = user && user.role === 'admin';

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <span className="text-white font-bold text-xl">B</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
              BidCart
            </span>
          </Link>



          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isLinkActive(link)
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                aria-current={isLinkActive(link) ? 'page' : undefined}
              >
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin/dashboard"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
              >
                <FaUserShield />
                Admin
              </Link>
            )}
            {user && isVendorApproved && (
              <Link
                to="/vendor/dashboard"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
              >
                <FaStore />
                Vendor
              </Link>
            )}
          </div>

          {/* User Menu - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link
                  to="/notifications"
                  className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
                  aria-label="Notifications"
                >
                  <FaBell className="text-xl" />
                  {getUnreadCount() > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {getUnreadCount()}
                    </span>
                  )}
                </Link>
                <Link
                  to="/cart"
                  className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
                  aria-label="Cart"
                >
                  <FaShoppingCart className="text-xl" />
                  {getCartCount() > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {getCartCount()}
                    </span>
                  )}
                </Link>
                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                <UserDropdown />
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMenuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
            onClick={() => setIsMenuOpen(false)}
          />
        )}
        <div
          className={`md:hidden fixed right-0 top-0 w-80 max-w-[85vw] h-full bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600">
              <Link to="/" className="flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow">
                  <span className="text-blue-600 font-extrabold text-lg">B</span>
                </div>
                <span className="text-xl font-extrabold text-white">BidCart</span>
              </Link>
              <button
                className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
                aria-label="Close menu"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            {/* User Info Section */}
            {user && (
              <div className="p-4 bg-gray-50 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center font-bold text-lg text-white shadow">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{user.name}</p>
                    <p className="text-sm text-gray-600 truncate">{user.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                      {currentRole === 'vendor' ? 'Vendor' : user.role === 'admin' ? 'Admin' : 'User'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center px-4 py-3 rounded-lg font-medium transition-all ${isLinkActive(link)
                      ? 'bg-blue-50 text-blue-600 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}

                <Link
                  to="/cart"
                  className="flex items-center justify-between px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-all"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="flex items-center gap-3">
                    {/* <FaShoppingCart className="text-lg" />*/}
                    Cart
                  </span>
                  {getCartCount() > 0 && (
                    <span className="px-2 py-1 text-xs font-bold bg-blue-600 text-white rounded-full">
                      {getCartCount()}
                    </span>
                  )}
                </Link>

                {user && (
                  <Link
                    to="/notifications"
                    className="flex items-center justify-between px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-all"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="flex items-center gap-3">
                      <FaBell className="text-lg" />
                      Notifications
                    </span>
                    {getUnreadCount() > 0 && (
                      <span className="px-2 py-1 text-xs font-bold bg-red-500 text-white rounded-full">
                        {getUnreadCount()}
                      </span>
                    )}
                  </Link>
                )}

                {isAdmin && (
                  <>
                    <div className="my-2 border-t"></div>
                    <Link
                      to="/admin/dashboard"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-all"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FaUserShield className="text-lg text-blue-600" />
                      Admin Dashboard
                    </Link>
                    <Link
                      to="/admin/disputes"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-all"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FaExclamationCircle className="text-lg text-orange-600" />
                      Manage Disputes
                    </Link>
                  </>
                )}

                {user && isVendorApproved && (
                  <Link
                    to="/vendor/dashboard"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-all"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FaStore className="text-lg text-green-600" />
                    Vendor Dashboard
                  </Link>
                )}

                {user && !isVendorApproved && !isAdmin && (
                  <Link
                    to="/vendor/apply"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-all"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FaStore className="text-lg text-orange-600" />
                    Become a Vendor
                  </Link>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="border-t p-4 bg-gray-50">
              {user ? (
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium transition-colors"
                >
                  <FaSignOutAlt />
                  Sign Out
                </button>
              ) : (
                <div className="space-y-2">
                  <Link
                    to="/login"
                    className="block w-full px-4 py-3 text-center font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block w-full px-4 py-3 text-center font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg shadow-sm transition-all"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
