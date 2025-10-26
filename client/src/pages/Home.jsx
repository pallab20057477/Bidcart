import React, { useState, useEffect, lazy } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { FaGavel, FaShoppingCart, FaClock, FaStar, FaBullhorn, FaUser } from 'react-icons/fa';

// Lazy load components that are not immediately visible
const ProductCard = lazy(() => import('../components/products/ProductCard'));
const UpcomingAuctions = lazy(() => import('../components/auctions/UpcomingAuctions'));

const Home = () => {
  const [, setFeaturedProducts] = useState([]);
  const [activeAuctions, setActiveAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [features, setFeatures] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featuredRes, auctionsRes] = await Promise.all([
          api.get('/products/featured/featured').catch(() => ({ data: [] })),
          api.get('/products?mode=auction&approvalStatus=approved&limit=6').catch(() => ({ data: { products: [] } }))
        ]);

        setFeaturedProducts(featuredRes.data);
        
        // Filter active auctions from all auction products
        const allAuctions = auctionsRes.data.products || auctionsRes.data || [];
        const now = new Date();
        const active = allAuctions.filter(auction => {
          if (!auction.auction) return false;
          const startTime = new Date(auction.auction.startTime);
          const endTime = new Date(auction.auction.endTime);
          return startTime <= now && endTime > now && auction.auction.status === 'active';
        });
        
        setActiveAuctions(active);
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const res = await api.get('/features');
        setFeatures(res.data);
      } catch (error) {
        setFeatures([]);
      }
    };
    fetchFeatures();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50" role="alert" aria-busy="true" aria-live="polite">
        <div className="loading-spinner animate-spin border-4 border-blue-500 border-t-transparent rounded-full w-12 h-12" aria-label="Loading"></div>
      </div>
    );
  }

  return (
    <main className="bg-gray-50" role="main">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700" aria-label="Hero section">
        {/* Simple background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-[80vh] px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-4xl mx-auto">
            {/* Main heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Welcome to <span className="text-yellow-300">BidCart</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl sm:text-2xl text-blue-100 mb-12 max-w-2xl mx-auto">
              Your trusted marketplace for live auctions and instant shopping
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link
                to="/products"
                className="px-8 py-4 bg-white text-blue-600 font-semibold text-lg rounded-lg shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all duration-200 min-w-[200px]"
              >
                <span className="flex items-center justify-center gap-2">
                  <FaShoppingCart />
                  Start Shopping
                </span>
              </Link>

              <Link
                to="/auction"
                className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold text-lg rounded-lg hover:bg-white/10 transition-all duration-200 min-w-[200px]"
              >
                <span className="flex items-center justify-center gap-2">
                  <FaGavel />
                  Live Auctions
                </span>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">1000+</div>
                <div className="text-blue-200 text-sm">Products</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">500+</div>
                <div className="text-blue-200 text-sm">Customers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">24/7</div>
                <div className="text-blue-200 text-sm">Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Announcements Section */}
      {features.length > 0 && (
        <section className="py-16 bg-white" aria-labelledby="announcements-title">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 id="announcements-title" className="text-4xl font-black mb-4 text-gray-900 flex items-center justify-center gap-3">
                <FaBullhorn className="text-indigo-600" aria-hidden="true" />
                Latest Announcements
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Stay updated with the latest news and features from BidCart
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {features.map(feature => (
                <article
                  key={feature._id}
                  className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 overflow-hidden"
                  aria-labelledby={`feature-title-${feature._id}`}
                >
                  <div className="border-l-4 border-indigo-500 pl-6">
                    <h3 id={`feature-title-${feature._id}`} className="text-2xl font-bold mb-3 text-gray-900">{feature.title}</h3>
                    <p className="mb-4 text-gray-700 leading-relaxed">{feature.description}</p>
                    <time className="text-sm text-gray-500 font-medium" dateTime={new Date(feature.date).toISOString()}>
                      {new Date(feature.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </time>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16 bg-white" aria-labelledby="why-choose-title">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <header className="text-center mb-12">
            <h2 id="why-choose-title" className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Choose BidCart?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Experience the future of online shopping
            </p>
          </header>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <article className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow duration-200">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg mb-4">
                  <FaGavel className="text-3xl text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Live Auctions
                </h3>
                <p className="text-gray-600">
                  Experience real-time bidding with instant updates and live competition.
                </p>
              </div>
            </article>

            <article className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow duration-200">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-lg mb-4">
                  <FaShoppingCart className="text-3xl text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Instant Purchase
                </h3>
                <p className="text-gray-600">
                  Buy immediately with our secure, lightning-fast checkout system.
                </p>
              </div>
            </article>

            <article className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow duration-200">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-lg mb-4">
                  <FaStar className="text-3xl text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Premium Quality
                </h3>
                <p className="text-gray-600">
                  Curated products from verified sellers with guaranteed authenticity.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Upcoming Auctions Section */}
      <section className="py-16 bg-gray-100" aria-label="Upcoming Auctions">
        <div className="container mx-auto px-6">
          <UpcomingAuctions />
        </div>
      </section>

      {/* Active Auctions Section */}
      <section className="py-16 bg-white border-t border-gray-200" aria-labelledby="active-auctions-title">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 id="active-auctions-title" className="text-3xl font-bold text-gray-900 mb-2">
                Live Auctions
              </h2>
              <p className="text-gray-600">Bid on exclusive items now</p>
            </div>
            <Link 
              to="/auction" 
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              View All Auctions
            </Link>
          </div>
          {activeAuctions.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {activeAuctions.slice(0, 8).map((product) => (
                <React.Suspense
                  key={product._id}
                  fallback={
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden h-full animate-pulse">
                      <div className="bg-gray-200 h-48 w-full"></div>
                      <div className="p-4">
                        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  }
                >
                  <ProductCard product={product} />
                </React.Suspense>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
              <FaClock className="text-5xl text-gray-300 mx-auto mb-4" aria-hidden="true" />
              <p className="text-gray-600 text-lg">No active auctions at the moment</p>
              <p className="text-gray-500 text-sm mt-2">Check back soon for exciting new auctions</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700" aria-label="Call to action">
        <div className="container mx-auto px-6 text-center text-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Ready to Start Shopping?
            </h2>

            <p className="mb-10 text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
              Join thousands of smart shoppers who've discovered the perfect blend of auctions and instant purchases
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link
                to="/products"
                className="px-8 py-4 bg-white text-blue-600 font-semibold text-lg rounded-lg hover:bg-gray-50 transition-colors min-w-[200px]"
              >
                <span className="flex items-center justify-center gap-2">
                  <FaShoppingCart />
                  Explore Products
                </span>
              </Link>

              <Link
                to="/register"
                className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold text-lg rounded-lg hover:bg-white/10 transition-colors min-w-[200px]"
              >
                <span className="flex items-center justify-center gap-2">
                  <FaUser />
                  Join Free Today
                </span>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold">100%</div>
                <div className="text-sm text-blue-200">Secure</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">24/7</div>
                <div className="text-sm text-blue-200">Support</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">Fast</div>
                <div className="text-sm text-blue-200">Shipping</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">Easy</div>
                <div className="text-sm text-blue-200">Returns</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
