import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/ProductCard';
import { StationeryCategory } from '../types';
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  FileText,
  HeartHandshake,
  Clock,
  Sparkles,
  BookOpen,
  PenTool,
  Paperclip,
  Printer,
  Package,
  Layers,
  Palette,
  Briefcase,
  Gift,
  Compass,
  Search,
  CheckCircle2,
} from 'lucide-react';

const categoryIcons: Record<StationeryCategory, React.ReactNode> = {
  Notebooks: <BookOpen className="w-6 h-6 text-teal-600" />,
  Pens: <PenTool className="w-6 h-6 text-blue-600" />,
  Pencils: <PenTool className="w-6 h-6 text-amber-600" />,
  Paper: <Layers className="w-6 h-6 text-indigo-600" />,
  'Files & Folders': <Paperclip className="w-6 h-6 text-emerald-600" />,
  'Art & Craft': <Palette className="w-6 h-6 text-rose-600" />,
  'School Supplies': <Compass className="w-6 h-6 text-orange-600" />,
  'Office Supplies': <Briefcase className="w-6 h-6 text-purple-600" />,
  'Printing Supplies': <Printer className="w-6 h-6 text-cyan-600" />,
  Books: <BookOpen className="w-6 h-6 text-teal-600" />,
  'Computer Accessories': <Printer className="w-6 h-6 text-slate-600" />,
  'Packaging Materials': <Package className="w-6 h-6 text-amber-700" />,
  'Gift Items': <Gift className="w-6 h-6 text-pink-600" />,
  Other: <Layers className="w-6 h-6 text-slate-500" />,
};

