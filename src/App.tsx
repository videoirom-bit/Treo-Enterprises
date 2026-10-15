import React, { useState, useEffect, useRef } from 'react';
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
import { AdminAuthView } from './views/AdminAuthView';
import { AccessDeniedView } from './views/AccessDeniedView';
import { TrackOrderView } from './views/TrackOrderView';
import { CustomerPortalView } from './views/CustomerPortalView';
import { CheckCircle2, MessageCircle, Copy, Phone, X, ExternalLink } from 'lucide-react';
import { supabase, verifyUserAdminRoleInDatabase } from './services/supabaseService';

export function App() {
  const {
    activeView,
    setActiveView,
    toastMessage,
    shopSettings,
    isDarkMode,
    showToast,
    isAdminLoggedIn,
    setIsAdminLoggedIn,
    isCustomerLoggedIn,
    currentUserRole,
    setCurrentUserRole,
    logoutCustomer,
  } = useApp();
  const [showWhatsAppMenu, setShowWhatsAppMenu] = useState(false);
  const [adminDashboardTab, setAdminDashboardTab] = useState<any>('overview');
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);

  // Keep ref of activeView to prevent redundant state updates
  const activeViewRef = useRef(activeView);
  useEffect(() => {
    activeViewRef.current = activeView;
  }, [activeView]);

  // Synchronize browser URL navigation with application state and enforce strict role protection
  useEffect(() => {
    const handleRouteSync = async () => {
      const path = window.location.pathname.toLowerCase();

      if (path === '/admin') {
        if (isAdminLoggedIn && (currentUserRole === 'admin' || currentUserRole === 'super_admin')) {
          if (activeViewRef.current !== 'admin-dashboard') {
            setActiveView('admin-dashboard');
          }
        } else {
          if (activeViewRef.current !== 'admin') {
            setActiveView('admin');
          }
        }
        return;
      }

      if (path.startsWith('/admin/') && path !== '/admin') {
        // Strict Security: Verify role server-side / database-side. Never trust client state alone.
        const token =
          localStorage.getItem('abc_stationery_v1_admin_token') ||
          localStorage.getItem('abc_stationery_v1_auth_token');

        let isAuthorized = false;
        let verifiedRole: any = null;

        // 1. Verify via backend server endpoint
        if (token) {
          try {
            const res = await fetch('/api/admin/verify-session', {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              const data = await res.json();
              if (data.authorized && (data.role === 'admin' || data.role === 'super_admin')) {
                isAuthorized = true;
                verifiedRole = data.role;
              }
            }
          } catch (e) {
            console.warn('Backend session verification error:', e);
          }
        }

        // 2. Fallback: Verify via Supabase Auth & Database
        if (!isAuthorized) {
          try {
            const {
              data: { session },
            } = await supabase.auth.getSession();
            if (session?.user) {
              const roleCheck = await verifyUserAdminRoleInDatabase({
                id: session.user.id,
                email: session.user.email,
              });
              if (roleCheck.isAuthorized && (roleCheck.role === 'admin' || roleCheck.role === 'super_admin')) {
                isAuthorized = true;
                verifiedRole = roleCheck.role;
              }
            }
          } catch (e) {
            console.warn('Supabase session verification error:', e);
          }
        }

        if (isAuthorized) {
          setIsAdminLoggedIn(true);
          if (verifiedRole) setCurrentUserRole(verifiedRole);

          const subTab = path.replace('/admin/', '');
          if (subTab === 'products') setAdminDashboardTab('products');
          else if (subTab === 'categories') setAdminDashboardTab('categories');
          else if (subTab === 'inventory') setAdminDashboardTab('inventory');
          else if (subTab === 'orders') setAdminDashboardTab('orders');
          else if (subTab === 'customers') setAdminDashboardTab('customers');
          else if (subTab === 'suppliers') setAdminDashboardTab('suppliers');
          else if (subTab === 'sales') setAdminDashboardTab('sales');
          else if (subTab === 'reports') setAdminDashboardTab('reports');
          else if (subTab === 'notifications') setAdminDashboardTab('notifications');
          else if (subTab === 'staff') setAdminDashboardTab('staff');
          else if (subTab === 'settings') setAdminDashboardTab('settings');
          else setAdminDashboardTab('overview');

          if (activeViewRef.current !== 'admin-dashboard') {
            setActiveView('admin-dashboard');
          }
        } else {
          // If a normal authenticated user or visitor manually visits /admin/dashboard:
          // Deny access and redirect them to the Admin Sign-In page.
          window.history.replaceState(null, '', '/admin');
          if (activeViewRef.current !== 'admin') {
            setActiveView('admin');
            showToast('Access Denied: Please sign in with an authorized administrator account.');
          }
        }
        return;
      }

      // Customer routes
      let targetView: any = 'home';
      if (path === '/products') targetView = 'products';
      else if (path === '/categories') targetView = 'categories';
      else if (path === '/offers') targetView = 'offers';
      else if (path === '/cart') targetView = 'cart';
      else if (path === '/checkout') targetView = 'checkout';
      else if (path === '/track-order') targetView = 'track-order';
      else if (path === '/customer-portal') targetView = 'customer-portal';
      else if (path === '/about') targetView = 'about';
      else if (path === '/contact') targetView = 'contact';
      else if (path === '/' || path === '') targetView = 'home';

      if (activeViewRef.current !== targetView) {
        setActiveView(targetView);
      }
    };

    handleRouteSync();
    window.addEventListener('popstate', handleRouteSync);
    return () => window.removeEventListener('popstate', handleRouteSync);
  }, []);

  // Keep browser URL synchronized with activeView
  useEffect(() => {
    const currentPath = window.location.pathname.toLowerCase();
    let targetPath = '/';

    if (activeView === 'admin') targetPath = '/admin';
    else if (activeView === 'admin-dashboard') {
      const tabPaths: Record<string, string> = {
        products: '/admin/products',
        categories: '/admin/categories',
        inventory: '/admin/inventory',
        orders: '/admin/orders',
        customers: '/admin/customers',
        suppliers: '/admin/suppliers',
        sales: '/admin/sales',
        reports: '/admin/reports',
        notifications: '/admin/notifications',
        staff: '/admin/staff',
        settings: '/admin/settings',
        overview: '/admin/dashboard',
      };
      targetPath = tabPaths[adminDashboardTab] || '/admin/dashboard';
    } else if (activeView === 'products') targetPath = '/products';
    else if (activeView === 'categories') targetPath = '/categories';
    else if (activeView === 'offers') targetPath = '/offers';
    else if (activeView === 'cart') targetPath = '/cart';
    else if (activeView === 'checkout') targetPath = '/checkout';
    else if (activeView === 'invoice-view') targetPath = '/invoice-view';
    else if (activeView === 'track-order') targetPath = '/track-order';
    else if (activeView === 'customer-portal') targetPath = '/customer-portal';
    else if (activeView === 'about') targetPath = '/about';
    else if (activeView === 'contact') targetPath = '/contact';

    if (currentPath !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  }, [activeView, adminDashboardTab]);

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

  const isAdminDashboardRoute =
    activeView === 'admin-dashboard' ||
    (activeView === 'admin' && isAdminLoggedIn && (currentUserRole === 'admin' || currentUserRole === 'super_admin'));

  return (
    <div className={`${isDarkMode ? 'dark' : ''} min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors selection:bg-blue-600 selection:text-white`}>
      {/* Header (Hidden in Admin Dashboard) */}
      {!isAdminDashboardRoute && <Header />}

      {/* Main App Content View */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden flex flex-col">
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
        {activeView === 'admin' && (
          isAdminLoggedIn && (currentUserRole === 'admin' || currentUserRole === 'super_admin') ? (
            <AdminDashboardView initialTab={adminDashboardTab} />
          ) : (
            <AdminAuthView />
          )
        )}
        {activeView === 'admin-dashboard' && (
          isAdminLoggedIn && (currentUserRole === 'admin' || currentUserRole === 'super_admin') ? (
            <AdminDashboardView initialTab={adminDashboardTab} />
          ) : (
            <AccessDeniedView
              onSwitchToLogin={() => {
                logoutCustomer();
                setActiveView('admin');
              }}
            />
          )
        )}
        {activeView === 'access-denied' && (
          <AccessDeniedView
            onSwitchToLogin={() => {
              logoutCustomer();
              setActiveView('admin');
            }}
          />
        )}
      </main>

      {/* Footer (Hidden in Admin Dashboard) */}
      {!isAdminDashboardRoute && <Footer />}

      {/* Floating WhatsApp Quick Action & Context Menu (Hidden in Admin Dashboard) */}
      {!isAdminDashboardRoute && (
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
      )}


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
