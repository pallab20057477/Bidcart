import React from 'react';
import { FaFlag, FaClock, FaCheck, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const DisputeStatus = ({ dispute }) => {
  if (!dispute) return null;

  const getStatusConfig = (status) => {
    switch (status) {
      case 'open':
        return {
          icon: FaFlag,
          color: 'text-orange-600',
          bg: 'bg-orange-100',
          border: 'border-orange-300',
          label: 'Dispute Open'
        };
      case 'investigating':
        return {
          icon: FaClock,
          color: 'text-blue-600',
          bg: 'bg-blue-100',
          border: 'border-blue-300',
          label: 'Under Investigation'
        };
      case 'resolved':
        return {
          icon: FaCheck,
          color: 'text-green-600',
          bg: 'bg-green-100',
          border: 'border-green-300',
          label: 'Resolved'
        };
      case 'rejected':
        return {
          icon: FaTimes,
          color: 'text-red-600',
          bg: 'bg-red-100',
          border: 'border-red-300',
          label: 'Rejected'
        };
      default:
        return {
          icon: FaExclamationTriangle,
          color: 'text-gray-600',
          bg: 'bg-gray-100',
          border: 'border-gray-300',
          label: 'Dispute'
        };
    }
  };

  const config = getStatusConfig(dispute.status);
  const Icon = config.icon;

  return (
    <Link
      to={`/disputes/${dispute._id}`}
      className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md border transition-colors hover:opacity-80 ${config.color} ${config.bg} ${config.border}`}
    >
      <Icon className="w-4 h-4 mr-2" />
      {config.label}
    </Link>
  );
};

export default DisputeStatus;