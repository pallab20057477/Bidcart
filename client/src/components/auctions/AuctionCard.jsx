import React from 'react';
import { Link } from 'react-router-dom';
import { FaGavel, FaClock, FaUser, FaEye } from 'react-icons/fa';
import Countdown from 'react-countdown';

const AuctionCard = ({ auction, status = 'live' }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getTimeRemaining = () => {
    const now = new Date();
    const endTime = new Date(auction.auction?.endTime);
    const startTime = new Date(auction.auction?.startTime);
    
    if (status === 'upcoming') {
      return startTime;
    }
    return endTime;
  };

  const isEndingSoon = () => {
    if (status !== 'live') return false;
    const now = new Date();
    const endTime = new Date(auction.auction?.endTime);
    const hoursLeft = (endTime - now) / (1000 * 60 * 60);
    return hoursLeft <= 24 && hoursLeft > 0;
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'live':
        return isEndingSoon() ? (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            <FaClock className="mr-1" />
            Ending Soon
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
            Live
          </span>
        );
      case 'upcoming':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <FaClock className="mr-1" />
            Upcoming
          </span>
        );
      case 'past':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Ended
          </span>
        );
      default:
        return null;
    }
  };

  const CountdownRenderer = ({ days, hours, minutes, seconds, completed }) => {
    if (completed) {
      return status === 'upcoming' ? (
        <span className="text-green-600 font-medium text-sm">Starting Now!</span>
      ) : (
        <span className="text-red-600 font-medium text-sm">Auction Ended</span>
      );
    }

    return (
      <div className="flex gap-1 text-xs">
        {days > 0 && (
          <span className="bg-gray-800 text-white px-1.5 py-0.5 rounded font-mono">
            {days}d
          </span>
        )}
        <span className="bg-gray-800 text-white px-1.5 py-0.5 rounded font-mono">
          {hours.toString().padStart(2, '0')}h
        </span>
        <span className="bg-gray-800 text-white px-1.5 py-0.5 rounded font-mono">
          {minutes.toString().padStart(2, '0')}m
        </span>
      </div>
    );
  };

  return (
    <Link 
      to={`/products/${auction._id}?mode=auction`}
      className="block bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden"
    >
      {/* Image Section */}
      <div className="relative">
        <img
          src={auction.images?.[0] || 'https://via.placeholder.com/300x200/f3f4f6/9ca3af?text=No+Image'}
          alt={auction.name}
          className="w-full h-48 object-cover"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/300x200/f3f4f6/9ca3af?text=No+Image';
          }}
        />
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          {getStatusBadge()}
        </div>

        {/* Countdown Overlay */}
        {(status === 'live' || status === 'upcoming') && (
          <div className="absolute bottom-3 right-3">
            <div className="bg-black bg-opacity-75 rounded-lg px-2 py-1">
              <Countdown
                date={getTimeRemaining()}
                renderer={CountdownRenderer}
              />
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight">
          {auction.name}
        </h3>

        {/* Auction Info */}
        <div className="space-y-3">
          {/* Current/Starting Bid */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">
              {status === 'upcoming' ? 'Starting Bid' : 'Current Bid'}
            </span>
            <span className="font-bold text-lg text-green-600">
              {formatPrice(auction.auction?.currentBid || auction.auction?.startingBid || 0)}
            </span>
          </div>

          {/* Bid Count & Seller */}
          <div className="flex justify-between items-center text-sm text-gray-500">
            <div className="flex items-center">
              <FaGavel className="mr-1" />
              <span>{auction.auction?.totalBids || 0} bids</span>
            </div>
            <div className="flex items-center">
              <FaUser className="mr-1" />
              <span className="truncate max-w-20">
                {auction.seller?.name || 'Unknown'}
              </span>
            </div>
          </div>

          {/* Time Info */}
          {status !== 'past' && (
            <div className="text-xs text-gray-500">
              {status === 'upcoming' ? 'Starts' : 'Ends'}: {' '}
              {new Date(
                status === 'upcoming' 
                  ? auction.auction?.startTime 
                  : auction.auction?.endTime
              ).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          )}

          {/* Winner Info for Past Auctions */}
          {status === 'past' && auction.auction?.winner && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
              <div className="text-xs text-yellow-800">
                <div className="font-medium">Winner: {auction.auction.winner.name}</div>
                <div>Final Bid: {formatPrice(auction.auction.currentBid)}</div>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-4">
          <div className="flex items-center justify-center w-full py-2 px-3 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <FaEye className="mr-2" />
            {status === 'live' ? 'Bid Now' : 
             status === 'upcoming' ? 'View Details' : 
             'View Results'}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default AuctionCard;