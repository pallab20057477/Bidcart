import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCalendar, FiDollarSign, FiFileText, FiUpload } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const categories = [
    'Electronics', 'Fashion', 'Home', 'Sports', 'Books', 'Art', 'Collectibles', 'Other', 'Tools & Hardware'
];
const conditions = ['new', 'like-new', 'good', 'fair', 'poor'];

const CreateAuctionRequest = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [imageFiles, setImageFiles] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        brand: '',
        condition: 'new',
        stock: 1,
        tags: '',
        images: [],
        requestedStartTime: '',
        requestedEndTime: '',
        startingBid: '',
        minBidIncrement: '1',
        justification: ''
    });
    const [errors, setErrors] = useState({});

    const handleImageChange = (e) => {
        setImageFiles([...e.target.files]);
    };

    const handleImageUpload = async () => {
        setUploading(true);
        try {
            if (!imageFiles.length) {
                toast.error('Please select at least one image');
                setUploading(false);
                return;
            }

            const formDataUpload = new FormData();
            // Append all files with the same field name 'images'
            for (const file of imageFiles) {
                formDataUpload.append('images', file);
            }

            const res = await api.post('/upload/images', formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Use the correct response format
            const urls = res.data.imageUrls || [];
            setFormData(prev => ({ ...prev, images: urls }));
            toast.success(`${urls.length} image(s) uploaded successfully!`);

            // Clear the file input after successful upload
            setImageFiles([]);

        } catch (err) {
            console.error('Image upload error:', err);
            toast.error(err.response?.data?.message || 'Image upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        console.log('Form field changed:', name, value);
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name) newErrors.name = 'Product name is required';
        if (!formData.description) newErrors.description = 'Description is required';
        if (!formData.price || formData.price <= 0) newErrors.price = 'Price must be greater than 0';
        if (!formData.category) newErrors.category = 'Category is required';
        if (!formData.images || formData.images.length === 0) newErrors.images = 'At least one image is required';

        if (!formData.requestedStartTime) {
            newErrors.requestedStartTime = 'Start time is required';
        } else {
            const startTime = new Date(formData.requestedStartTime);
            if (startTime <= new Date()) {
                newErrors.requestedStartTime = 'Start time must be in the future';
            }
        }

        if (!formData.requestedEndTime) {
            newErrors.requestedEndTime = 'End time is required';
        } else if (formData.requestedStartTime) {
            const startTime = new Date(formData.requestedStartTime);
            const endTime = new Date(formData.requestedEndTime);
            if (endTime <= startTime) {
                newErrors.requestedEndTime = 'End time must be after start time';
            }
        }

        if (!formData.startingBid || formData.startingBid <= 0) {
            newErrors.startingBid = 'Starting bid must be greater than 0';
        }

        if (!formData.justification || formData.justification.length < 10) {
            newErrors.justification = 'Justification must be at least 10 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // First create the product as auction
            const productPayload = {
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price),
                category: formData.category,
                brand: formData.brand,
                condition: formData.condition,
                stock: parseInt(formData.stock),
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
                images: formData.images,
                mode: 'auction',
                auction: {
                    startTime: new Date(formData.requestedStartTime).toISOString(),
                    endTime: new Date(formData.requestedEndTime).toISOString(),
                    startingBid: parseFloat(formData.startingBid),
                    minBidIncrement: parseInt(formData.minBidIncrement)
                },
                justification: formData.justification
            };

            const response = await api.post('/auction-requests', productPayload);

            if (response.data.success) {
                toast.success('Auction request submitted for approval!');
                navigate('/vendor/auction-requests');
            }
        } catch (error) {
            const errorMsg = error.response?.data?.error?.message || error.response?.data?.message || 'Failed to create auction product';
            toast.error(errorMsg);
            setErrors({ general: errorMsg });
        } finally {
            setLoading(false);
        }
    }; return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-4">
                <button
                    onClick={() => navigate('/vendor/auction-requests')}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                >
                    <FiArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Create Auction Request</h1>
                    <p className="text-gray-600">Submit a product for auction approval</p>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white shadow rounded-lg p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {errors.general && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            {errors.general}
                        </div>
                    )}

                    {/* Product Details */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Product Name *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            maxLength={100}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-300' : 'border-gray-300'
                                }`}
                            required
                        />
                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description *
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            maxLength={2000}
                            rows={4}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.description ? 'border-red-300' : 'border-gray-300'
                                }`}
                            required
                        />
                        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Category *
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.category ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                required
                            >
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Condition
                            </label>
                            <select
                                name="condition"
                                value={formData.condition}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                {conditions.map(cond => (
                                    <option key={cond} value={cond}>{cond}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Stock
                            </label>
                            <input
                                type="number"
                                name="stock"
                                value={formData.stock}
                                onChange={handleChange}
                                min={1}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Product Price ($) *
                            </label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                min={0}
                                step="0.01"
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.price ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                required
                            />
                            {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tags (comma separated)
                        </label>
                        <input
                            type="text"
                            name="tags"
                            value={formData.tags}
                            onChange={handleChange}
                            placeholder="e.g. vintage, rare, collectible"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Product Images */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <FiUpload className="inline w-4 h-4 mr-1" />
                            Product Images * (Max 5 images)
                        </label>
                        <div className="space-y-3">
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageChange}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.images ? 'border-red-300' : 'border-gray-300'}`}
                            />

                            {imageFiles.length > 0 && (
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-sm text-gray-600 mb-2">
                                        {imageFiles.length} file(s) selected:
                                    </p>
                                    <ul className="text-sm text-gray-700 space-y-1">
                                        {Array.from(imageFiles).map((file, idx) => (
                                            <li key={idx} className="flex items-center gap-2">
                                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={handleImageUpload}
                                disabled={uploading || !imageFiles.length}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {uploading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Uploading Images...
                                    </>
                                ) : (
                                    <>
                                        <FiUpload className="w-4 h-4" />
                                        Upload Images
                                    </>
                                )}
                            </button>
                        </div>

                        {formData.images.length > 0 && (
                            <div className="mt-4">
                                <p className="text-sm font-medium text-gray-700 mb-2">
                                    Uploaded Images ({formData.images.length}):
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {formData.images.map((url, idx) => (
                                        <div key={idx} className="relative group">
                                            <img
                                                src={url}
                                                alt={`Product ${idx + 1}`}
                                                className="w-full h-24 object-cover rounded-lg border border-gray-200 shadow-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newImages = formData.images.filter((_, i) => i !== idx);
                                                    setFormData(prev => ({ ...prev, images: newImages }));
                                                }}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {errors.images && <p className="mt-1 text-sm text-red-600">{errors.images}</p>}
                        <p className="mt-1 text-xs text-gray-500">
                            Supported formats: JPG, PNG, GIF. Max file size: 5MB per image.
                        </p>
                    </div>

                    {/* Auction Period */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <FiCalendar className="inline w-4 h-4 mr-1" />
                                Requested Start Time *
                            </label>
                            <input
                                type="datetime-local"
                                name="requestedStartTime"
                                value={formData.requestedStartTime}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.requestedStartTime ? 'border-red-300' : 'border-gray-300'
                                    }`}
                            />
                            {errors.requestedStartTime && (
                                <p className="mt-1 text-sm text-red-600">{errors.requestedStartTime}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <FiCalendar className="inline w-4 h-4 mr-1" />
                                Requested End Time *
                            </label>
                            <input
                                type="datetime-local"
                                name="requestedEndTime"
                                value={formData.requestedEndTime}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.requestedEndTime ? 'border-red-300' : 'border-gray-300'
                                    }`}
                            />
                            {errors.requestedEndTime && (
                                <p className="mt-1 text-sm text-red-600">{errors.requestedEndTime}</p>
                            )}
                        </div>
                    </div>

                    {/* Bidding Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <FiDollarSign className="inline w-4 h-4 mr-1" />
                                Starting Bid *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                name="startingBid"
                                value={formData.startingBid}
                                onChange={handleChange}
                                placeholder="0.00"
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.startingBid ? 'border-red-300' : 'border-gray-300'
                                    }`}
                            />
                            {errors.startingBid && (
                                <p className="mt-1 text-sm text-red-600">{errors.startingBid}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Minimum Bid Increment
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                name="minBidIncrement"
                                value={formData.minBidIncrement}
                                onChange={handleChange}
                                placeholder="1.00"
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.minBidIncrement ? 'border-red-300' : 'border-gray-300'
                                    }`}
                            />
                            {errors.minBidIncrement && (
                                <p className="mt-1 text-sm text-red-600">{errors.minBidIncrement}</p>
                            )}
                        </div>
                    </div>



                    {/* Justification */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <FiFileText className="inline w-4 h-4 mr-1" />
                            Justification *
                        </label>
                        <textarea
                            name="justification"
                            value={formData.justification}
                            onChange={handleChange}
                            rows={4}
                            placeholder="Explain why this product should be auctioned..."
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.justification ? 'border-red-300' : 'border-gray-300'
                                }`}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            {formData.justification.length}/1000 characters
                        </p>
                        {errors.justification && (
                            <p className="mt-1 text-sm text-red-600">{errors.justification}</p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={() => navigate('/vendor/auction-requests')}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateAuctionRequest;