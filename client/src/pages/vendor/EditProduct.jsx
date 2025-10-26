import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../utils/api';
import { FaUpload, FaPlus, FaTrash, FaGavel, FaShoppingCart, FaSave, FaPlusCircle, FaMinusCircle, FaImage } from 'react-icons/fa';
import toast from 'react-hot-toast';

const EditProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [imageErrors, setImageErrors] = useState({});
  const [variants, setVariants] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Electronics',
    mode: 'buy-now',
    brand: '',
    condition: 'new',
    stock: 1,
    tags: '',
    specifications: {},
    auction: {
      startTime: '',
      endTime: '',
      startingBid: '',
      minBidIncrement: 1
    }
  });

  const categories = [
    'Electronics', 'Fashion', 'Home', 'Sports', 'Books', 'Art', 'Collectibles', 'Other'
  ];

  const conditions = [
    { value: 'new', label: 'New' },
    { value: 'like-new', label: 'Like New' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' }
  ];

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/vendors/products/${id}`);

      const product = response.data;
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        mode: product.mode,
        brand: product.brand || '',
        condition: product.condition,
        stock: product.stock,
        tags: product.tags ? product.tags.join(', ') : '',
        specifications: product.specifications || {},
        auction: product.auction ? {
          startTime: product.auction.startTime ? new Date(product.auction.startTime).toISOString().slice(0, 16) : '',
          endTime: product.auction.endTime ? new Date(product.auction.endTime).toISOString().slice(0, 16) : '',
          startingBid: product.auction.startingBid || '',
          minBidIncrement: product.auction.minBidIncrement || 1
        } : {
          startTime: '',
          endTime: '',
          startingBid: '',
          minBidIncrement: 1
        }
      });

      setImages(product.images || []);
      setVariants(product.variants || []);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to fetch product');
      navigate('/vendor/products');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('auction.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        auction: {
          ...prev.auction,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    const validFiles = [];
    const errors = {};

    files.forEach((file, index) => {
      if (!file.type.startsWith('image/')) {
        errors[`image-${index}`] = 'Please select valid image files';
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        errors[`image-${index}`] = 'File size must be less than 5MB';
        return;
      }

      validFiles.push(file);
    });

    if (Object.keys(errors).length > 0) {
      setImageErrors(errors);
      return;
    }

    setNewImages(prev => [...prev, ...validFiles]);
    setImageErrors({});
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  // Variant handlers
  const handleVariantChange = (index, field, value) => {
    setVariants(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };
  const handleVariantAttrChange = (index, attr, value) => {
    setVariants(prev => prev.map((v, i) => i === index ? { ...v, attributes: { ...v.attributes, [attr]: value } } : v));
  };
  const addVariant = () => {
    setVariants(prev => [...prev, { attributes: {}, price: '', stock: '', sku: '', image: null, isDefault: false }]);
  };
  const removeVariant = (index) => {
    setVariants(prev => prev.filter((_, i) => i !== index));
  };
  const handleVariantImage = (index, file) => {
    setVariants(prev => prev.map((v, i) => i === index ? { ...v, image: file } : v));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) errors.name = 'Product name is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (!formData.price || formData.price <= 0) errors.price = 'Valid price is required';
    if (images.length === 0 && newImages.length === 0) errors.images = 'At least one image is required';

    if (formData.mode === 'auction') {
      if (!formData.auction.startTime) errors.startTime = 'Auction start time is required';
      if (!formData.auction.endTime) errors.endTime = 'Auction end time is required';
      if (!formData.auction.startingBid || formData.auction.startingBid <= 0) {
        errors.startingBid = 'Valid starting bid is required';
      }

      const startTime = new Date(formData.auction.startTime);
      const endTime = new Date(formData.auction.endTime);
      const now = new Date();

      if (startTime <= now) {
        errors.startTime = 'Auction start time must be in the future';
      }
      if (endTime <= startTime) {
        errors.endTime = 'Auction end time must be after start time';
      }
    }

    if (variants.length > 0) {
      variants.forEach((variant, idx) => {
        if (!variant.price || variant.price <= 0) errors[`variant-price-${idx}`] = 'Variant price required';
        if (!variant.stock || variant.stock < 0) errors[`variant-stock-${idx}`] = 'Variant stock required';
      });
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      Object.values(errors).forEach(error => toast.error(error));
      return;
    }

    setSaving(true);

    try {
      const formDataToSend = new FormData();
      
      // Add basic product data
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('mode', formData.mode);
      formDataToSend.append('brand', formData.brand);
      formDataToSend.append('condition', formData.condition);
      formDataToSend.append('stock', formData.stock);
      formDataToSend.append('tags', formData.tags);

      // Add auction data if mode is auction
      if (formData.mode === 'auction') {
        formDataToSend.append('auction', JSON.stringify(formData.auction));
      }

      // Add existing images
      formDataToSend.append('existingImages', JSON.stringify(images));

      // Add new images
      newImages.forEach((image) => {
        formDataToSend.append('newImages', image);
      });

      if (variants.length > 0) {
        formDataToSend.append('variants', JSON.stringify(variants.map(v => ({
          ...v,
          image: undefined // images handled separately
        }))));
        variants.forEach((variant, idx) => {
          if (variant.image) {
            formDataToSend.append(`variantImages`, variant.image);
          }
        });
      }

      const response = await api.put(`/vendors/products/${id}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      toast.success('Product updated successfully!');
      navigate('/vendor/products');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update product';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Edit Product
          </h1>
          <p className="text-gray-600">
            Update your product information and settings
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="input input-bordered w-full"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="select select-bordered w-full"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
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
                  className="input input-bordered w-full"
                  placeholder="Enter brand name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition
                </label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  className="select select-bordered w-full"
                >
                  {conditions.map(condition => (
                    <option key={condition.value} value={condition.value}>
                      {condition.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="input input-bordered w-full"
                  placeholder="0.00"
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
                  min="0"
                  className="input input-bordered w-full"
                  placeholder="1"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="4"
                className="textarea textarea-bordered w-full"
                placeholder="Describe your product..."
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="input input-bordered w-full"
                placeholder="Enter tags separated by commas"
              />
            </div>
          </div>

          {/* Product Mode */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Product Mode</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="mode"
                    value="buy-now"
                    checked={formData.mode === 'buy-now'}
                    onChange={handleChange}
                    className="radio radio-primary"
                  />
                  <span className="ml-2 flex items-center">
                    <FaShoppingCart className="mr-1" />
                    Buy Now
                  </span>
                </label>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="mode"
                    value="auction"
                    checked={formData.mode === 'auction'}
                    onChange={handleChange}
                    className="radio radio-primary"
                  />
                  <span className="ml-2 flex items-center">
                    <FaGavel className="mr-1" />
                    Auction
                  </span>
                </label>
              </div>
            </div>

            {/* Auction Settings */}
            {formData.mode === 'auction' && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Auction Settings</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time *
                    </label>
                    <input
                      type="datetime-local"
                      name="auction.startTime"
                      value={formData.auction.startTime}
                      onChange={handleChange}
                      required
                      className="input input-bordered w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time *
                    </label>
                    <input
                      type="datetime-local"
                      name="auction.endTime"
                      value={formData.auction.endTime}
                      onChange={handleChange}
                      required
                      className="input input-bordered w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Starting Bid *
                    </label>
                    <input
                      type="number"
                      name="auction.startingBid"
                      value={formData.auction.startingBid}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.01"
                      className="input input-bordered w-full"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Bid Increment
                    </label>
                    <input
                      type="number"
                      name="auction.minBidIncrement"
                      value={formData.auction.minBidIncrement}
                      onChange={handleChange}
                      min="0.01"
                      step="0.01"
                      className="input input-bordered w-full"
                      placeholder="1.00"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Product Images */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Product Images</h2>
            
            {/* Existing Images */}
            {images.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Current Images</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Product ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 btn btn-circle btn-sm btn-error"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Images */}
            {newImages.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">New Images</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {newImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`New ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        className="absolute top-2 right-2 btn btn-circle btn-sm btn-error"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload New Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add New Images
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="file-input file-input-bordered w-full max-w-xs"
                />
                <span className="text-sm text-gray-500">
                  Max 5MB per image, up to 10 images
                </span>
              </div>
              {Object.keys(imageErrors).length > 0 && (
                <div className="mt-2 text-sm text-red-600">
                  {Object.values(imageErrors).map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Variants */}
          <div className="bg-white rounded-lg shadow p-6 mt-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              Product Variants
              <button type="button" className="ml-4 btn btn-sm btn-success" onClick={addVariant}>
                <FaPlusCircle className="mr-1" /> Add Variant
              </button>
            </h2>
            {variants.length === 0 && <p className="text-gray-500">No variants added. Click "Add Variant" to create options like size, color, etc.</p>}
            {variants.map((variant, idx) => (
              <div key={idx} className="border rounded-lg p-4 mb-4 relative bg-gray-50">
                <button type="button" className="absolute top-2 right-2 btn btn-xs btn-error" onClick={() => removeVariant(idx)}>
                  <FaMinusCircle />
                </button>
                <div className="grid md:grid-cols-3 gap-4 mb-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                    <input type="text" className="input input-bordered w-full" value={variant.attributes?.size || ''} onChange={e => handleVariantAttrChange(idx, 'size', e.target.value)} placeholder="e.g. M, L, XL" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                    <input type="text" className="input input-bordered w-full" value={variant.attributes?.color || ''} onChange={e => handleVariantAttrChange(idx, 'color', e.target.value)} placeholder="e.g. Red, Blue" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                    <input type="text" className="input input-bordered w-full" value={variant.sku || ''} onChange={e => handleVariantChange(idx, 'sku', e.target.value)} placeholder="SKU (optional)" />
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4 mb-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                    <input type="number" className="input input-bordered w-full" value={variant.price} onChange={e => handleVariantChange(idx, 'price', e.target.value)} min="0" step="0.01" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
                    <input type="number" className="input input-bordered w-full" value={variant.stock} onChange={e => handleVariantChange(idx, 'stock', e.target.value)} min="0" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                    <input type="file" accept="image/*" className="file-input file-input-bordered w-full" onChange={e => handleVariantImage(idx, e.target.files[0])} />
                    {variant.image && <div className="mt-2"><img src={typeof variant.image === 'string' ? variant.image : URL.createObjectURL(variant.image)} alt="Variant" className="w-16 h-16 object-cover rounded" /></div>}
                  </div>
                </div>
                <div className="flex items-center mt-2">
                  <input type="checkbox" checked={variant.isDefault} onChange={e => handleVariantChange(idx, 'isDefault', e.target.checked)} className="checkbox checkbox-primary mr-2" />
                  <span>Set as default variant</span>
                </div>
              </div>
            ))}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/vendor/products')}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? (
                <>
                  <div className="loading loading-spinner loading-sm"></div>
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
        </form>
      </div>
    </div>
  );
};

export default EditProduct; 