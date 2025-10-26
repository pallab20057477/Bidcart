import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaClock, FaEye, FaCalendarAlt } from 'react-icons/fa';
import api from '../../utils/api';
import Countdown from 'react-countdown';
import { useSocket } from '../../contexts/SocketContext';

const UpcomingAuctions = () => {
  const [upcomingAuctions, setUpcomingAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    fetchUpcomingAuctions();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleAuctionScheduled = () => fetchUpcomingAuctions();
    const handleAuctionStarted = () => fetchUpcomingAuctions();
    socket.on('auction:scheduled', handleAuctionScheduled);
    socket.on('auction:started', handleAuctionStarted);
    return () => {
      socket.off('auction:scheduled', handleAuctionScheduled);
      socket.off('auction:started', handleAuctionStarted);
    };
  }, [socket]);

  const fetchUpcomingAuctions = async () => {
    try {
      // Try multiple endpoints to get upcoming auctions
      let response;
      try {
        response = await api.get('/products/auctions/upcoming');
      } catch (error) {
        // Fallback to general products endpoint
        response = await api.get('/products?mode=auction&approvalStatus=approved&limit=6');
        const allAuctions = response.data.products || response.data || [];
        const now = new Date();
        const upcoming = allAuctions.filter(auction => {
          if (!auction.auction) return false;
          const startTime = new Date(auction.auction.startTime);
          return startTime > now && (auction.auction.status === 'scheduled' || auction.auction.status === 'pending-approval');
        });
        response.data = upcoming;
      }
      setUpcomingAuctions(response.data || []);
    } catch (error) {
      console.error('Error fetching upcoming auctions:', error);
      setUpcomingAuctions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const CountdownRenderer = ({ days, hours, minutes, seconds, completed }) => {
    if (completed) {
      return <span className="text-green-600 font-medium">Starting Now!</span>;
    }

    return (
      <div className="flex gap-1 text-sm">
        {days > 0 && (
          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded font-medium">
            {days}d
          </span>
        )}
        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded font-medium">
          {hours.toString().padStart(2, '0')}h
        </span>
        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded font-medium">
          {minutes.toString().padStart(2, '0')}m
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (upcomingAuctions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center mb-4">
          <FaCalendarAlt className="mr-3 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Upcoming Auctions</h2>
        </div>
        <div className="text-center py-8">
          <FaClock className="mx-auto text-4xl text-gray-300 mb-3" />
          <p className="text-gray-500">No upcoming auctions at the moment.</p>
          <p className="text-gray-400 text-sm">Check back soon for new auctions!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FaCalendarAlt className="mr-3 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Upcoming Auctions</h2>
              <p className="text-gray-600 text-sm">Don't miss these exciting auctions</p>
            </div>
          </div>
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {upcomingAuctions.length} Scheduled
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {upcomingAuctions.map((auction) => (
            <div key={auction._id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative">
                <img
                  src={auction.images?.[0] || 'https://via.placeholder.com/300x200/f3f4f6/9ca3af?text=No+Image'}
                  alt={auction.name}
                  className="w-full h-40 object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x200/f3f4f6/9ca3af?text=No+Image';
                  }}
                />
                <div className="absolute top-2 left-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <FaClock className="mr-1" />
                    Scheduled
                  </span>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
                  {auction.name}
                </h3>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Starting Bid</span>
                    <span className="font-semibold text-green-600">
                      {formatPrice(auction.auction?.startingBid || 0)}
                    </span>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500 mb-2">Starts in</div>
                    <Countdown
                      date={new Date(auction.auction?.startTime)}
                      renderer={CountdownRenderer}
                    />
                  </div>

                  <div className="text-xs text-gray-500">
                    <div className="flex items-center">
                      <FaCalendarAlt className="mr-1" />
                      {formatDate(auction.auction?.startTime)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <span className="text-sm text-gray-500 truncate">
                      by {auction.seller?.name || 'Unknown'}
                    </span>
                    <Link
                      to={`/products/${auction._id}?mode=auction`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      <FaEye className="text-xs" />
                      View
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {upcomingAuctions.length > 0 && (
          <div className="text-center mt-6">
            <Link
              to="/auction"
              className="inline-flex items-center px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FaCalendarAlt className="mr-2" />
              View All Auctions
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingAuctions;
