import { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  FaClock, FaFire, FaGavel, FaTrophy, FaCalendarAlt, 
  FaUsers, FaShieldAlt, FaBolt
} from 'react-icons/fa';
import AuctionCard from '../components/auctions/AuctionCard';

const Auction = () => {
  const [activeAuctions, setActiveAuctions] = useState([]);
  const [upcomingAuctions, setUpcomingAuctions] = useState([]);
  const [endingSoonAuctions, setEndingSoonAuctions] = useState([]);
  const [pastAuctions, setPastAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('live');


  useEffect(() => {
    fetchAuctionData();
  }, []);

  const fetchAuctionData = async () => {
    try {
      setLoading(true);

      // Fetch all auction products first
      console.log('Fetching auction products...');
      const allAuctionsRes = await api.get('/products?mode=auction&limit=100&isActive=true').catch((err) => {
        console.error('Error fetching auctions:', err);
        return { data: { products: [] } };
      });
      const allAuctions = allAuctionsRes.data.products || allAuctionsRes.data || [];

      console.log('🎯 All auctions fetched:', allAuctions.length);
      console.log('🎯 Full auctions data:', allAuctions);
      
      // Debug each auction
      allAuctions.forEach(a => {
        console.log(`Auction: ${a.name}`);
        console.log(`  - Mode: ${a.mode}`);
        console.log(`  - Is Active: ${a.isActive}`);
        console.log(`  - Auction Status: ${a.auction?.status}`);
        console.log(`  - Start Time: ${a.auction?.startTime}`);
      });

      const now = new Date();
      
      // Filter auctions by status
      const active = allAuctions.filter(auction => {
        if (!auction.auction) return false;
        const startTime = new Date(auction.auction.startTime);
        const endTime = new Date(auction.auction.endTime);
        return startTime <= now && endTime > now && auction.auction.status === 'active';
      });

      const upcoming = allAuctions.filter(auction => {
        if (!auction.auction) return false;
        const startTime = new Date(auction.auction.startTime);
        const isUpcoming = startTime > now && (auction.auction.status === 'scheduled' || auction.auction.status === 'pending-approval');
        
        // Debug logging
        if (auction.auction.status === 'scheduled') {
          console.log('Scheduled auction found:', {
            name: auction.name,
            status: auction.auction.status,
            startTime: startTime,
            now: now,
            isUpcoming: isUpcoming
          });
        }
        
        return isUpcoming;
      });

      const past = allAuctions.filter(auction => {
        if (!auction.auction) return false;
        const endTime = new Date(auction.auction.endTime);
        return endTime <= now && auction.auction.status === 'ended';
      });

      // Filter ending soon (within 24 hours)
      const endingSoon = active.filter(auction => {
        const endTime = new Date(auction.auction.endTime);
        const hoursLeft = (endTime - now) / (1000 * 60 * 60);
        return hoursLeft <= 24 && hoursLeft > 0;
      });

      console.log('Filtered auctions:', { active: active.length, upcoming: upcoming.length, past: past.length, endingSoon: endingSoon.length });

      setActiveAuctions(active);
      setUpcomingAuctions(upcoming);
      setPastAuctions(past);
      setEndingSoonAuctions(endingSoon);
    } catch (error) {
      console.error('Error fetching auction data:', error);
      setActiveAuctions([]);
      setUpcomingAuctions([]);
      setEndingSoonAuctions([]);
      setPastAuctions([]);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentAuctions = () => {
    switch (activeTab) {
      case 'live':
        return activeAuctions;
      case 'ending':
        return endingSoonAuctions;
      case 'upcoming':
        return upcomingAuctions;
      case 'past':
        return pastAuctions;
      default:
        return activeAuctions;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading auctions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-lg mb-3 sm:mb-4">
              <FaGavel className="text-xl sm:text-2xl text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Auctions</h1>
            <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">Discover and bid on exclusive items</p>
            
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-sm sm:max-w-2xl mx-auto sm:grid-cols-4">
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{activeAuctions.length}</div>
                <div className="text-xs sm:text-sm text-gray-600">Live Now</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-orange-600">{endingSoonAuctions.length}</div>
                <div className="text-xs sm:text-sm text-gray-600">Ending Soon</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-purple-600">{upcomingAuctions.length}</div>
                <div className="text-xs sm:text-sm text-gray-600">Upcoming</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-green-600">{pastAuctions.length}</div>
                <div className="text-xs sm:text-sm text-gray-600">Completed</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            {/* Mobile-friendly tabs */}
            <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setActiveTab('live')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm ${
                  activeTab === 'live'
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FaFire className="text-sm" />
                <span className="hidden sm:inline">Live</span>
                <span className="sm:hidden">🔥</span>
                ({activeAuctions.length})
              </button>
              
              <button
                onClick={() => setActiveTab('ending')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm ${
                  activeTab === 'ending'
                    ? 'bg-orange-100 text-orange-700 border border-orange-200'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FaClock className="text-sm" />
                <span className="hidden sm:inline">Ending Soon</span>
                <span className="sm:hidden">⏰</span>
                ({endingSoonAuctions.length})
              </button>
              
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm ${
                  activeTab === 'upcoming'
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FaCalendarAlt className="text-sm" />
                <span className="hidden sm:inline">Upcoming</span>
                <span className="sm:hidden">📅</span>
                ({upcomingAuctions.length})
              </button>
              
              <button
                onClick={() => setActiveTab('past')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm ${
                  activeTab === 'past'
                    ? 'bg-gray-100 text-gray-700 border border-gray-300'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FaTrophy className="text-sm" />
                <span className="hidden sm:inline">Past</span>
                <span className="sm:hidden">🏆</span>
                ({pastAuctions.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {getCurrentAuctions().length > 0 ? (
          <>
            {/* Section Header */}
            <div className="mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">
                {activeTab === 'live' && 'Live Auctions'}
                {activeTab === 'ending' && 'Ending Soon'}
                {activeTab === 'upcoming' && 'Upcoming Auctions'}
                {activeTab === 'past' && 'Past Auctions'}
              </h2>
              <p className="text-gray-600 text-sm sm:text-base">
                {activeTab === 'live' && 'Bid on items that are currently active'}
                {activeTab === 'ending' && 'Last chance to bid on these items'}
                {activeTab === 'upcoming' && 'Preview upcoming auction items'}
                {activeTab === 'past' && 'View completed auction results'}
              </p>
            </div>

            {/* Auction Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {getCurrentAuctions().map((auction) => (
                <AuctionCard 
                  key={auction._id} 
                  auction={auction} 
                  status={activeTab === 'ending' ? 'live' : activeTab}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12 sm:py-16">
            <FaClock className="text-3xl sm:text-4xl text-gray-300 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-600 mb-2">
              {activeTab === 'live' && 'No Live Auctions'}
              {activeTab === 'ending' && 'No Auctions Ending Soon'}
              {activeTab === 'upcoming' && 'No Upcoming Auctions'}
              {activeTab === 'past' && 'No Past Auctions'}
            </h3>
            <p className="text-gray-500 text-sm sm:text-base px-4">
              {activeTab === 'live' && 'Check back soon for new auctions'}
              {activeTab === 'ending' && 'All auctions have plenty of time left'}
              {activeTab === 'upcoming' && 'New auctions will be announced soon'}
              {activeTab === 'past' && 'Past auction history will appear here'}
            </p>
          </div>
        )}
      </div>

      {/* How It Works */}
      <div className="bg-white border-t border-gray-200 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">How It Works</h2>
            <p className="text-gray-600 text-sm sm:text-base">Simple steps to start bidding</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto mb-8 sm:mb-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-lg mb-3 sm:mb-4">
                <span className="text-white font-bold text-sm sm:text-base">1</span>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Browse Items</h3>
              <p className="text-gray-600 text-sm sm:text-base">Find items you're interested in and check their details</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-green-600 rounded-lg mb-3 sm:mb-4">
                <span className="text-white font-bold text-sm sm:text-base">2</span>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Place Bids</h3>
              <p className="text-gray-600 text-sm sm:text-base">Submit your bids and compete with other bidders</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-purple-600 rounded-lg mb-3 sm:mb-4">
                <span className="text-white font-bold text-sm sm:text-base">3</span>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Win & Pay</h3>
              <p className="text-gray-600 text-sm sm:text-base">Win the auction and complete your payment</p>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-2xl mx-auto">
            <div className="text-center bg-gray-50 rounded-lg p-3 sm:p-4">
              <FaShieldAlt className="text-xl sm:text-2xl text-blue-600 mx-auto mb-2" />
              <div className="font-medium text-gray-900 text-sm sm:text-base">Secure</div>
              <div className="text-xs sm:text-sm text-gray-600">Protected bidding</div>
            </div>
            <div className="text-center bg-gray-50 rounded-lg p-3 sm:p-4">
              <FaBolt className="text-xl sm:text-2xl text-green-600 mx-auto mb-2" />
              <div className="font-medium text-gray-900 text-sm sm:text-base">Fast</div>
              <div className="text-xs sm:text-sm text-gray-600">Quick delivery</div>
            </div>
            <div className="text-center bg-gray-50 rounded-lg p-3 sm:p-4">
              <FaUsers className="text-xl sm:text-2xl text-purple-600 mx-auto mb-2" />
              <div className="font-medium text-gray-900 text-sm sm:text-base">Trusted</div>
              <div className="text-xs sm:text-sm text-gray-600">Verified sellers</div>
            </div>
            <div className="text-center bg-gray-50 rounded-lg p-3 sm:p-4">
              <FaClock className="text-xl sm:text-2xl text-orange-600 mx-auto mb-2" />
              <div className="font-medium text-gray-900 text-sm sm:text-base">24/7</div>
              <div className="text-xs sm:text-sm text-gray-600">Always open</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auction;