import React from 'react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../utils/gstUtils';
import { Trash2, ShoppingBag, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';

export const CartView: React.FC = () => {
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartGSTDetails,
    setActiveView,
    shopSettings,
  } = useApp();

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your Cart is Empty</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            You haven't added any stationery items, copier paper, or office supplies yet.
          </p>
        </div>
        <button
          onClick={() => setActiveView('products')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition"
        >
          <span>Explore Stationery Catalog</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Shopping Cart
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review items, quantities, and GST breakdown before checkout.
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Cart</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Cart Item List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-slate-800">
            {cart.map(({ product, quantity }) => {
              const itemTotal = product.sellingPrice * quantity;
              return (
                <div
                  key={product.id}
                  id={`cart-row-${product.id}`}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-16 h-16 rounded-xl object-cover bg-slate-100 dark:bg-slate-900 shrink-0 border border-slate-200 dark:border-slate-700"
                    />
                    <div>
                      <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400">
                        {product.brand} • {product.category}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="font-mono text-[11px]">SKU: {product.sku}</span>
                        <span>•</span>
                        <span>GST {product.gstRate}%</span>
                        <span>•</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {formatINR(product.sellingPrice)} / {product.unit}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity and Subtotal */}
                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 self-end sm:self-center">
                    <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900 text-xs">
                      <button
                        onClick={() => updateCartQuantity(product.id, quantity - 1)}
                        className="px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 font-bold"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 font-bold text-slate-800 dark:text-slate-200">
                        {quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(product.id, quantity + 1)}
                        disabled={quantity >= product.currentStock}
                        className="px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 font-bold disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right min-w-[90px]">
                      <span className="text-sm font-bold text-slate-900 dark:text-white block">
                        {formatINR(itemTotal)}
                      </span>
                    </div>

                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 transition"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setActiveView('products')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Continue Shopping</span>
          </button>
        </div>

        {/* Indian GST Order Summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-4">
            <h2 className="font-extrabold text-base text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              Tax & Order Summary
            </h2>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Gross Cart Value (MRP based)</span>
                <span className="font-medium">{formatINR(cartGSTDetails.subtotal)}</span>
              </div>

              {cartGSTDetails.totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Store Discount</span>
                  <span>- {formatINR(cartGSTDetails.totalDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-100 dark:border-slate-800">
                <span className="font-semibold">Taxable Base Amount</span>
                <span className="font-semibold">{formatINR(cartGSTDetails.taxableAmount)}</span>
              </div>

              {/* GST Split */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1 my-2">
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>CGST (Central Tax)</span>
                  <span className="font-medium">{formatINR(cartGSTDetails.cgst)}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>SGST (State Tax - {shopSettings.state})</span>
                  <span className="font-medium">{formatINR(cartGSTDetails.sgst)}</span>
                </div>
                <div className="flex justify-between text-slate-700 dark:text-slate-200 font-semibold pt-1 border-t border-slate-200 dark:border-slate-800">
                  <span>Total GST Tax Included</span>
                  <span>{formatINR(cartGSTDetails.totalTax)}</span>
                </div>
              </div>

              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Estimated Delivery / Service</span>
                <span className="text-emerald-600 font-semibold">Free (Store Pickup)</span>
              </div>

              {cartGSTDetails.roundOff !== 0 && (
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Round-off adjustment</span>
                  <span>{cartGSTDetails.roundOff > 0 ? `+${cartGSTDetails.roundOff}` : cartGSTDetails.roundOff}</span>
                </div>
              )}

              <div className="flex justify-between items-baseline pt-3 border-t border-slate-200 dark:border-slate-700">
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Grand Total
                </span>
                <span className="text-xl font-black text-teal-600 dark:text-teal-400">
                  {formatINR(cartGSTDetails.grandTotal)}
                </span>
              </div>
            </div>

            <button
              id="proceed-checkout-btn"
              onClick={() => setActiveView('checkout')}
              className="w-full py-3.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-[11px] text-slate-500 justify-center pt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>GST compliant invoice will be generated on placement</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
