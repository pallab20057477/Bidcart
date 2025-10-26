import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaGavel, FaShoppingCart, FaStar, FaEye, FaCheck } from 'react-icons/fa';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/login', { state: { from: `/products/${product._id}` } });
      return;
    }

    if (isAdding || justAdded) return;

    setIsAdding(true);
    
    try {
      await addToCart(product);
      setJustAdded(true);
      toast.success(`${product.name} added to cart!`, {
        icon: '🛒',
        duration: 2000,
      });
      
      // Reset the "just added" state after 2 seconds
      setTimeout(() => {
        setJustAdded(false);
      }, 2000);
    } catch (error) {
      toast.error('Failed to add to cart');
    } finally {
      setIsAdding(false);
    }
  };



  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getCurrentPrice = () => {
    if (product.mode === 'auction') {
      return product.auction?.currentBid || product.auction?.startingBid || product.price;
    }
    return product.price;
  };

  const isAuctionActive = () => {
    return product.mode === 'auction' && product.auction?.status === 'active';
  };



  const imageUrl = product.images?.[0] || '/api/placeholder/300/300';
  const outOfStock = product.mode === 'buy-now' && product.stock <= 0;
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  return (
    <Link to={`/products/${product._id}`} className="group block">
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 transform hover:-translate-y-1">
        {/* Product Image */}
        <div className="relative overflow-hidden bg-gray-100 h-64">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
            loading="lazy"
            onError={(e) => {
              e.target.src = '/api/placeholder/300/300';
            }}
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.mode === 'auction' ? (
              <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                <FaGavel className="text-xs" />
                Live Auction
              </span>
            ) : (
              <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                <FaShoppingCart className="text-xs" />
                Buy Now
              </span>
            )}
            
            {hasDiscount && (
              <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                Sale
              </span>
            )}
          </div>





          {/* Out of Stock Overlay */}
          {outOfStock && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="bg-white px-4 py-2 rounded-full">
                <span className="text-gray-900 font-bold text-sm">Out of Stock</span>
              </div>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-5">
          {/* Category */}
          {product.category && (
            <span className="inline-block text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full mb-2">
              {product.category}
            </span>
          )}

          {/* Product Name */}
          <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 text-lg group-hover:text-blue-600 transition-colors" title={product.name}>
            {product.name}
          </h3>

          {/* Rating - Only show for buy-now products */}
          {product.mode === 'buy-now' && (
            <div className="flex items-center gap-1 mb-3 h-5">
              {((typeof product.rating === 'object' && product.rating?.count > 0) || 
                (typeof product.rating === 'number' && product.rating > 0) || 
                (product.reviewCount && product.reviewCount > 0)) ? (
                <>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => {
                      const rating = typeof product.rating === 'object' ? product.rating?.average : product.rating;
                      return (
                        <FaStar 
                          key={i} 
                          className={`text-xs ${i < Math.floor(rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`} 
                        />
                      );
                    })}
                  </div>
                  <span className="text-xs text-gray-500 ml-1">
                    ({typeof product.rating === 'object' 
                      ? product.rating?.count || 0
                      : product.reviewCount || 0})
                  </span>
                </>
              ) : (
                <span className="text-xs text-gray-400">No reviews yet</span>
              )}
            </div>
          )}

          {/* Price */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl font-bold text-gray-900">
                {formatPrice(getCurrentPrice())}
              </span>
              {hasDiscount && (
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
            
            {product.mode === 'auction' && (
              <p className="text-xs text-gray-600">
                {product.auction?.currentBid ? 'Current bid' : 'Starting bid'}
              </p>
            )}
          </div>

          {/* Stock Info - Always show container to maintain consistent height */}
          <div className="mb-4 min-h-[40px]">
            {product.mode === 'buy-now' && product.stock > 0 && (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Stock</span>
                  <span className={`font-medium ${
                    product.stock > 10 ? 'text-green-600' : 
                    product.stock > 5 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {product.stock > 10 ? '10+' : product.stock} left
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div 
                    className={`h-1.5 rounded-full ${
                      product.stock > 10 ? 'bg-green-500' : 
                      product.stock > 5 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min((product.stock / 20) * 100, 100)}%` }}
                  ></div>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {/* Always show View Details button */}
            <Link
              to={`/products/${product._id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm"
            >
              <FaEye className="text-xs" />
              View Details
            </Link>

            {product.mode === 'buy-now' && product.stock > 0 && (
              <button
                onClick={handleAddToCart}
                disabled={isAdding || justAdded}
                className={`flex-1 py-2.5 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl text-sm ${
                  justAdded
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                } ${isAdding ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isAdding ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Adding...
                  </>
                ) : justAdded ? (
                  <>
                    <FaCheck className="text-xs animate-bounce" />
                    Added!
                  </>
                ) : (
                  <>
                    <FaShoppingCart className="text-xs" />
                    Add to Cart
                  </>
                )}
              </button>
            )}

            {product.mode === 'auction' && isAuctionActive() && (
              <Link
                to={`/products/${product._id}`}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white py-2.5 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl text-sm"
              >
                <FaGavel className="text-xs" />
                Place Bid
              </Link>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard; 