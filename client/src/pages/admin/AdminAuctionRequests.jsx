import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiEye, FiCheck, FiX, FiClock, FiTrendingUp, FiAlertCircle } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';

// Fix for Link import issue

const AdminAuctionRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [stats, setStats] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Approval form data
    const [approvalData, setApprovalData] = useState({
        startTime: '',
        endTime: '',
        startingBid: '',
        minBidIncrement: '',
        reservePrice: '',
        buyNowPrice: '',
        message: ''
    });

    // Rejection form data
    const [rejectionMessage, setRejectionMessage] = useState('');

    useEffect(() => {
        fetchAuctionRequests();
        fetchStats();
    }, [filter, currentPage]);

    const fetchAuctionRequests = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage,
                limit: 10
            });

            if (filter !== 'all') {
                params.append('status', filter);
            }

            const response = await api.get(`/auction-requests/admin?${params}`);
            const data = response.data;
            // Filter out any null/undefined requests
            const validRequests = (data.docs || data.auctionRequests || []).filter(request => 
                request && request._id
            );
            setRequests(validRequests);
            setTotalPages(data.totalPages || 1);
        } catch (error) {
            console.error('Error fetching auction requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get('/auction-requests/admin/stats');
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleApproveClick = (request) => {
        setSelectedRequest(request);
        setApprovalData({
            startTime: request.requestedStartTime ? request.requestedStartTime.slice(0, 16) : '',
            endTime: request.requestedEndTime ? request.requestedEndTime.slice(0, 16) : '',
            startingBid: request.startingBid || '',
            minBidIncrement: request.minBidIncrement || '',
            reservePrice: request.reservePrice || '',
            buyNowPrice: request.buyNowPrice || '',
            message: ''
        });
        setShowApproveModal(true);
    };

    const handleRejectClick = (request) => {
        setSelectedRequest(request);
        setRejectionMessage('');
        setShowRejectModal(true);
    };

    const handleApprove = async () => {
        if (!selectedRequest) return;

        setActionLoading(true);
        try {
            await api.post(`/auction-requests/${selectedRequest._id}/approve`, approvalData);
            setShowApproveModal(false);
            fetchAuctionRequests();
            fetchStats();
        } catch (error) {
            console.error('Error approving request:', error);
            alert('An error occurred');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!selectedRequest || !rejectionMessage.trim()) {
            alert('Please provide a rejection reason');
            return;
        }

        setActionLoading(true);
        try {
            await api.post(`/auction-requests/${selectedRequest._id}/reject`, { message: rejectionMessage });
            setShowRejectModal(false);
            fetchAuctionRequests();
            fetchStats();
        } catch (error) {
            console.error('Error rejecting request:', error);
            alert('An error occurred');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: { color: 'bg-yellow-100 text-yellow-800', icon: FiClock, text: 'Pending' },
            approved: { color: 'bg-green-100 text-green-800', icon: FiCheck, text: 'Approved' },
            rejected: { color: 'bg-red-100 text-red-800', icon: FiX, text: 'Rejected' }
        };

        const badge = badges[status] || badges.pending;
        const Icon = badge.icon;

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                <Icon className="w-3 h-3 mr-1" />
                {badge.text}
            </span>
        );
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading && !requests.length) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Auction Requests</h1>
                            <p className="text-gray-600 mt-1">Review and manage vendor auction requests</p>
                        </div>
                        {stats && stats.byStatus?.pending > 0 && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <FiAlertCircle className="text-yellow-600" />
                                <span className="text-sm font-medium text-yellow-800">
                                    {stats.byStatus.pending} pending review
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Requests</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total || 0}</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <FiTrendingUp className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Pending Review</p>
                                    <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.byStatus?.pending || 0}</p>
                                </div>
                                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                    <FiClock className="w-6 h-6 text-yellow-600" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Approved</p>
                                    <p className="text-3xl font-bold text-green-600 mt-2">{stats.byStatus?.approved || 0}</p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <FiCheck className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Rejected</p>
                                    <p className="text-3xl font-bold text-red-600 mt-2">{stats.byStatus?.rejected || 0}</p>
                                </div>
                                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                    <FiX className="w-6 h-6 text-red-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">Filter by status:</span>
                        <div className="flex gap-2">
                            {['all', 'pending', 'approved', 'rejected'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => {
                                        setFilter(status);
                                        setCurrentPage(1);
                                    }}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${filter === status
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {status}
                                    {status !== 'all' && stats?.byStatus?.[status] > 0 && (
                                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${filter === status ? 'bg-white/20' : 'bg-gray-200'
                                            }`}>
                                            {stats.byStatus[status]}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Requests Table */}
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                    {requests.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No auction requests found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Product
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Vendor
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Auction Period
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Starting Bid
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {requests.filter(request => request && request._id).map((request) => (
                                        <tr key={request._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <img
                                                        className="h-10 w-10 rounded-lg object-cover"
                                                        src={request.product?.images?.[0]}
                                                        alt={request.product?.name}
                                                    />
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {request.product?.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {request.product?.category}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {request.vendor?.businessName || 'N/A'}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {request.vendor?.email}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <div>
                                                    <div>Start: {formatDate(request.requestedStartTime)}</div>
                                                    <div>End: {formatDate(request.requestedEndTime)}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                ${request.startingBid?.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(request.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-2">
                                                    {request.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApproveClick(request)}
                                                                className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded"
                                                                title="Approve"
                                                            >
                                                                <FiCheck className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleRejectClick(request)}
                                                                className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded"
                                                                title="Reject"
                                                            >
                                                                <FiX className="w-5 h-5" />
                                                            </button>
                                                        </>
                                                    )}
                                                    {request.product && request.product._id ? (
                                                        <Link
                                                            to={`/products/${request.product._id}?mode=auction`}
                                                            className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded inline-block"
                                                            title="View Product"
                                                        >
                                                            <FiEye className="w-5 h-5" />
                                                        </Link>
                                                    ) : (
                                                        <span className="text-gray-400 p-2" title="Product not available">
                                                            <FiEye className="w-5 h-5" />
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center space-x-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-2 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Previous
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`px-3 py-2 rounded-md text-sm font-medium ${currentPage === page
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white border border-gray-300 text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                {page}
                            </button>
                        ))}

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}

                {/* Approve Modal */}
                {showApproveModal && selectedRequest && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Approve Auction Request</h2>

                                {/* Product Info */}
                                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                    <div className="flex items-center space-x-4">
                                        <img
                                            src={selectedRequest.product?.images?.[0]}
                                            alt={selectedRequest.product?.name}
                                            className="w-16 h-16 object-cover rounded-lg"
                                        />
                                        <div>
                                            <h3 className="font-medium text-gray-900">{selectedRequest.product?.name}</h3>
                                            <p className="text-sm text-gray-600">{selectedRequest.vendor?.businessName}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Justification */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Vendor's Justification
                                    </label>
                                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                                        {selectedRequest.justification}
                                    </p>
                                </div>

                                {/* Approval Form */}
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Start Time *
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={approvalData.startTime}
                                                onChange={(e) => setApprovalData({ ...approvalData, startTime: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                End Time *
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={approvalData.endTime}
                                                onChange={(e) => setApprovalData({ ...approvalData, endTime: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Starting Bid *
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={approvalData.startingBid}
                                                onChange={(e) => setApprovalData({ ...approvalData, startingBid: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Min Bid Increment *
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={approvalData.minBidIncrement}
                                                onChange={(e) => setApprovalData({ ...approvalData, minBidIncrement: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Reserve Price
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={approvalData.reservePrice}
                                                onChange={(e) => setApprovalData({ ...approvalData, reservePrice: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Buy Now Price
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={approvalData.buyNowPrice}
                                                onChange={(e) => setApprovalData({ ...approvalData, buyNowPrice: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Message to Vendor (Optional)
                                        </label>
                                        <textarea
                                            value={approvalData.message}
                                            onChange={(e) => setApprovalData({ ...approvalData, message: e.target.value })}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            placeholder="Any notes or modifications..."
                                        />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end space-x-4 mt-6">
                                    <button
                                        onClick={() => setShowApproveModal(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                        disabled={actionLoading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleApprove}
                                        disabled={actionLoading}
                                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                    >
                                        {actionLoading ? 'Approving...' : 'Approve Auction'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Reject Modal */}
                {showRejectModal && selectedRequest && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-lg w-full">
                            <div className="p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Reject Auction Request</h2>

                                {/* Product Info */}
                                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                    <div className="flex items-center space-x-4">
                                        <img
                                            src={selectedRequest.product?.images?.[0]}
                                            alt={selectedRequest.product?.name}
                                            className="w-16 h-16 object-cover rounded-lg"
                                        />
                                        <div>
                                            <h3 className="font-medium text-gray-900">{selectedRequest.product?.name}</h3>
                                            <p className="text-sm text-gray-600">{selectedRequest.vendor?.businessName}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Rejection Reason *
                                    </label>
                                    <textarea
                                        value={rejectionMessage}
                                        onChange={(e) => setRejectionMessage(e.target.value)}
                                        rows={4}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        placeholder="Explain why this auction request is being rejected..."
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end space-x-4 mt-6">
                                    <button
                                        onClick={() => setShowRejectModal(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                        disabled={actionLoading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleReject}
                                        disabled={actionLoading || !rejectionMessage.trim()}
                                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                    >
                                        {actionLoading ? 'Rejecting...' : 'Reject Request'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminAuctionRequests;
