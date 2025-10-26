import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { FiCheck, FiX, FiEye, FiSearch, FiPackage } from 'react-icons/fi';
import toast from 'react-hot-toast';
import CustomModal from '../../components/CustomModal';

const VendorManagement = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  // eslint-disable-next-line no-unused-vars
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [vendorActivity, setVendorActivity] = useState(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivatingVendor, setDeactivatingVendor] = useState(null);
  // Add state for storing vendor activities
  const [vendorActivities, setVendorActivities] = useState({});
  const [activitiesLoading, setActivitiesLoading] = useState({});
  const [showAllDetailsModal, setShowAllDetailsModal] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [searchName, setSearchName] = useState('');

  // Add function to fetch activity for a specific vendor
  const fetchVendorActivity = useCallback(async (vendorId) => {
    if (vendorActivities[vendorId]) return; // Already loaded
    
    setActivitiesLoading(prev => ({ ...prev, [vendorId]: true }));
    try {
      const res = await api.get(`/vendors/admin/${vendorId}/activity`);
      setVendorActivities(prev => ({ ...prev, [vendorId]: res.data }));
    } catch (error) {
      console.error('Failed to fetch vendor activity:', error);
    } finally {
      setActivitiesLoading(prev => ({ ...prev, [vendorId]: false }));
    }
  }, [vendorActivities]);

  const fetchVendors = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10
      });
      
      if (statusFilter) {
        params.append('status', statusFilter);
      }

      const response = await api.get(`/vendors/admin/applications?${params}`);
      // Server returns { success, applications, total, totalPages, currentPage }
      const list = Array.isArray(response.data?.applications)
        ? response.data.applications
        : [];
      setVendors(list);
      setTotalPages(response.data?.totalPages || 1);
      
      // Fetch activity for each vendor
      list.forEach(vendor => {
        if (vendor?._id) {
          fetchVendorActivity(vendor._id);
        }
      });
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast.error('Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, fetchVendorActivity]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const handleStatusUpdate = async (vendorId, status, rejectionReason = '') => {
    try {
      await api.put(`/vendors/admin/${vendorId}/status`, {
        status,
        rejectionReason
      });
      
      toast.success(`Vendor application ${status}`);
      fetchVendors();
    } catch (error) {
      toast.error('Failed to update vendor status');
    }
  };

  const handleViewActivity = async (vendorId, vendorData) => {
    setSelectedVendor(vendorData);
    setShowModal(true);
    setActivityLoading(true);
    try {
      const res = await api.get(`/vendors/admin/${vendorId}/activity`);
      setVendorActivity(res.data);
    } catch (error) {
      toast.error('Failed to fetch vendor activity');
      setVendorActivity(null);
    } finally {
      setActivityLoading(false);
    }
  };

  const handleDeactivateVendor = async (vendorId) => {
    if (!window.confirm('Are you sure you want to deactivate this vendor?')) return;
    try {
      await api.put(`/vendors/admin/${vendorId}/deactivate`);
      toast.success('Vendor deactivated successfully');
      setShowModal(false);
      fetchVendors();
    } catch (error) {
      toast.error('Failed to deactivate vendor');
    }
  };

  // eslint-disable-next-line no-unused-vars
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      approved: 'bg-green-50 text-green-700 border-green-200',
      rejected: 'bg-red-50 text-red-700 border-red-200',
      suspended: 'bg-gray-50 text-gray-700 border-gray-200'
    };

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${statusStyles[status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
        {status}
      </span>
    );
  };

  // Filter vendors by search term safely
  const filteredVendors = (vendors || []).filter(vendor => {
    const businessName = vendor.businessName?.toLowerCase() || '';
    const ownerName = vendor.user?.name?.toLowerCase() || '';
    const email = vendor.contactInfo?.email?.toLowerCase() || '';
    const phone = vendor.contactInfo?.phone?.toLowerCase() || '';
    const term = (searchTerm || '').toLowerCase();
    
    return (
      businessName.includes(term) || 
      ownerName.includes(term) ||
      email.includes(term) ||
      phone.includes(term)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vendor Management</h1>
            <p className="text-sm text-gray-500 mt-1">Manage vendor applications and accounts</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">{vendors.length}</span>
            <span>Vendors</span>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Business</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Owner</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Performance</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center text-gray-500">
                        <FiPackage className="w-12 h-12 mb-3" />
                        <p className="text-sm font-medium">No vendors found</p>
                        <p className="text-xs">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredVendors.map(vendor => {
                    const activity = vendorActivities[vendor._id];
                    return (
                      <tr key={vendor._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900 whitespace-nowrap">{vendor.businessName}</div>
                          <div className="text-xs text-gray-500">{vendor.businessType}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{vendor.user?.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{vendor.user?.email}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{getStatusBadge(vendor.status)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {activity ? (
                            <div className="text-xs text-gray-600">
                              <div className="mb-1">
                                <span className="font-medium">Products:</span> {activity.stats.totalProducts}
                              </div>
                              <div className="mb-1">
                                <span className="font-medium">Orders:</span> {activity.stats.totalOrders}
                              </div>
                              <div>
                                <span className="font-medium">Earnings:</span> ${Number(activity?.stats?.totalEarnings ?? 0).toFixed(2)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Loading...</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => handleViewActivity(vendor._id, vendor)}
                              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                              title="View Details"
                            >
                              <FiEye className="w-4 h-4" />
                            </button>
                            {vendor.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleStatusUpdate(vendor._id, 'approved')}
                                  className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors"
                                  title="Approve"
                                >
                                  <FiCheck className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    const reason = prompt('Enter rejection reason:');
                                    if (reason) handleStatusUpdate(vendor._id, 'rejected', reason);
                                  }}
                                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                                  title="Reject"
                                >
                                  <FiX className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-600">
            Showing {filteredVendors.length} of {vendors.length} vendors
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={filteredVendors.length < 10}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Vendor Details Modal */}
      {showModal && selectedVendor && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">
              Vendor Details - {selectedVendor.businessName}
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-lg mb-2">Business Information</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p><strong>Name:</strong> {selectedVendor.businessName}</p>
                    <p><strong>Type:</strong> {selectedVendor.businessType}</p>
                    <p><strong>Description:</strong> {selectedVendor.businessDescription}</p>
                    <p><strong>Status:</strong> {getStatusBadge(selectedVendor.status)}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-lg mb-2">Owner Information</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p><strong>Name:</strong> {selectedVendor.user.name}</p>
                    <p><strong>Email:</strong> {selectedVendor.user.email}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-lg mb-2">Contact Information</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p><strong>Phone:</strong> {selectedVendor?.contactInfo?.phone || 'N/A'}</p>
                    <p><strong>Email:</strong> {selectedVendor?.contactInfo?.email || selectedVendor?.user?.email || 'N/A'}</p>
                    <p><strong>Website:</strong> {selectedVendor?.contactInfo?.website ? (
                      <a href={selectedVendor.contactInfo.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {selectedVendor.contactInfo.website}
                      </a>
                    ) : 'N/A'}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-lg mb-2">Business Address</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-1">
                    <p>{selectedVendor?.businessAddress?.street || 'N/A'}</p>
                    <p>
                      {[selectedVendor?.businessAddress?.city, selectedVendor?.businessAddress?.state]
                        .filter(Boolean)
                        .join(', ')}
                      {selectedVendor?.businessAddress?.zipCode ? ` ${selectedVendor.businessAddress.zipCode}` : ''}
                    </p>
                    <p>{selectedVendor?.businessAddress?.country || 'N/A'}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-lg mb-2">Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedVendor?.categories?.length > 0 ? (
                      selectedVendor.categories.map((category, index) => (
                        <span key={index} className="badge badge-outline">{category}</span>
                      ))
                    ) : (
                      <p className="text-gray-500">No categories specified</p>
                    )}
                  </div>
                </div>
                
                {selectedVendor.rejectionReason && (
                  <div>
                    <h4 className="font-semibold text-red-600 text-lg mb-2">Rejection Reason</h4>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p>{selectedVendor.rejectionReason}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Activity Information */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-lg mb-2">
                    Vendor Activity
                  </h4>
                  
                  {activityLoading ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="loading-spinner"></div>
                    </div>
                  ) : vendorActivity ? (
                    <div className="space-y-4">
                      {/* Activity Stats */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {vendorActivity.stats.totalProducts}
                          </div>
                          <div className="text-sm text-gray-600">Products</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {vendorActivity.stats.totalOrders}
                          </div>
                          <div className="text-sm text-gray-600">Orders</div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            ₹{Number(vendorActivity?.stats?.totalEarnings ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className="text-sm text-gray-600">Earnings</div>
                        </div>
                      </div>

                      {/* Recent Products */}
                      {vendorActivity?.products?.length > 0 && (
                        <div>
                          <h5 className="font-semibold mb-2">Recent Products</h5>
                          <div className="bg-gray-50 p-4 rounded-lg max-h-32 overflow-y-auto">
                            {vendorActivity.products.slice(0, 5).map((product) => (
                              <div key={product._id} className="flex justify-between items-center py-1">
                                <span className="text-sm">{product.name}</span>
                                <span className="badge badge-sm">{product.approvalStatus}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recent Orders */}
                      {vendorActivity?.orders?.length > 0 && (
                        <div>
                          <h5 className="font-semibold mb-2">Recent Orders</h5>
                          <div className="bg-gray-50 p-4 rounded-lg max-h-32 overflow-y-auto">
                            {vendorActivity.orders.slice(0, 5).map((order) => (
                              <div key={order._id} className="flex justify-between items-center py-1">
                                <span className="text-sm">Order #{order._id.slice(-6)}</span>
                                <span className="text-sm font-medium">${order.totalAmount}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                      No activity data available
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="modal-action flex justify-between items-center mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="btn"
              >
                Close
              </button>
              <div className="flex space-x-2">
                {selectedVendor.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        handleStatusUpdate(selectedVendor._id, 'approved');
                        setShowModal(false);
                      }}
                      className="btn btn-success"
                    >
                      <FiCheck className="mr-2" />
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Enter rejection reason:');
                        if (reason) {
                          handleStatusUpdate(selectedVendor._id, 'rejected', reason);
                          setShowModal(false);
                        }
                      }}
                      className="btn btn-error"
                    >
                      <FiX className="mr-2" />
                      Reject
                    </button>
                  </>
                )}
                
                {selectedVendor.status === 'approved' && (
                  <button
                    onClick={() => {
                      handleStatusUpdate(selectedVendor._id, 'suspended');
                      setShowModal(false);
                    }}
                    className="btn btn-warning"
                  >
                    Suspend
                  </button>
                )}
                
                {selectedVendor.status === 'suspended' && (
                  <button
                    onClick={() => {
                      handleStatusUpdate(selectedVendor._id, 'approved');
                      setShowModal(false);
                    }}
                    className="btn btn-success"
                  >
                    Activate
                  </button>
                )}
                
                {selectedVendor.status !== 'suspended' && (
                  <button
                    onClick={() => {
                      setDeactivatingVendor(selectedVendor);
                      setShowDeactivateModal(true);
                      setShowModal(false);
                    }}
                    className="btn btn-error"
                  >
                    Deactivate Vendor
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      <CustomModal
        open={showDeactivateModal}
        onClose={() => {
          setShowDeactivateModal(false);
          setDeactivatingVendor(null);
        }}
        title="Confirm Vendor Deactivation"
      >
        {deactivatingVendor && (
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-2">Warning</h4>
              <p className="text-red-700">
                You are about to deactivate the vendor account for <strong>{deactivatingVendor.businessName}</strong>.
              </p>
              <p className="text-red-700 mt-2">
                This action will:
              </p>
              <ul className="list-disc list-inside text-red-700 mt-1 ml-4">
                <li>Suspend the vendor's account</li>
                <li>Hide their products from the marketplace</li>
                <li>Prevent them from processing new orders</li>
                <li>Send a notification to the vendor</li>
              </ul>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-semibold mb-2">Vendor Activity Summary</h5>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Products:</span> {vendorActivity?.stats.totalProducts || 0}
                </div>
                <div>
                  <span className="font-medium">Orders:</span> {vendorActivity?.stats.totalOrders || 0}
                </div>
                <div>
                  <span className="font-medium">Earnings:</span> ${vendorActivity?.stats.totalEarnings?.toFixed(2) || '0.00'}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowDeactivateModal(false);
                  setDeactivatingVendor(null);
                }}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDeactivateVendor(deactivatingVendor._id);
                  setShowDeactivateModal(false);
                  setDeactivatingVendor(null);
                }}
                className="btn btn-error"
              >
                Confirm Deactivation
              </button>
            </div>
          </div>
        )}
      </CustomModal>

      {/* All Vendor Details Modal */}
      <CustomModal open={showAllDetailsModal} onClose={() => setShowAllDetailsModal(false)} center>
        <div className="max-h-[80vh] overflow-y-auto p-4">
          <h2 className="text-2xl font-bold mb-4">All Vendor Details</h2>
          <table className="table w-full text-xs">
            <thead>
              <tr>
                <th>Business Name</th>
                <th>Owner</th>
                <th>Email</th>
                <th>Status</th>
                <th>Categories</th>
                <th>Products</th>
                <th>Orders</th>
                <th>Earnings</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map(vendor => {
                const activity = vendorActivities[vendor._id];
                return (
                  <tr key={vendor._id}>
                    <td>{vendor.businessName}</td>
                    <td>{vendor.user?.name}</td>
                    <td>{vendor.user?.email}</td>
                    <td>
                      <span className={`badge ${vendor.status === 'approved' ? 'badge-success' : vendor.status === 'pending' ? 'badge-warning' : 'badge-error'}`}>{vendor.status}</span>
                    </td>
                    <td>{(vendor.categories || []).join(', ')}</td>
                    <td>{activity ? activity.stats.totalProducts : '-'}</td>
                    <td>{activity ? activity.stats.totalOrders : '-'}</td>
                    <td>
                      {activity 
                        ? `₹${Number(activity?.stats?.totalEarnings ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
                        : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="flex justify-end mt-4">
            <button className="btn" onClick={() => setShowAllDetailsModal(false)}>Close</button>
          </div>
        </div>
      </CustomModal>
    </div>
  );
};

export default VendorManagement; 