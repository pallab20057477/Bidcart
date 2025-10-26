import React, { useState } from 'react';
import { FaExclamationTriangle, FaFlag, FaTimes, FaPaperPlane } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';

const DisputeButton = ({ order, onDisputeCreated }) => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [disputeData, setDisputeData] = useState({
    reason: '',
    description: '',
    category: 'product_issue'
  });
  const navigate = useNavigate();

  const disputeReasons = [
    { value: 'product_issue', label: 'Product Quality Issue', icon: '📦' },
    { value: 'not_received', label: 'Order Not Received', icon: '🚚' },
    { value: 'wrong_item', label: 'Wrong Item Delivered', icon: '🔄' },
    { value: 'damaged', label: 'Item Damaged/Broken', icon: '💔' },
    { value: 'not_as_described', label: 'Not as Described', icon: '📝' },
    { value: 'refund_issue', label: 'Refund/Return Issue', icon: '💰' },
    { value: 'delivery_issue', label: 'Delivery Problem', icon: '🚛' },
    { value: 'other', label: 'Other Issue', icon: '❓' }
  ];

  // Check if dispute can be created
  const canCreateDispute = () => {
    // Can create dispute if:
    // 1. Order is delivered or completed
    // 2. Payment is completed
    // 3. Order is not too old (within 30 days)
    const orderDate = new Date(order.createdAt);
    const daysSinceOrder = (new Date() - orderDate) / (1000 * 60 * 60 * 24);
    
    return (
      ['delivered', 'completed'].includes(order.status) &&
      order.paymentStatus === 'completed' &&
      daysSinceOrder <= 30
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!disputeData.reason || !disputeData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/disputes', {
        orderId: order._id,
        reason: disputeData.reason,
        description: disputeData.description,
        category: disputeData.category
      });

      if (response.data.success) {
        toast.success('Dispute created successfully');
        setShowModal(false);
        if (onDisputeCreated) {
          onDisputeCreated(response.data.dispute);
        }
        // Navigate to dispute details
        navigate(`/disputes/${response.data.dispute._id}`);
      }
    } catch (error) {
      console.error('Error creating dispute:', error);
      toast.error(error.response?.data?.message || 'Failed to create dispute');
    } finally {
      setLoading(false);
    }
  };

  const selectedReason = disputeReasons.find(r => r.value === disputeData.reason);

  if (!canCreateDispute()) {
    return null; // Don't show dispute button if conditions aren't met
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center px-3 py-2 text-sm font-medium text-orange-700 bg-orange-100 border border-orange-300 rounded-md hover:bg-orange-200 transition-colors"
      >
        <FaFlag className="w-4 h-4 mr-2" />
        Report Issue
      </button>

      {/* Dispute Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="bg-orange-100 p-2 rounded-full">
                  <FaExclamationTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Report an Issue</h3>
                  <p className="text-sm text-gray-600">Order #{order._id.slice(-8)}</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Order Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Order Date:</span>
                    <span className="ml-2 font-medium">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className="ml-2 font-medium capitalize">{order.status}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="ml-2 font-medium">₹{order.totalAmount}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Items:</span>
                    <span className="ml-2 font-medium">{order.products?.length || 0}</span>
                  </div>
                </div>
              </div>

              {/* Issue Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  What type of issue are you experiencing? *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {disputeReasons.map((reason) => (
                    <label
                      key={reason.value}
                      className={`relative flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        disputeData.reason === reason.value
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={reason.value}
                        checked={disputeData.reason === reason.value}
                        onChange={(e) => setDisputeData({ ...disputeData, reason: e.target.value })}
                        className="sr-only"
                      />
                      <span className="text-lg mr-3">{reason.icon}</span>
                      <span className="text-sm font-medium text-gray-900">{reason.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Please describe the issue in detail *
                </label>
                <textarea
                  value={disputeData.description}
                  onChange={(e) => setDisputeData({ ...disputeData, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Provide as much detail as possible about the issue you're experiencing..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Include specific details, dates, and any relevant information that will help us resolve your issue.
                </p>
              </div>

              {/* Guidelines */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="font-medium text-blue-900 mb-2">Dispute Guidelines</h5>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Provide accurate and detailed information</li>
                  <li>• Upload photos if applicable (coming soon)</li>
                  <li>• Our team will review within 24-48 hours</li>
                  <li>• You'll receive updates via email and notifications</li>
                  <li>• False disputes may result in account restrictions</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !disputeData.reason || !disputeData.description.trim()}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane className="w-4 h-4 mr-2" />
                      Submit Dispute
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default DisputeButton;