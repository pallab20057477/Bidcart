import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaGavel, FaTrophy, FaUsers, FaClock, FaHistory, FaUser, FaCalendar, FaTag, FaArrowLeft, FaCrown } from 'react-icons/fa';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { useSocket } from '../../contexts/SocketContext';

const AuctionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bids');
  const { socket } = useSocket();

  useEffect(() => {
    fetchAuctionDetails();

    if (socket) {
      socket.on('bid-update', handleBidUpdate);
      socket.on('auction-ended', handleAuctionEnded);

      return () => {
        socket.off('bid-update', handleBidUpdate);
        socket.off('auction-ended', handleAuctionEnded);
      };
    }
  }, [id, socket]);

  const fetchAuctionDetails = async () => {
    try {
      const [auctionRes, bidsRes] = await Promise.all([
        api.get(`/admin/auctions/${id}`),
        api.get(`/admin/auctions/${id}/bids`)
      ]);

      setAuction(auctionRes.data);
      setBids(bidsRes.data);
    } catch (error) {
      console.error('Error fetching auction details:', error);
      toast.error('Failed to fetch auction details');
    } finally {
      setLoading(false);
    }
  };

  const handleBidUpdate = (data) => {
    if (data.productId === id) {
      setAuction(prev => ({
        ...prev,
        auction: { ...prev.auction, currentBid: data.currentBid }
      }));
      fetchAuctionDetails();
    }
  };

  const handleAuctionEnded = (data) => {
    if (data.productId === id) {
      toast.success('Auction has ended!');
      fetchAuctionDetails();
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatTimeRemaining = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">Active</span>;
      case 'ended':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">Ended</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">Pending</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded">{status}</span>;
    }
  };

  const handleEndAuction = async () => {
    if (!window.confirm('Are you sure you want to end this auction? This action cannot be undone.')) {
      return;
    }

    try {
      await api.post(`/admin/auctions/${id}/end`);
      toast.success('Auction ended successfully');
      fetchAuctionDetails();
    } catch (error) {
      console.error('Error ending auction:', error);
      toast.error('Failed to end auction');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg shadow-sm border p-12">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Auction Not Found</h2>
          <button
            onClick={() => navigate('/admin/auctions/active')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Auctions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/auctions/active')}
            className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-flex items-center"
          >
            <FaArrowLeft className="mr-2" />
            Back to Auctions
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center">
                <FaGavel className="mr-2 text-blue-600" />
                {auction.name}
              </h1>
              <p className="text-gray-600">{auction.description}</p>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(auction.auction.status)}
              {auction.auction.status === 'active' && (
                <button
                  onClick={handleEndAuction}
                  className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                >
                  End Auction
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column - Product Info */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <img
                src={auction.images[0]}
                alt={auction.name}
                className="w-full h-96 object-cover"
              />

              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Product Details</h2>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center text-sm">
                    <FaTag className="mr-2 text-gray-400" />
                    <span className="text-gray-600">Category:</span>
                    <span className="ml-2 font-medium text-gray-900">{auction.category}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <FaUser className="mr-2 text-gray-400" />
                    <span className="text-gray-600">Vendor:</span>
                    <span className="ml-2 font-medium text-gray-900">{auction.seller?.name || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <FaCalendar className="mr-2 text-gray-400" />
                    <span className="text-gray-600">Start:</span>
                    <span className="ml-2 font-medium text-gray-900">{formatTime(auction.auction.startTime)}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <FaCalendar className="mr-2 text-gray-400" />
                    <span className="text-gray-600">End:</span>
                    <span className="ml-2 font-medium text-gray-900">{formatTime(auction.auction.endTime)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Auction Stats */}
          <div className="space-y-6">
            {/* Current Bid Card */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <FaTrophy className="text-4xl text-green-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-green-800 mb-2">Current Highest Bid</h3>
              <p className="text-3xl font-bold text-green-900">${auction.auction.currentBid}</p>
              {auction.auction.winner && (
                <p className="text-sm text-green-700 mt-2">
                  Winner: {auction.auction.winner.name}
                </p>
              )}
            </div>

            {/* Auction Stats */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Starting Bid:</span>
                  <span className="font-semibold text-gray-900">${auction.auction.startingBid}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Total Bids:</span>
                  <span className="font-semibold text-gray-900">{auction.auction.totalBids}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Unique Bidders:</span>
                  <span className="font-semibold text-gray-900">{new Set(bids.map(bid => bid.bidder._id)).size}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Time Remaining:</span>
                  <span className={`font-semibold ${formatTimeRemaining(auction.auction.endTime) === 'Ended'
                    ? 'text-red-600'
                    : 'text-green-600'
                    }`}>
                    {formatTimeRemaining(auction.auction.endTime)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex gap-8">
              <button
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${activeTab === 'bids'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                onClick={() => setActiveTab('bids')}
              >
                <FaHistory className="mr-2" />
                Bid History ({bids.length})
              </button>
              <button
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${activeTab === 'participants'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                onClick={() => setActiveTab('participants')}
              >
                <FaUsers className="mr-2" />
                Participants
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'bids' && (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Bid History</h3>
              {bids.length === 0 ? (
                <div className="text-center py-12">
                  <FaHistory className="text-4xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No bids placed yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bidder</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bids.map((bid, index) => (
                        <tr key={bid._id} className={`${index === 0 ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {index === 0 && <FaCrown className="text-yellow-500 mr-2" />}
                              <span className="text-sm font-medium text-gray-900">{bid.bidder.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">${bid.amount}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatTime(bid.placedAt)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {index === 0 ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">Winning</span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded">Outbid</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'participants' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Auction Participants</h3>
            {bids.length === 0 ? (
              <div className="text-center py-12">
                <FaUsers className="text-4xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No participants yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from(new Set(bids.map(bid => bid.bidder._id))).map(bidderId => {
                  const bidder = bids.find(bid => bid.bidder._id === bidderId).bidder;
                  const bidderBids = bids.filter(bid => bid.bidder._id === bidderId);
                  const highestBid = Math.max(...bidderBids.map(bid => bid.amount));
                  const isWinning = bidderBids.some(bid => bid.amount === auction.auction.currentBid);

                  return (
                    <div key={bidderId} className={`rounded-lg border p-4 ${isWinning ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{bidder.name}</h4>
                        {isWinning && <FaCrown className="text-yellow-500" />}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{bidder.email}</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Bids:</span>
                          <span className="font-medium text-gray-900">{bidderBids.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Highest:</span>
                          <span className="font-medium text-gray-900">${highestBid}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuctionDetail;
