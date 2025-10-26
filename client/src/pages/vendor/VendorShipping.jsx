import { useState, useEffect, useCallback } from 'react';
import {
  FaTruck, FaBox, FaMapMarkerAlt, FaPlus, FaEdit, FaTrash,
  FaSave, FaShippingFast, FaGlobe, FaCalculator,
  FaSync, FaFileExport, FaEye, FaClock, FaCheck, FaExclamationTriangle
} from 'react-icons/fa';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const VendorShipping = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('zones');

  const [shippingData, setShippingData] = useState({
    zones: [],
    methods: [],
    settings: {
      freeShippingThreshold: 0,
      processingTime: 1,
      returnPolicy: '',
      trackingEnabled: true,
      internationalShipping: false
    },
    recentShipments: []
  });

  const [showZoneModal, setShowZoneModal] = useState(false);
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [editingMethod, setEditingMethod] = useState(null);

  const [zoneForm, setZoneForm] = useState({
    name: '',
    countries: [],
    states: [],
    postalCodes: '',
    isActive: true
  });

  const [methodForm, setMethodForm] = useState({
    name: '',
    description: '',
    baseRate: 0,
    perKgRate: 0,
    freeThreshold: 0,
    estimatedDays: '3-5',
    zoneId: '',
    isActive: true
  });

  const fetchShippingData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/vendors/shipping');

      if (response.data.success) {
        setShippingData(prevData => ({
          zones: response.data.data?.zones || prevData.zones || [],
          methods: response.data.data?.methods || prevData.methods || [],
          settings: response.data.data?.settings || prevData.settings || {
            freeShippingThreshold: 0,
            processingTime: 1,
            returnPolicy: '',
            trackingEnabled: true,
            internationalShipping: false
          },
          recentShipments: response.data.data?.recentShipments || prevData.recentShipments || []
        }));
      }
    } catch (error) {
      console.error('Error fetching shipping data:', error);
      toast.error('Failed to load shipping data');
      // Ensure we maintain the initial state structure even on error
      setShippingData(prevData => ({
        zones: prevData.zones || [],
        methods: prevData.methods || [],
        settings: prevData.settings || {
          freeShippingThreshold: 0,
          processingTime: 1,
          returnPolicy: '',
          trackingEnabled: true,
          internationalShipping: false
        },
        recentShipments: prevData.recentShipments || []
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShippingData();
  }, [fetchShippingData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchShippingData();
    setRefreshing(false);
    toast.success('Shipping data refreshed');
  };

  const handleSaveZone = async () => {
    try {
      const endpoint = editingZone
        ? `/vendors/shipping/zones/${editingZone._id}`
        : '/vendors/shipping/zones';

      const method = editingZone ? 'put' : 'post';

      const response = await api[method](endpoint, zoneForm);

      if (response.data.success) {
        toast.success(`Zone ${editingZone ? 'updated' : 'created'} successfully`);
        setShowZoneModal(false);
        setEditingZone(null);
        setZoneForm({
          name: '',
          countries: [],
          states: [],
          postalCodes: '',
          isActive: true
        });
        fetchShippingData();
      }
    } catch (error) {
      console.error('Error saving zone:', error);
      toast.error(error.response?.data?.message || 'Failed to save zone');
    }
  };

  const handleSaveMethod = async () => {
    try {
      const endpoint = editingMethod
        ? `/vendors/shipping/methods/${editingMethod._id}`
        : '/vendors/shipping/methods';

      const method = editingMethod ? 'put' : 'post';

      const response = await api[method](endpoint, methodForm);

      if (response.data.success) {
        toast.success(`Method ${editingMethod ? 'updated' : 'created'} successfully`);
        setShowMethodModal(false);
        setEditingMethod(null);
        setMethodForm({
          name: '',
          description: '',
          baseRate: 0,
          perKgRate: 0,
          freeThreshold: 0,
          estimatedDays: '3-5',
          zoneId: '',
          isActive: true
        });
        fetchShippingData();
      }
    } catch (error) {
      console.error('Error saving method:', error);
      toast.error(error.response?.data?.message || 'Failed to save method');
    }
  };

  const handleDeleteZone = async (zoneId) => {
    if (!window.confirm('Are you sure you want to delete this shipping zone?')) return;

    try {
      const response = await api.delete(`/vendors/shipping/zones/${zoneId}`);

      if (response.data.success) {
        toast.success('Zone deleted successfully');
        fetchShippingData();
      }
    } catch (error) {
      console.error('Error deleting zone:', error);
      toast.error('Failed to delete zone');
    }
  };

  const handleDeleteMethod = async (methodId) => {
    if (!window.confirm('Are you sure you want to delete this shipping method?')) return;

    try {
      const response = await api.delete(`/vendors/shipping/methods/${methodId}`);

      if (response.data.success) {
        toast.success('Method deleted successfully');
        fetchShippingData();
      }
    } catch (error) {
      console.error('Error deleting method:', error);
      toast.error('Failed to delete method');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">Shipping Management</h1>
                <div className="flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <FaTruck className="mr-1" />
                  {shippingData.zones?.length || 0} Zones
                </div>
              </div>
              <p className="text-gray-600">Manage shipping zones, methods, and delivery options</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <FaClock />
                  Last updated: {new Date().toLocaleTimeString()}
                </span>
                <span className="flex items-center gap-1">
                  <FaBox />
                  {shippingData.recentShipments?.length || 0} Recent shipments
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleRefresh}
                className="flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={refreshing}
              >
                <FaSync className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              <button
                onClick={() => {/* Export functionality */ }}
                className="flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FaFileExport className="mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'zones', label: 'Shipping Zones', icon: FaGlobe },
                { key: 'methods', label: 'Shipping Methods', icon: FaTruck },
                { key: 'settings', label: 'Settings', icon: FaCalculator },
                { key: 'tracking', label: 'Tracking', icon: FaEye }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <Icon className="mr-2" />
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'zones' && (
          <div className="space-y-6">
            {/* Zones Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Shipping Zones</h2>
              <button
                onClick={() => {
                  setEditingZone(null);
                  setZoneForm({
                    name: '',
                    countries: [],
                    states: [],
                    postalCodes: '',
                    isActive: true
                  });
                  setShowZoneModal(true);
                }}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaPlus className="mr-2" />
                Add Zone
              </button>
            </div>

            {/* Zones List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shippingData.zones?.map((zone) => (
                <div key={zone._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{zone.name}</h3>
                      <div className="flex items-center mt-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${zone.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                          {zone.isActive ? <FaCheck className="mr-1" /> : <FaExclamationTriangle className="mr-1" />}
                          {zone.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingZone(zone);
                          setZoneForm(zone);
                          setShowZoneModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteZone(zone._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <FaMapMarkerAlt className="mr-2 text-gray-400" />
                      <span>{zone.countries?.length || 0} countries</span>
                    </div>
                    {zone.states?.length > 0 && (
                      <div className="flex items-center">
                        <FaGlobe className="mr-2 text-gray-400" />
                        <span>{zone.states.length} states/regions</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'methods' && (
          <div className="space-y-6">
            {/* Methods Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Shipping Methods</h2>
              <button
                onClick={() => {
                  setEditingMethod(null);
                  setMethodForm({
                    name: '',
                    description: '',
                    baseRate: 0,
                    perKgRate: 0,
                    freeThreshold: 0,
                    estimatedDays: '3-5',
                    zoneId: '',
                    isActive: true
                  });
                  setShowMethodModal(true);
                }}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaPlus className="mr-2" />
                Add Method
              </button>
            </div>

            {/* Methods List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Zone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Base Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Per Kg
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Delivery Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {shippingData.methods?.map((method) => (
                      <tr key={method._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{method.name}</div>
                            <div className="text-sm text-gray-500">{method.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {shippingData.zones?.find(z => z._id === method.zoneId)?.name || 'All Zones'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(method.baseRate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(method.perKgRate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {method.estimatedDays} days
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${method.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                            {method.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setEditingMethod(method);
                                setMethodForm(method);
                                setShowMethodModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDeleteMethod(method._id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Shipping Settings</h2>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Free Shipping Threshold
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={shippingData.settings?.freeShippingThreshold || 0}
                      onChange={(e) => setShippingData({
                        ...shippingData,
                        settings: {
                          ...shippingData.settings,
                          freeShippingThreshold: parseFloat(e.target.value) || 0
                        }
                      })}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Orders above this amount get free shipping</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Processing Time (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={shippingData.settings?.processingTime || 1}
                    onChange={(e) => setShippingData({
                      ...shippingData,
                      settings: {
                        ...shippingData.settings,
                        processingTime: parseInt(e.target.value) || 1
                      }
                    })}
                  />
                  <p className="text-sm text-gray-500 mt-1">Time needed to prepare orders for shipping</p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Return Policy
                  </label>
                  <textarea
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={shippingData.settings?.returnPolicy || ''}
                    onChange={(e) => setShippingData({
                      ...shippingData,
                      settings: {
                        ...shippingData.settings,
                        returnPolicy: e.target.value
                      }
                    })}
                    placeholder="Describe your return and refund policy..."
                  />
                </div>

                <div className="md:col-span-2 space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="trackingEnabled"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={shippingData.settings?.trackingEnabled || false}
                      onChange={(e) => setShippingData({
                        ...shippingData,
                        settings: {
                          ...shippingData.settings,
                          trackingEnabled: e.target.checked
                        }
                      })}
                    />
                    <label htmlFor="trackingEnabled" className="ml-2 block text-sm text-gray-900">
                      Enable order tracking
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="internationalShipping"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={shippingData.settings?.internationalShipping || false}
                      onChange={(e) => setShippingData({
                        ...shippingData,
                        settings: {
                          ...shippingData.settings,
                          internationalShipping: e.target.checked
                        }
                      })}
                    />
                    <label htmlFor="internationalShipping" className="ml-2 block text-sm text-gray-900">
                      Enable international shipping
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={async () => {
                    try {
                      const response = await api.put('/vendors/shipping/settings', shippingData.settings || {});
                      if (response.data.success) {
                        toast.success('Settings saved successfully');
                      }
                    } catch (error) {
                      toast.error('Failed to save settings');
                    }
                  }}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaSave className="mr-2" />
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tracking' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Shipments</h2>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tracking Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Shipped Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {shippingData.recentShipments?.length > 0 ? (
                      shippingData.recentShipments.map((shipment) => (
                        <tr key={shipment._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{shipment.orderId?.slice(-6)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {shipment.customerName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {shipment.trackingNumber || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${shipment.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              shipment.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                                shipment.status === 'shipped' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                              }`}>
                              {shipment.status?.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {shipment.shippedDate ? new Date(shipment.shippedDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-700 flex items-center">
                              <FaEye className="mr-1" />
                              Track
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                          <FaShippingFast className="text-4xl mx-auto mb-4 text-gray-300" />
                          <p className="text-lg font-medium">No shipments yet</p>
                          <p className="text-sm">Shipment tracking will appear here once orders are shipped</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Zone Modal */}
        {showZoneModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingZone ? 'Edit Zone' : 'Add New Zone'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zone Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={zoneForm.name}
                      onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                      placeholder="e.g., Domestic, International"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Countries (comma-separated)
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={zoneForm.countries?.join(', ') || ''}
                      onChange={(e) => setZoneForm({ ...zoneForm, countries: e.target.value.split(',').map(c => c.trim()) })}
                      placeholder="US, CA, MX"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="zoneActive"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={zoneForm.isActive}
                      onChange={(e) => setZoneForm({ ...zoneForm, isActive: e.target.checked })}
                    />
                    <label htmlFor="zoneActive" className="ml-2 block text-sm text-gray-900">
                      Active
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    onClick={() => setShowZoneModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                    onClick={handleSaveZone}
                  >
                    <FaSave className="mr-2" />
                    Save Zone
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Method Modal */}
        {showMethodModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingMethod ? 'Edit Method' : 'Add New Method'}
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Method Name
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={methodForm.name}
                        onChange={(e) => setMethodForm({ ...methodForm, name: e.target.value })}
                        placeholder="Standard Shipping"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Zone
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={methodForm.zoneId}
                        onChange={(e) => setMethodForm({ ...methodForm, zoneId: e.target.value })}
                      >
                        <option value="">All Zones</option>
                        {shippingData.zones?.map((zone) => (
                          <option key={zone._id} value={zone._id}>{zone.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="2"
                      value={methodForm.description}
                      onChange={(e) => setMethodForm({ ...methodForm, description: e.target.value })}
                      placeholder="Standard delivery service"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Base Rate ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={methodForm.baseRate}
                        onChange={(e) => setMethodForm({ ...methodForm, baseRate: parseFloat(e.target.value) || 0 })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Per Kg Rate ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={methodForm.perKgRate}
                        onChange={(e) => setMethodForm({ ...methodForm, perKgRate: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Free Threshold ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={methodForm.freeThreshold}
                        onChange={(e) => setMethodForm({ ...methodForm, freeThreshold: parseFloat(e.target.value) || 0 })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Delivery Time
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={methodForm.estimatedDays}
                        onChange={(e) => setMethodForm({ ...methodForm, estimatedDays: e.target.value })}
                        placeholder="3-5"
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="methodActive"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={methodForm.isActive}
                      onChange={(e) => setMethodForm({ ...methodForm, isActive: e.target.checked })}
                    />
                    <label htmlFor="methodActive" className="ml-2 block text-sm text-gray-900">
                      Active
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    onClick={() => setShowMethodModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                    onClick={handleSaveMethod}
                  >
                    <FaSave className="mr-2" />
                    Save Method
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

export default VendorShipping;