import React, { useState, useMemo } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  ShoppingCart,
  CreditCard,
  Package,
  Clock,
  Trash2,
  CheckCheck,
  Filter,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AdminTab } from './AdminSidebar';

export interface StoreNotificationItem {
  id: string;
  type: 'order' | 'low_stock' | 'out_of_stock' | 'payment' | 'status_update';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  linkTab?: AdminTab;
}

interface AdminNotificationsTabProps {
  setActiveTab: (tab: AdminTab) => void;
  notifications: StoreNotificationItem[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearNotifications: () => void;
}

export const AdminNotificationsTab: React.FC<AdminNotificationsTabProps> = ({
  setActiveTab,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearNotifications,
}) => {
  const [filterType, setFilterType] = useState<string>('all');

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (filterType === 'unread') return !n.isRead;
      if (filterType === 'order') return n.type === 'order' || n.type === 'status_update';
      if (filterType === 'stock') return n.type === 'low_stock' || n.type === 'out_of_stock';
      if (filterType === 'payment') return n.type === 'payment';
      return true;
    });
  }, [notifications, filterType]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getIcon = (type: StoreNotificationItem['type']) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="w-4 h-4 text-orange-600" />;
      case 'low_stock':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'out_of_stock':
        return <Package className="w-4 h-4 text-red-600" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      default:
        return <Bell className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            Live Notification Center
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white">
                {unreadCount} unread
              </span>
            )}
          </h2>
          <span className="text-xs text-slate-400">
            Real-time triggers for incoming orders, payment captures, stock limits, and order updates.
          </span>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 hover:bg-blue-100 transition cursor-pointer flex items-center gap-1.5"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all as read</span>
            </button>
          )}

          <button
            onClick={onClearNotifications}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold pb-1">
        {[
          { id: 'all', label: `All (${notifications.length})` },
          { id: 'unread', label: `Unread (${unreadCount})` },
          { id: 'order', label: 'Orders' },
          { id: 'stock', label: 'Inventory Alerts' },
          { id: 'payment', label: 'Payments' },
        ].map((chip) => (
          <button
            key={chip.id}
            onClick={() => setFilterType(chip.id)}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
              filterType === chip.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs divide-y divide-slate-100 dark:divide-slate-700/60 overflow-hidden text-xs">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => {
                onMarkAsRead(notif.id);
                if (notif.linkTab) setActiveTab(notif.linkTab);
              }}
              className={`p-4 flex items-start gap-3.5 transition cursor-pointer ${
                notif.isRead
                  ? 'hover:bg-slate-50 dark:hover:bg-slate-750 opacity-80'
                  : 'bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/80 font-medium'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-700 shadow-2xs border border-slate-200 dark:border-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                {getIcon(notif.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-900 dark:text-white truncate">
                    {notif.title}
                  </span>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                  {notif.message}
                </p>
              </div>

              {!notif.isRead && (
                <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-2" />
              )}
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 opacity-60" />
            <p>You're all caught up! No notifications to display.</p>
          </div>
        )}
      </div>
    </div>
  );
};
