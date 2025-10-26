import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import {
    FaGavel, FaUpload, FaSave, FaTimes, FaTag, FaDollarSign, FaInfoCircle,
    FaImage, FaPlus, FaCheck, FaExclamationTriangle, FaEye, FaClock,
    FaRuler, FaWeight, FaBarcode, FaCog, FaLightbulb, FaShoppingCart,
    FaCloudUploadAlt, FaSpinner, FaCalendarAlt, FaHammer
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const AddAuctionProduct = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [images, setImages] = useState([]);
    const [imagePreview, setImagePreview] = useState([]);
    const [currentStep, setCurrentStep] = useState(1);
    const [validationErrors, setValidationErrors] = useState({});
    const [isDragOver, setIsDragOver] = useState(false);
    const [newFeature, setNewFeature] = useState('');
    const [newTag, setNewTag] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        startingBid: '',
        category: '',
        subcategory: '',
        brand: '',
        condition: 'new',
        sku: '',
        weight: '',
        dimensions: {
            length: '',
            width: '',
            height: ''
        },
        features: [],
        tags: [],
        mode: 'auction',
        auction: {
            startTime: '',
            endTime: '',
            startingBid: '',
            minBidIncrement: '1',
            reservePrice: '',
            buyNowPrice: ''
        },
        seoTitle: '',
        seoDescription: '',
        warranty: '',
        returnPolicy: ''
    });

    const steps = [
        { id: 1, title: 'Basic Info', icon: FaInfoCircle },
        { id: 2, title: 'Images', icon: FaImage },
        { id: 3, title: 'Auction Details', icon: FaGavel },
        { id: 4, title: 'Review', icon: FaEye }
    ];

    const categories = [
        'Electronics', 'Fashion', 'Home & Garden', 'Sports & Outdoors',
        'Books & Media', 'Toys & Games', 'Health & Beauty', 'Automotive',
        'Tools & Hardware', 'Food & Beverages', 'Collectibles', 'Art & Antiques'
    ];

    const subcategories = {
        'Electronics': ['Smartphones', 'Laptops', 'Tablets', 'Accessories', 'Audio', 'Cameras'],
        'Fashion': ['Clothing', 'Shoes', 'Bags', 'Jewelry', 'Watches', 'Accessories'],
        'Home & Garden': ['Furniture', 'Decor', 'Kitchen', 'Garden', 'Lighting', 'Storage'],
        'Sports & Outdoors': ['Fitness', 'Outdoor', 'Team Sports', 'Water Sports', 'Camping'],
        'Books & Media': ['Books', 'Movies', 'Music', 'Games', 'Magazines'],
        'Toys & Games': ['Board Games', 'Video Games', 'Educational', 'Action Figures'],
        'Health & Beauty': ['Skincare', 'Makeup', 'Hair Care', 'Fragrances', 'Supplements'],
        'Automotive': ['Car Parts', 'Accessories', 'Tools', 'Maintenance'],
        'Tools & Hardware': ['Power Tools', 'Hand Tools', 'Fasteners', 'Plumbing'],
        'Food & Beverages': ['Snacks', 'Beverages', 'Organic', 'Gourmet'],
        'Collectibles': ['Coins', 'Stamps', 'Cards', 'Memorabilia'],
        'Art & Antiques': ['Paintings', 'Sculptures', 'Antiques', 'Crafts']
    };

    const conditions = [
        { value: 'new', label: 'New', description: 'Brand new, never used' },
        { value: 'like-new', label: 'Like New', description: 'Excellent condition, minimal use' },
        { value: 'good', label: 'Good', description: 'Normal wear, fully functional' },
        { value: 'fair', label: 'Fair', description: 'Heavy wear but works properly' },
        { value: 'poor', label: 'Poor', description: 'Significant wear, may need repair' }
    ];

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

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
            const newValue = type === 'checkbox' ? checked : value;
            setFormData(prev => ({
                ...prev,
                [name]: newValue
            }));

            // Update auction startingBid when main startingBid changes
            if (name === 'startingBid') {
                setFormData(prev => ({
                    ...prev,
                    auction: {
                        ...prev.auction,
                        startingBid: value
                    }
                }));
            }
        }

        // Clear specific validation errors when user starts typing
        if (validationErrors[name] || validationErrors[name.split('.')[1]]) {
            const newErrors = { ...validationErrors };
            delete newErrors[name];
            delete newErrors[name.split('.')[1]];
            setValidationErrors(newErrors);
        }
    };

    const validateForm = () => {
        const errors = {};

        // Basic validation
        if (!formData.name || !formData.name.trim()) {
            errors.name = 'Product name is required';
        } else if (formData.name.trim().length < 3) {
            errors.name = 'Product name must be at least 3 characters';
        }

        if (!formData.description || !formData.description.trim()) {
            errors.description = 'Description is required';
        } else if (formData.description.trim().length < 10) {
            errors.description = 'Description must be at least 10 characters';
        }

        if (!formData.startingBid || parseFloat(formData.startingBid) <= 0) {
            errors.startingBid = 'Valid starting bid is required';
        } else if (parseFloat(formData.startingBid) < 0.01) {
            errors.startingBid = 'Starting bid must be at least $0.01';
        }

        if (!formData.category) {
            errors.category = 'Category is required';
        }

        if (!formData.condition) {
            errors.condition = 'Item condition is required';
        }

        if (images.length === 0) {
            errors.images = 'At least one image is required';
        }

        // Auction-specific validation
        if (!formData.auction.startTime) {
            errors.startTime = 'Auction start time is required';
        }

        if (!formData.auction.endTime) {
            errors.endTime = 'Auction end time is required';
        }

        // Only validate timing if both dates are provided
        if (formData.auction.startTime && formData.auction.endTime) {
            const startTime = new Date(formData.auction.startTime);
            const endTime = new Date(formData.auction.endTime);
            const now = new Date();

            // Add 5 minutes buffer for start time to account for form submission time
            const minStartTime = new Date(now.getTime() + 5 * 60 * 1000);

            if (isNaN(startTime.getTime())) {
                errors.startTime = 'Invalid start time format';
            } else if (startTime <= minStartTime) {
                errors.startTime = 'Start time must be at least 5 minutes in the future';
            }

            if (isNaN(endTime.getTime())) {
                errors.endTime = 'Invalid end time format';
            } else if (endTime <= startTime) {
                errors.endTime = 'End time must be after start time';
            } else {
                const duration = (endTime - startTime) / (1000 * 60 * 60); // hours
                if (duration < 1) {
                    errors.endTime = 'Auction must run for at least 1 hour';
                } else if (duration > 720) { // 30 days
                    errors.endTime = 'Auction cannot run for more than 30 days';
                }
            }
        }

        // Validate reserve price if provided
        if (formData.auction.reservePrice && formData.auction.reservePrice.trim() !== '') {
            const reservePrice = parseFloat(formData.auction.reservePrice);
            const startingBid = parseFloat(formData.startingBid);

            if (isNaN(reservePrice) || reservePrice <= 0) {
                errors.reservePrice = 'Reserve price must be a valid positive number';
            } else if (reservePrice < startingBid) {
                errors.reservePrice = 'Reserve price must be greater than or equal to starting bid';
            }
        }

        // Validate buy now price if provided
        if (formData.auction.buyNowPrice && formData.auction.buyNowPrice.trim() !== '') {
            const buyNowPrice = parseFloat(formData.auction.buyNowPrice);
            const startingBid = parseFloat(formData.startingBid);

            if (isNaN(buyNowPrice) || buyNowPrice <= 0) {
                errors.buyNowPrice = 'Buy now price must be a valid positive number';
            } else if (buyNowPrice <= startingBid) {
                errors.buyNowPrice = 'Buy now price must be greater than starting bid';
            }
        }

        // Validate minimum bid increment
        if (formData.auction.minBidIncrement) {
            const minIncrement = parseFloat(formData.auction.minBidIncrement);
            if (isNaN(minIncrement) || minIncrement <= 0) {
                errors.minBidIncrement = 'Minimum bid increment must be a positive number';
            } else if (minIncrement < 0.01) {
                errors.minBidIncrement = 'Minimum bid increment must be at least $0.01';
            }
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        processImageFiles(files);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        processImageFiles(files);
    };

    const processImageFiles = (files) => {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));

        if (imageFiles.length + images.length > 5) {
            toast.error('Maximum 5 images allowed');
            return;
        }

        const oversizedFiles = imageFiles.filter(file => file.size > 5 * 1024 * 1024);
        if (oversizedFiles.length > 0) {
            toast.error('Some images are too large. Maximum size is 5MB per image.');
            return;
        }

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        const invalidFiles = imageFiles.filter(file => !allowedTypes.includes(file.type));
        if (invalidFiles.length > 0) {
            toast.error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
            return;
        }

        setImages(prev => [...prev, ...imageFiles]);

        const newPreviews = imageFiles.map(file => ({
            file,
            url: URL.createObjectURL(file),
            name: file.name,
            size: file.size,
            type: file.type
        }));

        setImagePreview(prev => [...prev, ...newPreviews]);
        toast.success(`${imageFiles.length} image(s) added successfully`);
    };

    const removeImage = (index) => {
        URL.revokeObjectURL(imagePreview[index].url);
        setImages(prev => prev.filter((_, i) => i !== index));
        setImagePreview(prev => prev.filter((_, i) => i !== index));
    };

    const handleFeatureAdd = () => {
        if (newFeature.trim()) {
            setFormData(prev => ({
                ...prev,
                features: [...prev.features, newFeature.trim()]
            }));
            setNewFeature('');
        }
    };

    const handleFeatureKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleFeatureAdd();
        }
    };

    const handleFeatureRemove = (index) => {
        setFormData(prev => ({
            ...prev,
            features: prev.features.filter((_, i) => i !== index)
        }));
    };

    const handleTagAdd = () => {
        if (newTag.trim()) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, newTag.trim()]
            }));
            setNewTag('');
        }
    };

    const handleTagKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleTagAdd();
        }
    };

    const handleTagRemove = (index) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fix the validation errors before submitting');
            return;
        }

        setLoading(true);
        setUploadingImages(true);

        try {
            const imageUrls = [];
            if (images.length > 0) {
                toast.loading('Uploading images...', { id: 'upload' });

                for (let i = 0; i < images.length; i++) {
                    const image = images[i];
                    const formDataImage = new FormData();
                    formDataImage.append('image', image);

                    try {
                        const uploadResponse = await api.post('/upload/image', formDataImage, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });

                        imageUrls.push(uploadResponse.data.url);
                        toast.loading(`Uploading images... ${i + 1}/${images.length}`, { id: 'upload' });
                    } catch (uploadError) {
                        console.error('Image upload failed:', uploadError);
                        toast.error(`Failed to upload image: ${image.name}`);
                    }
                }

                toast.dismiss('upload');
            }

            const productData = {
                ...formData,
                images: imageUrls,
                price: parseFloat(formData.startingBid) || 0, // Backend requires 'price' field
                startingBid: parseFloat(formData.startingBid) || 0,
                weight: parseFloat(formData.weight) || 0,
                dimensions: {
                    length: parseFloat(formData.dimensions.length) || 0,
                    width: parseFloat(formData.dimensions.width) || 0,
                    height: parseFloat(formData.dimensions.height) || 0
                },
                auction: {
                    ...formData.auction,
                    startingBid: parseFloat(formData.startingBid) || 0,
                    minBidIncrement: parseInt(formData.auction.minBidIncrement) || 1,
                    reservePrice: parseFloat(formData.auction.reservePrice) || 0,
                    buyNowPrice: parseFloat(formData.auction.buyNowPrice) || 0
                }
            };

            toast.loading('Creating auction product...', { id: 'create' });
            const response = await api.post('/vendors/products/auction', productData);

            toast.dismiss('create');
            toast.success('Auction product created successfully!');
            navigate('/vendor/products');
        } catch (error) {
            console.error('Auction product creation error:', error);
            const message = error.response?.data?.error?.message ||
                error.response?.data?.message ||
                'Failed to create auction product';
            toast.error(message);

            if (error.response?.data?.error?.details) {
                setValidationErrors(error.response.data.error.details);
            }
        } finally {
            setLoading(false);
            setUploadingImages(false);
        }
    };

    const nextStep = () => {
        if (currentStep < steps.length) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const goToStep = (step) => {
        setCurrentStep(step);
    };

    // Generate minimum end time (1 hour from start time)
    const getMinEndTime = () => {
        if (formData.auction.startTime) {
            const startTime = new Date(formData.auction.startTime);
            startTime.setHours(startTime.getHours() + 1);
            return startTime.toISOString().slice(0, 16);
        }
        return '';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
            {(loading || uploadingImages) && (
                <div className="fixed top-0 left-0 w-full z-50">
                    <div className="h-1 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 animate-pulse w-full" />
                </div>
            )}

            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-orange-100">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight flex items-center">
                                <FaGavel className="mr-3 text-orange-600" />
                                Add Auction Product
                            </h1>
                            <p className="text-gray-600 text-lg">Create a new auction product with our specialized wizard</p>
                        </div>
                        <button
                            onClick={() => navigate('/vendor/products')}
                            className="px-6 py-3 border-2 border-orange-500 text-orange-600 rounded-xl hover:bg-orange-50 transition-all duration-200 font-medium"
                        >
                            Back to Products
                        </button>
                    </div>
                </div>

                {/* Progress Steps */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            const isActive = currentStep === step.id;
                            const isCompleted = currentStep > step.id;

                            return (
                                <div key={step.id} className="flex items-center">
                                    <div
                                        className={`flex items-center cursor-pointer ${isActive || isCompleted ? 'text-orange-600' : 'text-gray-400'
                                            }`}
                                        onClick={() => goToStep(step.id)}
                                    >
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${isActive
                                            ? 'bg-orange-600 border-orange-600 text-white shadow-lg'
                                            : isCompleted
                                                ? 'bg-green-500 border-green-500 text-white'
                                                : 'bg-white border-gray-300 text-gray-400'
                                            }`}>
                                            {isCompleted ? <FaCheck /> : <Icon />}
                                        </div>
                                        <div className="ml-3">
                                            <p className={`font-medium ${isActive ? 'text-orange-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                                                Step {step.id}
                                            </p>
                                            <p className={`text-sm ${isActive ? 'text-orange-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                                                {step.title}
                                            </p>
                                        </div>
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className={`flex-1 h-1 mx-8 rounded ${currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                                            }`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Step 1: Basic Information */}
                    {currentStep === 1 && (
                        <div className="bg-white rounded-2xl shadow-xl p-8 border border-orange-100">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-3xl font-bold text-orange-700 flex items-center">
                                    <FaInfoCircle className="mr-3" />
                                    Basic Information
                                </h2>
                                <div className="text-sm text-gray-500">
                                    Step 1 of {steps.length}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Product Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 ${validationErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50'
                                            }`}
                                        placeholder="Enter auction product name"
                                        required
                                    />
                                    {validationErrors.name && (
                                        <p className="text-red-500 text-sm mt-1 flex items-center">
                                            <FaExclamationTriangle className="mr-1" />
                                            {validationErrors.name}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FaDollarSign className="inline mr-2" />
                                        Starting Bid *
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">$</span>
                                        <input
                                            type="number"
                                            name="startingBid"
                                            value={formData.startingBid}
                                            onChange={handleChange}
                                            className={`w-full pl-8 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 ${validationErrors.startingBid ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50'
                                                }`}
                                            placeholder="0.00"
                                            step="0.01"
                                            min="0.01"
                                            required
                                        />
                                    </div>
                                    {validationErrors.startingBid && (
                                        <p className="text-red-500 text-sm mt-1 flex items-center">
                                            <FaExclamationTriangle className="mr-1" />
                                            {validationErrors.startingBid}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FaBarcode className="inline mr-2" />
                                        SKU
                                    </label>
                                    <input
                                        type="text"
                                        name="sku"
                                        value={formData.sku}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border-2 border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                                        placeholder="Auto-generated if empty"
                                    />
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
                                        className="w-full px-4 py-3 border-2 border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                                        placeholder="Enter brand name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FaTag className="inline mr-2" />
                                        Category *
                                    </label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 ${validationErrors.category ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50'
                                            }`}
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map((category) => (
                                            <option key={category} value={category}>
                                                {category}
                                            </option>
                                        ))}
                                    </select>
                                    {validationErrors.category && (
                                        <p className="text-red-500 text-sm mt-1 flex items-center">
                                            <FaExclamationTriangle className="mr-1" />
                                            {validationErrors.category}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Subcategory
                                    </label>
                                    <select
                                        name="subcategory"
                                        value={formData.subcategory}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border-2 border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                                        disabled={!formData.category}
                                    >
                                        <option value="">Select Subcategory</option>
                                        {formData.category && subcategories[formData.category]?.map((sub) => (
                                            <option key={sub} value={sub}>
                                                {sub}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Condition Selection */}
                            <div className="mt-8">
                                <label className="block text-sm font-medium text-gray-700 mb-4">
                                    Item Condition *
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                    {conditions.map((condition) => (
                                        <label key={condition.value} className={`flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${formData.condition === condition.value ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-gray-50'
                                            }`}>
                                            <input
                                                type="radio"
                                                name="condition"
                                                value={condition.value}
                                                checked={formData.condition === condition.value}
                                                onChange={handleChange}
                                                className="sr-only"
                                            />
                                            <span className={`font-medium ${formData.condition === condition.value ? 'text-orange-600' : 'text-gray-600'}`}>
                                                {condition.label}
                                            </span>
                                            <span className="text-xs text-gray-500 mt-1">
                                                {condition.description}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                {validationErrors.condition && (
                                    <p className="text-red-500 text-sm mt-2 flex items-center">
                                        <FaExclamationTriangle className="mr-1" />
                                        {validationErrors.condition}
                                    </p>
                                )}
                            </div>

                            <div className="mt-8">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Product Description *
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 h-32 resize-none ${validationErrors.description ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50'
                                        }`}
                                    placeholder="Describe your auction item in detail. Include condition, history, and any unique features..."
                                    required
                                />
                                {validationErrors.description && (
                                    <p className="text-red-500 text-sm mt-1 flex items-center">
                                        <FaExclamationTriangle className="mr-1" />
                                        {validationErrors.description}
                                    </p>
                                )}
                                <p className="text-sm text-gray-500 mt-1">
                                    {formData.description.length}/1000 characters
                                </p>
                            </div>

                            <div className="flex justify-end mt-8">
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="px-8 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-all duration-200 font-medium flex items-center"
                                >
                                    Next: Add Images
                                    <FaUpload className="ml-2" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Product Images */}
                    {currentStep === 2 && (
                        <div className="bg-white rounded-2xl shadow-xl p-8 border border-purple-100">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-3xl font-bold text-purple-700 flex items-center">
                                    <FaImage className="mr-3" />
                                    Product Images
                                </h2>
                                <div className="text-sm text-gray-500">
                                    Step 2 of {steps.length}
                                </div>
                            </div>

                            {/* Drag and Drop Upload Area */}
                            <div
                                className={`border-3 border-dashed rounded-2xl p-12 text-center transition-all duration-200 ${isDragOver
                                    ? 'border-purple-500 bg-purple-50'
                                    : validationErrors.images
                                        ? 'border-red-500 bg-red-50'
                                        : 'border-gray-300 bg-gray-50'
                                    }`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <FaCloudUploadAlt className={`mx-auto text-6xl mb-4 ${isDragOver ? 'text-purple-500' : 'text-gray-400'
                                    }`} />
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                    Drag & Drop Images Here
                                </h3>
                                <p className="text-gray-500 mb-4">
                                    High-quality images increase auction success
                                </p>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    id="image-upload"
                                />
                                <label
                                    htmlFor="image-upload"
                                    className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all duration-200 cursor-pointer font-medium"
                                >
                                    <FaUpload className="mr-2" />
                                    Choose Images
                                </label>
                                <p className="text-sm text-gray-500 mt-4">
                                    Supported: JPG, PNG, GIF, WebP • Max 5 images • Max 5MB each
                                </p>
                            </div>

                            {validationErrors.images && (
                                <p className="text-red-500 text-sm mt-2 flex items-center">
                                    <FaExclamationTriangle className="mr-1" />
                                    {validationErrors.images}
                                </p>
                            )}

                            {/* Image Previews */}
                            {imagePreview.length > 0 && (
                                <div className="mt-8">
                                    <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                                        <FaImage className="mr-2" />
                                        Selected Images ({imagePreview.length}/5)
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {imagePreview.map((preview, index) => (
                                            <div key={index} className="relative group bg-white border-2 border-gray-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-200">
                                                <div className="aspect-w-16 aspect-h-12">
                                                    <img
                                                        src={preview.url}
                                                        alt={`Preview ${index + 1}`}
                                                        className="w-full h-48 object-cover"
                                                    />
                                                </div>
                                                <div className="p-4">
                                                    <p className="text-sm font-medium text-gray-700 truncate">
                                                        {preview.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {(preview.size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className="absolute top-3 right-3 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm shadow-lg hover:bg-red-600 transition-all duration-200 opacity-0 group-hover:opacity-100"
                                                    title="Remove image"
                                                >
                                                    <FaTimes />
                                                </button>
                                                {index === 0 && (
                                                    <div className="absolute top-3 left-3 bg-blue-500 text-white px-2 py-1 rounded-lg text-xs font-medium">
                                                        Main Image
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-4 flex items-center">
                                        <FaLightbulb className="mr-2 text-yellow-500" />
                                        Tip: The first image will be the main auction image. Use high-quality photos from multiple angles.
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-between mt-8">
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="px-8 py-3 border-2 border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                                >
                                    Previous
                                </button>
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="px-8 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all duration-200 font-medium flex items-center"
                                >
                                    Next: Auction Details
                                    <FaGavel className="ml-2" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Auction Details */}
                    {currentStep === 3 && (
                        <div className="bg-white rounded-2xl shadow-xl p-8 border border-red-100">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-3xl font-bold text-red-700 flex items-center">
                                    <FaGavel className="mr-3" />
                                    Auction Configuration
                                </h2>
                                <div className="text-sm text-gray-500">
                                    Step 3 of {steps.length}
                                </div>
                            </div>

                            {/* Auction Timing */}
                            <div className="mb-8">
                                <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
                                    <FaCalendarAlt className="mr-2 text-red-600" />
                                    Auction Schedule
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Start Time *
                                        </label>
                                        <input
                                            type="datetime-local"
                                            name="auction.startTime"
                                            value={formData.auction.startTime}
                                            onChange={handleChange}
                                            min={new Date().toISOString().slice(0, 16)}
                                            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 ${validationErrors.startTime ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50'
                                                }`}
                                            required
                                        />
                                        {validationErrors.startTime && (
                                            <p className="text-red-500 text-sm mt-1 flex items-center">
                                                <FaExclamationTriangle className="mr-1" />
                                                {validationErrors.startTime}
                                            </p>
                                        )}
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
                                            min={getMinEndTime()}
                                            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 ${validationErrors.endTime ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50'
                                                }`}
                                            required
                                        />
                                        {validationErrors.endTime && (
                                            <p className="text-red-500 text-sm mt-1 flex items-center">
                                                <FaExclamationTriangle className="mr-1" />
                                                {validationErrors.endTime}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Bidding Configuration */}
                            <div className="mb-8">
                                <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
                                    <FaHammer className="mr-2 text-red-600" />
                                    Bidding Rules
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Minimum Bid Increment
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">$</span>
                                            <input
                                                type="number"
                                                name="auction.minBidIncrement"
                                                value={formData.auction.minBidIncrement}
                                                onChange={handleChange}
                                                className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                                                placeholder="1.00"
                                                step="0.01"
                                                min="0.01"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Minimum amount each bid must increase</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Reserve Price (Optional)
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">$</span>
                                            <input
                                                type="number"
                                                name="auction.reservePrice"
                                                value={formData.auction.reservePrice}
                                                onChange={handleChange}
                                                className={`w-full pl-8 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 ${validationErrors.reservePrice ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50'
                                                    }`}
                                                placeholder="0.00"
                                                step="0.01"
                                                min="0"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Minimum price you'll accept (hidden from bidders)</p>
                                        {validationErrors.reservePrice && (
                                            <p className="text-red-500 text-sm mt-1 flex items-center">
                                                <FaExclamationTriangle className="mr-1" />
                                                {validationErrors.reservePrice}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Buy Now Price (Optional)
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">$</span>
                                            <input
                                                type="number"
                                                name="auction.buyNowPrice"
                                                value={formData.auction.buyNowPrice}
                                                onChange={handleChange}
                                                className={`w-full pl-8 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 ${validationErrors.buyNowPrice ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50'
                                                    }`}
                                                placeholder="0.00"
                                                step="0.01"
                                                min="0"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Allow immediate purchase at this price</p>
                                        {validationErrors.buyNowPrice && (
                                            <p className="text-red-500 text-sm mt-1 flex items-center">
                                                <FaExclamationTriangle className="mr-1" />
                                                {validationErrors.buyNowPrice}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Features & Tags */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-4">
                                        <FaLightbulb className="inline mr-2 text-yellow-500" />
                                        Product Features
                                    </label>
                                    <div className="space-y-3">
                                        {formData.features.map((feature, index) => (
                                            <div key={index} className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                                                <FaCheck className="text-red-600 flex-shrink-0" />
                                                <span className="flex-1 text-gray-700">{feature}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleFeatureRemove(index)}
                                                    className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-all duration-200"
                                                >
                                                    <FaTimes />
                                                </button>
                                            </div>
                                        ))}
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newFeature}
                                                onChange={(e) => setNewFeature(e.target.value)}
                                                onKeyPress={handleFeatureKeyPress}
                                                className="flex-1 px-3 py-2 border-2 border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                                placeholder="Enter a product feature..."
                                            />
                                            <button
                                                type="button"
                                                onClick={handleFeatureAdd}
                                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 flex items-center"
                                            >
                                                <FaPlus />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-4">
                                        <FaTag className="inline mr-2 text-blue-500" />
                                        Product Tags
                                    </label>
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap gap-2">
                                            {formData.tags.map((tag, index) => (
                                                <span key={index} className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                                                    {tag}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleTagRemove(index)}
                                                        className="text-blue-500 hover:text-blue-700"
                                                    >
                                                        <FaTimes className="text-xs" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newTag}
                                                onChange={(e) => setNewTag(e.target.value)}
                                                onKeyPress={handleTagKeyPress}
                                                className="flex-1 px-3 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Enter a product tag..."
                                            />
                                            <button
                                                type="button"
                                                onClick={handleTagAdd}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center"
                                            >
                                                <FaPlus />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Physical Properties */}
                            <div className="mb-8">
                                <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
                                    <FaRuler className="mr-2 text-red-600" />
                                    Physical Properties
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <FaWeight className="inline mr-2" />
                                            Weight (kg)
                                        </label>
                                        <input
                                            type="number"
                                            name="weight"
                                            value={formData.weight}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border-2 border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                                            placeholder="0.0"
                                            step="0.1"
                                            min="0"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Length (cm)
                                        </label>
                                        <input
                                            type="number"
                                            name="dimensions.length"
                                            value={formData.dimensions.length}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border-2 border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                                            placeholder="0"
                                            min="0"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Width (cm)
                                        </label>
                                        <input
                                            type="number"
                                            name="dimensions.width"
                                            value={formData.dimensions.width}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border-2 border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                                            placeholder="0"
                                            min="0"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Height (cm)
                                        </label>
                                        <input
                                            type="number"
                                            name="dimensions.height"
                                            value={formData.dimensions.height}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border-2 border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                                            placeholder="0"
                                            min="0"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between mt-8">
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="px-8 py-3 border-2 border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                                >
                                    Previous
                                </button>
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="px-8 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 font-medium flex items-center"
                                >
                                    Next: Review & Submit
                                    <FaEye className="ml-2" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Review & Submit */}
                    {currentStep === 4 && (
                        <div className="bg-white rounded-2xl shadow-xl p-8 border border-green-100">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-3xl font-bold text-green-700 flex items-center">
                                    <FaEye className="mr-3" />
                                    Review Auction Product
                                </h2>
                                <div className="text-sm text-gray-500">
                                    Step 4 of {steps.length}
                                </div>
                            </div>

                            {/* Auction Summary */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Basic Information */}
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Basic Information</h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Product Name:</span>
                                                <span className="font-medium">{formData.name || 'Not specified'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Brand:</span>
                                                <span className="font-medium">{formData.brand || 'Not specified'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Category:</span>
                                                <span className="font-medium">{formData.category || 'Not specified'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Condition:</span>
                                                <span className="font-medium capitalize">{formData.condition || 'Not specified'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Starting Bid:</span>
                                                <span className="font-medium text-green-600">${formData.startingBid || '0.00'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Auction Configuration</h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Start Time:</span>
                                                <span className="font-medium">
                                                    {formData.auction.startTime ? new Date(formData.auction.startTime).toLocaleString() : 'Not set'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">End Time:</span>
                                                <span className="font-medium">
                                                    {formData.auction.endTime ? new Date(formData.auction.endTime).toLocaleString() : 'Not set'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Min Bid Increment:</span>
                                                <span className="font-medium">${formData.auction.minBidIncrement || '1.00'}</span>
                                            </div>
                                            {formData.auction.reservePrice && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Reserve Price:</span>
                                                    <span className="font-medium text-orange-600">${formData.auction.reservePrice}</span>
                                                </div>
                                            )}
                                            {formData.auction.buyNowPrice && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Buy Now Price:</span>
                                                    <span className="font-medium text-blue-600">${formData.auction.buyNowPrice}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Images & Additional Info */}
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Product Images</h3>
                                        {imagePreview.length > 0 ? (
                                            <div className="grid grid-cols-2 gap-4">
                                                {imagePreview.slice(0, 4).map((preview, index) => (
                                                    <div key={index} className="relative">
                                                        <img
                                                            src={preview.url}
                                                            alt={`Preview ${index + 1}`}
                                                            className="w-full h-24 object-cover rounded-lg border border-gray-200"
                                                        />
                                                        {index === 0 && (
                                                            <div className="absolute top-1 left-1 bg-blue-500 text-white px-1 py-0.5 rounded text-xs">
                                                                Main
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                                {imagePreview.length > 4 && (
                                                    <div className="flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200 h-24">
                                                        <span className="text-gray-500 text-sm">+{imagePreview.length - 4} more</span>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-gray-400 text-sm">No images uploaded</div>
                                        )}
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Features & Tags</h3>
                                        <div className="space-y-3">
                                            <div>
                                                <span className="text-gray-600">Features:</span>
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {formData.features.length > 0 ? (
                                                        formData.features.map((feature, index) => (
                                                            <span key={index} className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                                                                {feature}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">No features added</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Tags:</span>
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {formData.tags.length > 0 ? (
                                                        formData.tags.map((tag, index) => (
                                                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                                                                {tag}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">No tags added</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="mt-8">
                                <h3 className="text-lg font-semibold text-gray-700 mb-4">Product Description</h3>
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    <p className="text-gray-700">
                                        {formData.description || 'No description provided'}
                                    </p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-between mt-8">
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="px-8 py-3 border-2 border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                                >
                                    Previous
                                </button>
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/vendor/products')}
                                        className="px-8 py-3 border-2 border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl hover:from-green-600 hover:to-blue-600 transition-all duration-200 font-medium flex items-center shadow-lg"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <FaSpinner className="animate-spin mr-2" />
                                                Creating Auction...
                                            </>
                                        ) : (
                                            <>
                                                <FaGavel className="mr-2" />
                                                Create Auction Product
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default AddAuctionProduct;

// Helper function to validate current step
const validateCurrentStepHelper = (currentStep, formData, images) => {
    const errors = {};

    switch (currentStep) {
        case 1: // Basic Info
            if (!formData.name || !formData.name.trim()) {
                errors.name = 'Product name is required';
            }
            if (!formData.description || !formData.description.trim()) {
                errors.description = 'Description is required';
            }
            if (!formData.startingBid || parseFloat(formData.startingBid) <= 0) {
                errors.startingBid = 'Valid starting bid is required';
            }
            if (!formData.category) {
                errors.category = 'Category is required';
            }
            if (!formData.condition) {
                errors.condition = 'Item condition is required';
            }
            break;

        case 2: // Images
            if (images.length === 0) {
                errors.images = 'At least one image is required';
            }
            break;

        case 3: // Auction Details
            if (!formData.auction.startTime) {
                errors.startTime = 'Auction start time is required';
            }
            if (!formData.auction.endTime) {
                errors.endTime = 'Auction end time is required';
            }

            if (formData.auction.startTime && formData.auction.endTime) {
                const startTime = new Date(formData.auction.startTime);
                const endTime = new Date(formData.auction.endTime);
                const now = new Date();
                const minStartTime = new Date(now.getTime() + 5 * 60 * 1000);

                if (startTime <= minStartTime) {
                    errors.startTime = 'Start time must be at least 5 minutes in the future';
                }
                if (endTime <= startTime) {
                    errors.endTime = 'End time must be after start time';
                }
            }
            break;
    }

    return { errors, isValid: Object.keys(errors).length === 0 };
};
// // IMP
// ORTANT FIX: Update the API call and data structure
// // Replace the existing API call with:
// /*
// const finalProductData = {
//   ...productData,
//   price: parseFloat(formData.startingBid) || 0, // Backend requires 'price' field
//   condition: formData.condition || 'new' // Ensure valid condition
// };

// console.log('Sending auction product data:', finalProductData);
// const response = await api.post('/vendors/products/auction', finalProductData);
// */