import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { FaSearch, FaFilter, FaTimes } from 'react-icons/fa';

import ProductCard from '../components/products/ProductCard';

// Add CSS animation styles
const styles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fadeInUp {
    animation: fadeInUp 0.6s ease-out;
  }
  
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

const Products = ({ modeOverride }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    mode: modeOverride || searchParams.get('mode') || '', // Use modeOverride if provided
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: searchParams.get('sortOrder') || 'desc'
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  // Watch for URL parameter changes and update filters
  useEffect(() => {
    const newFilters = {
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || '',
      mode: modeOverride || searchParams.get('mode') || '', // Keep modeOverride if provided
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc'
    };
    setFilters(newFilters);
    setCurrentPage(1);
  }, [searchParams, modeOverride]);

  useEffect(() => {
    fetchProducts();
  }, [filters, currentPage]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/products/categories/list');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 12
      });

      // Only add non-empty filter values
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          params.set(key, value);
        }
      });

      const response = await api.get(`/products?${params}`);
      setProducts(response.data.products);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setCurrentPage(1);

    // Update URL params - only include non-empty values
    const newSearchParams = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== '') newSearchParams.set(key, value);
    });
    setSearchParams(newSearchParams);
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      category: '',
      mode: modeOverride || '', // Preserve modeOverride if provided
      minPrice: '',
      maxPrice: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    setFilters(clearedFilters);
    setCurrentPage(1);
    setSearchParams({}); // Clear all URL parameters
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Header Skeleton */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="h-8 w-48 bg-base-200 rounded mb-2 animate-pulse" />
            <div className="h-4 w-72 bg-base-200 rounded animate-pulse" />
          </div>
          <div className="flex flex-col md:flex-row gap-4 items-center w-full md:w-auto">
            <div className="h-10 w-full md:w-80 bg-base-200 rounded animate-pulse" />
            <div className="h-10 w-28 bg-base-200 rounded animate-pulse" />
          </div>
        </div>

        {/* Grid Skeleton */}
        <div className="w-full bg-base-100 rounded-2xl shadow-md p-6 md:p-8 mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="w-full aspect-[4/3] bg-base-200 rounded-xl animate-pulse" />
                <div className="h-5 w-3/4 bg-base-200 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-base-200 rounded animate-pulse" />
                <div className="h-10 w-full bg-base-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-primary mb-2 tracking-tight">
            {modeOverride === 'auction' ? 'Auction Products' : 'All Products'}
          </h1>
          <p className="text-gray-500 text-lg">
            {modeOverride === 'auction'
              ? 'Browse our latest auction products'
              : 'Browse our latest products and auctions'}
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-primary text-base shadow-sm"
            />
          </div>
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-outline btn-primary font-semibold"
          >
            <FaFilter className="mr-2" />
            Filters
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-base-200 p-6 rounded-2xl mb-10 shadow flex flex-col gap-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="select select-bordered w-full"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            {/* Mode Filter - Hide if modeOverride is provided */}
            {!modeOverride && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mode
                </label>
                <select
                  value={filters.mode}
                  onChange={(e) => handleFilterChange('mode', e.target.value)}
                  className="select select-bordered w-full"
                >
                  <option value="">All Modes</option>
                  <option value="buy-now">Buy Now</option>
                  <option value="auction">Auction</option>
                </select>
              </div>
            )}
            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Price
              </label>
              <input
                type="number"
                placeholder="Min price"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                className="input input-bordered w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Price
              </label>
              <input
                type="number"
                placeholder="Max price"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                className="input input-bordered w-full"
              />
            </div>
          </div>
          {/* Sort Options */}
          <div className="flex flex-wrap items-center gap-4 mt-2">
            <label className="block text-sm font-medium text-gray-700">
              Sort by:
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="select select-bordered"
            >
              <option value="createdAt">Date Added</option>
              <option value="price">Price</option>
              <option value="name">Name</option>
              <option value="views">Views</option>
            </select>
            <select
              value={filters.sortOrder}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
              className="select select-bordered"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
            <button
              onClick={clearFilters}
              className="btn btn-ghost btn-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Active Filters + Result Count */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div className="text-sm text-base-content/70">
          Showing <span className="font-semibold">{products.length}</span> result{products.length !== 1 ? 's' : ''}
          {filters.search && <> for "<span className="font-medium">{filters.search}</span>"</>}
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.category && (
            <span className="badge badge-outline gap-2">
              Category: {filters.category}
              <button
                type="button"
                aria-label="Clear category filter"
                onClick={() => handleFilterChange('category', '')}
                className="ml-1 hover:text-error"
              >
                <FaTimes />
              </button>
            </span>
          )}
          {!modeOverride && filters.mode && (
            <span className="badge badge-outline gap-2">
              Mode: {filters.mode}
              <button
                type="button"
                aria-label="Clear mode filter"
                onClick={() => handleFilterChange('mode', '')}
                className="ml-1 hover:text-error"
              >
                <FaTimes />
              </button>
            </span>
          )}
          {filters.minPrice && (
            <span className="badge badge-outline gap-2">
              Min: {filters.minPrice}
              <button
                type="button"
                aria-label="Clear min price filter"
                onClick={() => handleFilterChange('minPrice', '')}
                className="ml-1 hover:text-error"
              >
                <FaTimes />
              </button>
            </span>
          )}
          {filters.maxPrice && (
            <span className="badge badge-outline gap-2">
              Max: {filters.maxPrice}
              <button
                type="button"
                aria-label="Clear max price filter"
                onClick={() => handleFilterChange('maxPrice', '')}
                className="ml-1 hover:text-error"
              >
                <FaTimes />
              </button>
            </span>
          )}
          {(filters.category || (!modeOverride && filters.mode) || filters.minPrice || filters.maxPrice || filters.search) && (
            <button
              type="button"
              onClick={clearFilters}
              className="btn btn-ghost btn-xs"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Products Grid */}
      {products.length > 0 ? (
        <>
          <div className="mb-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {products.map((product, index) => (
                <div
                  key={product._id}
                  className="animate-fadeInUp"
                  style={{ 
                    animationDelay: `${index * 0.1}s`,
                    animationFillMode: 'both'
                  }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="join" role="navigation" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="join-item btn btn-outline"
                  aria-label="Previous page"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`join-item btn btn-outline ${currentPage === page ? 'btn-active' : ''}`}
                    aria-current={currentPage === page ? 'page' : undefined}
                    aria-label={`Page ${page}`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="join-item btn btn-outline"
                  aria-label="Next page"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <FaSearch className="text-7xl text-gray-300 mb-6" />
          <h3 className="text-2xl font-semibold text-gray-700 mb-2">No products found</h3>
          <p className="text-gray-500 mb-6">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  );
};

export default Products;