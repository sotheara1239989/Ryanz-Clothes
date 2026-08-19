import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Filter, 
  SlidersHorizontal, 
  Search, 
  X, 
  RotateCcw, 
  Check, 
  Layers, 
  Sparkles, 
  Flame, 
  Clock 
} from 'lucide-react';
import { listenToProducts } from '../services/productService';
import { listenToCategories } from '../services/categoryService';
import ProductCard from '../components/common/ProductCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

export const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedFilterTab, setSelectedFilterTab] = useState(searchParams.get('filter') || 'all'); // 'all', 'new', 'featured', 'sale'
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(250);
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'price-low', 'price-high', 'rating', 'name'
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync URL params to local state if query changes
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setSelectedCategory(cat);

    const q = searchParams.get('search');
    if (q) setSearchTerm(q);

    const f = searchParams.get('filter');
    if (f) setSelectedFilterTab(f);
  }, [searchParams]);

  // Real-time listeners for products and categories from Firestore
  useEffect(() => {
    setLoading(true);
    const unsubProducts = listenToProducts(
      (items) => {
        setProducts(items.filter(p => p.isActive !== false));
        setLoading(false);
      },
      (err) => {
        console.error("Shop product stream error:", err);
        setError("Unable to load store products from Firestore.");
        setLoading(false);
      }
    );

    const unsubCategories = listenToCategories(
      (cats) => {
        setCategories(cats.filter(c => c.isActive !== false));
      },
      (err) => {
        console.error("Shop categories stream error:", err);
      }
    );

    return () => {
      unsubProducts();
      unsubCategories();
    };
  }, []);

  const handleCategorySelect = (slug) => {
    setSelectedCategory(slug);
    if (slug === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', slug);
    }
    setSearchParams(searchParams);
  };

  const handleFilterTabSelect = (filterKey) => {
    setSelectedFilterTab(filterKey);
    if (filterKey === 'all') {
      searchParams.delete('filter');
    } else {
      searchParams.set('filter', filterKey);
    }
    setSearchParams(searchParams);
  };

  const toggleSize = (size) => {
    setSelectedSizes(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSearchTerm('');
    setSelectedFilterTab('all');
    setSelectedSizes([]);
    setInStockOnly(false);
    setMaxPrice(250);
    setSortBy('newest');
    setSearchParams({});
  };

  // Dynamic Available Sizes extracted across all Firestore products
  const availableSizes = useMemo(() => {
    const set = new Set(['XS', 'S', 'M', 'L', 'XL', 'XXL']);
    products.forEach(p => {
      if (Array.isArray(p.sizes)) {
        p.sizes.forEach(s => {
          if (s && typeof s === 'string') set.add(s.trim());
        });
      }
      if (Array.isArray(p.variants)) {
        p.variants.forEach(v => {
          if (v && v.size && typeof v.size === 'string' && v.size !== 'Default' && v.size !== 'Standard') {
            set.add(v.size.trim());
          }
        });
      }
    });
    return Array.from(set);
  }, [products]);

  // Filtered and Sorted Products computation
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Category filter (matches category ID, slug, or name)
      if (selectedCategory !== 'all') {
        const prodCat = (product.category || '').toLowerCase();
        const targetCat = selectedCategory.toLowerCase();
        if (prodCat !== targetCat) return false;
      }

      // Quick filter tabs
      if (selectedFilterTab === 'new' && !product.isNewArrival) return false;
      if (selectedFilterTab === 'featured' && !product.featured) return false;
      if (selectedFilterTab === 'sale') {
        const isSale = product.discountPrice && Number(product.discountPrice) > 0 && Number(product.discountPrice) < Number(product.price);
        if (!isSale) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = product.name?.toLowerCase().includes(term);
        const matchDesc = product.description?.toLowerCase().includes(term);
        const matchCat = product.category?.toLowerCase().includes(term);
        if (!matchName && !matchDesc && !matchCat) return false;
      }

      // Max price filter
      const activePrice = product.discountPrice && Number(product.discountPrice) > 0
        ? Number(product.discountPrice)
        : Number(product.price);
      if (activePrice > maxPrice) return false;

      // In stock only
      if (inStockOnly && Number(product.stock) <= 0) return false;

      // Selected Sizes
      if (selectedSizes.length > 0) {
        const prodSizes = Array.isArray(product.sizes) ? product.sizes : [];
        const varSizes = Array.isArray(product.variants) ? product.variants.map(v => v.size).filter(Boolean) : [];
        const allSizes = [...prodSizes, ...varSizes].map(s => String(s).toUpperCase());
        const hasMatchingSize = selectedSizes.some(s => allSizes.includes(String(s).toUpperCase()));
        if (!hasMatchingSize) return false;
      }

      return true;
    }).sort((a, b) => {
      const priceA = a.discountPrice && Number(a.discountPrice) > 0 ? Number(a.discountPrice) : Number(a.price);
      const priceB = b.discountPrice && Number(b.discountPrice) > 0 ? Number(b.discountPrice) : Number(b.price);

      if (sortBy === 'price-low') return priceA - priceB;
      if (sortBy === 'price-high') return priceB - priceA;
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'rating') return (Number(b.rating) || 0) - (Number(a.rating) || 0);

      // Default: Newest first
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
      return timeB - timeA;
    });
  }, [products, selectedCategory, selectedFilterTab, searchTerm, maxPrice, inStockOnly, selectedSizes, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      <div className="bg-white border-b border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Dynamic Storefront
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {selectedCategory !== 'all' 
                  ? `${categories.find(c => c.slug === selectedCategory || c.name === selectedCategory)?.name || selectedCategory}`
                  : 'All Apparel & Streetwear'}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Showing {filteredProducts.length} dynamic items synchronized with Firestore
              </p>
            </div>

            {/* Quick Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleFilterTabSelect('all')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  selectedFilterTab === 'all'
                    ? 'bg-slate-950 text-white shadow-sm'
                    : 'bg-gray-100 hover:bg-gray-200 text-slate-700'
                }`}
              >
                All Items
              </button>

              <button
                onClick={() => handleFilterTabSelect('new')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  selectedFilterTab === 'new'
                    ? 'bg-slate-950 text-white shadow-sm'
                    : 'bg-gray-100 hover:bg-gray-200 text-slate-700'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                New Arrivals
              </button>

              <button
                onClick={() => handleFilterTabSelect('featured')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  selectedFilterTab === 'featured'
                    ? 'bg-slate-950 text-white shadow-sm'
                    : 'bg-gray-100 hover:bg-gray-200 text-slate-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Featured
              </button>

              <button
                onClick={() => handleFilterTabSelect('sale')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  selectedFilterTab === 'sale'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                On Sale
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6 sticky top-24">
              
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <Filter className="w-4 h-4" />
                  <span>Filter Products</span>
                </div>
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-slate-400 hover:text-slate-900 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              </div>

              {/* Dynamic Categories List from Firestore */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Dynamic Categories
                </h4>
                <div className="space-y-1.5">
                  <button
                    onClick={() => handleCategorySelect('all')}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between ${
                      selectedCategory === 'all'
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>All Collections</span>
                    <span className="text-[10px] opacity-70">({products.length})</span>
                  </button>

                  {categories.map((cat) => {
                    const catSlug = cat.slug || cat.name;
                    const count = products.filter(p => (p.category || '').toLowerCase() === catSlug.toLowerCase()).length;
                    const isSelected = selectedCategory.toLowerCase() === catSlug.toLowerCase();

                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleCategorySelect(catSlug)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between ${
                          isSelected
                            ? 'bg-slate-900 text-white font-semibold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span>{cat.name}</span>
                        <span className="text-[10px] opacity-70">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Filter Slider */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Max Price
                  </h4>
                  <span className="text-xs font-bold text-slate-900">${maxPrice}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="300"
                  step="5"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-950"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>$10</span>
                  <span>$300+</span>
                </div>
              </div>

              {/* Sizes Filter */}
              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Available Sizes
                </h4>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((size) => {
                    const isChecked = selectedSizes.includes(size);
                    return (
                      <button
                        key={size}
                        onClick={() => toggleSize(size)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          isChecked
                            ? 'bg-slate-950 border-slate-950 text-white'
                            : 'bg-white border-gray-200 text-slate-700 hover:border-slate-400'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* In-Stock Toggle */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-900">In Stock Only</h4>
                  <p className="text-[10px] text-slate-400">Hide out of stock items</p>
                </div>
                <button
                  onClick={() => setInStockOnly(!inStockOnly)}
                  className={`w-10 h-6 rounded-full transition-colors relative p-1 ${
                    inStockOnly ? 'bg-slate-950' : 'bg-slate-200'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      inStockOnly ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

            </div>
          </aside>

          {/* Main Products Grid & Search Bar Area */}
          <main className="lg:col-span-9 space-y-6">
            
            {/* Search and Sort Toolbar */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              
              {/* Search Bar */}
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter by name, description, tag..."
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-900 transition-colors"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Mobile Filter Button & Sort Select */}
              <div className="flex items-center justify-between w-full sm:w-auto gap-3">
                <button
                  onClick={() => setMobileFilterOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Filters
                </button>

                <div className="flex items-center gap-2 ml-auto sm:ml-0">
                  <span className="text-xs text-slate-400 font-medium">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-slate-900 cursor-pointer"
                  >
                    <option value="newest">Newest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                    <option value="name">Alphabetical (A-Z)</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Active Filters Display Chips */}
            {(selectedCategory !== 'all' || selectedSizes.length > 0 || inStockOnly || searchTerm || selectedFilterTab !== 'all') && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400">Active Filters:</span>
                
                {selectedCategory !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-200 text-slate-800 text-xs font-medium rounded-lg">
                    Category: {selectedCategory}
                    <button onClick={() => handleCategorySelect('all')}><X className="w-3 h-3" /></button>
                  </span>
                )}

                {selectedFilterTab !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-200 text-slate-800 text-xs font-medium rounded-lg">
                    Filter: {selectedFilterTab}
                    <button onClick={() => handleFilterTabSelect('all')}><X className="w-3 h-3" /></button>
                  </span>
                )}

                {selectedSizes.map(s => (
                  <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-200 text-slate-800 text-xs font-medium rounded-lg">
                    Size: {s}
                    <button onClick={() => toggleSize(s)}><X className="w-3 h-3" /></button>
                  </span>
                ))}

                {inStockOnly && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-200 text-slate-800 text-xs font-medium rounded-lg">
                    In Stock Only
                    <button onClick={() => setInStockOnly(false)}><X className="w-3 h-3" /></button>
                  </span>
                )}

                <button
                  onClick={handleResetFilters}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold ml-2 underline"
                >
                  Clear All
                </button>
              </div>
            )}

            {/* Products Grid */}
            {loading ? (
              <LoadingSpinner message="Syncing dynamic product feed with Firestore..." />
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 border border-gray-100 shadow-sm text-center">
                <EmptyState
                  title="No matching products found"
                  description="Try adjusting your filters, price range, or category selection to find what you are looking for."
                  actionText="Reset All Filters"
                  onActionClick={handleResetFilters}
                />
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
};

export default Shop;
