import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  User,
  Shield,
  LogOut,
  Settings,
  ExternalLink,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Package,
  ShoppingCart,
  Users,
  X,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AdminTab } from './AdminSidebar';

interface AdminTopNavbarProps {
  onOpenMobileMenu: () => void;
  setActiveTab: (tab: AdminTab) => void;
  unreadNotificationsCount: number;
  onOpenNotificationModal?: () => void;
}

export const AdminTopNavbar: React.FC<AdminTopNavbarProps> = ({
  onOpenMobileMenu,
  setActiveTab,
  unreadNotificationsCount,
}) => {
  const {
    isDarkMode,
    toggleDarkMode,
    currentAdminUser,
    currentUserRole,
    logoutAdmin,
    setActiveView,
    products,
    orders,
    customers,
    isSupabaseConnected,
    isSupabaseSyncing,
    syncWithSupabase,
    showToast,
  } = useApp();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter search results across Products, Orders, Customers
  const filteredProducts = searchQuery.trim()
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 4)
    : [];

  const filteredOrders = searchQuery.trim()
    ? orders
        .filter(
          (o) =>
            o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.customerMobile.includes(searchQuery)
        )
        .slice(0, 4)
    : [];

  const filteredCustomers = searchQuery.trim()
    ? customers
        .filter(
          (c) =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.mobile.includes(searchQuery) ||
            (c.email || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 4)
    : [];

  const hasSearchResults =
    filteredProducts.length > 0 || filteredOrders.length > 0 || filteredCustomers.length > 0;

  return (
    <header className="h-16 px-4 md:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
      {/* Left: Mobile Menu Trigger & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <div ref={searchRef} className="relative flex-1">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Search products, orders, customers (e.g. A4, JK, #ORD)..."
              className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Instant Search Results Dropdown */}
          {isSearchOpen && searchQuery.trim() && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-2 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                <span>Search results for "{searchQuery}"</span>
                <span className="font-medium">ESC to close</span>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
                {/* Products */}
                {filteredProducts.length > 0 && (
                  <div className="p-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-1">
                      Products
                    </span>
                    {filteredProducts.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setActiveTab('products');
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 text-left flex items-center justify-between transition cursor-pointer"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Package className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {p.name}
                          </span>
                        </div>
                        <span className="text-slate-400 text-[10px] shrink-0 font-mono">
                          {p.sku} • ₹{p.sellingPrice}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Orders */}
                {filteredOrders.length > 0 && (
                  <div className="p-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-1">
                      Orders
                    </span>
                    {filteredOrders.map((o) => (
                      <button
                        key={o.id}
                        onClick={() => {
                          setActiveTab('orders');
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/40 text-left flex items-center justify-between transition cursor-pointer"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <ShoppingCart className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {o.orderNumber} ({o.customerName})
                          </span>
                        </div>
                        <span className="text-slate-400 text-[10px] shrink-0 font-mono">
                          ₹{o.grandTotal} • {o.orderStatus}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Customers */}
                {filteredCustomers.length > 0 && (
                  <div className="p-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-1">
                      Customers
                    </span>
                    {filteredCustomers.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setActiveTab('customers');
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-left flex items-center justify-between transition cursor-pointer"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Users className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {c.name}
                          </span>
                        </div>
                        <span className="text-slate-400 text-[10px] shrink-0 font-mono">{c.mobile}</span>
                      </button>
                    ))}
                  </div>
                )}

                {!hasSearchResults && (
                  <div className="p-4 text-center text-slate-400">
                    No matching records found for "{searchQuery}".
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Supabase Status Pill */}
        <button
          onClick={() => {
            syncWithSupabase();
            showToast('Syncing with Supabase live database...');
          }}
          title={isSupabaseConnected ? 'Live Supabase Connected' : 'Connecting to Supabase...'}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100 transition cursor-pointer"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isSupabaseSyncing ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'
            }`}
          />
          <span>{isSupabaseSyncing ? 'Syncing...' : 'Supabase Live'}</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Notifications Bell Dropdown */}
        <div ref={notificationsRef} className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Notifications"
            aria-label="Open notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-blue-600" />
                  Store Notifications
                </span>
                {unreadNotificationsCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                    {unreadNotificationsCount} unread
                  </span>
                )}
              </div>

              <div className="py-2 space-y-2 text-xs">
                <div
                  onClick={() => {
                    setActiveTab('orders');
                    setIsNotificationsOpen(false);
                  }}
                  className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/40 hover:bg-orange-100/70 transition cursor-pointer flex items-start gap-2"
                >
                  <ShoppingCart className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      Order Management
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {orders.length} total orders recorded in Supabase.
                    </span>
                  </div>
                </div>

                <div
                  onClick={() => {
                    setActiveTab('inventory');
                    setIsNotificationsOpen(false);
                  }}
                  className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 hover:bg-amber-100/70 transition cursor-pointer flex items-start gap-2"
                >
                  <Package className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      Inventory Status
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Check low stock limits and reorder reams & paper.
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveTab('notifications');
                  setIsNotificationsOpen(false);
                }}
                className="w-full py-1.5 text-center text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition cursor-pointer border-t border-slate-100 dark:border-slate-700 pt-2"
              >
                View all notifications →
              </button>
            </div>
          )}
        </div>

        {/* Profile Pill & Dropdown */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 transition cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-700 to-orange-500 flex items-center justify-center text-white font-bold text-xs shadow-xs">
              {(currentAdminUser?.name || 'Admin')[0].toUpperCase()}
            </div>
            <div className="hidden sm:flex flex-col text-left leading-none">
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                {currentAdminUser?.name || 'Administrator'}
              </span>
              <span className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold uppercase tracking-wider">
                {currentUserRole === 'super_admin' ? 'Super Admin' : 'Admin'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700/60 mb-1">
                <span className="font-bold text-slate-900 dark:text-white block truncate">
                  {currentAdminUser?.name || 'TREO Administrator'}
                </span>
                <span className="text-[10px] text-slate-400 truncate block">
                  {currentAdminUser?.email || 'admin@treoenterprises.com'}
                </span>
              </div>

              <button
                onClick={() => {
                  setActiveTab('settings');
                  setIsProfileOpen(false);
                }}
                className="w-full px-3 py-2 rounded-xl text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/70 font-semibold flex items-center gap-2 transition cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span>Store Settings</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('staff');
                  setIsProfileOpen(false);
                }}
                className="w-full px-3 py-2 rounded-xl text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/70 font-semibold flex items-center gap-2 transition cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                <span>Admin Users & Access</span>
              </button>

              <button
                onClick={() => {
                  setActiveView('home');
                  setIsProfileOpen(false);
                }}
                className="w-full px-3 py-2 rounded-xl text-left text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-semibold flex items-center gap-2 transition cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Storefront</span>
              </button>

              <div className="my-1 border-t border-slate-100 dark:border-slate-700/60" />

              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  logoutAdmin();
                }}
                className="w-full px-3 py-2 rounded-xl text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold flex items-center gap-2 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
