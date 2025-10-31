import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { FaUpload, FaSave, FaTimes, FaInfoCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';

const AddProduct = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [images, setImages] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    brand: '',
    stock: '',
    tags: [],
    isActive: true,
    approvalStatus: 'approved',
    mode: 'buy-now'
  });

  const categories = [
    'Electronics', 'Fashion', 'Home', 'Sports', 'Books', 'Art', 'Collectibles', 'Other', 'Tools & Hardware', 'Toys & Games'
  ];

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      console.log('🔍 Fetching approved vendors...');
      const response = await api.get('/vendors/admin/applications?status=approved');
      console.log('📋 Vendor response:', response.data);

      // The API returns 'applications', not 'vendors'
      const vendorList = response.data.applications || [];
      console.log('✅ Found vendors:', vendorList.length);

      setVendors(vendorList);
    } catch (error) {
      console.error('❌ Error fetching vendors:', error);
      setVendors([]);
    } finally {
      setVendorsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    // Check file sizes (5MB limit)
    const oversizedFiles = imageFiles.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error('Some images exceed 5MB limit. Please choose smaller files.');
      return;
    }

    const newImages = imageFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    setImages(prev => [...prev, ...newImages].slice(0, 5));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedVendor) {
      toast.error('Please select a vendor');
      return;
    }

    if (images.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }

    setLoading(true);
    setUploadingImages(true);
    
    try {
      // Upload images first
      toast.loading('Uploading images...', { id: 'image-upload' });
      
      let imageUrls = [];
      try {
        const formData = new FormData();
        images.forEach((image) => {
          formData.append('images', image.file);
        });

        console.log('📤 Uploading images to server...');
        const uploadResponse = await api.post('/upload/images', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        imageUrls = uploadResponse.data.imageUrls;
        console.log('✅ Images uploaded successfully:', imageUrls);

        if (!imageUrls || imageUrls.length === 0) {
          throw new Error('No images were uploaded successfully');
        }
      } catch (uploadError) {
        console.error('❌ Image upload error:', uploadError);
        toast.error(`Failed to upload images: ${uploadError.response?.data?.message || uploadError.message}`);
        return; // Stop the submission process
      }

      toast.success('Images uploaded successfully!', { id: 'image-upload' });
      setUploadingImages(false);

      const productData = {
        ...formData,
        vendor: selectedVendor,
        images: imageUrls,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock) || 0,
        tags: formData.tags.filter(tag => tag.trim() !== '')
      };

      await api.post('/products/admin/create', productData);

      toast.success('Product created successfully!');
      navigate('/admin/products');
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error(error.response?.data?.message || 'Failed to create product');
    } finally {
      setLoading(false);
      setUploadingImages(false);
      toast.dismiss('image-upload');
    }
  };

  const addTag = () => {
    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, '']
    }));
  };

  const updateTag = (index, value) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.map((tag, i) => i === index ? value : tag)
    }));
  };

  const removeTag = (index) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Add New Product</h1>
              <p className="text-gray-600 mt-1">Create a new product for the marketplace</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ← Back to Products
            </button>
          </div>

          {/* Info Banner */}
          <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
            <div className="flex">
              <FaInfoCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  This form creates regular "Buy Now" products. For auction products, use the
                  <strong className="ml-1">Auction Requests</strong> system.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Basic Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendor *
                </label>
                <select
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Vendor</option>
                  {vendorsLoading ? (
                    <option disabled>Loading vendors...</option>
                  ) : vendors.length === 0 ? (
                    <option disabled>No approved vendors found</option>
                  ) : (
                    vendors.map((vendor) => (
                      <option key={vendor._id} value={vendor._id}>
                        {vendor.businessName} - {vendor.user?.name || 'N/A'}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Product Images *</h2>
            <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-700">⚠️ At least one image is required</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Images (Max 5) *
              </label>
              
              {/* Enhanced File Input with Drag & Drop */}
              <div 
                className="relative"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('border-blue-400', 'bg-blue-50');
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                  const files = Array.from(e.dataTransfer.files);
                  const imageFiles = files.filter(file => file.type.startsWith('image/'));

                  if (imageFiles.length > 5) {
                    toast.error('Maximum 5 images allowed');
                    return;
                  }

                  // Check file sizes (5MB limit)
                  const oversizedFiles = imageFiles.filter(file => file.size > 5 * 1024 * 1024);
                  if (oversizedFiles.length > 0) {
                    toast.error('Some images exceed 5MB limit. Please choose smaller files.');
                    return;
                  }

                  const newImages = imageFiles.map(file => ({
                    file,
                    preview: URL.createObjectURL(file)
                  }));

                  setImages(prev => [...prev, ...newImages].slice(0, 5));
                }}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FaUpload className="w-8 h-8 mb-4 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, JPEG up to 5MB each</p>
                  </div>
                </label>
              </div>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => setImages(images.filter((_, i) => i !== index))}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Tags</h2>

            <div className="space-y-3">
              {formData.tags.map((tag, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => updateTag(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter tag"
                  />
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <FaTimes />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200"
              >
                + Add Tag
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploadingImages}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {uploadingImages ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading Images...
                </>
              ) : loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Product...
                </>
              ) : (
                <>
                  <FaSave className="mr-2" />
                  Create Product
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;