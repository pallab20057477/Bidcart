import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiEye, FiEdit, FiTrash2, FiClock, FiCheck, FiX } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const VendorAuctionRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchAuctionRequests();
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

            console.log('🔍 Fetching vendor auction requests from:', `/auction-requests/vendor?${params}`);
            const response = await api.get(`/auction-requests/vendor?${params}`);
            
            console.log('📋 Vendor auction requests response:', response.data);
            const data = response.data;
            
            if (data.success) {
                // Filter out any null/undefined requests
                const validRequests = (data.auctionRequests || []).filter(request => 
                    request && request._id
                );
                setRequests(validRequests);
                setTotalPages(data.totalPages || 1);
                console.log('✅ Found auction requests:', validRequests.length);
            } else {
                console.log('❌ Failed to fetch auction requests:', data.message);
                toast.error(data.message || 'Failed to fetch auction requests');
            }
        } catch (error) {
            console.error('❌ Error fetching auction requests:', error);
            toast.error('Failed to fetch auction requests');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this auction request?')) {
            return;
        }

        try {
            await api.delete(`/auction-requests/${id}`);
            fetchAuctionRequests();
        } catch (error) {
            console.error('Error deleting auction request:', error);
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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Auction Requests</h1>
                    <p className="text-gray-600">Manage your product auction requests</p>
                </div>
                <Link
                    to="/vendor/auction-requests/create"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    <FiPlus className="w-4 h-4" />
                    New Request
                </Link>
            </div>

            {/* Filters */}
            <div className="flex space-x-4">
                {['all', 'pending', 'approved', 'rejected'].map((status) => (
                    <button
                        key={status}
                        onClick={() => {
                            setFilter(status);
                            setCurrentPage(1);
                        }}
                        className={`px-4 py-2 rounded-lg capitalize ${
                            filter === status
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* Requests List */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                {requests.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No auction requests found</p>
                        <Link
                            to="/vendor/auction-requests/create"
                            className="text-blue-600 hover:text-blue-700 mt-2 inline-block"
                        >
                            Create your first auction request
                        </Link>
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
                                        Auction Period
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Starting Bid
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Created
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
                                                {request.product && request.product.images && request.product.images.length > 0 ? (
                                                    <img
                                                        className="h-10 w-10 rounded-lg object-cover"
                                                        src={request.product.images[0]}
                                                        alt={request.product.name}
                                                    />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                                                        <span className="text-gray-400 text-xs">No Image</span>
                                                    </div>
                                                )}
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {request.product?.name || 'Product Not Found'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {request.product?.category || 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div>
                                                <div>Start: {request.requestedStartTime ? formatDate(request.requestedStartTime) : 'N/A'}</div>
                                                <div>End: {request.requestedEndTime ? formatDate(request.requestedEndTime) : 'N/A'}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            ${request.startingBid ? request.startingBid.toFixed(2) : '0.00'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(request.status || 'pending')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {request.createdAt ? formatDate(request.createdAt) : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2">
                                                {request.product && request.product._id ? (
                                                    <Link
                                                        to={`/products/${request.product._id}?mode=auction`}
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="View Product"
                                                    >
                                                        <FiEye className="w-4 h-4" />
                                                    </Link>
                                                ) : (
                                                    <span className="text-gray-400" title="Product not available">
                                                        <FiEye className="w-4 h-4" />
                                                    </span>
                                                )}
                                                {request.status === 'pending' && (
                                                    <>
                                                        <Link
                                                            to={`/vendor/auction-requests/${request._id}/edit`}
                                                            className="text-green-600 hover:text-green-900"
                                                        >
                                                            <FiEdit className="w-4 h-4" />
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(request._id)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            <FiTrash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
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
                            className={`px-3 py-2 rounded-md text-sm font-medium ${
                                currentPage === page
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
        </div>
    );
};

export default VendorAuctionRequests;