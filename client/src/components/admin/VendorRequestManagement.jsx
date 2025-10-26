import React, { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaEye, FaBuilding, FaUser, FaClock, FaCheckCircle, FaTimesCircle, FaFile, FaDownload, FaStore } from 'react-icons/fa';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const VendorRequestManagement = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [responseMessage, setResponseMessage] = useState('');

  useEffect(() => {
    fetchRequests();
    fetchStats();
    const socket = io('http://localhost:5000', {
      auth: { token: localStorage.getItem('token') }
    });
    socket.on('vendor-request:new', (newRequest) => {
      setRequests(prev => [newRequest, ...prev]);
      toast.success('New vendor request received!');
    });
    return () => {
      socket.disconnect();
    };
  }, [filter]);

  const fetchRequests = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('status', filter);
      }
      
      const response = await api.get(`/vendor-requests?${params}`);
      setRequests(response.data.requests || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/vendor-requests/stats/overview');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      await api.put(`/vendor-requests/${requestId}/approve`, {
        responseMessage: responseMessage || 'Your vendor request has been approved! Welcome to BidCart!'
      });
      
      toast.success('Vendor request approved successfully!');
      fetchRequests();
      fetchStats();
      setShowModal(false);
      setResponseMessage('');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to approve request';
      toast.error(message);
    }
  };

  const handleReject = async (requestId) => {
    if (!responseMessage.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      await api.put(`/vendor-requests/${requestId}/reject`, {
        responseMessage
      });
      
      toast.success('Vendor request rejected');
      fetchRequests();
      fetchStats();
      setShowModal(false);
      setResponseMessage('');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to reject request';
      toast.error(message);
    }
  };

  const viewRequest = async (requestId) => {
    try {
      const response = await api.get(`/vendor-requests/${requestId}`);
      setSelectedRequest(response.data);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching request details:', error);
      toast.error('Failed to fetch request details');
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-error'
    };

    return (
      <span className={`badge ${statusClasses[status] || 'badge-neutral'}`}>
        {status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Vendor Request Management
        </h1>
        <p className="text-gray-600">
          Review and manage vendor applications from users
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
        <div className="stat bg-white shadow rounded-lg">
          <div className="stat-figure text-primary">
            <FaClock className="text-3xl" />
          </div>
          <div className="stat-title">Pending</div>
          <div className="stat-value text-warning">{stats.pending || 0}</div>
        </div>
        
        <div className="stat bg-white shadow rounded-lg">
          <div className="stat-figure text-success">
            <FaCheckCircle className="text-3xl" />
          </div>
          <div className="stat-title">Approved</div>
          <div className="stat-value text-success">{stats.approved || 0}</div>
        </div>
        
        <div className="stat bg-white shadow rounded-lg">
          <div className="stat-figure text-error">
            <FaTimesCircle className="text-3xl" />
          </div>
          <div className="stat-title">Rejected</div>
          <div className="stat-value text-error">{stats.rejected || 0}</div>
        </div>
        
        <div className="stat bg-white shadow rounded-lg">
          <div className="stat-figure text-info">
            <FaBuilding className="text-3xl" />
          </div>
          <div className="stat-title">Total Requests</div>
          <div className="stat-value text-info">{stats.total || 0}</div>
        </div>

        {/* Total Vendors */}
        <div className="stat bg-white shadow rounded-lg">
          <div className="stat-figure text-blue-500">
            <FaStore className="text-3xl" />
          </div>
          <div className="stat-title">Total Vendors</div>
          <div className="stat-value text-blue-500">{stats.totalVendors || 0}</div>
        </div>

        {/* Total Users */}
        <div className="stat bg-white shadow rounded-lg">
          <div className="stat-figure text-success">
            <FaUser className="text-3xl" />
          </div>
          <div className="stat-title">Total Users</div>
          <div className="stat-value text-success">{stats.totalUsers || 0}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="select select-bordered w-full"
            >
              <option value="all">All Requests</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilter('all');
              }}
              className="btn btn-outline"
            >
              Clear Filter
            </button>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>User</th>
                <th>Business</th>
                <th>Type</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.length > 0 ? (
                requests.map((request) => (
                  <tr key={request._id}>
                    <td>
                      <div className="flex items-center space-x-3">
                        <div className="avatar placeholder">
                          <div className="bg-neutral text-neutral-content rounded-full w-12">
                            <FaUser className="text-xl" />
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">{request.user?.name || 'Unknown User'}</div>
                          <div className="text-sm text-gray-500">{request.user?.email || 'No email'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className="font-medium">
                          {request.businessDetails?.businessName || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.businessDetails?.businessType || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="capitalize">
                        {request.businessDetails?.businessType || 'N/A'}
                      </span>
                    </td>
                    <td>
                      {getStatusBadge(request.status)}
                    </td>
                    <td>
                      <div className="text-sm">
                        {formatDate(request.createdAt)}
                      </div>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewRequest(request._id)}
                          className="btn btn-sm btn-outline"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        
                        {request.status === 'pending' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowModal(true);
                                setResponseMessage('');
                              }}
                              className="btn btn-sm btn-success"
                              title="Approve"
                            >
                              <FaCheck />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowModal(true);
                                setResponseMessage('');
                              }}
                              className="btn btn-sm btn-error"
                              title="Reject"
                            >
                              <FaTimes />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">
                    No vendor requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Request Details */}
      {showModal && selectedRequest && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <h3 className="font-bold text-lg mb-4">
              Vendor Request Details
            </h3>
            
            <div className="space-y-6">
              {/* User Information */}
              <div>
                <h4 className="font-semibold mb-2">User Information</h4>
                <div className="bg-gray-50 p-4 rounded">
                  <p><strong>Name:</strong> {selectedRequest.user?.name || 'Unknown User'}</p>
                  <p><strong>Email:</strong> {selectedRequest.user?.email || 'No email'}</p>
                  <p><strong>Phone:</strong> {selectedRequest.user?.phone || 'N/A'}</p>
                </div>
              </div>

              {/* Business Information */}
              <div>
                <h4 className="font-semibold mb-2">Business Information</h4>
                <div className="bg-gray-50 p-4 rounded">
                  <p><strong>Business Name:</strong> {selectedRequest.businessDetails?.businessName || 'N/A'}</p>
                  <p><strong>Business Type:</strong> {selectedRequest.businessDetails?.businessType || 'N/A'}</p>
                  <p><strong>Phone:</strong> {selectedRequest.businessDetails?.phone || 'N/A'}</p>
                  <p><strong>Website:</strong> {selectedRequest.businessDetails?.website || 'N/A'}</p>
                </div>
              </div>

              {/* Business Address */}
              {selectedRequest.businessDetails?.businessAddress && (
                <div>
                  <h4 className="font-semibold mb-2">Business Address</h4>
                  <div className="bg-gray-50 p-4 rounded">
                    <p>{selectedRequest.businessDetails.businessAddress.street}</p>
                    <p>
                      {selectedRequest.businessDetails.businessAddress.city}, 
                      {selectedRequest.businessDetails.businessAddress.state} 
                      {selectedRequest.businessDetails.businessAddress.zipCode}
                    </p>
                    <p>{selectedRequest.businessDetails.businessAddress.country}</p>
                  </div>
                </div>
              )}

              {/* Business Description */}
              <div>
                <h4 className="font-semibold mb-2">Business Description</h4>
                <div className="bg-gray-50 p-4 rounded">
                  <p>{selectedRequest.message}</p>
                </div>
              </div>

              {/* Documents */}
              {selectedRequest.documents && selectedRequest.documents.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Uploaded Documents</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedRequest.documents.map((doc, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <FaFile className="mr-2 text-gray-500" />
                            <span className="text-sm">{doc.originalName}</span>
                          </div>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline"
                          >
                            <FaDownload />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Response */}
              {selectedRequest.adminResponse && (
                <div>
                  <h4 className="font-semibold mb-2">Admin Response</h4>
                  <div className="bg-gray-50 p-4 rounded">
                    <p><strong>Message:</strong> {selectedRequest.adminResponse.message}</p>
                    <p><strong>Responded:</strong> {formatDate(selectedRequest.adminResponse.respondedAt)}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons for Pending Requests */}
              {selectedRequest.status === 'pending' && (
                <div>
                  <h4 className="font-semibold mb-2">Admin Response Message</h4>
                  <textarea
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    className="textarea textarea-bordered w-full"
                    rows={3}
                    placeholder="Enter your response message..."
                  />
                  
                  <div className="flex gap-4 mt-4">
                    <button
                      onClick={() => handleApprove(selectedRequest._id)}
                      className="btn btn-success"
                    >
                      <FaCheck className="mr-2" />
                      Approve Request
                    </button>
                    <button
                      onClick={() => handleReject(selectedRequest._id)}
                      className="btn btn-error"
                    >
                      <FaTimes className="mr-2" />
                      Reject Request
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-action">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedRequest(null);
                  setResponseMessage('');
                }}
                className="btn"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorRequestManagement; 