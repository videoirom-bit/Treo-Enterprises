import React, { useState } from 'react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { formatINR } from '../utils/gstUtils';
import { ShoppingCart, Zap, Eye, Check, AlertTriangle } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, setActiveView, setSelectedProductForDetail } = useApp();
  const [quantity, setQuantity] = useState<number>(1);
  const [addedAnimation, setAddedAnimation] = useState(false);

  const isLowStock = product.currentStock > 0 && product.currentStock <= product.minimumStock;
  const isOutOfStock = product.currentStock <= 0;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1200);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    setActiveView('checkout');
  };

  const openDetails = () => {
    setSelectedProductForDetail(product);
    setActiveView('product-detail');
  };

  return (
    <div
      id={`product-card-${product.id}`}
      className="group bg-white dark:bg-slate-800/90 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between w-full"
    >
      {/* Product Image and Badges */}
      <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-900 cursor-pointer" onClick={openDetails}>
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 flex flex-col gap-1 sm:gap-1.5 z-10 max-w-[85%]">
          {product.discountPercentage > 0 && (
            <span className="bg-amber-500 text-slate-950 font-extrabold text-[9px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full shadow-xs truncate">
              {Math.round(product.discountPercentage)}% OFF
            </span>
          )}
          {product.isBestSeller && (
            <span className="bg-teal-700 text-white font-semibold text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full shadow-xs truncate">
              Best Seller
            </span>
          )}
          {product.isTodayOffer && (
            <span className="bg-rose-600 text-white font-semibold text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full shadow-xs truncate">
              Today's Deal
            </span>
          )}
        </div>

        {/* Quick View Button on Hover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            openDetails();
          }}
          className="absolute right-1.5 top-1.5 sm:right-2.5 sm:top-2.5 p-1.5 sm:p-2 rounded-full bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:text-teal-600 shadow-md opacity-0 group-hover:opacity-100 transition duration-200"
          title="Quick View Details"
        >
          <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        {/* Stock warning pill overlay */}
        {isOutOfStock ? (
          <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center backdrop-blur-xs p-1">
            <span className="bg-red-600 text-white font-bold text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full uppercase tracking-wider text-center">
              Out of Stock
            </span>
          </div>
        ) : isLowStock ? (
          <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 bg-amber-100/90 text-amber-900 dark:bg-amber-950/90 dark:text-amber-200 text-[8px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-md flex items-center gap-1 max-w-[90%]">
            <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-600 shrink-0" />
            <span className="truncate">Only {product.currentStock} left</span>
          </div>
        ) : null}
      </div>

      {/* Content Area */}
      <div className="p-2 sm:p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-[9px] sm:text-xs text-slate-500 dark:text-slate-400 mb-0.5 gap-1">
            <span className="font-medium text-teal-600 dark:text-teal-400 truncate">{product.brand}</span>
            <span className="font-mono text-[8px] sm:text-[10px] truncate shrink-0">{product.sku}</span>
          </div>

          <h3
            onClick={openDetails}
            className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm line-clamp-2 hover:text-teal-600 dark:hover:text-teal-400 transition cursor-pointer mb-1 leading-tight sm:leading-snug"
          >
            {product.name}
          </h3>

          <div className="flex items-baseline gap-1 sm:gap-2 mb-1 flex-wrap">
            <span className="text-xs sm:text-base font-bold text-slate-900 dark:text-white">
              {formatINR(product.sellingPrice)}
            </span>
            {product.mrp > product.sellingPrice && (
              <span className="text-[9px] sm:text-xs text-slate-400 line-through font-normal">
                {formatINR(product.mrp)}
              </span>
            )}
            <span className="text-[8px] sm:text-[11px] text-slate-500 dark:text-slate-400">/{product.unit}</span>
          </div>

          {/* GST Tag */}
          <div className="text-[8px] sm:text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-1 mb-1.5 sm:mb-2 gap-1">
            <span className="truncate">GST {product.gstRate}%</span>
            <span className="font-mono text-[7px] sm:text-[9px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded shrink-0">
              HSN: {product.hsnCode}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-1 sm:space-y-1.5 mt-auto">
          {/* Quantity Selector & Add to Cart */}
          <div className="flex items-center justify-between gap-1 sm:gap-1.5">
            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg sm:rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={isOutOfStock}
                className="px-1.5 sm:px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-50 min-w-[22px] sm:min-w-[32px] min-h-[28px] sm:min-h-[38px] text-center flex items-center justify-center font-bold text-xs sm:text-sm cursor-pointer touch-manipulation"
                aria-label="Decrease quantity"
              >
                -
              </button>
              <span className="px-0.5 sm:px-1.5 py-0.5 font-semibold text-slate-800 dark:text-slate-200 min-w-[14px] sm:min-w-[18px] text-center text-xs">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(product.currentStock, q + 1))}
                disabled={isOutOfStock || quantity >= product.currentStock}
                className="px-1.5 sm:px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-50 min-w-[22px] sm:min-w-[32px] min-h-[28px] sm:min-h-[38px] text-center flex items-center justify-center font-bold text-xs sm:text-sm cursor-pointer touch-manipulation"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <button
              id={`add-to-cart-btn-${product.id}`}
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`flex-1 min-w-0 flex items-center justify-center gap-1 py-1 sm:py-2 px-1 sm:px-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition truncate min-h-[28px] sm:min-h-[38px] cursor-pointer touch-manipulation ${
                addedAnimation
                  ? 'bg-emerald-600 text-white'
                  : 'bg-teal-50 dark:bg-teal-950/70 text-teal-800 dark:text-teal-200 hover:bg-teal-100 dark:hover:bg-teal-900'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {addedAnimation ? (
                <>
                  <Check className="w-3 h-3 shrink-0" />
                  <span className="truncate">Added!</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3 h-3 shrink-0" />
                  <span className="truncate">
                    <span className="sm:hidden">Add</span>
                    <span className="hidden sm:inline">Add to Cart</span>
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Buy Now Button */}
          <button
            id={`buy-now-btn-${product.id}`}
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            className="w-full flex items-center justify-center gap-1 py-1 sm:py-2 px-1.5 sm:px-2.5 rounded-lg sm:rounded-xl bg-slate-900 hover:bg-teal-700 text-white text-[10px] sm:text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed shadow-xs min-h-[28px] sm:min-h-[38px] cursor-pointer touch-manipulation"
          >
            <Zap className="w-3 h-3 text-amber-400 shrink-0" />
            <span>Buy Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
