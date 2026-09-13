import React from 'react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/ProductCard';
import { Tag, Sparkles, Clock, Percent } from 'lucide-react';

export const OffersView: React.FC = () => {
  const { products, setActiveView } = useApp();

  const discountedProducts = products.filter(
    (p) => p.isTodayOffer || p.discountPercentage >= 10
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Promotional Banner */}
      <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-amber-500 via-rose-500 to-orange-500 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Limited Period Clearance Deals</span>
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Today's Exclusive Stationery Discounts
          </h1>
          <p className="text-white/90 text-xs sm:text-sm leading-relaxed">
            Special bulk discounts on school notebooks, permanent markers, geometry kits, and JK copier paper. Take advantage of wholesale rates for your institution or corporate workspace.
          </p>
        </div>
      </div>

      {/* Discount Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Available Discounted Products ({discountedProducts.length})
          </h2>
          <span className="text-xs text-slate-500">Auto-calculated GST included</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {discountedProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </div>
  );
};
