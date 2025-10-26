import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiEye, FiClock, FiTrendingUp, FiPackage, FiAward } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { useSocket } from '../../contexts/SocketContext';

const ActiveAuctions = () => {
  const [auctions, setAuctions] = useState([]);
  const [auctionHistory, setAuctionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const { socket } = useSocket();

  useEffect(() => {
    console.log('ActiveAuctions component mounted');
    fetchAuctions();

    // Subscribe to real-time auction updates
    if (socket) {
      socket.on('bid-update', handleBidUpdate);
      socket.on('auction-ended', handleAuctionEnded);

      return () => {
        socket.off('bid-update', handleBidUpdate);
        socket.off('auction-ended', handleAuctionEnded);
      };
    }
  }, [socket]);

  const fetchAuctions = async () => {
    console.log('Fetching auctions...');
    try {
      const [activeRes, historyRes] = await Promise.all([
        api.get('/admin/auctions/active'),
        api.get('/admin/auctions/history')
      ]);

      console.log('Active auctions response:', activeRes.data);
      console.log('Auction history response:', historyRes.data);

      setAuctions(activeRes.data);
      setAuctionHistory(historyRes.data);
    } catch (error) {
      console.error('Error fetching auctions:', error);
      console.error('Error response:', error.response);
      toast.error('Failed to fetch auction data');
    } finally {
      setLoading(false);
    }
  };

  const handleBidUpdate = (data) => {
    setAuctions(prevAuctions =>
      prevAuctions.map(auction =>
        auction._id === data.productId
          ? { ...auction, auction: { ...auction.auction, currentBid: data.currentBid } }
          : auction
      )
    );
  };

  const handleAuctionEnded = (data) => {
    setAuctions(prevAuctions =>
      prevAuctions.filter(auction => auction._id !== data.productId)
    );
    fetchAuctions(); // Refresh to get updated history
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatTimeRemaining = (auction) => {
    const now = new Date();
    const startTime = new Date(auction.auction?.startTime);
    const endTime = new Date(auction.auction?.endTime);
    const status = auction.computedStatus || auction.auction?.status;

    // If auction hasn't started yet (upcoming)
    if (status === 'scheduled' && startTime > now) {
      const diff = startTime - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) return `Starts in ${days}d ${hours}h ${minutes}m`;
      if (hours > 0) return `Starts in ${hours}h ${minutes}m`;
      return `Starts in ${minutes}m`;
    }

    // If auction is active or ended
    const diff = endTime - now;
    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusBadge = (auction) => {
    const status = auction.computedStatus || auction.auction?.status;
    const now = new Date();
    const startTime = new Date(auction.auction?.startTime);
    const endTime = new Date(auction.auction?.endTime);

    const statusStyles = {
      scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
      active: 'bg-green-50 text-green-700 border-green-200',
      ended: 'bg-gray-50 text-gray-700 border-gray-200',
      cancelled: 'bg-red-50 text-red-700 border-red-200'
    };

    let displayStatus = status;
    let styleKey = status;

    if (status === 'scheduled' && startTime > now) {
      displayStatus = 'Upcoming';
      styleKey = 'scheduled';
    } else if (status === 'active' || (startTime <= now && endTime > now)) {
      displayStatus = 'Active';
      styleKey = 'active';
    } else if (status === 'ended' || endTime <= now) {
      displayStatus = 'Ended';
      styleKey = 'ended';
    } else if (status === 'cancelled') {
      displayStatus = 'Cancelled';
      styleKey = 'cancelled';
    }

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${statusStyles[styleKey] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
        {displayStatus}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Auction Management</h1>
            <p className="text-sm text-gray-500 mt-1">Monitor active auctions and view history</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">{auctions.length}</span>
            <span>Active</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg border border-gray-200 p-1">
          <div className="inline-flex bg-gray-100 rounded-lg p-1">
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'active'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('active')}
            >
              Active & Upcoming ({auctions.length})
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('history')}
            >
              History ({auctionHistory.length})
            </button>
          </div>
        </div>

        {/* Active Auctions Tab */}
        {activeTab === 'active' && (
          <div>
            {auctions.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <FiPackage className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900 mb-2">No Active Auctions</h2>
                <p className="text-sm text-gray-500">
                  There are currently no active or upcoming auctions.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {auctions.map((auction) => (
                  <div key={auction._id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    <img
                      src={auction.images[0]}
                      alt={auction.name}
                      className="w-full h-48 object-cover"
                    />

                    <div className="p-6">
                      <h2 className="text-lg font-bold text-gray-900 mb-2">{auction.name}</h2>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {auction.description}
                      </p>

                      {/* Current Bid Info */}
                      <div className="bg-green-50 border border-green-200 p-3 rounded-lg mb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-green-700">Current Bid</p>
                            <p className="text-xl font-bold text-green-900">${auction.auction.currentBid}</p>
                          </div>
                          <FiAward className="w-8 h-8 text-green-600" />
                        </div>
                      </div>

                      {/* Auction Details */}
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Starting Bid:</span>
                          <span className="font-semibold text-gray-900">${auction.auction.startingBid}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Total Bids:</span>
                          <span className="font-semibold text-gray-900">{auction.auction.totalBids}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Time Remaining:</span>
                          <span className={`font-semibold ${formatTimeRemaining(auction).includes('Ended')
                              ? 'text-red-600'
                              : formatTimeRemaining(auction).includes('Starts in')
                                ? 'text-blue-600'
                                : 'text-green-600'
                            }`}>
                            {formatTimeRemaining(auction)}
                          </span>
                        </div>
                      </div>

                      {/* Status and Actions */}
                      <div className="flex items-center justify-between">
                        {getStatusBadge(auction)}
                        <Link
                          to={`/admin/auctions/${auction._id}`}
                          className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                          title="View Details"
                        >
                          <FiEye className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Auction History Tab */}
        {activeTab === 'history' && (
          <div>
            {auctionHistory.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <div className="text-6xl mb-4">📜</div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">No Auction History</h2>
                <p className="text-gray-600">
                  No auctions have been completed yet.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Starting Bid</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Final Bid</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Bids</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Winner</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {auctionHistory.map((auction) => (
                        <tr key={auction._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <img
                                src={auction.images[0]}
                                alt={auction.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                              <div className="ml-3">
                                <div className="font-medium text-gray-900">{auction.name}</div>
                                <div className="text-sm text-gray-500">{auction.category}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${auction.auction.startingBid}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">${auction.auction.currentBid}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{auction.auction.totalBids}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {auction.auction.winner ? (
                              <div className="flex items-center">
                                <FiAward className="text-yellow-500 mr-2" />
                                <span className="text-gray-900">{auction.auction.winner.name}</span>
                              </div>
                            ) : (
                              <span className="text-gray-500">No winner</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatTime(auction.auction.endTime)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(auction)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <Link
                              to={`/admin/auctions/${auction._id}`}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <FiEye />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveAuctions; 