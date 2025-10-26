import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { FaBuilding, FaMapMarkerAlt, FaPhone, FaGlobe, FaIdCard, FaCreditCard } from 'react-icons/fa';
import { io } from 'socket.io-client';

const VendorApplication = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    businessDescription: '',
    businessAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    contactInfo: {
      phone: '',
      email: user?.email || '',
      website: ''
    },
    businessType: 'individual',
    taxId: '',
    bankInfo: {
      accountHolder: '',
      accountNumber: '',
      routingNumber: '',
      bankName: ''
    },
    categories: [],
    idProofUrl: '',
    addressProofUrl: '',
    businessLicenseUrl: '',
    bankStatementUrl: ''
  });
  const [uploading, setUploading] = useState(false);
  const [hasRequest, setHasRequest] = useState(false);
  const [requestStatus, setRequestStatus] = useState('');

  const categories = [
    'Electronics', 'Fashion', 'Home', 'Sports', 'Books', 
    'Art', 'Collectibles', 'Beauty', 'Health', 'Toys', 'Other'
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const socket = io(process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000', {
      auth: { token }
    });
    socket.on('vendor-request:status', (data) => {
      if (data.status === 'approved') {
        toast.success('Your vendor application has been approved!');
        // Optionally redirect to vendor dashboard
        // navigate('/vendor/dashboard');
      } else if (data.status === 'rejected') {
        toast.error('Your vendor application was rejected.');
      }
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    // Check if user already has a pending or approved vendor request/account
    const checkVendorRequest = async () => {
      try {
        const res = await api.get('/vendor-requests/my-request');
        if (res.data && (res.data.status === 'pending' || res.data.status === 'approved')) {
          setHasRequest(true);
          setRequestStatus(res.data.status);
        }
      } catch (err) {
        // No request found, user can apply
        setHasRequest(false);
      }
    };
    checkVendorRequest();
  }, []);

  const handleChange = (e) => {
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
  
  const handleCategoryChange = (category) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleFileUpload = async (e, field) => {
    setUploading(true);
    const file = e.target.files[0];
    const uploadData = new FormData();
    uploadData.append('images', file);
    try {
      const res = await api.post('/images', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, [field]: res.data.imageUrls[0] }));
      toast.success('Image uploaded!');
    } catch {
      toast.error('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Build documents array from uploaded URLs
    const documents = [
      formData.idProofUrl && { type: 'id_proof', url: formData.idProofUrl, uploadedAt: new Date() },
      formData.addressProofUrl && { type: 'address_proof', url: formData.addressProofUrl, uploadedAt: new Date() },
      formData.businessLicenseUrl && { type: 'business_license', url: formData.businessLicenseUrl, uploadedAt: new Date() },
      formData.bankStatementUrl && { type: 'bank_statement', url: formData.bankStatementUrl, uploadedAt: new Date() }
    ].filter(Boolean);

    // Validate required fields
    if (!formData.businessName || !formData.businessDescription || !formData.businessAddress.street || !formData.contactInfo.phone || !formData.contactInfo.email || !formData.businessType || documents.length < 4) {
      toast.error('Please fill in all required fields and upload all documents.');
      setLoading(false);
      return;
    }

    const payload = {
      businessName: formData.businessName,
      businessDescription: formData.businessDescription,
      businessAddress: formData.businessAddress,
      contactInfo: formData.contactInfo,
      businessType: formData.businessType,
      taxId: formData.taxId,
      bankInfo: formData.bankInfo,
      categories: formData.categories,
      documents
    };
    console.log('Request data:', payload);
    try {
      const response = await api.post('/vendor-requests', payload);
      toast.success('Vendor request submitted successfully! Our team will review your documents.');
      navigate('/admin/vendor-requests');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to submit application';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (hasRequest) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6 mt-8 text-center">
        <h2 className="text-2xl font-bold text-primary mb-4">Vendor Application Status</h2>
        {requestStatus === 'pending' && (
          <>
            <p className="text-yellow-600 font-semibold mb-2">Your vendor application is pending review.</p>
            <p className="text-gray-600">Our team will contact you soon. You cannot submit another application at this time.</p>
          </>
        )}
        {requestStatus === 'approved' && (
          <>
            <p className="text-green-600 font-semibold mb-2">Your vendor application has been approved!</p>
            <p className="text-gray-600">You are now a vendor. Visit your vendor dashboard to manage your store.</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Become a Vendor
          </h1>
          <p className="text-gray-600">
            Start selling your products on BidCart and reach thousands of customers
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Business Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FaBuilding className="mr-2" />
              Business Information
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  required
                  className="input input-bordered w-full"
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
                  onChange={handleChange}
                  required
                  className="select select-bordered w-full"
                >
                  <option value="individual">Individual</option>
                  <option value="business">Business</option>
                  <option value="corporation">Corporation</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Description *
                </label>
                <textarea
                  name="businessDescription"
                  value={formData.businessDescription}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="textarea textarea-bordered w-full"
                  placeholder="Describe your business and what you sell..."
                />
              </div>
            </div>
          </div>

          {/* Business Address */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FaMapMarkerAlt className="mr-2" />
              Business Address
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address
                </label>
                <input
                  type="text"
                  name="businessAddress.street"
                  value={formData.businessAddress.street}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="Enter street address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  name="businessAddress.city"
                  value={formData.businessAddress.city}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="Enter city"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State/Province
                </label>
                <input
                  type="text"
                  name="businessAddress.state"
                  value={formData.businessAddress.state}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="Enter state"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP/Postal Code
                </label>
                <input
                  type="text"
                  name="businessAddress.zipCode"
                  value={formData.businessAddress.zipCode}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="Enter ZIP code"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  name="businessAddress.country"
                  value={formData.businessAddress.country}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="Enter country"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FaPhone className="mr-2" />
              Contact Information
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="contactInfo.phone"
                  value={formData.contactInfo.phone}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="contactInfo.email"
                  value={formData.contactInfo.email}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="Enter email"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website (Optional)
                </label>
                <input
                  type="url"
                  name="contactInfo.website"
                  value={formData.contactInfo.website}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="Enter website URL"
                />
              </div>
            </div>
          </div>

          {/* Tax Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FaIdCard className="mr-2" />
              Tax Information
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax ID / EIN
              </label>
              <input
                type="text"
                name="taxId"
                value={formData.taxId}
                onChange={handleChange}
                className="input input-bordered w-full"
                placeholder="Enter Tax ID or EIN"
              />
            </div>
          </div>

          {/* Bank Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FaCreditCard className="mr-2" />
              Bank Information (for payouts)
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  name="bankInfo.accountHolder"
                  value={formData.bankInfo.accountHolder}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="Enter account holder name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name
                </label>
                <input
                  type="text"
                  name="bankInfo.bankName"
                  value={formData.bankInfo.bankName}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="Enter bank name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  name="bankInfo.accountNumber"
                  value={formData.bankInfo.accountNumber}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="Enter account number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Routing Number
                </label>
                <input
                  type="text"
                  name="bankInfo.routingNumber"
                  value={formData.bankInfo.routingNumber}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="Enter routing number"
                />
              </div>
            </div>
          </div>

          {/* Product Categories */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              Product Categories
            </h2>
            <p className="text-gray-600 mb-4">
              Select the categories you plan to sell in:
            </p>
            
            <div className="grid md:grid-cols-3 gap-3">
              {categories.map((category) => (
                <label key={category} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.categories.includes(category)}
                    onChange={() => handleCategoryChange(category)}
                    className="checkbox checkbox-primary"
                  />
                  <span className="text-sm">{category}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Document Uploads */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Document Uploads</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ID Proof *</label>
                <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'idProofUrl')} disabled={uploading} />
                {formData.idProofUrl && <img src={formData.idProofUrl} alt="ID Proof" className="mt-2 w-20 h-20 object-cover rounded border" />}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address Proof *</label>
                <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'addressProofUrl')} disabled={uploading} />
                {formData.addressProofUrl && <img src={formData.addressProofUrl} alt="Address Proof" className="mt-2 w-20 h-20 object-cover rounded border" />}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business License *</label>
                <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'businessLicenseUrl')} disabled={uploading} />
                {formData.businessLicenseUrl && <img src={formData.businessLicenseUrl} alt="Business License" className="mt-2 w-20 h-20 object-cover rounded border" />}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Statement *</label>
                <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'bankStatementUrl')} disabled={uploading} />
                {formData.bankStatementUrl && <img src={formData.bankStatementUrl} alt="Bank Statement" className="mt-2 w-20 h-20 object-cover rounded border" />}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg"
            >
              {loading ? (
                <div className="loading-spinner"></div>
              ) : (
                'Submit Application'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VendorApplication; 