import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Clock,
  Package,
  AlertTriangle,
  Users,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Eye,
  FileSpreadsheet,
  Receipt,
  Download,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../utils/gstUtils';
import { AdminTab } from './AdminSidebar';
import { Order } from '../../types';

interface AdminDashboardOverviewProps {
  setActiveTab: (tab: AdminTab) => void;
  onViewOrderDetails: (order: Order) => void;
  onGenerateInvoice: (order: Order) => void;
}

export const AdminDashboardOverview: React.FC<AdminDashboardOverviewProps> = ({
  setActiveTab,
  onViewOrderDetails,
  onGenerateInvoice,
}) => {
  const { products, orders, customers, shopSettings } = useApp();

  const [revenuePeriod, setRevenuePeriod] = useState<'7d' | '30d' | '3m' | '12m'>('30d');
  const [salesChartType, setSalesChartType] = useState<'category' | 'product'>('category');

  // --- Real Supabase Calculations ---
  const todayStr = new Date().toISOString().slice(0, 10);

  // 1. Total Revenue
  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  }, [orders]);

  // 2. Today's Revenue
  const todayOrders = useMemo(() => {
    return orders.filter((o) => (o.orderDate || '').slice(0, 10) === todayStr);
  }, [orders, todayStr]);

  const todayRevenue = useMemo(() => {
    return todayOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  }, [todayOrders]);

  // 3. Total Orders
  const totalOrdersCount = orders.length;

  // 4. Pending Orders
  const pendingOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        (o.orderStatus || '').toLowerCase() === 'pending' ||
        (o.orderStatus || '').toLowerCase() === 'order placed' ||
        (o.orderStatus || '').toLowerCase() === 'confirmed' ||
        (o.orderStatus || '').toLowerCase() === 'processing'
    );
  }, [orders]);

  // 5. Total Products
  const totalProductsCount = products.length;

  // 6. Low Stock Products
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.currentStock <= p.minimumStock);
  }, [products]);

  // 7. Total Customers
  const totalCustomersCount = customers.length;

  // 8. Delivered Orders
  const deliveredOrders = useMemo(() => {
    return orders.filter((o) => (o.orderStatus || '').toLowerCase() === 'delivered');
  }, [orders]);

  // --- Revenue Chart Data Calculation (7 days, 30 days, 3 months, 12 months) ---
  const revenueChartData = useMemo(() => {
    const now = new Date();
    const dataPoints: { label: string; date: string; amount: number; count: number }[] = [];

    if (revenuePeriod === '7d') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const dayOrders = orders.filter((o) => (o.orderDate || '').slice(0, 10) === dateStr);
        const amount = dayOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
        const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
        dataPoints.push({ label, date: dateStr, amount, count: dayOrders.length });
      }
    } else if (revenuePeriod === '30d') {
      for (let i = 29; i >= 0; i -= 3) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        // Include window of 3 days
        const prevD = new Date(d);
        prevD.setDate(prevD.getDate() - 2);
        const prevStr = prevD.toISOString().slice(0, 10);

        const groupOrders = orders.filter((o) => {
          const od = (o.orderDate || '').slice(0, 10);
          return od >= prevStr && od <= dateStr;
        });
        const amount = groupOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dataPoints.push({ label, date: dateStr, amount, count: groupOrders.length });
      }
    } else if (revenuePeriod === '3m') {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i * 7);
        const dateStr = d.toISOString().slice(0, 10);
        const prevD = new Date(d);
        prevD.setDate(prevD.getDate() - 7);
        const prevStr = prevD.toISOString().slice(0, 10);

        const weekOrders = orders.filter((o) => {
          const od = (o.orderDate || '').slice(0, 10);
          return od >= prevStr && od <= dateStr;
        });
        const amount = weekOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
        const label = `W${12 - i} (${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
        dataPoints.push({ label, date: dateStr, amount, count: weekOrders.length });
      }
    } else {
      // 12 months
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthPrefix = d.toISOString().slice(0, 7);
        const monthOrders = orders.filter((o) => (o.orderDate || '').slice(0, 7) === monthPrefix);
        const amount = monthOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
        const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        dataPoints.push({ label, date: monthPrefix, amount, count: monthOrders.length });
      }
    }
    return dataPoints;
  }, [orders, revenuePeriod]);

  const maxRevenue = Math.max(...revenueChartData.map((d) => d.amount), 1000);

  // --- Sales by Category ---
  const salesByCategory = useMemo(() => {
    const map: Record<string, { revenue: number; quantity: number }> = {};
    orders.forEach((o) => {
      (o.items || []).forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        const cat = prod?.category || 'Paper';
        if (!map[cat]) map[cat] = { revenue: 0, quantity: 0 };
        const lineTotal = item.totalAmount || (item.rate || item.unitPrice || 0) * (item.quantity || 1);
        map[cat].revenue += lineTotal;
        map[cat].quantity += item.quantity || 1;
      });
    });

    return Object.entries(map)
      .map(([category, stats]) => ({ category, ...stats }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [orders, products]);

  // --- Sales by Product (Top Selling Products) ---
  const topProducts = useMemo(() => {
    const map: Record<string, { product: any; unitsSold: number; revenue: number }> = {};
    orders.forEach((o) => {
      (o.items || []).forEach((item) => {
        const pid = item.productId;
        const prod = products.find((p) => p.id === pid) || {
          id: pid,
          name: item.productName || 'Product',
          category: 'Paper',
          imageUrl: '',
          sellingPrice: item.rate || 0,
        };
        if (!map[pid]) {
          map[pid] = { product: prod, unitsSold: 0, revenue: 0 };
        }
        const lineTotal = item.totalAmount || (item.rate || item.unitPrice || 0) * (item.quantity || 1);
        map[pid].unitsSold += item.quantity || 1;
        map[pid].revenue += lineTotal;
      });
    });

    return Object.values(map)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [orders, products]);

  // --- Order Status Breakdown ---
  const orderStatusSummary = useMemo(() => {
    const statuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] as const;
    const counts: Record<string, number> = {
      Pending: 0,
      Confirmed: 0,
      Processing: 0,
      Shipped: 0,
      Delivered: 0,
      Cancelled: 0,
    };

    orders.forEach((o) => {
      const st = (o.orderStatus || 'Pending').toLowerCase();
      if (st.includes('deliver')) counts['Delivered']++;
      else if (st.includes('ship') || st.includes('dispatch') || st.includes('out for delivery')) counts['Shipped']++;
      else if (st.includes('process')) counts['Processing']++;
      else if (st.includes('confirm')) counts['Confirmed']++;
      else if (st.includes('cancel')) counts['Cancelled']++;
      else counts['Pending']++;
    });

    return statuses.map((st) => ({
      status: st,
      count: counts[st],
      percentage: orders.length > 0 ? Math.round((counts[st] / orders.length) * 100) : 0,
    }));
  }, [orders]);

  // --- Recent Orders ---
  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.orderDate || '').getTime() - new Date(a.orderDate || '').getTime())
      .slice(0, 6);
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl p-4 sm:p-6 bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-orange-500 text-white">
              Official Dashboard
            </span>
            <span className="text-xs text-blue-200">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            TREO ENTERPRISES Management
          </h1>
          <p className="text-xs text-blue-200 max-w-xl">
            Live business analytics, inventory tracking, orders dispatch, and GST billing connected to your Supabase cloud database.
          </p>
        </div>

        <div className="flex items-center gap-2.5 z-10 shrink-0">
          <button
            onClick={() => setActiveTab('orders')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-sm transition cursor-pointer flex items-center gap-1.5"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Process Orders</span>
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition cursor-pointer flex items-center gap-1.5"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Manage Stock</span>
          </button>
        </div>

        {/* Decorative corner glow */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 8 Primary Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Revenue */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between hover:border-blue-400 dark:hover:border-blue-500 transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatINR(totalRevenue)}
            </span>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-600 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Lifetime gross sales</span>
            </div>
          </div>
        </div>

        {/* Card 2: Today's Revenue */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between hover:border-orange-400 dark:hover:border-orange-500 transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Today's Revenue
            </span>
            <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-orange-600 dark:text-orange-400 tracking-tight">
              {formatINR(todayRevenue)}
            </span>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-500 font-semibold">
              <span>{todayOrders.length} orders placed today</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Orders */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between hover:border-indigo-400 dark:hover:border-indigo-500 transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Orders
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {totalOrdersCount}
            </span>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-indigo-600 font-semibold">
              <span>Across all store channels</span>
            </div>
          </div>
        </div>

        {/* Card 4: Pending Orders */}
        <div
          onClick={() => setActiveTab('orders')}
          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between hover:border-amber-400 dark:hover:border-amber-500 transition group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pending Orders
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
              {pendingOrders.length}
            </span>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-amber-700 dark:text-amber-300 font-semibold">
              <span>Awaiting dispatch / fulfillment →</span>
            </div>
          </div>
        </div>

        {/* Card 5: Total Products */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between hover:border-blue-400 dark:hover:border-blue-500 transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Products
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {totalProductsCount}
            </span>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-500 font-semibold">
              <span>Active catalog items</span>
            </div>
          </div>
        </div>

        {/* Card 6: Low Stock Products */}
        <div
          onClick={() => setActiveTab('inventory')}
          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between hover:border-red-400 dark:hover:border-red-500 transition group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Low Stock Products
            </span>
            <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-red-600 dark:text-red-400 tracking-tight">
              {lowStockProducts.length}
            </span>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-red-700 dark:text-red-300 font-semibold">
              <span>Require stock replenishment →</span>
            </div>
          </div>
        </div>

        {/* Card 7: Total Customers */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between hover:border-purple-400 dark:hover:border-purple-500 transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Customers
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {totalCustomersCount}
            </span>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-purple-600 font-semibold">
              <span>Registered buyers & clients</span>
            </div>
          </div>
        </div>

        {/* Card 8: Delivered Orders */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between hover:border-emerald-400 dark:hover:border-emerald-500 transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Delivered Orders
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {deliveredOrders.length}
            </span>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-600 font-semibold">
              <span>
                {totalOrdersCount > 0 ? Math.round((deliveredOrders.length / totalOrdersCount) * 100) : 0}% fulfillment rate
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Section: Revenue Chart & Sales Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Revenue Chart with Period Selector */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-700">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Financial Analytics
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Revenue Trajectory
              </h2>
            </div>

            {/* Timeframe Selector (7 days, 30 days, 3 months, 12 months) */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-700/60 rounded-xl text-xs font-bold">
              {[
                { id: '7d', label: '7 Days' },
                { id: '30d', label: '30 Days' },
                { id: '3m', label: '3 Months' },
                { id: '12m', label: '12 Months' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setRevenuePeriod(t.id as any)}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    revenuePeriod === t.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Line / Bar Chart Representation */}
          <div className="pt-6">
            <div className="h-60 w-full flex items-end gap-2 sm:gap-3 px-2">
              {revenueChartData.map((pt, idx) => {
                const heightPct = Math.max(8, Math.round((pt.amount / maxRevenue) * 100));
                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                      <div className="bg-slate-900 text-white text-[10px] font-semibold py-1 px-2 rounded-lg shadow-lg whitespace-nowrap">
                        <span className="block font-bold">{formatINR(pt.amount)}</span>
                        <span className="text-slate-400 text-[9px]">{pt.count} orders • {pt.date}</span>
                      </div>
                      <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1" />
                    </div>

                    {/* Bar */}
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full max-w-[28px] rounded-t-lg bg-gradient-to-t from-blue-700 via-blue-600 to-orange-400 group-hover:from-blue-600 group-hover:to-orange-300 transition-all duration-300 relative shadow-2xs"
                    />

                    {/* X-axis Label */}
                    <span className="text-[10px] text-slate-400 font-medium truncate w-full text-center mt-2 group-hover:text-slate-900 dark:group-hover:text-white">
                      {pt.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-4 mt-2 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  Actual Supabase Sales
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                  Peak Highs
                </span>
              </div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Peak: {formatINR(maxRevenue)}
              </span>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Sales by Product & Category + Order Status */}
        <div className="space-y-6">
          {/* Sales Breakdown Switcher */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                Sales Distribution
              </span>
              <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-[11px] font-bold">
                <button
                  onClick={() => setSalesChartType('category')}
                  className={`px-2 py-1 rounded-md transition cursor-pointer ${
                    salesChartType === 'category'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  By Category
                </button>
                <button
                  onClick={() => setSalesChartType('product')}
                  className={`px-2 py-1 rounded-md transition cursor-pointer ${
                    salesChartType === 'product'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  By Product
                </button>
              </div>
            </div>

            <div className="pt-3 space-y-3 max-h-64 overflow-y-auto">
              {salesChartType === 'category' ? (
                salesByCategory.length > 0 ? (
                  salesByCategory.map((cat, i) => {
                    const pct = totalRevenue > 0 ? Math.round((cat.revenue / totalRevenue) * 100) : 0;
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                            {cat.category}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {formatINR(cat.revenue)} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className="h-full bg-gradient-to-r from-blue-600 to-orange-500 rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No category sales data recorded yet.
                  </div>
                )
              ) : (
                topProducts.length > 0 ? (
                  topProducts.map((p, i) => {
                    const pct = totalRevenue > 0 ? Math.round((p.revenue / totalRevenue) * 100) : 0;
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[160px]">
                            {p.product.name}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {formatINR(p.revenue)}
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                          <div
                            style={{ width: `${Math.max(5, pct)}%` }}
                            className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No product sales data recorded yet.
                  </div>
                )
              )}
            </div>
          </div>

          {/* Order Status Breakdown */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 shadow-xs">
            <span className="font-bold text-sm text-slate-900 dark:text-white block pb-2 border-b border-slate-100 dark:border-slate-700">
              Order Fulfillment Status
            </span>
            <div className="grid grid-cols-2 gap-2 pt-3">
              {orderStatusSummary.map((st, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                      {st.status}
                    </span>
                    <span className="text-base font-black text-slate-900 dark:text-white">
                      {st.count}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                    {st.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Products & Recent Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products List */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Leaderboard
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Top Performing Products
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('products')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 cursor-pointer"
            >
              <span>View catalog</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700/60 pt-2">
            {topProducts.length > 0 ? (
              topProducts.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                      {item.product.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <Package className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-slate-800 dark:text-slate-100 truncate block">
                        {item.product.name}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate block">
                        {item.product.category} • {item.product.sku}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {formatINR(item.revenue)}
                    </span>
                    <span className="text-[11px] text-emerald-600 font-semibold">
                      {item.unitsSold} units sold
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                No orders registered yet to calculate top products.
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders List */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Fulfillment Queue
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Recent Orders
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('orders')}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400 flex items-center gap-1 cursor-pointer"
            >
              <span>All orders ({orders.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700/60 pt-2">
            {recentOrders.length > 0 ? (
              recentOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50 dark:hover:bg-slate-750 px-1 rounded-xl transition"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {ord.orderNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          ord.paymentStatus === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                        }`}
                      >
                        {ord.paymentStatus}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 truncate block">
                      {ord.customerName} • {(ord.orderDate || '').slice(0, 10)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {formatINR(ord.grandTotal)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {ord.orderStatus}
                      </span>
                    </div>
                    <button
                      onClick={() => onViewOrderDetails(ord)}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition cursor-pointer"
                      title="View order details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onGenerateInvoice(ord)}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-orange-100 dark:hover:bg-orange-900/60 text-slate-600 dark:text-slate-300 hover:text-orange-600 transition cursor-pointer"
                      title="Generate GST Invoice"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                No orders recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
