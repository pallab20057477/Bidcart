import React from 'react';
import { FaCreditCard, FaCheck, FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const PaymentConfirmationToast = ({ notification, onClose, onView }) => {
  const navigate = useNavigate();

  const handleViewOrder = () => {
    if (notification.data?.orderId) {
      navigate(`/admin/orders/${notification.data.orderId}`);
      onClose();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="bg-green-100 p-2 rounded-full">
            <FaCreditCard className="text-green-600 w-4 h-4" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">Payment Received!</h4>
            <p className="text-xs text-gray-500">Just now</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-sm text-gray-700 mb-2">
          <strong>{notification.data?.customerName}</strong> paid{' '}
          <strong className="text-green-600">₹{notification.data?.amount}</strong>
        </p>
        
        <div className="text-xs text-gray-500">
          Order #{notification.data?.orderNumber}
        </div>
        
        {notification.data?.products && (
          <div className="text-xs text-gray-500 mt-1">
            {notification.data.products.length} item(s)
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        <button
          onClick={handleViewOrder}
          className="flex-1 bg-blue-600 text-white text-sm py-2 px-3 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
        >
          <FaEye className="w-3 h-3" />
          <span>View Order</span>
        </button>
        
        <button
          onClick={onClose}
          className="bg-gray-100 text-gray-700 text-sm py-2 px-3 rounded-md hover:bg-gray-200 transition-colors"
        >
          <FaCheck className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default PaymentConfirmationToast;