export const HomeView: React.FC = () => {
  const {
    products,
    setActiveView,
    setSelectedCategoryFilter,
    shopSettings,
    setSearchTrackingId,
    showToast,
  } = useApp();

  const [trackInput, setTrackInput] = useState('');

  const handleTrackSubmit = (e: React.FormEvent, customId?: string) => {
    e.preventDefault();
    const query = (customId !== undefined ? customId : trackInput).trim();
    if (!query) {
      showToast('Please enter an Order ID or Mobile Number');
      return;
    }
    setSearchTrackingId(query);
    setActiveView('track-order');
  };

  const categories: StationeryCategory[] = [
    'Paper',
    'Notebooks',
    'Pens',
    'Pencils',
    'Files & Folders',
    'Office Supplies',
    'School Supplies',
    'Art & Craft',
    'Printing Supplies',
    'Computer Accessories',
    'Packaging Materials',
    'Gift Items',
  ];

  const bestSellers = products.filter((p) => p.isBestSeller).slice(0, 8);
  const todayOffers = products.filter((p) => p.isTodayOffer || p.discountPercentage >= 15).slice(0, 4);

  const handleCategorySelect = (cat: StationeryCategory) => {
    setSelectedCategoryFilter(cat);
    setActiveView('products');
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-900 via-slate-900 to-slate-950 text-white rounded-2xl sm:rounded-3xl mx-3 sm:mx-6 lg:mx-8 mt-3 sm:mt-4 shadow-xl border border-teal-900/40">
        {/* Background ambient lighting */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 sm:w-96 h-64 sm:h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-60 sm:w-80 h-60 sm:h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16 lg:py-24">
          <div className="max-w-3xl space-y-4 sm:space-y-6">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-teal-500/20 text-teal-300 text-[11px] sm:text-xs font-semibold border border-teal-400/30 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Genuine Paper & Stationery Store</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight leading-tight">
              Everything You Need for <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-amber-300">School, Office & Everyday Life</span>
            </h1>

            <p className="text-slate-300 text-xs sm:text-base lg:text-lg max-w-2xl leading-relaxed">
              Quality copier paper, ball & gel pens, registers, corporate files, student geometry kits, and art materials at competitive local rates. Instant GST Tax Invoice on every purchase.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                id="hero-shop-now-btn"
                onClick={() => {
                  setSelectedCategoryFilter(null);
                  setActiveView('products');
                }}
                className="w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-teal-900/40 flex items-center justify-center gap-2 transition transform hover:-translate-y-0.5"
              >
                <span>Shop Catalog Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="hero-view-categories-btn"
                onClick={() => setActiveView('categories')}
                className="w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/15 backdrop-blur-xs text-center transition"
              >
                View Categories
              </button>
            </div>

            {/* Micro stats banner */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 sm:pt-6 border-t border-slate-800 text-center sm:text-left text-xs max-w-xl">
              <div>
                <span className="block font-bold text-base sm:text-lg text-white">500+</span>
                <span className="text-[11px] sm:text-xs text-slate-400">Stationery SKUs</span>
              </div>
              <div>
                <span className="block font-bold text-base sm:text-lg text-amber-400">100%</span>
                <span className="text-[11px] sm:text-xs text-slate-400">GST Invoice</span>
              </div>
              <div>
                <span className="block font-bold text-base sm:text-lg text-teal-300">Fast Local</span>
                <span className="text-[11px] sm:text-xs text-slate-400">Dispatch</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Prominent Track Your Order Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-xl border border-blue-800/40 relative overflow-hidden">
          {/* Subtle glowing accents */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-xl space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
                <Truck className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                <span>Live Dispatch & Transit Tracking</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Track Your Stationery Order
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm">
                Get real-time updates from packaging to delivery rider arrival. Enter your Order ID or registered mobile number.
              </p>
            </div>

            {/* Input & Action */}
            <div className="w-full lg:max-w-md space-y-3">
              <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={trackInput}
                    onChange={(e) => setTrackInput(e.target.value)}
                    placeholder="e.g. ABC-2026-00125 or 9876500125"
                    className="w-full pl-10 pr-3 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-400 active:scale-98 text-white font-bold rounded-2xl text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shrink-0"
                >
                  <Search className="w-4 h-4" />
                  <span>Track</span>
                </button>
              </form>

              {/* Quick test buttons */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="text-slate-400 text-[11px]">Quick Samples:</span>
                <button
                  type="button"
                  onClick={(e) => handleTrackSubmit(e, 'ABC-2026-00125')}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-blue-200 border border-white/10 font-mono text-[11px] transition"
                >
                  #ABC-2026-00125 (Out for Delivery)
                </button>
                <button
                  type="button"
                  onClick={(e) => handleTrackSubmit(e, 'ABC-2026-00124')}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-300 border border-white/10 font-mono text-[11px] transition"
                >
                  #ABC-2026-00124 (Delivered)
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories Carousel / Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Featured Categories
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Select your required stationery section to explore all products
            </p>
          </div>
          <button
            onClick={() => setActiveView('categories')}
            className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
          >
            <span>All 14 Categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <div
              key={cat}
              id={`cat-card-${cat.toLowerCase().replace(/[^a-z]/g, '-')}`}
              onClick={() => handleCategorySelect(cat)}
              className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 hover:border-teal-500 hover:shadow-md transition-all cursor-pointer text-center group flex flex-col items-center justify-center gap-3"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center group-hover:scale-110 group-hover:bg-teal-50 dark:group-hover:bg-teal-950/60 transition-transform">
                {categoryIcons[cat]}
              </div>
              <span className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition">
                {cat}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Today's Offers / Promotional Section */}
      {todayOffers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-orange-500/15 border border-amber-300 dark:border-amber-900/50 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-rose-600 text-white font-bold text-xs uppercase tracking-wider mb-2">
                  Special Clearance Deals
                </span>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Today's Featured Offers
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Save up to 28% off on notebooks, calculators, art supplies and paper reams.
                </p>
              </div>

              <button
                onClick={() => setActiveView('offers')}
                className="self-start sm:self-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition"
              >
                View All Deals
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {todayOffers.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Best Selling Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Best Selling Products
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Most requested supplies by local schools, colleges, offices & businesses
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedCategoryFilter(null);
              setActiveView('products');
            }}
            className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {bestSellers.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Why Choose {shopSettings.shopName}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Serving students, educators, corporate accountants, and creative artists with trusted reliability.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-xl bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center text-teal-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Quality Products</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">100% genuine top stationery brands.</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Affordable Prices</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Wholesale pricing available on bulk reams.</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600">
              <Truck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Fast Service</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Quick store pickup and doorstep delivery.</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Local Trusted Shop</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Serving the community for years.</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
              <Clock className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Easy Ordering</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Order online or directly via WhatsApp.</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">GST Invoice Available</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">B2B & B2C tax compliance with HSN codes.</p>
          </div>
        </div>
      </section>

      {/* Contact & Map Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center border border-slate-800">
          <div className="space-y-4">
            <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">
              Visit Our Stationery Store
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold">{shopSettings.shopName}</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              {shopSettings.shopAddress}, {shopSettings.city}, {shopSettings.state} - {shopSettings.pinCode}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-slate-400 block mb-1">Phone / Orders</span>
                <span className="font-bold text-white text-sm">{shopSettings.phoneNumber}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-slate-400 block mb-1">WhatsApp Business</span>
                <span className="font-bold text-emerald-400 text-sm">{shopSettings.whatsAppNumber}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-slate-400 block mb-1">Email Queries</span>
                <span className="font-semibold text-white">{shopSettings.emailAddress}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-slate-400 block mb-1">Store Timings</span>
                <span className="font-semibold text-slate-200">{shopSettings.openingHours}</span>
              </div>
            </div>
          </div>

          {/* Interactive Map Visual */}
          <div className="h-64 sm:h-80 rounded-2xl overflow-hidden border border-slate-700 bg-slate-800 relative flex items-center justify-center text-center p-6">
            <div className="space-y-3 max-w-sm">
              <div className="w-12 h-12 mx-auto rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center">
                <Compass className="w-6 h-6 animate-spin" />
              </div>
              <h4 className="font-bold text-base">Store Location & Directions</h4>
              <p className="text-xs text-slate-400">
                Conveniently located near Station Road Commercial Market. Ample 2-wheeler and 4-wheeler parking available.
              </p>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(
                  `${shopSettings.shopName} ${shopSettings.shopAddress} ${shopSettings.city}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-block px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold transition"
              >
                Open in Google Maps
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
