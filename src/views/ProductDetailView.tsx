import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../utils/gstUtils';
import { ProductCard } from '../components/ProductCard';
import {
  ShoppingCart,
  Zap,
  MessageCircle,
  ArrowLeft,
  ShieldCheck,
  Truck,
  RotateCcw,
  Tag,
  CheckCircle,
  Share2,
} from 'lucide-react';

export const ProductDetailView: React.FC = () => {
  const {
    selectedProductForDetail,
    products,
    addToCart,
    setActiveView,
    shopSettings,
    showToast,
  } = useApp();

  const [quantity, setQuantity] = useState<number>(1);
  const [selectedTab, setSelectedTab] = useState<'specs' | 'gst' | 'return'>('specs');

  if (!selectedProductForDetail) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center">
        <p className="text-slate-500 mb-4">No product selected.</p>
        <button
          onClick={() => setActiveView('products')}
          className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  const product = selectedProductForDetail;
  const isOutOfStock = product.currentStock <= 0;

  // Related products from same category
  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const handleWhatsAppInquiry = () => {
    const cleanNumber = (shopSettings?.whatsAppNumber || '').replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `Hello ${shopSettings?.shopName || 'ABC Paper & Stationery'}, I want to inquire about: "${product.name}" (SKU: ${product.sku}, Price: ₹${product.sellingPrice}). Is it available in bulk quantity?`
    );
    window.open(`https://wa.me/${cleanNumber}?text=${text}`, '_blank');
  };

  const handleShareProduct = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Check out ${product.name} at ${shopSettings.shopName} for ${formatINR(product.sellingPrice)}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Product link copied to clipboard!');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Back to Products */}
      <button
        onClick={() => setActiveView('products')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Product Catalog</span>
      </button>

      {/* Main Details Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 bg-white dark:bg-slate-800/90 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-700/80 shadow-md">
        {/* Large Product Image */}
        <div className="lg:col-span-5 space-y-4">
          <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 relative">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {product.discountPercentage > 0 && (
              <span className="absolute top-4 left-4 bg-amber-500 text-slate-950 font-black text-xs px-3 py-1 rounded-full shadow-md">
                {Math.round(product.discountPercentage)}% OFF
              </span>
            )}
          </div>

          <div className="flex items-center justify-between px-2 text-xs text-slate-500">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle className="w-4 h-4" />
              <span>100% Genuine Brand Stock</span>
            </span>
            <button
              onClick={handleShareProduct}
              className="flex items-center gap-1 hover:text-teal-600 transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Product</span>
            </button>
          </div>
        </div>

        {/* Product Details & Purchase Actions */}
        <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-xs font-bold">
                {product.category}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                Brand: {product.brand}
              </span>
              <span className="font-mono text-xs text-slate-400">SKU: {product.sku}</span>
              <span className="font-mono text-xs text-slate-400">Barcode: {product.barcode}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              {product.name}
            </h1>

            {/* Pricing block */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-baseline gap-4 flex-wrap">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {formatINR(product.sellingPrice)}
              </span>
              {product.mrp > product.sellingPrice && (
                <span className="text-sm text-slate-400 line-through">
                  MRP {formatINR(product.mrp)}
                </span>
              )}
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                Save {formatINR(product.mrp - product.sellingPrice)}
              </span>
              <span className="text-xs text-slate-500">Unit: {product.unit}</span>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {product.description}
            </p>

            {/* Quick specifications preview */}
            {product.specifications && product.specifications.length > 0 && (
              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  Highlights:
                </span>
                {product.specifications.map((spec, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                    <span>{spec}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Stock status indicator */}
            <div className="flex items-center gap-3 pt-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Stock Status:
              </span>
              {isOutOfStock ? (
                <span className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950 px-2.5 py-1 rounded-md">
                  Currently Out of Stock
                </span>
              ) : (
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{product.currentStock} units ready for dispatch</span>
                </span>
              )}
            </div>
          </div>

          {/* Action buttons & Quantity */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Quantity selector */}
              <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 text-sm">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={isOutOfStock}
                  className="px-3.5 py-2 hover:bg-slate-200 dark:hover:bg-slate-800 font-bold"
                >
                  -
                </button>
                <span className="px-4 py-2 font-bold text-slate-800 dark:text-slate-200">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(product.currentStock, q + 1))}
                  disabled={isOutOfStock || quantity >= product.currentStock}
                  className="px-3.5 py-2 hover:bg-slate-200 dark:hover:bg-slate-800 font-bold"
                >
                  +
                </button>
              </div>

              {/* Add to Cart */}
              <button
                id="product-detail-add-cart-btn"
                onClick={() => addToCart(product, quantity)}
                disabled={isOutOfStock}
                className="flex-1 py-3 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition disabled:opacity-40"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>

              {/* Buy Now */}
              <button
                id="product-detail-buy-now-btn"
                onClick={() => {
                  addToCart(product, quantity);
                  setActiveView('checkout');
                }}
                disabled={isOutOfStock}
                className="py-3 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md transition disabled:opacity-40"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Buy Now</span>
              </button>
            </div>

            {/* WhatsApp Enquiry button */}
            <button
              id="product-detail-whatsapp-btn"
              onClick={handleWhatsAppInquiry}
              className="w-full py-2.5 px-4 rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-semibold text-xs flex items-center justify-center gap-2 transition"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Ask Shop Owner on WhatsApp for Bulk / School Discounts</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs: Specifications, GST Info, Returns */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-6">
        <div className="flex border-b border-slate-200 dark:border-slate-700 gap-4 text-xs font-bold">
          <button
            onClick={() => setSelectedTab('specs')}
            className={`pb-3 border-b-2 transition ${
              selectedTab === 'specs'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Detailed Specifications
          </button>
          <button
            onClick={() => setSelectedTab('gst')}
            className={`pb-3 border-b-2 transition ${
              selectedTab === 'gst'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Indian GST & Tax Details
          </button>
          <button
            onClick={() => setSelectedTab('return')}
            className={`pb-3 border-b-2 transition ${
              selectedTab === 'return'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Delivery & Replacement Policy
          </button>
        </div>

        {selectedTab === 'specs' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-3">
              <h4 className="font-bold text-slate-800 dark:text-slate-200">Package Contents</h4>
              <p className="text-slate-600 dark:text-slate-300">{product.packageContents || 'Standard original retail packaging'}</p>

              <h4 className="font-bold text-slate-800 dark:text-slate-200 pt-2">Suitable For</h4>
              <p className="text-slate-600 dark:text-slate-300">{product.suitableFor || 'Schools, offices, colleges and personal use'}</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 dark:text-slate-200">Key Parameters</h4>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Unit Type:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{product.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Brand Name:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{product.brand}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Barcode / EAN:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{product.barcode}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'gst' && (
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <span className="block text-slate-400 mb-1">Applicable GST Rate</span>
                <span className="text-base font-bold text-teal-600">{product.gstRate}%</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <span className="block text-slate-400 mb-1">Harmonized System HSN Code</span>
                <span className="text-base font-mono font-bold text-slate-800 dark:text-slate-200">
                  {product.hsnCode}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <span className="block text-slate-400 mb-1">Tax Split Rule</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  CGST {product.gstRate / 2}% + SGST {product.gstRate / 2}% (Intra-state)
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 pt-2">
              * GST Input Tax Credit (ITC) can be claimed by businesses and registered taxpayers by providing their 15-digit GSTIN at checkout.
            </p>
          </div>
        )}

        {selectedTab === 'return' && (
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
            <p>
              • <strong>Store Pickup:</strong> Free instant collection from {shopSettings.shopName} during business hours.
            </p>
            <p>
              • <strong>Home & Office Delivery:</strong> Dispatched via local delivery partners within 24 hours across the city.
            </p>
            <p>
              • <strong>3-Day Replacement Guarantee:</strong> In case of defective markers, pens or damaged paper reams, immediate replacement is provided with invoice presentation.
            </p>
          </div>
        )}
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Related {product.category} Items
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
