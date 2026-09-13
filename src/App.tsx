import React, { useState, useRef } from 'react';
import { useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomeView } from './views/HomeView';
import { ProductsCatalogView } from './views/ProductsCatalogView';
import { ProductDetailView } from './views/ProductDetailView';
import { CartView } from './views/CartView';
import { CheckoutView } from './views/CheckoutView';
import { InvoiceView } from './views/InvoiceView';
import { CategoriesView } from './views/CategoriesView';
import { OffersView } from './views/OffersView';
import { AboutContactView } from './views/AboutContactView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { TrackOrderView } from './views/TrackOrderView';
import { CustomerPortalView } from './views/CustomerPortalView';
import { CheckCircle2, MessageCircle, Copy, Phone, X, ExternalLink } from 'lucide-react';

export function App() {
  const { activeView, toastMessage, shopSettings, isDarkMode, showToast } = useApp();
  const [showWhatsAppMenu, setShowWhatsAppMenu] = useState(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);

  const openWhatsAppFloating = () => {
    const cleanNumber = (shopSettings?.whatsAppNumber || '').replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `Hello ${shopSettings?.shopName || 'ABC Paper & Stationery'}, I want to place an order for paper and stationery items.`
    );
    window.open(`https://wa.me/${cleanNumber}?text=${text}`, '_blank');
  };

  const handleCopyContactNumber = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const num = shopSettings?.whatsAppNumber || '';
    navigator.clipboard.writeText(num);
    showToast(`Copied WhatsApp contact: ${num}`);
    setShowWhatsAppMenu(false);
  };

  const handleTouchStart = () => {
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setShowWhatsAppMenu(true);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    if (isLongPressRef.current) {
      isLongPressRef.current = false;
      return;
    }
    openWhatsAppFloating();
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowWhatsAppMenu(true);
  };

  return (
    <div className={`${isDarkMode ? 'dark' : ''} min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors selection:bg-teal-500 selection:text-white`}>
      {/* Header */}
      <Header />

      {/* Main App Content View */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        {activeView === 'home' && <HomeView />}
        {activeView === 'products' && <ProductsCatalogView />}
        {activeView === 'product-detail' && <ProductDetailView />}
        {activeView === 'categories' && <CategoriesView />}
        {activeView === 'offers' && <OffersView />}
        {activeView === 'cart' && <CartView />}
        {activeView === 'checkout' && <CheckoutView />}
        {activeView === 'invoice-view' && <InvoiceView />}
        {activeView === 'track-order' && <TrackOrderView />}
        {activeView === 'customer-portal' && <CustomerPortalView />}
        {activeView === 'about' && <AboutContactView />}
        {activeView === 'contact' && <AboutContactView />}
        {activeView === 'admin' && <AdminDashboardView />}
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating WhatsApp Quick Action & Context Menu */}
      <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:bottom-6 right-3.5 sm:right-6 z-40 print:hidden flex flex-col items-end">
        {showWhatsAppMenu && (
          <div
            id="whatsapp-contact-menu"
            className="mb-2 p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-64 max-w-[calc(100vw-2rem)] space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-150 text-xs"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-700">
              <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                WhatsApp Contact
              </span>
              <button
                onClick={() => setShowWhatsAppMenu(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl font-mono text-center font-bold text-slate-800 dark:text-slate-200 text-xs select-all break-all">
              {shopSettings.whatsAppNumber}
            </div>

            <div className="flex flex-col gap-1.5">
              <button
                id="copy-whatsapp-number-btn"
                onClick={handleCopyContactNumber}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold flex items-center justify-center gap-1.5 transition text-slate-700 dark:text-slate-200 min-h-[44px] cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy contact number</span>
              </button>

              <button
                onClick={() => {
                  setShowWhatsAppMenu(false);
                  openWhatsAppFloating();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white flex items-center justify-center gap-1.5 transition shadow-2xs min-h-[44px] cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in WhatsApp</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center pt-0.5">
              Tip: Right-click or long-press anytime
            </p>
          </div>
        )}

        <button
          id="floating-whatsapp-btn"
          onClick={handleButtonClick}
          onContextMenu={handleContextMenu}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart}
          onMouseUp={handleTouchEnd}
          title="Click to chat or right-click / long-press to copy contact number"
          aria-label="WhatsApp quick chat"
          className="p-3 sm:p-3.5 min-h-[48px] min-w-[48px] rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white shadow-xl hover:scale-105 transition-transform flex items-center justify-center border-2 border-white dark:border-slate-800 cursor-pointer touch-manipulation"
        >
          <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
        </button>
      </div>

      {/* Global Toast Notification */}
      {toastMessage && (
        <div
          id="global-toast-notification"
          className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:bottom-6 left-3.5 sm:left-6 z-50 max-w-[calc(100vw-2rem)] sm:max-w-sm px-4 py-3 rounded-2xl bg-slate-900/95 text-white dark:bg-white dark:text-slate-900 shadow-2xl border border-slate-700/60 dark:border-slate-200 flex items-center gap-3 text-xs font-semibold backdrop-blur-md animate-fade-in"
        >
          <CheckCircle2 className="w-4 h-4 text-teal-400 dark:text-teal-600 shrink-0" />
          <span className="break-words">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default App;
