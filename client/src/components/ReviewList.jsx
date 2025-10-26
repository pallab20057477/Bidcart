import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FaStar, FaThumbsUp, FaThumbsDown, FaImage, FaUser, FaCheck } from 'react-icons/fa';
import ReviewForm from './ReviewForm';

const ReviewList = ({ productId }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  // Track reviews user has voted on
  const [votedReviewIds, setVotedReviewIds] = useState([]);
  const [userVotes, setUserVotes] = useState({}); // Track user's vote type per review

  // Load votedReviewIds and userVotes from localStorage on mount
  React.useEffect(() => {
    const storedVoted = localStorage.getItem('votedReviewIds');
    const storedVotes = localStorage.getItem('userVotes');
    if (storedVoted) {
      setVotedReviewIds(JSON.parse(storedVoted));
    }
    if (storedVotes) {
      setUserVotes(JSON.parse(storedVotes));
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [productId, currentPage]);

  useEffect(() => {
    if (socket) {
      // Listen for new reviews
      socket.on('review:added', handleNewReview);
      
      return () => {
        socket.off('review:added', handleNewReview);
      };
    }
  }, [socket, productId]);

  const fetchReviews = async () => {
    try {
      const response = await api.get(`/reviews/product/${productId}`, {
        params: { page: currentPage, limit: 10 }
      });

      // Ensure counts are numbers and handle virtual properties correctly
      const normalizedReviews = response.data.reviews.map(review => ({
        ...review,
        helpfulCount: typeof review.helpfulCount === 'number' ? review.helpfulCount : 0,
        notHelpfulCount: typeof review.notHelpfulCount === 'number' ? review.notHelpfulCount : 0,
      }));
      
      setReviews(normalizedReviews);
      setAverageRating(response.data.averageRating);
      setReviewCount(response.data.reviewCount);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleNewReview = (data) => {
    if (data.productId === productId) {
      // Add new review to the beginning of the list
      setReviews(prev => [data.review, ...prev]);
      setReviewCount(prev => prev + 1);
      
      // Recalculate average rating
      const newTotal = reviews.reduce((sum, review) => sum + review.rating, 0) + data.review.rating;
      const newAverage = newTotal / (reviews.length + 1);
      setAverageRating(Math.round(newAverage * 10) / 10);
      
      toast.success('New review added!');
    }
  };

  const handleHelpfulVote = async (reviewId, helpful) => {
    if (!user) {
      toast.error('Please login to vote on reviews');
      return;
    }

    // Check if user already voted
    if (votedReviewIds.includes(reviewId)) {
      toast.error('You have already voted on this review');
      return;
    }

    try {
      const response = await api.post(`/reviews/${reviewId}/helpful`, { helpful });
      
      // Update the review in the list
      setReviews(prev => prev.map(review => {
        if (review._id === reviewId) {
          return {
            ...review,
            helpfulCount: response.data.helpfulCount || 0,
            notHelpfulCount: response.data.notHelpfulCount || 0
          };
        }
        return review;
      }));

      // Add to votedReviewIds and persist in localStorage
      setVotedReviewIds(prev => {
        const updated = [...prev, reviewId];
        localStorage.setItem('votedReviewIds', JSON.stringify(updated));
        return updated;
      });

      // Track user's vote type
      setUserVotes(prev => {
        const updated = { ...prev, [reviewId]: helpful };
        localStorage.setItem('userVotes', JSON.stringify(updated));
        return updated;
      });
      
      toast.success(helpful ? 'Marked as helpful!' : 'Marked as not helpful!');
    } catch (error) {
      console.error('Error voting on review:', error);
      toast.error('Failed to vote on review');
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            className={`text-sm ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Review Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{averageRating.toFixed(1)}</div>
              <div className="flex items-center justify-center mt-1">
                {renderStars(Math.round(averageRating))}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-600">Based on verified purchases</div>
            <div className="text-xs text-gray-500 mt-1">
              Only customers who received the product can leave reviews
            </div>
          </div>
        </div>
      </div>

      {/* Review Form */}
      <ReviewForm 
        productId={productId} 
        onReviewAdded={(newReview) => {
          // Add new review to the beginning of the list
          setReviews(prev => [newReview.review, ...prev]);
          setReviewCount(prev => prev + 1);
          
          // Recalculate average rating
          const newTotal = reviews.reduce((sum, review) => sum + review.rating, 0) + newReview.review.rating;
          const newAverage = newTotal / (reviews.length + 1);
          setAverageRating(Math.round(newAverage * 10) / 10);
        }}
      />
                
      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review._id} className="bg-white rounded-lg shadow-sm border p-6">
              {/* Review Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center">
                    {review.user?.name ? (
                      review.user.name.charAt(0).toUpperCase()
                    ) : (
                      <FaUser />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {review.user?.name || 'Anonymous User'}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      {renderStars(review.rating)}
                      <span>•</span>
                      <span>{formatDate(review.createdAt)}</span>
                      {review.verified && (
                        <>
                          <span>•</span>
                          <span className="flex items-center text-green-600">
                            <FaCheck className="text-xs mr-1" />
                            Verified Purchase
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Review Content */}
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
                <p className="text-gray-700 leading-relaxed">{review.comment}</p>
              </div>

              {/* Review Images */}
              {review.images && review.images.length > 0 && (
                <div className="mb-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {review.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image.url}
                          alt={image.caption || 'Review image'}
                          className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition"
                          onClick={() => window.open(image.url, '_blank')}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Helpful Votes */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-4">
                  {!votedReviewIds.includes(review._id) ? (
                    <>
                      <button
                        onClick={() => handleHelpfulVote(review._id, true)}
                        disabled={!user}
                        className={`flex items-center space-x-1 text-sm px-3 py-1 rounded-md transition-colors ${
                          !user 
                            ? 'text-gray-400 cursor-not-allowed' 
                            : 'text-gray-600 hover:text-green-600 hover:bg-green-50 cursor-pointer'
                        }`}
                        title={!user ? "Login to vote" : "Mark as helpful"}
                      >
                        <FaThumbsUp className="text-sm" />
                        <span>Helpful ({typeof review.helpfulCount === 'number' ? review.helpfulCount : 0})</span>
                      </button>
                      <button
                        onClick={() => handleHelpfulVote(review._id, false)}
                        disabled={!user}
                        className={`flex items-center space-x-1 text-sm px-3 py-1 rounded-md transition-colors ${
                          !user 
                            ? 'text-gray-400 cursor-not-allowed' 
                            : 'text-gray-600 hover:text-red-600 hover:bg-red-50 cursor-pointer'
                        }`}
                        title={!user ? "Login to vote" : "Mark as not helpful"}
                      >
                        <FaThumbsDown className="text-sm" />
                        <span>Not Helpful ({typeof review.notHelpfulCount === 'number' ? review.notHelpfulCount : 0})</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <div className={`flex items-center space-x-1 text-sm px-3 py-1 rounded-md ${
                        userVotes[review._id] === true ? 'text-green-600 bg-green-50' : 'text-gray-600'
                      }`}>
                        <FaThumbsUp className="text-sm" />
                        <span>Helpful ({typeof review.helpfulCount === 'number' ? review.helpfulCount : 0})</span>
                      </div>
                      <div className={`flex items-center space-x-1 text-sm px-3 py-1 rounded-md ${
                        userVotes[review._id] === false ? 'text-red-600 bg-red-50' : 'text-gray-600'
                      }`}>
                        <FaThumbsDown className="text-sm" />
                        <span>Not Helpful ({typeof review.notHelpfulCount === 'number' ? review.notHelpfulCount : 0})</span>
                      </div>
                    </>
                  )}
                </div>
                {votedReviewIds.includes(review._id) && (
                  <div className="text-xs text-gray-400">You already voted on this review</div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FaStar className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Reviews Yet</h3>
          <p className="text-gray-500">
            Be the first to review this product after receiving it!
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="join">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="join-item btn"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`join-item btn ${currentPage === page ? 'btn-active' : ''}`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="join-item btn"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewList; 