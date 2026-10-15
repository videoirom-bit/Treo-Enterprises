import React from 'react';
import {
  LayoutDashboard,
  Package,
  Layers,
  Boxes,
  ShoppingCart,
  Users,
  Building2,
  TrendingUp,
  FileBarChart,
  Bell,
  Shield,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Store,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';

export type AdminTab =
  | 'overview'
  | 'products'
  | 'categories'
  | 'inventory'
  | 'orders'
  | 'customers'
  | 'suppliers'
  | 'sales'
  | 'reports'
  | 'notifications'
  | 'staff'
  | 'settings';

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  unreadNotificationsCount: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  unreadNotificationsCount,
}) => {
  const { shopSettings, logoutAdmin, setActiveView, products, orders } = useApp();

  const lowStockCount = products.filter((p) => p.currentStock <= p.minimumStock).length;
  const pendingOrdersCount = orders.filter(
    (o) => (o.orderStatus || '').toLowerCase() === 'pending' || (o.orderStatus || '').toLowerCase() === 'order placed'
  ).length;

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'products', label: 'Products', icon: Package, badge: products.length > 0 ? products.length : null },
    { id: 'categories', label: 'Categories', icon: Layers, badge: null },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: Boxes,
      badge: lowStockCount > 0 ? { text: `${lowStockCount} low`, color: 'bg-amber-500' } : null,
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: ShoppingCart,
      badge: pendingOrdersCount > 0 ? { text: `${pendingOrdersCount} new`, color: 'bg-orange-500' } : null,
    },
    { id: 'customers', label: 'Customers', icon: Users, badge: null },
    { id: 'suppliers', label: 'Suppliers', icon: Building2, badge: null },
    { id: 'sales', label: 'Sales', icon: TrendingUp, badge: null },
    { id: 'reports', label: 'Reports', icon: FileBarChart, badge: null },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadNotificationsCount > 0 ? { text: String(unreadNotificationsCount), color: 'bg-red-500' } : null,
    },
    { id: 'staff', label: 'Admin Users', icon: Shield, badge: null },
    { id: 'settings', label: 'Settings', icon: Settings, badge: null },
  ] as const;

  const handleNavClick = (tabId: AdminTab) => {
    setActiveTab(tabId);
    setIsMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/40">
        <div
          onClick={() => handleNavClick('overview')}
          className="flex items-center gap-3 cursor-pointer overflow-hidden group"
          title="TREO ENTERPRISES Admin"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 via-blue-600 to-orange-500 p-0.5 shadow-md flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center overflow-hidden p-1">
              <img
                src="/treo-logo.svg"
                alt="Treo Logo"
                className="w-full h-full object-contain filter drop-shadow-xs"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>

          {(!isCollapsed || isMobileOpen) && (
            <div className="min-w-0 flex flex-col leading-tight">
              <span className="font-black text-sm tracking-wider text-white truncate flex items-center gap-1.5">
                TREO
                <span className="text-orange-400 font-extrabold text-xs px-1.5 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/20">
                  ENTERPRISES
                </span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium truncate uppercase tracking-widest">
                Business Admin
              </span>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        {isMobileOpen && (
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id as AdminTab)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-900/30'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              } ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}`}
            >
              {/* Active Route Glow Indicator */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-orange-400 rounded-r-full shadow-sm shadow-orange-400" />
              )}

              <Icon
                className={`w-4 h-4 shrink-0 transition-transform ${
                  isActive ? 'text-white scale-110' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />

              {(!isCollapsed || isMobileOpen) && (
                <span className="truncate flex-1 text-left">{item.label}</span>
              )}

              {/* Badge */}
              {(!isCollapsed || isMobileOpen) && item.badge && (
                typeof item.badge === 'number' ? (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-slate-800 text-slate-300 border border-slate-700/60">
                    {item.badge}
                  </span>
                ) : (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold text-white rounded-md shrink-0 shadow-2xs ${item.badge.color}`}
                  >
                    {item.badge.text}
                  </span>
                )
              )}

              {/* Collapsed Badge Dot */}
              {isCollapsed && !isMobileOpen && item.badge && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500 ring-2 ring-slate-900" />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Section */}
      <div className="p-2 border-t border-slate-800 bg-slate-950/60 space-y-1">
        {/* View Storefront Link */}
        <button
          onClick={() => setActiveView('home')}
          title={isCollapsed ? 'View Storefront' : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/90 transition cursor-pointer ${
            isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''
          }`}
        >
          <Store className="w-4 h-4 text-emerald-400 shrink-0" />
          {(!isCollapsed || isMobileOpen) && (
            <>
              <span className="truncate flex-1 text-left">View Storefront</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={() => logoutAdmin()}
          title={isCollapsed ? 'Logout' : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition cursor-pointer ${
            isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''
          }`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {(!isCollapsed || isMobileOpen) && <span className="truncate">Logout</span>}
        </button>

        {/* Collapse toggle (Desktop only) */}
        <div className="hidden md:flex justify-end pt-1">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-xs transition cursor-pointer"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:block shrink-0 h-screen sticky top-0 transition-all duration-300 z-30 ${
          isCollapsed ? 'w-18' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (with backdrop) */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10"
            >
              {sidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
