import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const AuctionScheduler = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    startTime: '',
    endTime: '',
    startingBid: '',
    minBidIncrement: 1
  });
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    active: 0,
    revenue: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      console.log('🔍 Fetching auction products from: /products?mode=auction&limit=100');
      
      const [productsRes, revenueRes] = await Promise.all([
        api.get('/products?mode=auction&limit=100'),
        api.get('/admin/dashboard/overview'),
      ]);
      
      console.log('✅ Products API response received');

      const auctionProducts = productsRes.data.products || [];
      
      console.log('📊 RAW API Response:', productsRes.data);
      console.log('📊 Auction products fetched:', auctionProducts.length);
      console.log('📊 Full products array:', auctionProducts);
      
      // Debug each product status
      auctionProducts.forEach(p => {
        const status = getAuctionStatus(p);
        console.log(`Product: ${p.name}`);
        console.log(`  - Computed Status: ${status}`);
        console.log(`  - Auction Status: ${p.auction?.status}`);
        console.log(`  - Is Active: ${p.isActive}`);
        console.log(`  - Approval Status: ${p.approvalStatus}`);
        console.log(`  - Start Time: ${p.auction?.startTime}`);
        console.log(`  - End Time: ${p.auction?.endTime}`);
      });
      
      setProducts(auctionProducts);

      const scheduled = auctionProducts.filter(p => getAuctionStatus(p) === 'scheduled').length;
      const active = auctionProducts.filter(p => getAuctionStatus(p) === 'active').length;

      console.log('📈 Stats:', { total: auctionProducts.length, scheduled, active });

      setStats({
        total: auctionProducts.length,
        scheduled,
        active,
        revenue: revenueRes.data?.revenue?.totalRevenue ?? 0
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch auction data');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleAuction = async (e) => {
    e.preventDefault();
    
    if (!selectedProduct) return;

    try {
      await api.post('/products/auctions/schedule', {
        productId: selectedProduct._id,
        ...scheduleData
      });

      toast.success('Auction scheduled successfully');
      setShowScheduleModal(false);
      setSelectedProduct(null);
      setScheduleData({
        startTime: '',
        endTime: '',
        startingBid: '',
        minBidIncrement: 1
      });
      fetchData();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to schedule auction';
      toast.error(message);
    }
  };

  const handleStartAuction = async (productId) => {
    try {
      await api.post(`/products/auctions/${productId}/start`);
      toast.success('Auction started');
      fetchData();
    } catch (error) {
      toast.error('Failed to start auction');
    }
  };

  const handleEndAuction = async (productId) => {
    try {
      await api.post(`/products/auctions/${productId}/end`);
      toast.success('Auction ended');
      fetchData();
    } catch (error) {
      toast.error('Failed to end auction');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAuctionStatus = (product) => {
    if (!product.auction) return 'not-scheduled';
    
    const now = new Date();
    const startTime = new Date(product.auction.startTime);
    const endTime = new Date(product.auction.endTime);

    if (product.auction.status === 'cancelled') return 'cancelled';
    if (product.auction.status === 'ended') return 'ended';
    if (startTime > now) return 'scheduled';
    if (endTime > now) return 'active';
    return 'ended';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Auction Scheduler</h1>
          <p className="text-sm text-gray-600 mt-1">Schedule and manage auctions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Total Auctions</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Scheduled</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.scheduled}</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Active</div>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Revenue</div>
            <div className="text-2xl font-bold text-gray-900">${stats.revenue.toLocaleString()}</div>
          </div>
        </div>

        {/* All Auction Products */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">All Auction Products</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => {
                  const status = getAuctionStatus(product);
                  return (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded border border-gray-200"
                          />
                          <div>
                            <div className="font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500">{formatPrice(product.price)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          status === 'active' ? 'bg-green-100 text-green-800' :
                          status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                          status === 'ended' ? 'bg-gray-100 text-gray-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {status === 'not-scheduled' ? 'Not Scheduled' : status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {product.auction && (
                          <div className="space-y-1">
                            {status === 'scheduled' && (
                              <div>Starts: {formatDate(product.auction.startTime)}</div>
                            )}
                            {status === 'active' && (
                              <>
                                <div>Current: {formatPrice(product.auction.currentBid)}</div>
                                <div className="text-gray-500">Bids: {product.auction.totalBids}</div>
                              </>
                            )}
                            {status === 'ended' && (
                              <div>Ended: {formatDate(product.auction.endTime)}</div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {status === 'scheduled' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setShowScheduleModal(true);
                                }}
                                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleStartAuction(product._id)}
                                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                              >
                                Start
                              </button>
                            </>
                          )}
                          
                          {status === 'active' && (
                            <button
                              onClick={() => handleEndAuction(product._id)}
                              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                            >
                              End
                            </button>
                          )}
                          
                          {(status === 'ended' || status === 'not-scheduled') && (
                            <button
                              onClick={() => {
                                setSelectedProduct(product);
                                setShowScheduleModal(true);
                              }}
                              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                              Schedule
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Schedule Modal */}
        {showScheduleModal && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Schedule Auction</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedProduct.name}</p>
              </div>
              
              <form onSubmit={handleScheduleAuction} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduleData.startTime}
                    onChange={(e) => setScheduleData(prev => ({ ...prev, startTime: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduleData.endTime}
                    onChange={(e) => setScheduleData(prev => ({ ...prev, endTime: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Starting Bid
                  </label>
                  <input
                    type="number"
                    value={scheduleData.startingBid}
                    onChange={(e) => setScheduleData(prev => ({ ...prev, startingBid: e.target.value }))}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Bid Increment
                  </label>
                  <input
                    type="number"
                    value={scheduleData.minBidIncrement}
                    onChange={(e) => setScheduleData(prev => ({ ...prev, minBidIncrement: e.target.value }))}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Schedule Auction
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuctionScheduler;
