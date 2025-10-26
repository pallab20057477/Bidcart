import { useState, useEffect } from 'react';
import { 
  FaSave, FaEdit, FaUser, FaBuilding, FaMapMarkerAlt, FaPhone, 
  FaEnvelope, FaGlobe, FaIdCard, FaUniversity, FaShieldAlt, 
  FaCheckCircle, FaClock, FaTimes, FaEye, FaEyeSlash 
} from 'react-icons/fa';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const VendorSettings = () => {
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    businessName: '',
    businessDescription: '',
    businessAddress: '',
    contactInfo: {
      phone: '',
      email: '',
      website: ''
    },
    businessType: '',
    taxId: '',
    bankInfo: {
      accountNumber: '',
      bankName: '',
      routingNumber: ''
    },
    categories: []
  });

  useEffect(() => {
    fetchVendorProfile();
  }, []);

  const fetchVendorProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/vendors/profile');
      
      if (response.data.success) {
        setVendor(response.data.vendor);
        setFormData({
          businessName: response.data.vendor.businessName || '',
          businessDescription: response.data.vendor.businessDescription || '',
          businessAddress: response.data.vendor.businessAddress || '',
          contactInfo: {
            phone: response.data.vendor.contactInfo?.phone || '',
            email: response.data.vendor.contactInfo?.email || '',
            website: response.data.vendor.contactInfo?.website || ''
          },
          businessType: response.data.vendor.businessType || '',
          taxId: response.data.vendor.taxId || '',
          bankInfo: {
            accountNumber: response.data.vendor.bankInfo?.accountNumber || '',
            bankName: response.data.vendor.bankInfo?.bankName || '',
            routingNumber: response.data.vendor.bankInfo?.routingNumber || ''
          },
          categories: response.data.vendor.categories || []
        });
      }
    } catch (error) {
      console.error('Error fetching vendor profile:', error);
      toast.error('Failed to load vendor profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await api.put('/vendors/profile', formData);
      
      if (response.data.success) {
        toast.success('Profile updated successfully');
        setIsEditing(false);
        fetchVendorProfile(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <FaCheckCircle className="text-green-500" />;
      case 'pending': return <FaClock className="text-yellow-500" />;
      case 'rejected': return <FaTimes className="text-red-500" />;
      default: return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const maskSensitiveData = (data, type = 'account') => {
    if (!data) return '';
    if (type === 'account') {
      return showSensitiveInfo ? data : `****${data.slice(-4)}`;
    }
    return showSensitiveInfo ? data : '****';
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <FaUser className="mr-3 text-blue-600" />
                Vendor Settings
              </h1>
              <p className="text-gray-600 mt-1">Manage your vendor profile and business information</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSensitiveInfo(!showSensitiveInfo)}
                className="flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {showSensitiveInfo ? <FaEyeSlash className="mr-2" /> : <FaEye className="mr-2" />}
                {showSensitiveInfo ? 'Hide' : 'Show'} Sensitive Info
              </button>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  isEditing 
                    ? 'bg-gray-600 text-white hover:bg-gray-700' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isEditing ? <FaTimes className="mr-2" /> : <FaEdit className="mr-2" />}
                {isEditing ? 'Cancel Edit' : 'Edit Profile'}
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'profile', label: 'Business Profile', icon: FaBuilding },
                { key: 'contact', label: 'Contact Info', icon: FaPhone },
                { key: 'financial', label: 'Financial Info', icon: FaUniversity },
                { key: 'account', label: 'Account Status', icon: FaShieldAlt }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === key
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

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Business Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <FaBuilding className="text-xl text-blue-600 mr-3" />
                <h2 className="text-lg font-semibold text-gray-900">Business Information</h2>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    disabled={!isEditing}
                    required
                    placeholder="Enter your business name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Type *
                  </label>
                  <select
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    disabled={!isEditing}
                    required
                  >
                    <option value="">Select Business Type</option>
                    <option value="retail">Retail</option>
                    <option value="wholesale">Wholesale</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="service">Service</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Description
                  </label>
                  <textarea
                    name="businessDescription"
                    value={formData.businessDescription}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    disabled={!isEditing}
                    placeholder="Describe your business, products, and services..."
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaMapMarkerAlt className="inline mr-1" />
                    Business Address
                  </label>
                  <textarea
                    name="businessAddress"
                    value={formData.businessAddress}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    disabled={!isEditing}
                    placeholder="Enter your complete business address..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Contact Information Tab */}
          {activeTab === 'contact' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <FaPhone className="text-xl text-green-600 mr-3" />
                <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaPhone className="inline mr-1" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="contactInfo.phone"
                    value={formData.contactInfo.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    disabled={!isEditing}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaEnvelope className="inline mr-1" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="contactInfo.email"
                    value={formData.contactInfo.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    disabled={!isEditing}
                    placeholder="business@example.com"
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaGlobe className="inline mr-1" />
                    Website URL
                  </label>
                  <input
                    type="url"
                    name="contactInfo.website"
                    value={formData.contactInfo.website}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    disabled={!isEditing}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Financial Information Tab */}
          {activeTab === 'financial' && (
            <div className="space-y-6">
              {/* Tax Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-6">
                  <FaIdCard className="text-xl text-purple-600 mr-3" />
                  <h2 className="text-lg font-semibold text-gray-900">Tax Information</h2>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax Identification Number
                  </label>
                  <input
                    type="text"
                    name="taxId"
                    value={showSensitiveInfo ? formData.taxId : maskSensitiveData(formData.taxId, 'tax')}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    disabled={!isEditing || !showSensitiveInfo}
                    placeholder="Enter your tax identification number"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This information is encrypted and securely stored
                  </p>
                </div>
              </div>

              {/* Bank Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-6">
                  <FaUniversity className="text-xl text-blue-600 mr-3" />
                  <h2 className="text-lg font-semibold text-gray-900">Banking Information</h2>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      name="bankInfo.bankName"
                      value={formData.bankInfo.bankName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                      disabled={!isEditing}
                      placeholder="Chase Bank"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Routing Number
                    </label>
                    <input
                      type="text"
                      name="bankInfo.routingNumber"
                      value={showSensitiveInfo ? formData.bankInfo.routingNumber : maskSensitiveData(formData.bankInfo.routingNumber, 'routing')}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                      disabled={!isEditing || !showSensitiveInfo}
                      placeholder="021000021"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Number
                    </label>
                    <input
                      type="text"
                      name="bankInfo.accountNumber"
                      value={maskSensitiveData(formData.bankInfo.accountNumber, 'account')}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                      disabled={!isEditing || !showSensitiveInfo}
                      placeholder="1234567890"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Account information is masked for security. Click "Show Sensitive Info" to view.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Account Status Tab */}
          {activeTab === 'account' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <FaShieldAlt className="text-xl text-green-600 mr-3" />
                <h2 className="text-lg font-semibold text-gray-900">Account Status & Statistics</h2>
              </div>
              
              {/* Status Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-center mb-3">
                    {getStatusIcon(vendor?.status)}
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Account Status</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(vendor?.status)}`}>
                    {vendor?.status || 'pending'}
                  </span>
                </div>

                <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex justify-center mb-3">
                    <FaBuilding className="text-2xl text-blue-600" />
                  </div>
                  <p className="text-sm font-medium text-blue-700 mb-2">Total Products</p>
                  <p className="text-2xl font-bold text-blue-900">{vendor?.totalProducts || 0}</p>
                </div>

                <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex justify-center mb-3">
                    <FaCheckCircle className="text-2xl text-green-600" />
                  </div>
                  <p className="text-sm font-medium text-green-700 mb-2">Total Sales</p>
                  <p className="text-2xl font-bold text-green-900">${vendor?.totalSales || 0}</p>
                </div>

                <div className="text-center p-6 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex justify-center mb-3">
                    <FaUser className="text-2xl text-purple-600" />
                  </div>
                  <p className="text-sm font-medium text-purple-700 mb-2">Member Since</p>
                  <p className="text-sm font-bold text-purple-900">
                    {vendor?.createdAt ? new Date(vendor.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Account Details */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-md font-semibold text-gray-900 mb-4">Account Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Vendor ID:</span>
                    <span className="ml-2 text-gray-600">{vendor?._id || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Commission Rate:</span>
                    <span className="ml-2 text-gray-600">{vendor?.commissionRate || 15}%</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Last Updated:</span>
                    <span className="ml-2 text-gray-600">
                      {vendor?.updatedAt ? new Date(vendor.updatedAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Verification Status:</span>
                    <span className="ml-2 text-gray-600">
                      {vendor?.isVerified ? 'Verified' : 'Pending Verification'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          {isEditing && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default VendorSettings; 