import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { 
  FaBuilding, 
  FaMapMarkerAlt, 
  FaPhone, 
  FaGlobe, 
  FaIdCard, 
  FaCreditCard,
  FaUpload,
  FaFile,
  FaTrash,
  FaCheck,
  FaTimes,
  FaClock
} from 'react-icons/fa';

const VendorRequest = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [existingRequest, setExistingRequest] = useState(null);
  const [formData, setFormData] = useState({
    message: '',
    businessDetails: {
      businessName: '',
      businessType: 'individual',
      businessAddress: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      phone: '',
      website: ''
    }
  });
  const [documents, setDocuments] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]); // {id, type, name, url, uploading}
  const [uploading, setUploading] = useState(false);

  const businessTypes = [
    { value: 'individual', label: 'Individual' },
    { value: 'company', label: 'Company' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'business', label: 'Business' },
    { value: 'other', label: 'Other' }
  ];

  const requiredDocuments = [
    { id: 'idProof', name: 'ID Proof', required: true },
    { id: 'businessLicense', name: 'Business License', required: true },
    { id: 'taxCertificate', name: 'Tax Certificate', required: true },
    { id: 'bankStatement', name: 'Bank Statement', required: true },
    { id: 'addressProof', name: 'Address Proof', required: true }
  ];

  useEffect(() => {
    checkExistingRequest();
  }, []);

  const checkExistingRequest = async () => {
    try {
      const response = await api.get('/vendor-requests/my-request');
      setExistingRequest(response.data);
    } catch (error) {
      // No existing request found, which is fine
      console.log(error);
    }
  };

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

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      businessDetails: {
        ...prev.businessDetails,
        businessAddress: {
          ...prev.businessDetails.businessAddress,
          [name]: value
        }
      }
    }));
  };

  const handleFileUpload = async (e, documentType) => {
    const files = Array.from(e.target.files);
    setUploading(true);
    for (const file of files) {
      // Validate file size/type
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 5MB.`);
        continue;
      }
      const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
        'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name} is not a supported file type.`);
        continue;
      }
      // Upload to backend (Cloudinary)
      const uploadData = new FormData();
      uploadData.append('image', file);
      try {
        const res = await api.post('/upload/image', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setUploadedFiles(prev => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            type: documentType, // e.g. 'id_proof'
            name: file.name,
            url: res.data.url
          }
        ]);
        toast.success(`${file.name} uploaded!`);
      } catch (err) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    setUploading(false);
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.message.trim()) {
      toast.error('Please provide a business description');
      return;
    }
    if (!formData.businessDetails.businessName.trim()) {
      toast.error('Please provide a business name');
      return;
    }
    if (uploadedFiles.length === 0) {
      toast.error('Please upload at least one document');
      return;
    }
    setLoading(true);
    try {
      // Map document types to match server expectations
      const mapDocType = {
        idProof: 'id_proof',
        businessLicense: 'business_license',
        taxCertificate: 'tax_certificate',
        bankStatement: 'bank_statement',
        addressProof: 'address_proof'
      };
      
      // Prepare documents array for backend with proper mapping
      const documents = uploadedFiles.map(file => ({
        type: mapDocType[file.type] || file.type, // e.g. 'id_proof'
        url: file.url,
        originalName: file.name
      }));
      const payload = {
        message: formData.message,
        businessDetails: formData.businessDetails,
        documents
      };
      await api.post('/vendor-requests', payload);
      toast.success('Vendor request submitted successfully!');
      navigate('/profile');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to submit request';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (existingRequest) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              {existingRequest.status === 'pending' ? (
                <FaClock className="text-6xl text-yellow-500 mx-auto mb-4" />
              ) : existingRequest.status === 'approved' ? (
                <FaCheck className="text-6xl text-green-500 mx-auto mb-4" />
              ) : (
                <FaTimes className="text-6xl text-red-500 mx-auto mb-4" />
              )}
            </div>
            
            <h1 className="text-3xl font-bold mb-4">
              {existingRequest.status === 'pending' && 'Request Pending'}
              {existingRequest.status === 'approved' && 'Request Approved!'}
              {existingRequest.status === 'rejected' && 'Request Rejected'}
            </h1>
            
            <p className="text-gray-600 mb-6">
              {existingRequest.status === 'pending' && 'Your vendor request is currently under review. We will notify you once a decision has been made.'}
              {existingRequest.status === 'approved' && 'Congratulations! Your vendor request has been approved. You can now access the vendor dashboard.'}
              {existingRequest.status === 'rejected' && existingRequest.adminResponse?.message}
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-2">Request Details:</h3>
              <p className="text-sm text-gray-600">
                <strong>Submitted:</strong> {new Date(existingRequest.createdAt).toLocaleDateString()}
              </p>
              {existingRequest.processedAt && (
                <p className="text-sm text-gray-600">
                  <strong>Processed:</strong> {new Date(existingRequest.processedAt).toLocaleDateString()}
                </p>
              )}
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/profile')}
                className="btn btn-primary"
              >
                Go to Profile
              </button>
              {existingRequest.status === 'approved' && (
                <button
                  onClick={() => navigate('/vendor/dashboard')}
                  className="btn btn-secondary"
                >
                  Vendor Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
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
                  name="businessDetails.businessName"
                  value={formData.businessDetails.businessName}
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
                  name="businessDetails.businessType"
                  value={formData.businessDetails.businessType}
                  onChange={handleChange}
                  required
                  className="select select-bordered w-full"
                >
                  {businessTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="businessDetails.phone"
                  value={formData.businessDetails.phone}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  name="businessDetails.website"
                  value={formData.businessDetails.website}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="https://yourwebsite.com"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Description *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="textarea textarea-bordered w-full"
                  placeholder="Describe your business, what you sell, your experience, and why you want to become a vendor..."
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
                  name="street"
                  value={formData.businessDetails.businessAddress.street}
                  onChange={handleAddressChange}
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
                  name="city"
                  value={formData.businessDetails.businessAddress.city}
                  onChange={handleAddressChange}
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
                  name="state"
                  value={formData.businessDetails.businessAddress.state}
                  onChange={handleAddressChange}
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
                  name="zipCode"
                  value={formData.businessDetails.businessAddress.zipCode}
                  onChange={handleAddressChange}
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
                  name="country"
                  value={formData.businessDetails.businessAddress.country}
                  onChange={handleAddressChange}
                  className="input input-bordered w-full"
                  placeholder="Enter country"
                />
              </div>
            </div>
          </div>

          {/* Document Upload */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FaFile className="mr-2" />
              Required Documents
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {requiredDocuments.map(doc => (
                <div key={doc.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {doc.name} {doc.required && <span className="text-red-500">*</span>}
                    </label>
                  </div>
                  
                  <input
                    type="file"
                    onChange={(e) => handleFileUpload(e, doc.id)}
                    accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx"
                    className="file-input file-input-bordered w-full"
                  />
                  
                  <p className="text-xs text-gray-500 mt-1">
                    Accepted formats: JPG, PNG, GIF, PDF, DOC, DOCX (Max 5MB)
                  </p>
                </div>
              ))}
            </div>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-3">Uploaded Files:</h3>
                <div className="space-y-2">
                  {uploadedFiles.map(file => (
                    <div key={file.id} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                      <div className="flex items-center">
                        <FaFile className="mr-2 text-gray-500" />
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(file.id)}
                        className="btn btn-sm btn-error"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg"
            >
              {loading ? (
                <>
                  <div className="loading loading-spinner loading-sm"></div>
                  Submitting...
                </>
              ) : (
                'Submit Vendor Request'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VendorRequest; 