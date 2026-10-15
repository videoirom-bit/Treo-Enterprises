import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { AdminSidebar, AdminTab } from '../components/admin/AdminSidebar';
import { AdminTopNavbar } from '../components/admin/AdminTopNavbar';
import { AdminDashboardOverview } from '../components/admin/AdminDashboardOverview';
import { AdminProductsTab } from '../components/admin/AdminProductsTab';
import { AdminCategoriesTab } from '../components/admin/AdminCategoriesTab';
import { AdminInventoryTab } from '../components/admin/AdminInventoryTab';
import { AdminOrdersTab } from '../components/admin/AdminOrdersTab';
import { AdminCustomersTab } from '../components/admin/AdminCustomersTab';
import { AdminSuppliersTab } from '../components/admin/AdminSuppliersTab';
import { AdminReportsTab } from '../components/admin/AdminReportsTab';
import {
  AdminNotificationsTab,
  StoreNotificationItem,
} from '../components/admin/AdminNotificationsTab';
import { AdminUsersTab } from '../components/admin/AdminUsersTab';
import { AdminSettingsTab } from '../components/admin/AdminSettingsTab';
import { AdminInvoiceModal } from '../components/admin/AdminInvoiceModal';
import { Order } from '../types';

export interface AdminDashboardViewProps {
  initialTab?: AdminTab;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ initialTab }) => {
  const { products, orders, customers, isDarkMode } = useApp();

  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab || 'overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Invoice & Order Modals
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<Order | null>(null);

  // Sync tab with initialTab prop if updated from URL
  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Synchronize browser URL bar on tab changes
  useEffect(() => {
    const routeMap: Record<AdminTab, string> = {
      overview: '/admin/dashboard',
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
    };

    const targetUrl = routeMap[activeTab] || '/admin/dashboard';
    if (window.location.pathname !== targetUrl) {
      window.history.pushState(null, '', targetUrl);
    }
  }, [activeTab]);

  // Read notifications state stored in localStorage or memory
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('treo_read_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Dynamically generate real notifications based on actual Supabase store events
  const allNotifications = useMemo<StoreNotificationItem[]>(() => {
    const items: StoreNotificationItem[] = [];

    // 1. Pending & New Orders
    orders.forEach((o) => {
      const isPending =
        (o.orderStatus || '').toLowerCase() === 'pending' ||
        (o.orderStatus || '').toLowerCase() === 'order placed';
      if (isPending) {
        items.push({
          id: `notif-order-${o.id}`,
          type: 'order',
          title: `New Order #${o.orderNumber}`,
          message: `${o.customerName} placed an order for ₹${o.grandTotal}. Requires processing.`,
          timestamp: o.orderDate || new Date().toISOString(),
          isRead: readNotificationIds.includes(`notif-order-${o.id}`),
          linkTab: 'orders',
        });
      }

      // Paid / Payment update
      if (o.paymentStatus === 'Paid') {
        items.push({
          id: `notif-pay-${o.id}`,
          type: 'payment',
          title: `Payment Received for #${o.orderNumber}`,
          message: `Received ₹${o.grandTotal} via ${o.paymentMethod || 'UPI'}.`,
          timestamp: o.orderDate || new Date().toISOString(),
          isRead: readNotificationIds.includes(`notif-pay-${o.id}`),
          linkTab: 'orders',
        });
      }
    });

    // 2. Low Stock & Out of Stock Alerts
    products.forEach((p) => {
      if (p.currentStock <= 0) {
        items.push({
          id: `notif-stock-out-${p.id}`,
          type: 'out_of_stock',
          title: `Out of Stock: ${p.name}`,
          message: `Stock level is 0 ${p.unit || 'pcs'}. Immediate supplier restock required.`,
          timestamp: p.updatedAt || new Date().toISOString(),
          isRead: readNotificationIds.includes(`notif-stock-out-${p.id}`),
          linkTab: 'inventory',
        });
      } else if (p.currentStock <= p.minimumStock) {
        items.push({
          id: `notif-stock-low-${p.id}`,
          type: 'low_stock',
          title: `Low Stock Alert: ${p.name}`,
          message: `Remaining stock is ${p.currentStock} ${p.unit || 'pcs'} (Limit: ${p.minimumStock}).`,
          timestamp: p.updatedAt || new Date().toISOString(),
          isRead: readNotificationIds.includes(`notif-stock-low-${p.id}`),
          linkTab: 'inventory',
        });
      }
    });

    // Sort by timestamp newest first
    return items.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [orders, products, readNotificationIds]);

  const unreadCount = allNotifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = (id: string) => {
    setReadNotificationIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        localStorage.setItem('treo_read_notifications', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleMarkAllAsRead = () => {
    const allIds = allNotifications.map((n) => n.id);
    setReadNotificationIds(allIds);
    try {
      localStorage.setItem('treo_read_notifications', JSON.stringify(allIds));
    } catch {}
  };

  const handleClearNotifications = () => {
    const allIds = allNotifications.map((n) => n.id);
    setReadNotificationIds(allIds);
    try {
      localStorage.setItem('treo_read_notifications', JSON.stringify(allIds));
    } catch {}
  };

  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrderForDetails(order);
    setActiveTab('orders');
  };

  const handleGenerateInvoice = (order: Order) => {
    setSelectedOrderForInvoice(order);
  };

  return (
    <div className={`min-h-screen flex w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : ''}`}>
      {/* 1. Collapsible Desktop & Mobile Drawer Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
        unreadNotificationsCount={unreadCount}
      />

      {/* Main Admin Content Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* 2. Top Navbar */}
        <AdminTopNavbar
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          setActiveTab={setActiveTab}
          unreadNotificationsCount={unreadCount}
        />

        {/* 3. Tab Views */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'overview' && (
            <AdminDashboardOverview
              setActiveTab={setActiveTab}
              onViewOrderDetails={handleViewOrderDetails}
              onGenerateInvoice={handleGenerateInvoice}
            />
          )}

          {activeTab === 'products' && <AdminProductsTab />}

          {activeTab === 'categories' && <AdminCategoriesTab />}

          {activeTab === 'inventory' && <AdminInventoryTab />}

          {activeTab === 'orders' && (
            <AdminOrdersTab
              onGenerateInvoice={handleGenerateInvoice}
              selectedOrderForModal={selectedOrderForDetails}
              onCloseOrderModal={() => setSelectedOrderForDetails(null)}
            />
          )}

          {activeTab === 'customers' && (
            <AdminCustomersTab onViewOrderDetails={handleViewOrderDetails} />
          )}

          {activeTab === 'suppliers' && <AdminSuppliersTab />}

          {(activeTab === 'sales' || activeTab === 'reports') && <AdminReportsTab />}

          {activeTab === 'notifications' && (
            <AdminNotificationsTab
              setActiveTab={setActiveTab}
              notifications={allNotifications}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
              onClearNotifications={handleClearNotifications}
            />
          )}

          {activeTab === 'staff' && <AdminUsersTab />}

          {activeTab === 'settings' && <AdminSettingsTab />}
        </main>
      </div>

      {/* 4. Professional GST Tax Invoice Modal */}
      {selectedOrderForInvoice && (
        <AdminInvoiceModal
          order={selectedOrderForInvoice}
          onClose={() => setSelectedOrderForInvoice(null)}
        />
      )}
    </div>
  );
};

export default AdminDashboardView;
