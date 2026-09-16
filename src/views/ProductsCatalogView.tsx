import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/ProductCard';
import { StationeryCategory } from '../types';
import { Search, Filter, SlidersHorizontal, RotateCcw } from 'lucide-react';

export const ProductsCatalogView: React.FC = () => {
  const {
    products,
    categories,
    searchQuery,
    setSearchQuery,
    selectedCategoryFilter,
    setSelectedCategoryFilter,
  } = useApp();

  // Local filter states
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [selectedStockStatus, setSelectedStockStatus] = useState<'All' | 'in_stock' | 'low_stock' | 'out_of_stock'>('All');
  const [priceSort, setPriceSort] = useState<'default' | 'price_low_high' | 'price_high_low' | 'name_asc' | 'popularity'>('default');
  const [maxPrice, setMaxPrice] = useState<number>(1500);
  const [minDiscount, setMinDiscount] = useState<number>(0);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Dynamic categories list from Supabase / store
  const categoriesList = useMemo(() => {
    const list = categories.map((c) => c.name);
    // Also include any categories present in products
    products.forEach((p) => {
      if (p.category && !list.includes(p.category)) {
        list.push(p.category);
      }
    });
    return list;
  }, [categories, products]);

  const uniqueBrands = useMemo(() => {
    const brands = Array.from(new Set(products.map((p) => p.brand))).filter(Boolean);
    return ['All', ...brands];
  }, [products]);

  // Filtering & Sorting pipeline
  const filteredProducts = useMemo(() => {
    return products
      .filter((prod) => {
        // Search filter (name, sku, barcode, brand, category)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = prod.name.toLowerCase().includes(q);
          const matchSku = prod.sku.toLowerCase().includes(q);
          const matchBarcode = prod.barcode.toLowerCase().includes(q);
          const matchBrand = prod.brand.toLowerCase().includes(q);
          const matchCat = prod.category.toLowerCase().includes(q);
          if (!matchName && !matchSku && !matchBarcode && !matchBrand && !matchCat) {
            return false;
          }
        }

        // Category filter
        if (selectedCategoryFilter && prod.category !== selectedCategoryFilter) {
          return false;
        }

        // Brand filter
        if (selectedBrand !== 'All' && prod.brand !== selectedBrand) {
          return false;
        }

        // Stock status filter
        if (selectedStockStatus === 'in_stock' && prod.currentStock <= 0) return false;
        if (selectedStockStatus === 'low_stock' && (prod.currentStock > prod.minimumStock || prod.currentStock <= 0)) return false;
        if (selectedStockStatus === 'out_of_stock' && prod.currentStock > 0) return false;

        // Price filter
        if (prod.sellingPrice > maxPrice) return false;

        // Discount filter
        if (prod.discountPercentage < minDiscount) return false;

        return true;
      })
      .sort((a, b) => {
        if (priceSort === 'price_low_high') return a.sellingPrice - b.sellingPrice;
        if (priceSort === 'price_high_low') return b.sellingPrice - a.sellingPrice;
        if (priceSort === 'name_asc') return a.name.localeCompare(b.name);
        if (priceSort === 'popularity') return (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0);
        return 0; // default order
      });
  }, [
    products,
    searchQuery,
    selectedCategoryFilter,
    selectedBrand,
    selectedStockStatus,
    maxPrice,
    minDiscount,
    priceSort,
  ]);

  const resetAllFilters = () => {
    setSelectedCategoryFilter(null);
    setSelectedBrand('All');
    setSelectedStockStatus('All');
    setPriceSort('default');
    setMaxPrice(1500);
    setMinDiscount(0);
    setSearchQuery('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Stationery & Paper Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Showing {filteredProducts.length} of {products.length} products with live stock and GST tags.
          </p>
        </div>

        {/* Quick Sorting & Mobile Filter Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="lg:hidden min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer touch-manipulation"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-teal-600" />
            <span>Filters</span>
            {(selectedCategoryFilter || selectedBrand !== 'All' || minDiscount > 0 || selectedStockStatus !== 'All') && (
              <span className="w-2 h-2 rounded-full bg-teal-600"></span>
            )}
          </button>

          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <label className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">Sort:</label>
            <select
              id="sort-select-dropdown"
              value={priceSort}
              onChange={(e: any) => setPriceSort(e.target.value)}
              className="min-h-[44px] text-xs font-semibold py-2 px-2.5 sm:px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 flex-1 sm:flex-initial cursor-pointer"
            >
              <option value="default">Featured</option>
              <option value="popularity">Popularity</option>
              <option value="price_low_high">Price: Low to High</option>
              <option value="price_high_low">Price: High to Low</option>
              <option value="name_asc">Name (A - Z)</option>
            </select>
          </div>

          {(selectedCategoryFilter || selectedBrand !== 'All' || searchQuery || selectedStockStatus !== 'All' || minDiscount > 0) && (
            <button
              onClick={resetAllFilters}
              className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0 flex items-center justify-center cursor-pointer touch-manipulation"
              title="Reset all filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Catalog Layout with Sidebar Filter */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
        {/* Left Filter Sidebar (collapsible on mobile) */}
        <div className={`lg:col-span-1 space-y-6 ${mobileFiltersOpen ? 'block' : 'hidden lg:block'}`}>
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 space-y-5 sm:space-y-6 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-teal-600" />
                <span>Filter Items</span>
              </span>
              <button
                onClick={resetAllFilters}
                className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline"
              >
                Clear All
              </button>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                Category
              </label>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1 text-xs">
                <button
                  onClick={() => setSelectedCategoryFilter(null)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium transition ${
                    selectedCategoryFilter === null
                      ? 'bg-teal-600 text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                  }`}
                >
                  All Categories ({products.length})
                </button>
                {categoriesList.map((cat) => {
                  const count = products.filter((p) => p.category === cat).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategoryFilter(cat)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium transition flex items-center justify-between ${
                        selectedCategoryFilter === cat
                          ? 'bg-teal-600 text-white font-semibold'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <span>{cat}</span>
                      <span className="text-[10px] opacity-75">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Brand Filter */}
            <div className="border-t border-slate-100 dark:border-slate-700/80 pt-4">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                Brand
              </label>
              <select
                id="brand-filter-select"
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full min-h-[44px] text-xs py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                {uniqueBrands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Max Slider */}
            <div className="border-t border-slate-100 dark:border-slate-700/80 pt-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Max Price
                </label>
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                  ₹{maxPrice}
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="1600"
                step="50"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer"
              />
            </div>

            {/* Stock Availability */}
            <div className="border-t border-slate-100 dark:border-slate-700/80 pt-4">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                Stock Status
              </label>
              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="stock"
                    checked={selectedStockStatus === 'All'}
                    onChange={() => setSelectedStockStatus('All')}
                    className="accent-teal-600"
                  />
                  <span>All Items</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="stock"
                    checked={selectedStockStatus === 'in_stock'}
                    onChange={() => setSelectedStockStatus('in_stock')}
                    className="accent-teal-600"
                  />
                  <span>In Stock Only</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="stock"
                    checked={selectedStockStatus === 'low_stock'}
                    onChange={() => setSelectedStockStatus('low_stock')}
                    className="accent-teal-600"
                  />
                  <span>Low Stock Alert</span>
                </label>
              </div>
            </div>

            {/* Minimum Discount Filter */}
            <div className="border-t border-slate-100 dark:border-slate-700/80 pt-4">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                Discount Offer
              </label>
              <div className="grid grid-cols-3 gap-1 text-xs">
                {[0, 10, 20].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setMinDiscount(d)}
                    className={`py-1.5 px-2 rounded-lg border text-center font-medium transition ${
                      minDiscount === d
                        ? 'border-teal-600 bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {d === 0 ? 'All' : `${d}%+`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="lg:col-span-3">
          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                <Search className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                No matching stationery items found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try clearing your search query or adjusting category and price filters to discover more items.
              </p>
              <button
                onClick={resetAllFilters}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
