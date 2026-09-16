import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { ABCStoreLogo } from './ABCStoreLogo';
import {
  ShoppingBag,
  Search,
  MessageCircle,
  User,
  Moon,
  Sun,
  ShieldCheck,
  Menu,
  X,
  Phone,
  Store,
  Copy,
  Truck,
  Home,
  Package,
  Grid,
  Sparkles,
  Info,
  PhoneCall,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    shopSettings,
    cartTotalCount,
    activeView,
    setActiveView,
    searchQuery,
    setSearchQuery,
    isDarkMode,
    toggleDarkMode,
    isAdminLoggedIn,
    currentAdminUser,
    showToast,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showHeaderWhatsAppMenu, setShowHeaderWhatsAppMenu] = useState(false);
  const headerLongPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHeaderLongPressRef = useRef(false);

  const handleNavClick = (view: any) => {
    setActiveView(view);
    setMobileMenuOpen(false);
  };

  const openWhatsAppSupport = () => {
    const cleanNumber = (shopSettings?.whatsAppNumber || '').replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `Hello ${shopSettings?.shopName || 'ABC Paper & Stationery'}, I would like to inquire about paper and stationery supplies.`
    );
    window.open(`https://wa.me/${cleanNumber}?text=${text}`, '_blank');
  };

  const handleCopyHeaderNumber = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const num = shopSettings?.whatsAppNumber || '';
    navigator.clipboard.writeText(num);
    showToast(`Copied WhatsApp contact: ${num}`);
    setShowHeaderWhatsAppMenu(false);
  };

  const handleTouchStart = () => {
    isHeaderLongPressRef.current = false;
    headerLongPressTimerRef.current = setTimeout(() => {
      isHeaderLongPressRef.current = true;
      setShowHeaderWhatsAppMenu(true);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (headerLongPressTimerRef.current) {
      clearTimeout(headerLongPressTimerRef.current);
      headerLongPressTimerRef.current = null;
    }
  };

  const handleButtonClick = () => {
    if (isHeaderLongPressRef.current) {
      isHeaderLongPressRef.current = false;
      return;
    }
    openWhatsAppSupport();
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowHeaderWhatsAppMenu(true);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors shadow-xs print:hidden overflow-x-clip">
      {/* Top micro-bar with contact & quick note */}
      <div className="w-full bg-slate-900 text-slate-200 text-xs py-1 sm:py-1.5 px-2.5 sm:px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-2">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
            <a
              href={`tel:${(shopSettings?.phoneNumber || '').replace(/[^0-9+]/g, '')}`}
              className="flex items-center gap-1 text-[11px] sm:text-xs truncate hover:text-amber-400 transition"
              title="Click to call shop"
            >
              <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
              <span className="truncate font-medium">{shopSettings.phoneNumber}</span>
            </a>
            <span className="hidden sm:inline-block text-slate-400">|</span>
            <span className="hidden md:inline-block text-slate-300">
              GSTIN: <span className="font-mono text-amber-300">{shopSettings.gstin}</span>
            </span>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-3 text-[11px] shrink-0">
            <span className="hidden lg:inline text-slate-300">{shopSettings.openingHours}</span>
            <button
              id="header-admin-link-btn"
              onClick={() => handleNavClick('admin')}
              className="flex items-center gap-1 text-teal-300 hover:text-white transition font-medium px-1.5 sm:px-2 py-0.5 rounded hover:bg-slate-800 text-[10px] sm:text-[11px] whitespace-nowrap"
            >
              <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 text-teal-400" />
              <span>Admin</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <div className="w-full max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12 sm:h-16 gap-1.5 sm:gap-3">
          {/* Brand Logo & Name */}
          <div
            id="brand-logo-container"
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer shrink min-w-0 max-w-[calc(100vw-105px)] sm:max-w-none group"
          >
            <ABCStoreLogo size="md" variant="full" inverted={isDarkMode} />
          </div>

          {/* Search bar in center (Desktop only) */}
          <div className="hidden md:flex flex-1 max-w-[320px] lg:max-w-[380px] mx-2 lg:mx-3">
            <div className="relative w-full">
              <input
                id="global-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (activeView !== 'products') {
                    setActiveView('products');
                  }
                }}
                placeholder="Search stationery, paper, pens..."
                className="w-full pl-8.5 pr-8 py-1.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs lg:text-sm focus:outline-none focus:ring-0 focus:border-slate-200 dark:focus:border-slate-700 dark:text-white placeholder-slate-400 transition"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Header Action Items */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Track Order Direct Action Button */}
            <button
              id="header-track-order-btn"
              onClick={() => handleNavClick('track-order')}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition border cursor-pointer ${
                activeView === 'track-order'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 border-blue-200 dark:border-blue-800'
              }`}
            >
              <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Track Order</span>
            </button>

            {/* WhatsApp Quick Order button */}
            <div className="relative hidden sm:block">
              {showHeaderWhatsAppMenu && (
                <div
                  id="header-whatsapp-menu"
                  className="absolute right-0 top-full mt-2 p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 w-56 space-y-1.5 z-50 text-xs"
                >
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-700">
                    <span className="font-bold text-slate-700 dark:text-slate-200 text-[11px]">
                      {shopSettings.whatsAppNumber}
                    </span>
                    <button
                      onClick={() => setShowHeaderWhatsAppMenu(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <button
                    id="header-copy-whatsapp-btn"
                    onClick={handleCopyHeaderNumber}
                    className="w-full py-1.5 px-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold flex items-center justify-center gap-1.5 transition text-slate-700 dark:text-slate-200 text-[11px]"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy contact number</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowHeaderWhatsAppMenu(false);
                      openWhatsAppSupport();
                    }}
                    className="w-full py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-white flex items-center justify-center gap-1.5 transition text-[11px]"
                  >
                    <span>Open in WhatsApp</span>
                  </button>
                </div>
              )}
              <button
                id="header-whatsapp-btn"
                onClick={handleButtonClick}
                onContextMenu={handleContextMenu}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleTouchStart}
                onMouseUp={handleTouchEnd}
                title="Click to chat, or right-click / long-press to copy contact number"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition border border-emerald-200 dark:border-emerald-800 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp</span>
              </button>
            </div>

            {/* Dark mode toggle (Desktop only) */}
            <button
              id="theme-toggle-btn"
              onClick={toggleDarkMode}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="hidden md:flex p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all items-center justify-center focus:outline-hidden focus:ring-2 focus:ring-teal-500 shadow-2xs"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-amber-400 transition-transform duration-300 hover:rotate-45" />
              ) : (
                <Moon className="w-5 h-5 text-slate-600 transition-transform duration-300 hover:-rotate-12" />
              )}
            </button>

            {/* Cart Icon & Badge */}
            <button
              id="header-cart-btn"
              onClick={() => handleNavClick('cart')}
              aria-label="Shopping Cart"
              className="relative p-1.5 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-slate-800 dark:text-slate-100 transition group w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center cursor-pointer touch-manipulation shrink-0"
            >
              <ShoppingBag className="w-4.5 h-4.5 sm:w-5 sm:h-5 group-hover:text-teal-600 transition" />
              {cartTotalCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 font-bold text-[10px] sm:text-[11px] w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow-xs animate-pulse">
                  {cartTotalCount}
                </span>
              )}
            </button>

            {/* Mobile menu trigger */}
            <button
              id="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="md:hidden p-1.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 w-9 h-9 flex items-center justify-center cursor-pointer touch-manipulation shrink-0"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Quick Search Bar (Directly accessible on mobile devices) */}
        <div className="md:hidden pb-1.5 pt-0 px-0.5 w-full">
          <div className="relative w-full">
            <input
              id="mobile-global-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeView !== 'products') {
                  setActiveView('products');
                }
              }}
              placeholder="Search paper, pens, registers..."
              className="w-full pl-8 pr-8 py-1.5 bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-0 focus:border-slate-200 dark:focus:border-slate-700 dark:text-white placeholder-slate-400 transition"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 flex items-center justify-center cursor-pointer touch-manipulation"
                title="Clear search"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5 py-2 border-t border-slate-100 dark:border-slate-800 text-xs lg:text-sm font-medium overflow-x-auto scrollbar-none whitespace-nowrap">
          <button
            id="nav-link-home"
            onClick={() => handleNavClick('home')}
            className={`px-3 lg:px-4 py-1.5 rounded-lg transition whitespace-nowrap shrink-0 ${
              activeView === 'home'
                ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            Home
          </button>
          <button
            id="nav-link-products"
            onClick={() => handleNavClick('products')}
            className={`px-3 lg:px-4 py-1.5 rounded-lg transition whitespace-nowrap shrink-0 ${
              activeView === 'products'
                ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            All Products
          </button>
          <button
            id="nav-link-categories"
            onClick={() => handleNavClick('categories')}
            className={`px-3 lg:px-4 py-1.5 rounded-lg transition whitespace-nowrap shrink-0 ${
              activeView === 'categories'
                ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            Categories
          </button>
          <button
            id="nav-link-offers"
            onClick={() => handleNavClick('offers')}
            className={`px-3 lg:px-4 py-1.5 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeView === 'offers'
                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <span>Today's Offers</span>
          </button>
          <button
            id="nav-link-about"
            onClick={() => handleNavClick('about')}
            className={`px-3 lg:px-4 py-1.5 rounded-lg transition whitespace-nowrap shrink-0 ${
              activeView === 'about'
                ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            About Us
          </button>
          <button
            id="nav-link-contact"
            onClick={() => handleNavClick('contact')}
            className={`px-3 lg:px-4 py-1.5 rounded-lg transition whitespace-nowrap shrink-0 ${
              activeView === 'contact'
                ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            Contact
          </button>

          <div className="flex-1 min-w-4" />

          {/* Quick link to customer orders / track invoice */}
          <button
            id="nav-link-customer-portal"
            onClick={() => handleNavClick('customer-portal')}
            className={`text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeView === 'customer-portal'
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
            }`}
          >
            <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>My Account & Orders</span>
          </button>

          {/* Direct link to Admin Portal */}
          <button
            id="nav-link-admin-portal"
            onClick={() => handleNavClick('admin')}
            className={`text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeView === 'admin'
                ? 'bg-slate-900 text-white dark:bg-teal-600 dark:text-white font-bold shadow-xs'
                : 'text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 font-semibold'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-teal-500 dark:text-teal-300" />
            <span>Admin Dashboard</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          </button>
        </nav>
      </div>

      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 top-[112px] sm:top-[125px] bg-slate-950/60 backdrop-blur-xs z-30 md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden relative z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 py-3 space-y-2.5 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150 max-h-[calc(100vh-115px)] overflow-y-auto">
          {/* Quick theme & contact row in mobile menu */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
            <button
              onClick={toggleDarkMode}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium"
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-600" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                openWhatsAppSupport();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-medium"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp Shop</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-xs font-semibold">
            <button
              id="mobile-nav-home"
              onClick={() => handleNavClick('home')}
              className={`text-left px-2.5 py-2.5 rounded-xl flex items-center gap-2 transition min-h-[44px] ${
                activeView === 'home'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Home className={`w-4 h-4 shrink-0 ${activeView === 'home' ? 'text-white' : 'text-teal-600 dark:text-teal-400'}`} />
              <span className="truncate">Home</span>
            </button>

            <button
              id="mobile-nav-products"
              onClick={() => handleNavClick('products')}
              className={`text-left px-2.5 py-2.5 rounded-xl flex items-center gap-2 transition min-h-[44px] ${
                activeView === 'products'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Package className={`w-4 h-4 shrink-0 ${activeView === 'products' ? 'text-white' : 'text-teal-600 dark:text-teal-400'}`} />
              <span className="truncate">All Products</span>
            </button>

            <button
              id="mobile-nav-categories"
              onClick={() => handleNavClick('categories')}
              className={`text-left px-2.5 py-2.5 rounded-xl flex items-center gap-2 transition min-h-[44px] ${
                activeView === 'categories'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Grid className={`w-4 h-4 shrink-0 ${activeView === 'categories' ? 'text-white' : 'text-teal-600 dark:text-teal-400'}`} />
              <span className="truncate">Categories</span>
            </button>

            <button
              id="mobile-nav-offers"
              onClick={() => handleNavClick('offers')}
              className={`text-left px-2.5 py-2.5 rounded-xl flex items-center gap-2 transition min-h-[44px] ${
                activeView === 'offers'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/60 hover:bg-amber-100'
              }`}
            >
              <Sparkles className={`w-4 h-4 shrink-0 ${activeView === 'offers' ? 'text-slate-950' : 'text-amber-500'}`} />
              <span className="truncate">Today's Offers</span>
            </button>

            <button
              id="mobile-nav-about"
              onClick={() => handleNavClick('about')}
              className={`text-left px-2.5 py-2.5 rounded-xl flex items-center gap-2 transition min-h-[44px] ${
                activeView === 'about'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Info className={`w-4 h-4 shrink-0 ${activeView === 'about' ? 'text-white' : 'text-teal-600 dark:text-teal-400'}`} />
              <span className="truncate">About Us</span>
            </button>

            <button
              id="mobile-nav-contact"
              onClick={() => handleNavClick('contact')}
              className={`text-left px-2.5 py-2.5 rounded-xl flex items-center gap-2 transition min-h-[44px] ${
                activeView === 'contact'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <PhoneCall className={`w-4 h-4 shrink-0 ${activeView === 'contact' ? 'text-white' : 'text-teal-600 dark:text-teal-400'}`} />
              <span className="truncate">Contact</span>
            </button>

            <button
              id="mobile-nav-track-order"
              onClick={() => handleNavClick('track-order')}
              className={`text-left px-2.5 py-2.5 rounded-xl flex items-center gap-2 transition min-h-[44px] ${
                activeView === 'track-order'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 hover:bg-blue-100'
              }`}
            >
              <Truck className={`w-4 h-4 shrink-0 ${activeView === 'track-order' ? 'text-white' : 'text-blue-600'}`} />
              <span className="truncate">Track Order</span>
            </button>

            <button
              id="mobile-nav-customer-portal"
              onClick={() => handleNavClick('customer-portal')}
              className={`text-left px-2.5 py-2.5 rounded-xl flex items-center gap-2 transition min-h-[44px] ${
                activeView === 'customer-portal'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-100'
              }`}
            >
              <User className={`w-4 h-4 shrink-0 ${activeView === 'customer-portal' ? 'text-white' : 'text-emerald-600'}`} />
              <span className="truncate">My Orders</span>
            </button>

            <button
              id="mobile-nav-cart"
              onClick={() => handleNavClick('cart')}
              className={`text-left px-3 py-2.5 rounded-xl col-span-2 flex items-center justify-between transition min-h-[44px] ${
                activeView === 'cart'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-900/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 shrink-0" />
                <span>View Shopping Cart</span>
              </div>
              <span className={`font-bold text-xs px-2 py-0.5 rounded-md ${
                activeView === 'cart' ? 'bg-white text-teal-800' : 'bg-teal-600 text-white'
              }`}>
                {cartTotalCount} items
              </span>
            </button>

            <button
              id="mobile-nav-admin-btn"
              onClick={() => handleNavClick('admin')}
              className={`text-left px-3 py-2.5 rounded-xl col-span-2 flex items-center justify-between transition min-h-[44px] ${
                activeView === 'admin'
                  ? 'bg-slate-900 text-white dark:bg-slate-800 border-2 border-teal-400 shadow-md'
                  : 'bg-slate-900 text-white dark:bg-slate-800 border border-teal-500/40 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <ShieldCheck className="w-4 h-4 shrink-0 text-teal-400" />
                <div className="min-w-0">
                  <div className="font-semibold text-xs leading-tight truncate">
                    Admin Dashboard
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight truncate">
                    Inventory, Orders, POS, GST & Reports
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 bg-teal-500/20 text-teal-300 border border-teal-400/30 ml-2">
                Direct
              </span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
