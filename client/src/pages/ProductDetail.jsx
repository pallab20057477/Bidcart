import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FaShoppingCart, FaHeart, FaShare, FaTruck, FaShieldAlt, FaUndo, FaStar } from 'react-icons/fa';
import BiddingInterface from '../components/auctions/BiddingInterface';
import ReviewList from '../components/ReviewList';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('description');
  const [auctionBids, setAuctionBids] = useState([]);
  const [loadingBids, setLoadingBids] = useState(false);

  const fetchAuctionBids = useCallback(async (productId) => {
    if (!productId) return;

    setLoadingBids(true);
    try {
      const response = await api.get(`/bids/product/${productId}`);
      setAuctionBids(response.data || []);
    } catch (error) {
      console.error('Error fetching auction bids:', error);
      setAuctionBids([]);
    } finally {
      setLoadingBids(false);
    }
  }, []);

  const fetchProduct = useCallback(async () => {
    try {
      const response = await api.get(`/products/${id}`);
      const productData = response.data;

      // Update URL immediately with product mode to prevent navbar flickering
      if (productData && productData.mode) {
        const currentUrl = new URL(window.location);
        const currentMode = currentUrl.searchParams.get('mode');

        if (currentMode !== productData.mode) {
          currentUrl.searchParams.set('mode', productData.mode);
          window.history.replaceState({}, '', currentUrl.toString());

          // Dispatch custom event to notify navbar of URL change
          // Use setTimeout to ensure the URL change is processed
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('urlUpdated'));
          }, 0);
        }
      }

      setProduct(productData);

      // Fetch related products from same category
      if (productData.category) {
        fetchRelatedProducts(productData.category, id);
      }

      // Fetch auction bids if it's an auction product
      if (productData.mode === 'auction') {
        fetchAuctionBids(productData._id);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Product not found');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, fetchAuctionBids]);

  const fetchRelatedProducts = async (category, currentProductId) => {
    try {
      console.log(`Fetching related products for category: ${category}, excluding product: ${currentProductId}`);

      // First try to get products from the same category
      let categoryProducts = [];
      try {
        const categoryResponse = await api.get(`/products`, {
          params: {
            category: category,
            limit: 8, // Get more to have options after filtering
            exclude: currentProductId
          }
        });

        // Handle different response structures
        if (categoryResponse.data.products) {
          categoryProducts = categoryResponse.data.products;
        } else if (Array.isArray(categoryResponse.data)) {
          categoryProducts = categoryResponse.data;
        }

        console.log('Category products found:', categoryProducts.length);
      } catch (categoryError) {
        console.log('Category-specific API failed, trying general products API');
      }

      // If no category-specific products, get all products and filter by category
      if (categoryProducts.length === 0) {
        try {
          const allProductsResponse = await api.get('/products');
          let allProducts = [];

          if (allProductsResponse.data.products) {
            allProducts = allProductsResponse.data.products;
          } else if (Array.isArray(allProductsResponse.data)) {
            allProducts = allProductsResponse.data;
          }

          // Filter by category and exclude current product
          categoryProducts = allProducts.filter(p =>
            p.category === category && p._id !== currentProductId
          );

          console.log('Filtered products by category from all products:', categoryProducts.length);
        } catch (allProductsError) {
          console.error('Failed to fetch all products:', allProductsError);
        }
      }

      // Remove current product if it somehow got included
      const filtered = categoryProducts
        .filter(p => p._id !== currentProductId)
        .slice(0, 4); // Limit to 4 products

      console.log('Final related products:', filtered);
      setRelatedProducts(filtered);

      // If still no products found, try to get any products as last resort
      if (filtered.length === 0) {
        console.log('No category products found, getting random products');
        try {
          const fallbackResponse = await api.get('/products?limit=4');
          const fallbackProducts = Array.isArray(fallbackResponse.data)
            ? fallbackResponse.data
            : fallbackResponse.data.products || [];

          const randomProducts = fallbackProducts
            .filter(p => p._id !== currentProductId)
            .slice(0, 4);

          setRelatedProducts(randomProducts);
          console.log('Fallback products set:', randomProducts.length);
        } catch (fallbackError) {
          console.error('Fallback fetch also failed:', fallbackError);
        }
      }
    } catch (error) {
      console.error('Error in fetchRelatedProducts:', error);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);



  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }

    if (product.stock < quantity) {
      toast.error('Not enough stock available');
      return;
    }

    addToCart({ ...product, quantity });
    toast.success(`Added ${quantity} item(s) to cart!`);
  };

  const handleWishlist = () => {
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      navigate('/login');
      return;
    }
    setIsWishlisted(!isWishlisted);
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
  };

  const handleShare = () => {
    setShowShareMenu(!showShareMenu);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
    setShowShareMenu(false);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const handleBidPlaced = (newBidAmount) => {
    setProduct(prev => ({
      ...prev,
      auction: {
        ...prev.auction,
        currentBid: newBidAmount
      }
    }));

    // Refresh bids to show the latest bid
    if (product._id) {
      fetchAuctionBids(product._id);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Product not found</h2>
        <button
          onClick={() => navigate('/products')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg"
        >
          Back to Products
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="mb-4 text-sm">
          <button
            onClick={() => navigate(product.mode === 'auction' ? '/auction' : '/products')}
            className="text-blue-600 hover:underline"
          >
            {product.mode === 'auction' ? 'Auctions' : 'Products'}
          </button>
          <span className="mx-2 text-gray-400">›</span>
          <span className="text-gray-600">{product.category}</span>
          <span className="mx-2 text-gray-400">›</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        {/* Product Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{product.name}</h1>
            <div className="flex gap-2">
              <button
                onClick={handleWishlist}
                className={`p-2 rounded-full border ${isWishlisted ? 'bg-red-50 border-red-200 text-red-600' : 'bg-gray-50 border-gray-200 text-gray-600'} hover:bg-red-50 hover:text-red-600 transition-colors`}
              >
                <FaHeart />
              </button>
              <div className="relative">
                <button
                  onClick={handleShare}
                  className="p-2 rounded-full border bg-gray-50 border-gray-200 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  <FaShare />
                </button>
                {showShareMenu && (
                  <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10">
                    <button
                      onClick={copyToClipboard}
                      className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                    >
                      Copy Link
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rating - Only show if ratings exist */}
          {((typeof product.rating === 'object' && product.rating?.count > 0) ||
            (typeof product.rating === 'number' && product.rating > 0) ||
            (product.reviewCount && product.reviewCount > 0)) && (
              <div className="flex items-center gap-2 mb-2">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => {
                    const rating = typeof product.rating === 'object' ? product.rating?.average : product.rating;
                    return (
                      <FaStar key={i} className={i < (rating || 0) ? 'text-yellow-400' : 'text-gray-300'} />
                    );
                  })}
                </div>
                <span className="text-sm text-gray-600">
                  {typeof product.rating === 'object'
                    ? `${product.rating?.average?.toFixed(1)} (${product.rating?.count} reviews)`
                    : `${product.rating?.toFixed(1)} (${product.reviewCount} reviews)`
                  }
                </span>
              </div>
            )}

          <p className="text-gray-600">{product.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div>
            {/* Main Image */}
            <div className="w-full h-80 bg-gray-100 rounded-lg overflow-hidden mb-4">
              <img
                src={product.images[activeImage]}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = '/api/placeholder/400/400';
                }}
              />
            </div>

            {/* Thumbnail Images */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(index)}
                    className={`flex-shrink-0 w-16 h-16 bg-gray-100 rounded overflow-hidden border-2 ${activeImage === index ? 'border-blue-500' : 'border-gray-200'
                      }`}
                  >
                    <img
                      src={image}
                      alt={`View ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Purchase Info */}
          <div className="space-y-6">
            {/* Auction Mode - Simple Display */}
            {product.mode === 'auction' ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Auction Item</h3>
                  <p className="text-gray-600 mb-4">
                    This is an auction item. Scroll down to view bidding details and place your bid.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <div className="text-xs font-semibold text-gray-600 uppercase mb-1">
                        Current Bid
                      </div>
                      <div className="text-xl font-bold text-green-600">
                        {formatPrice(product.auction?.currentBid || product.auction?.startingBid || product.price)}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <div className="text-xs font-semibold text-gray-600 uppercase mb-1">
                        Status
                      </div>
                      <div className={`text-sm font-bold ${product.auction?.status === 'active'
                        ? 'text-green-600'
                        : product.auction?.status === 'ended'
                          ? 'text-gray-600'
                          : 'text-blue-600'
                        }`}>
                        {product.auction?.status === 'active' ? '● LIVE' :
                          product.auction?.status === 'ended' ? 'ENDED' : 'SCHEDULED'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Regular Product Mode */
              <div>
                <div className="mb-4">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    ${product.price}
                  </div>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <div className="flex items-center gap-2">
                      <span className="text-lg text-gray-500 line-through">${product.originalPrice}</span>
                      <span className="bg-red-100 text-red-800 text-sm px-2 py-1 rounded">
                        Save ${(product.originalPrice - product.price).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
                {/* Stock Status */}
                <div className="mb-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${product.stock > 10 ? 'bg-green-100 text-green-800' :
                    product.stock > 0 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                    {product.stock === 0 ? 'Out of Stock' : `${product.stock} available`}
                  </span>
                </div>

                {/* Buy Now Section */}
                {product.stock > 0 && (
                  <div className="space-y-4">
                    {/* Quantity Selector */}
                    <div className="flex items-center gap-4">
                      <span className="font-medium">Qty:</span>
                      <div className="flex items-center border border-gray-300 rounded">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="px-3 py-1 hover:bg-gray-100"
                        >
                          -
                        </button>
                        <span className="px-4 py-1 border-x border-gray-300">{quantity}</span>
                        <button
                          onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                          className="px-3 py-1 hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <button
                        onClick={handleAddToCart}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
                      >
                        <FaShoppingCart />
                        Add to Cart - ${(product.price * quantity).toFixed(2)}
                      </button>

                      <button
                        onClick={() => {
                          handleAddToCart();
                          navigate('/checkout');
                        }}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Delivery & Services */}
            <div className="border-t pt-6 space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-3 text-sm">
                  <FaTruck className="text-green-600" />
                  <span className="text-gray-700">Free delivery by tomorrow</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <FaUndo className="text-blue-600" />
                  <span className="text-gray-700">30-day return policy</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <FaShieldAlt className="text-purple-600" />
                  <span className="text-gray-700">2-year warranty included</span>
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="border-t pt-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Category:</span>
                <span className="font-medium">{product.category}</span>
              </div>

              {product.brand && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Brand:</span>
                  <span className="font-medium">{product.brand}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-gray-600">Seller:</span>
                <span className="font-medium">{product.seller?.name || 'BidCart Store'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Auction Interface */}
      {product.mode === 'auction' && (
        <div className="max-w-4xl mx-auto px-4 mt-8">
          {/* Auction Header */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {product.auction?.status === 'ended' ? 'Auction Results' : 'Live Auction'}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {product.auction?.status === 'ended'
                      ? 'View the final results of this auction'
                      : 'Place your bid to win this item'
                    }
                  </p>
                </div>
                <div className={`px-4 py-2 rounded-lg font-semibold text-sm ${product.auction?.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : product.auction?.status === 'ended'
                    ? 'bg-gray-100 text-gray-700'
                    : 'bg-blue-100 text-blue-700'
                  }`}>
                  {product.auction?.status === 'active' ? '● LIVE' :
                    product.auction?.status === 'ended' ? 'ENDED' : 'SCHEDULED'}
                </div>
              </div>

              {/* Auction Status Message */}
              <div className={`rounded-lg p-4 ${product.auction?.status === 'active'
                ? 'bg-green-50 border border-green-200'
                : product.auction?.status === 'ended'
                  ? 'bg-gray-50 border border-gray-200'
                  : 'bg-blue-50 border border-blue-200'
                }`}>
                <p className={`font-medium ${product.auction?.status === 'active'
                  ? 'text-green-700'
                  : product.auction?.status === 'ended'
                    ? 'text-gray-700'
                    : 'text-blue-700'
                  }`}>
                  {product.auction?.status === 'active' ? '● Auction is currently active - Place your bid now' :
                    product.auction?.status === 'ended' ? 'This auction has concluded' : 'Auction will begin soon'
                  }
                </p>
              </div>


              {/* Winner Section */}
              {product.auction?.status === 'ended' && (
                <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center">
                      <span className="mr-2">🏆</span>
                      Auction Winner
                    </h3>
                  </div>

                  {product.auction?.winner ? (
                    <div className="bg-white rounded-lg p-4 border border-amber-200">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs font-semibold text-gray-600 uppercase mb-2">
                            Winner
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold">
                                {product.auction.winner.name?.charAt(0) || 'W'}
                              </span>
                            </div>
                            <div>
                              <div className="text-lg font-bold text-gray-900">
                                {product.auction.winner.name || 'Anonymous'}
                              </div>
                              <div className="text-sm text-gray-600">Winning Bidder</div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-semibold text-gray-600 uppercase mb-2">
                            Final Bid
                          </div>
                          <div className="text-3xl font-bold text-green-600">
                            {formatPrice(product.auction.currentBid || product.auction.startingBid)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {auctionBids.length} total bids
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-600">No bids were placed on this auction</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        {/* Bidding Interface - Only show if auction is active */}
                  {product.auction?.status === 'active' && (
                    <BiddingInterface
                      product={product}
                      onBidPlaced={handleBidPlaced}
                    />
                  )}<br/>
          {/* Bid History Section */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Bid History
                </h3>
                <div className="flex items-center gap-3">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                    {auctionBids.length} Bids
                  </span>
                  {auctionBids.length > 0 && (
                    <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-semibold">
                      {new Set(auctionBids.map(bid => bid.bidder?._id || bid.bidder?.id)).size} Bidders
                    </span>
                  )}
                </div>
              </div>

              {loadingBids ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading bid history...</span>
                </div>
              ) : auctionBids.length > 0 ? (
                <>
                  {/* Bid Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="text-xs font-semibold text-green-700 uppercase mb-1">
                        Winning Bid
                      </div>
                      <div className="text-2xl font-bold text-green-800">
                        ${Math.max(...auctionBids.map(bid => bid.amount)).toFixed(2)}
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="text-xs font-semibold text-blue-700 uppercase mb-1">
                        Starting Bid
                      </div>
                      <div className="text-2xl font-bold text-blue-800">
                        ${product.auction.startingBid}
                      </div>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="text-xs font-semibold text-purple-700 uppercase mb-1">
                        Increase
                      </div>
                      <div className="text-2xl font-bold text-purple-800">
                        {auctionBids.length > 0
                          ? `+${(((Math.max(...auctionBids.map(bid => bid.amount)) - product.auction.startingBid) / product.auction.startingBid) * 100).toFixed(1)}%`
                          : '0%'
                        }
                      </div>
                    </div>

                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="text-xs font-semibold text-orange-700 uppercase mb-1">
                        Avg Bid
                      </div>
                      <div className="text-2xl font-bold text-orange-800">
                        ${auctionBids.length > 0
                          ? (auctionBids.reduce((sum, bid) => sum + bid.amount, 0) / auctionBids.length).toFixed(2)
                          : '0.00'
                        }
                      </div>
                    </div>
                  </div>

                  {/* Bids List */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    <h4 className="text-base font-semibold text-gray-900 mb-3">
                      All Bids (Latest First)
                    </h4>

                    {auctionBids.map((bid, index) => {
                      const isWinning = index === 0;
                      const timeAgo = new Date() - new Date(bid.placedAt);
                      const minutesAgo = Math.floor(timeAgo / (1000 * 60));
                      const hoursAgo = Math.floor(timeAgo / (1000 * 60 * 60));
                      const daysAgo = Math.floor(timeAgo / (1000 * 60 * 60 * 24));

                      let timeDisplay;
                      if (minutesAgo < 1) timeDisplay = 'Just now';
                      else if (minutesAgo < 60) timeDisplay = `${minutesAgo}m ago`;
                      else if (hoursAgo < 24) timeDisplay = `${hoursAgo}h ago`;
                      else timeDisplay = `${daysAgo}d ago`;

                      return (
                        <div
                          key={bid._id}
                          className={`rounded-lg p-4 border ${isWinning
                            ? 'bg-green-50 border-green-300'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {/* Rank Badge */}
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isWinning
                                ? 'bg-amber-500 text-white'
                                : 'bg-gray-300 text-gray-700'
                                }`}>
                                {isWinning ? '👑' : `#${index + 1}`}
                              </div>

                              {/* Bidder Info */}
                              <div className="flex items-center space-x-2">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isWinning
                                  ? 'bg-green-600 text-white'
                                  : 'bg-blue-600 text-white'
                                  }`}>
                                  <span className="font-bold text-sm">
                                    {bid.bidder?.name?.charAt(0) || 'U'}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900 flex items-center">
                                    {bid.bidder?.name || 'Anonymous Bidder'}
                                    {isWinning && (
                                      <span className="ml-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                                        WINNER
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {timeDisplay}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Bid Amount */}
                            <div className="text-right">
                              <div className={`text-xl font-bold ${isWinning
                                ? 'text-green-700'
                                : 'text-gray-900'
                                }`}>
                                ${bid.amount.toFixed(2)}
                              </div>
                              {index > 0 && (
                                <div className="text-xs text-gray-500">
                                  +${(bid.amount - auctionBids[index - 1]?.amount || 0).toFixed(2)}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Additional Info */}
                          {bid.isAutoBid && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                                Auto Bid
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Auction Summary */}
                  <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="text-base font-semibold text-gray-900 mb-3">Important Dates</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Auction Start</div>
                        <div className="text-sm font-bold text-gray-900">
                          {new Date(product.auction.startTime).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-xs text-gray-600">
                          at {new Date(product.auction.startTime).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Auction End</div>
                        <div className="text-sm font-bold text-gray-900">
                          {new Date(product.auction.endTime).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-xs text-gray-600">
                          at {new Date(product.auction.endTime).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Duration</div>
                        <div className="text-sm font-bold text-gray-900">
                          {(() => {
                            const totalHours = Math.floor((new Date(product.auction.endTime) - new Date(product.auction.startTime)) / (1000 * 60 * 60));
                            const days = Math.floor(totalHours / 24);
                            const hours = totalHours % 24;

                            if (days === 0) {
                              return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
                            } else if (hours === 0) {
                              return `${days} ${days === 1 ? 'day' : 'days'}`;
                            } else {
                              return `${days} ${days === 1 ? 'day' : 'days'}, ${hours} ${hours === 1 ? 'hr' : 'hrs'}`;
                            }
                          })()}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Unique Bidders</div>
                        <div className="text-sm font-bold text-gray-900">
                          {new Set(auctionBids.map(bid => bid.bidder?._id)).size}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="text-5xl mb-3">📊</div>
                  <h4 className="text-lg font-semibold text-gray-700 mb-1">No Bids Yet</h4>
                  <p className="text-gray-500 text-sm">
                    {product.auction?.status === 'active'
                      ? 'Be the first to place a bid!'
                      : 'This auction concluded without any bids.'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>

          
        </div>
      )}

      {/* Product Details Tabs */}
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('description')}
                className={`py-2 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'description'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                Description
              </button>
              <button
                onClick={() => setActiveTab('specifications')}
                className={`py-2 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'specifications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                Specifications
              </button>
              <button
                onClick={() => setActiveTab('shipping')}
                className={`py-2 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'shipping'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                Shipping
              </button>
            </nav>
          </div>

          <div className="min-h-[200px]">
            {activeTab === 'description' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Product Description</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {product.description || 'This is a high-quality product designed to meet your needs. Made with premium materials and attention to detail.'}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Key Features</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Premium quality materials</li>
                    <li>Durable construction</li>
                    <li>Easy to use and maintain</li>
                    <li>Excellent value for money</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'specifications' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 mb-4">Product Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-gray-600">Brand:</span>
                      <span className="font-medium">{product.brand || 'BidCart'}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium">{product.category}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-gray-600">Weight:</span>
                      <span className="font-medium">{product.weight || '1.5 kg'}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-gray-600">Dimensions:</span>
                      <span className="font-medium">{product.dimensions || '30 x 20 x 10 cm'}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-gray-600">Material:</span>
                      <span className="font-medium">{product.material || 'High-quality plastic'}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-gray-600">Warranty:</span>
                      <span className="font-medium">2 years</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 mb-4">Shipping Information</h3>
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2">Free Shipping</h4>
                    <p className="text-green-700">Free delivery on orders over $50. Estimated delivery: 2-3 business days.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Delivery Options</h4>
                      <ul className="space-y-2 text-gray-700">
                        <li>• Standard Delivery (2-3 days): Free</li>
                        <li>• Express Delivery (1-2 days): $9.99</li>
                        <li>• Same Day Delivery: $19.99</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Return Policy</h4>
                      <ul className="space-y-2 text-gray-700">
                        <li>• 30-day return window</li>
                        <li>• Free returns on defective items</li>
                        <li>• Original packaging required</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Section - Only for regular products */}
      {product.mode !== 'auction' && (
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Customer Reviews</h2>
            {product._id ? (
              <ReviewList productId={product._id} />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Loading reviews...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auction Information Section - Only for auctions */}
      {product.mode === 'auction' && (
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="mr-3">ℹ️</span>
              Auction Information
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-2">📋 Auction Rules</h3>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• Each bid must exceed the current bid by the minimum increment</li>
                    <li>• Bidding ends automatically at the scheduled time</li>
                    <li>• The highest bidder wins the item</li>
                    <li>• All bids are final and binding</li>
                  </ul>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h3 className="font-semibold text-green-800 mb-2">🛡️ Buyer Protection</h3>
                  <ul className="text-green-700 text-sm space-y-1">
                    <li>• Secure payment processing</li>
                    <li>• Authenticity guarantee</li>
                    <li>• Safe shipping and handling</li>
                    <li>• Customer support available</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h3 className="font-semibold text-purple-800 mb-2">⏰ Important Dates</h3>
                  <div className="text-purple-700 text-sm space-y-2">
                    <div className="flex justify-between items-start">
                      <span>Auction Start:</span>
                      <span className="font-medium text-right">
                        {product.auction?.startTime ? (
                          <>
                            <div>{new Date(product.auction.startTime).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}</div>
                            <div className="text-xs">at {new Date(product.auction.startTime).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}</div>
                          </>
                        ) : 'TBD'}
                      </span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span>Auction End:</span>
                      <span className="font-medium text-right">
                        {product.auction?.endTime ? (
                          <>
                            <div>{new Date(product.auction.endTime).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}</div>
                            <div className="text-xs">at {new Date(product.auction.endTime).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}</div>
                          </>
                        ) : 'TBD'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-medium">
                        {product.auction?.startTime && product.auction?.endTime ? (() => {
                          const totalHours = Math.floor((new Date(product.auction.endTime) - new Date(product.auction.startTime)) / (1000 * 60 * 60));
                          const days = Math.floor(totalHours / 24);
                          const hours = totalHours % 24;

                          if (days === 0) {
                            return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
                          } else if (hours === 0) {
                            return `${days} ${days === 1 ? 'day' : 'days'}`;
                          } else {
                            return `${days} ${days === 1 ? 'day' : 'days'}, ${hours} ${hours === 1 ? 'hr' : 'hrs'}`;
                          }
                        })() : 'TBD'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <h3 className="font-semibold text-orange-800 mb-2">💡 Bidding Tips</h3>
                  <ul className="text-orange-700 text-sm space-y-1">
                    <li>• Set a maximum budget before bidding</li>
                    <li>• Monitor the auction closely near the end</li>
                    <li>• Consider using quick bid buttons</li>
                    <li>• Bid strategically, not emotionally</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Auction Disclaimer */}
            <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-gray-600 text-sm text-center">
                <strong>Note:</strong> This is an auction item. Unlike regular products, auction items are unique and sold to the highest bidder.
                Reviews are not available for auction items as each auction is a one-time event.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* You Might Also Like - Only show for regular products, not auctions */}
      {product.mode !== 'auction' && (
        <div className="max-w-4xl mx-auto px-4 mt-8 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">You Might Also Like</h2>
              {product.category && relatedProducts.length > 0 && (
                <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  More in {product.category}
                </span>
              )}
            </div>

            {relatedProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatedProducts.map((relatedProduct) => (
                  <div
                    key={relatedProduct._id}
                    className="border border-gray-200 rounded-lg p-3 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group"
                    onClick={() => {
                      navigate(`/products/${relatedProduct._id}`);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <div className="w-full h-32 bg-gray-100 rounded mb-2 overflow-hidden">
                      <img
                        src={relatedProduct.images?.[0] || '/api/placeholder/150/150'}
                        alt={relatedProduct.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          e.target.src = '/api/placeholder/150/150';
                        }}
                      />
                    </div>
                    <h4 className="font-medium text-sm text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {relatedProduct.name}
                    </h4>
                    <p className="text-blue-600 font-semibold text-sm mb-1">
                      ${relatedProduct.price}
                    </p>

                    {/* Category badge */}
                    {relatedProduct.category && (
                      <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                        {relatedProduct.category}
                      </span>
                    )}

                    {/* Only show rating if it exists */}
                    {((typeof relatedProduct.rating === 'object' && relatedProduct.rating?.count > 0) ||
                      (typeof relatedProduct.rating === 'number' && relatedProduct.rating > 0) ||
                      (relatedProduct.reviewCount && relatedProduct.reviewCount > 0)) && (
                        <div className="flex text-yellow-400 text-xs mt-1">
                          {[...Array(5)].map((_, i) => {
                            const rating = typeof relatedProduct.rating === 'object'
                              ? relatedProduct.rating?.average
                              : relatedProduct.rating;
                            return (
                              <FaStar
                                key={i}
                                className={i < (rating || 0) ? 'text-yellow-400' : 'text-gray-300'}
                              />
                            );
                          })}
                        </div>
                      )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-lg font-medium mb-2">No similar products found</p>
                <p className="text-sm">
                  {product.category
                    ? `No other products in "${product.category}" category`
                    : 'No related products available'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ProductDetail;