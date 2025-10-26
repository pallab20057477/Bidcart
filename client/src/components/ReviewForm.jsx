import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FaStar, FaShoppingBag, FaCamera, FaTimes, FaUpload } from 'react-icons/fa';

const ReviewForm = ({ productId, onReviewAdded }) => {
  const { user, isAuthenticated } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(true);
  const [hasReviewed, setHasReviewed] = useState(false);

  console.log('ReviewForm rendered with productId:', productId, 'isAuthenticated:', isAuthenticated);

  // Check if user has purchased this product
  useEffect(() => {
    const checkPurchaseStatus = async () => {
      if (!isAuthenticated || !productId) {
        setCheckingPurchase(false);
        return;
      }

      try {
        // Check if user can review this product
        const response = await api.get(`/reviews/check-eligibility/${productId}`);
        setHasPurchased(response.data.canReview);
        setHasReviewed(!response.data.canReview && response.data.message === 'You have already reviewed this product');
      } catch (error) {
        console.error('Error checking review eligibility:', error);
        // Handle different error scenarios
        if (error.response?.status === 401) {
          // User not authenticated
          setHasPurchased(false);
        } else {
          // For other errors, don't allow reviews to be safe
          console.log('Review eligibility check failed:', error.message);
          setHasPurchased(false);
        }
      } finally {
        setCheckingPurchase(false);
      }
    };

    checkPurchaseStatus();
  }, [isAuthenticated, productId]);

  const handleImageUpload = async (files) => {
    if (!files || files.length === 0) return;

    // Limit to 5 images
    if (images.length + files.length > 5) {
      toast.error('You can upload maximum 5 images');
      return;
    }

    setUploading(true);
    const uploadedImages = [];

    try {
      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image file`);
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large. Maximum size is 5MB`);
          continue;
        }

        // Create FormData for upload
        const formData = new FormData();
        formData.append('image', file);

        try {
          // Upload to your image upload endpoint
          const response = await api.post('/upload/image', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          uploadedImages.push({
            url: response.data.url,
            caption: '',
            filename: file.name
          });
        } catch (error) {
          console.error('Error uploading image:', error);
          toast.error(`Failed to upload ${file.name}`);
        }
      }

      setImages(prev => [...prev, ...uploadedImages]);
      if (uploadedImages.length > 0) {
        toast.success(`${uploadedImages.length} image(s) uploaded successfully`);
      }
    } catch (error) {
      console.error('Error in image upload:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const updateImageCaption = (index, caption) => {
    setImages(prev => prev.map((img, i) => 
      i === index ? { ...img, caption } : img
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Detailed validation with specific error messages
    if (!isAuthenticated) {
      toast.error('Please login to write a review');
      return;
    }

    if (!productId || productId === 'undefined' || productId === 'null') {
      toast.error('Product ID is missing or invalid');
      console.error('Invalid productId:', productId);
      return;
    }

    if (!rating || rating === 0 || rating < 1 || rating > 5) {
      toast.error('Please select a rating between 1 and 5 stars');
      console.error('Invalid rating:', rating);
      return;
    }

    if (!title || !title.trim()) {
      toast.error('Please enter a review title');
      return;
    }

    if (!comment || !comment.trim()) {
      toast.error('Please write a review comment');
      return;
    }

    if (comment.trim().length < 10) {
      toast.error('Review comment must be at least 10 characters long');
      return;
    }

    // Additional check for required fields
    console.log('Validation passed - ProductId:', productId, 'Rating:', rating, 'Comment:', comment.trim());

    setLoading(true);
    try {
      // Ensure all required fields are present and properly formatted
      const reviewData = {
        product: productId.toString(), // Backend expects 'product', not 'productId'
        rating: parseInt(rating, 10), // Ensure rating is an integer
        comment: comment.trim(),
        title: title.trim() || `${rating}-Star Review`, // Title is required by backend
        images: images.length > 0 ? images : undefined, // Include images if any
      };

      // Validate data before sending
      if (!reviewData.product) throw new Error('Product ID is required');
      if (!reviewData.rating || isNaN(reviewData.rating)) throw new Error('Valid rating is required');
      if (!reviewData.comment) throw new Error('Review comment is required');
      if (!reviewData.title) throw new Error('Review title is required');
      
      // Log the exact data being sent
      console.log('Submitting review data:', JSON.stringify(reviewData, null, 2));

      const response = await api.post('/reviews', reviewData);

      toast.success('Review submitted successfully!');
      
      // Reset form
      setRating(0);
      setTitle('');
      setComment('');
      setImages([]);
      
      // Notify parent component
      if (onReviewAdded) {
        onReviewAdded(response.data);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      console.error('Error response:', error.response?.data);
      
      // Handle client-side validation errors
      if (error.message) {
        toast.error(error.message);
        return;
      }
      
      // Handle server-side errors
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Handle validation errors object
        if (typeof errorData === 'object' && !Array.isArray(errorData)) {
          const missingFields = [];
          
          // Check each field
          if (!errorData.productId) missingFields.push('Product ID');
          if (!errorData.rating) missingFields.push('Rating');
          if (!errorData.comment) missingFields.push('Comment');
          if (!errorData.title) missingFields.push('Title');
          
          if (missingFields.length > 0) {
            toast.error(`Missing required fields: ${missingFields.join(', ')}`);
            return;
          }
        }
        
        // Handle other error formats
        if (errorData.message) {
          toast.error(errorData.message);
          return;
        }
        
        if (errorData.error) {
          toast.error(errorData.error);
          return;
        }
        
        if (Array.isArray(errorData.errors)) {
          toast.error(errorData.errors[0] || 'Validation error');
          return;
        }
      }
      
      // Handle HTTP status codes
      switch (error.response?.status) {
        case 400:
          toast.error('Please fill in all required fields: Rating and Comment');
          break;
        case 401:
          toast.error('Please login to submit a review');
          break;
        case 403:
          toast.error('You must purchase this product before reviewing');
          break;
        case 404:
          toast.error('Product not found');
          break;
        default:
          toast.error('Failed to submit review. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingPurchase) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">Checking purchase status...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Don't show anything if user is not logged in
  }

  if (!hasPurchased) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
        <FaShoppingBag className="text-4xl text-orange-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-orange-800 mb-2">Purchase Required</h3>
        <p className="text-orange-700 mb-4">
          Only customers who have purchased this product can write reviews.
        </p>
        <p className="text-sm text-orange-600">
          This helps ensure authentic and helpful reviews from verified buyers.
        </p>
      </div>
    );
  }

  if (hasReviewed) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <FaStar className="text-4xl text-blue-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-blue-800 mb-2">You've Already Reviewed This Product</h3>
        <p className="text-blue-700 mb-3">
          Thank you for sharing your experience! Your review helps other customers make informed decisions.
        </p>
        <div className="text-sm text-blue-600 bg-blue-100 rounded-lg p-3">
          <p className="font-medium mb-1">📝 One Review Per Product Policy</p>
          <p>To maintain review authenticity, each customer can submit only one review per product. Your original review remains visible to help other shoppers.</p>
        </div>
        <div className="mt-4 text-xs text-blue-500">
          <p>Want to share more feedback? Consider leaving reviews on other products you've purchased!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Write a Review</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating *
          </label>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="text-2xl focus:outline-none"
              >
                <FaStar
                  className={`${
                    star <= (hoverRating || rating)
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  } hover:text-yellow-400 transition-colors`}
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-600">
              {rating > 0 && `${rating} star${rating > 1 ? 's' : ''}`}
            </span>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Review Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summarize your review..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            maxLength={100}
            required
          />
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Review * (minimum 10 characters)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this product... (minimum 10 characters)"
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              comment.length > 0 && comment.length < 10 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300'
            }`}
            maxLength={1000}
            required
            minLength={10}
          />
          <div className="flex justify-between text-xs mt-1">
            <span className={comment.length < 10 ? 'text-red-500' : 'text-green-600'}>
              {comment.length < 10 ? `Need ${10 - comment.length} more characters` : 'Good length!'}
            </span>
            <span className="text-gray-500">
              {comment.length}/1000 characters
            </span>
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaCamera className="inline mr-2" />
            Add Photos (Optional - Max 5 images, 5MB each)
          </label>
          
          {/* Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleImageUpload(Array.from(e.target.files))}
              className="hidden"
              id="image-upload"
              disabled={uploading || images.length >= 5}
            />
            <label
              htmlFor="image-upload"
              className={`cursor-pointer flex flex-col items-center ${
                uploading || images.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <FaUpload className="text-2xl text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">
                {uploading ? 'Uploading...' : 
                 images.length >= 5 ? 'Maximum 5 images reached' :
                 'Click to upload images or drag and drop'}
              </span>
              <span className="text-xs text-gray-500 mt-1">
                PNG, JPG, GIF up to 5MB each
              </span>
            </label>
          </div>

          {/* Image Preview */}
          {images.length > 0 && (
            <div className="mt-4 space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Uploaded Images ({images.length}/5)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {images.map((image, index) => (
                  <div key={index} className="relative bg-gray-50 rounded-lg p-3">
                    <div className="flex items-start space-x-3">
                      <img
                        src={image.url}
                        alt={`Review image ${index + 1}`}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          placeholder="Add a caption (optional)"
                          value={image.caption}
                          onChange={(e) => updateImageCaption(index, e.target.value)}
                          className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          maxLength={100}
                        />
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {image.filename}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Remove image"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || uploading || rating === 0 || !comment.trim() || !title.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          {loading ? 'Submitting...' : uploading ? 'Uploading Images...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;