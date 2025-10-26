import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiEye, FiTrash, FiUserCheck, FiUserX, FiUsers, FiShoppingBag, FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';

const TABS = [
    { key: 'users', label: 'Users', icon: FiUsers },
    { key: 'vendors', label: 'Vendors', icon: FiShoppingBag },
];

const PAGE_SIZE = 10;

const AccountsManagement = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Initialize activeTab from URL immediately
    const getInitialTab = () => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        return (tab && ['users', 'vendors'].includes(tab)) ? tab : 'users';
    };

    const [activeTab, setActiveTab] = useState(getInitialTab);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [roleFilter, setRoleFilter] = useState('all');
    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Fetch data
    const fetchData = useCallback(async () => {
        setLoading(true);
        let url = '';
        let params = { page, limit: PAGE_SIZE };
        if (search) params.search = search;

        if (activeTab === 'users') {
            url = '/admin/users';
            if (roleFilter !== 'all') params.role = roleFilter;
        } else if (activeTab === 'vendors') {
            url = '/vendors/admin/applications';
        }

        try {
            const response = await api.get(url, { params });
            if (activeTab === 'vendors') {
                setData(response.data.applications || response.data.vendors || []);
                setTotal(response.data.total || response.data.totalVendors || 0);
            } else {
                setData(response.data.users || []);
                setTotal(response.data.total || response.data.totalUsers || 0);
            }
        } catch (err) {
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    }, [activeTab, search, page, roleFilter]);

    // Sync tab with URL changes
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');

        if (tab && ['users', 'vendors'].includes(tab)) {
            if (tab !== activeTab) {
                setActiveTab(tab);
                setPage(1);
            }
        } else if (!tab) {
            // If no tab in URL, set default and update URL
            const newParams = new URLSearchParams();
            newParams.set('tab', activeTab);
            navigate({ search: newParams.toString() }, { replace: true });
        }
    }, [location.search]); // Run when URL changes

    // Update URL when tab changes programmatically (from clicking tabs)
    const handleTabChange = (newTab) => {
        setActiveTab(newTab);
        const params = new URLSearchParams();
        params.set('tab', newTab);
        navigate({ search: params.toString() }, { replace: true });
    };

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Actions
    const handleView = (item) => {
        setSelectedItem(item);
        setShowModal(true);
    };

    const handleToggleStatus = async (item) => {
        setActionLoading(true);
        try {
            if (activeTab === 'users') {
                await api.put(`/admin/users/${item._id}/status`, { isActive: !item.isActive });
                toast.success(`User ${item.isActive ? 'deactivated' : 'activated'} successfully`);
            } else {
                await api.put(`/vendors/admin/${item._id}/status`, {
                    status: item.status === 'approved' ? 'suspended' : 'approved'
                });
                toast.success(`Vendor ${item.status === 'approved' ? 'suspended' : 'activated'} successfully`);
            }
            fetchData();
        } catch (err) {
            toast.error('Failed to update status');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (item) => {
        if (!window.confirm('Are you sure? This action cannot be undone.')) return;
        setActionLoading(true);
        try {
            if (activeTab === 'users') {
                await api.delete(`/admin/users/${item._id}`);
                toast.success('User deleted successfully');
                // Dispatch event to refresh dashboard
                const event = new CustomEvent('userDeleted', { detail: { userId: item._id } });
                window.dispatchEvent(event);
            } else {
                await api.delete(`/vendors/admin/${item._id}`);
                toast.success('Vendor deleted successfully');
                // Dispatch event to refresh dashboard
                const event = new CustomEvent('vendorDeleted', { detail: { vendorId: item._id } });
                window.dispatchEvent(event);
            }
            fetchData();
        } catch (err) {
            toast.error('Failed to delete');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadge = (item) => {
        if (activeTab === 'users') {
            return item.isActive ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                    Active
                </span>
            ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
                    Inactive
                </span>
            );
        } else {
            const statusColors = {
                approved: 'bg-green-50 text-green-700 border-green-200',
                pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
                rejected: 'bg-red-50 text-red-700 border-red-200',
                suspended: 'bg-gray-50 text-gray-700 border-gray-200'
            };
            return (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${statusColors[item.status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                    {item.status}
                </span>
            );
        }
    };

    const stats = {
        users: {
            total: total,
            active: data.filter(u => u.isActive).length,
            inactive: data.filter(u => !u.isActive).length
        },
        vendors: {
            total: total,
            approved: data.filter(v => v.status === 'approved').length,
            pending: data.filter(v => v.status === 'pending').length
        }
    };

    if (loading && data.length === 0) {
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
                        <h1 className="text-2xl font-bold text-gray-900">Accounts Management</h1>
                        <p className="text-sm text-gray-500 mt-1">Manage users and vendors</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-medium">{stats[activeTab].total}</span>
                        <span>Total {activeTab}</span>
                    </div>
                </div>

                {/* Tabs & Search */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        {/* Tabs */}
                        <div className="inline-flex bg-gray-100 rounded-lg p-1">
                            {TABS.map(tab => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.key}
                                        onClick={() => {
                                            handleTabChange(tab.key);
                                            setPage(1);
                                        }}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === tab.key
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Search & Filter */}
                        <div className="flex gap-2 flex-1 sm:flex-initial sm:min-w-[300px]">
                            <div className="relative flex-1">
                                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder={`Search ${activeTab}...`}
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                                />
                            </div>

                            {activeTab === 'users' && (
                                <select
                                    value={roleFilter}
                                    onChange={e => setRoleFilter(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="all">All</option>
                                    <option value="user">User</option>
                                    <option value="vendor">Vendor</option>
                                    <option value="admin">Admin</option>
                                </select>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    {activeTab === 'users' ? (
                                        <>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Name</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Email</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Role</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Actions</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Business Name</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Owner</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Email</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Actions</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {data.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-500">
                                            No {activeTab} found
                                        </td>
                                    </tr>
                                ) : (
                                    data.map(item => (
                                        <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                                            {activeTab === 'users' ? (
                                                <>
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">{item.email}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">
                                                        <span className="capitalize">{item.role}</span>
                                                    </td>
                                                    <td className="px-4 py-3">{getStatusBadge(item)}</td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.businessName}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">{item.user?.name || '-'}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">{item.user?.email || '-'}</td>
                                                    <td className="px-4 py-3">{getStatusBadge(item)}</td>
                                                </>
                                            )}
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button
                                                        onClick={() => handleView(item)}
                                                        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                                                        title="View"
                                                    >
                                                        <FiEye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleStatus(item)}
                                                        disabled={actionLoading}
                                                        className={`p-2 rounded-md transition-colors disabled:opacity-50 ${
                                                            (activeTab === 'users' && item.isActive) || (activeTab === 'vendors' && item.status === 'approved')
                                                                ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'
                                                                : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                                                        }`}
                                                        title={(activeTab === 'users' && item.isActive) || (activeTab === 'vendors' && item.status === 'approved') ? 'Deactivate' : 'Activate'}
                                                    >
                                                        {(activeTab === 'users' && item.isActive) || (activeTab === 'vendors' && item.status === 'approved') ? (
                                                            <FiUserX className="w-4 h-4" />
                                                        ) : (
                                                            <FiUserCheck className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item)}
                                                        disabled={actionLoading}
                                                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                                                        title="Delete"
                                                    >
                                                        <FiTrash className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {total > PAGE_SIZE && (
                    <div className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg">
                        <div className="text-sm text-gray-600">
                            {((page - 1) * PAGE_SIZE) + 1}-{Math.min(page * PAGE_SIZE, total)} of {total}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={data.length < PAGE_SIZE}
                                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Details Modal */}
            {showModal && selectedItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-lg max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {activeTab === 'users' ? 'User' : 'Vendor'} Details
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600 p-1"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-4 space-y-3">
                            {activeTab === 'users' ? (
                                <>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm text-gray-600">Name</span>
                                        <span className="text-sm font-medium text-gray-900">{selectedItem.name}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm text-gray-600">Email</span>
                                        <span className="text-sm font-medium text-gray-900">{selectedItem.email}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm text-gray-600">Role</span>
                                        <span className="text-sm font-medium text-gray-900 capitalize">{selectedItem.role}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-sm text-gray-600">Status</span>
                                        {getStatusBadge(selectedItem)}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm text-gray-600">Business</span>
                                        <span className="text-sm font-medium text-gray-900">{selectedItem.businessName}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm text-gray-600">Owner</span>
                                        <span className="text-sm font-medium text-gray-900">{selectedItem.user?.name || '-'}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm text-gray-600">Email</span>
                                        <span className="text-sm font-medium text-gray-900">{selectedItem.user?.email || '-'}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-sm text-gray-600">Categories</span>
                                        <span className="text-sm font-medium text-gray-900">{(selectedItem.categories || []).join(', ') || 'None'}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-sm text-gray-600">Status</span>
                                        {getStatusBadge(selectedItem)}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="p-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex gap-2">
                            <button
                                onClick={() => {
                                    handleToggleStatus(selectedItem);
                                    setShowModal(false);
                                }}
                                disabled={actionLoading}
                                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 ${(activeTab === 'users' && selectedItem.isActive) || (activeTab === 'vendors' && selectedItem.status === 'approved')
                                        ? 'bg-orange-600 text-white hover:bg-orange-700'
                                        : 'bg-green-600 text-white hover:bg-green-700'
                                    }`}
                            >
                                {(activeTab === 'users' && selectedItem.isActive) || (activeTab === 'vendors' && selectedItem.status === 'approved') ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                                onClick={() => {
                                    handleDelete(selectedItem);
                                    setShowModal(false);
                                }}
                                disabled={actionLoading}
                                className="flex-1 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountsManagement;
