import React, { useState, useMemo } from 'react';
import {
  FileBarChart,
  Calendar,
  Search,
  Download,
  Printer,
  TrendingUp,
  Filter,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  Layers,
  Building,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../utils/gstUtils';
import { downloadCSVFile } from '../../utils/csvUtils';

export const AdminReportsTab: React.FC = () => {
  const { orders, products, customers, suppliers, expenses, shopSettings, showToast } = useApp();

  type ReportType =
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'products'
    | 'categories'
    | 'customers'
    | 'inventory'
    | 'orders';

  const [activeReport, setActiveReport] = useState<ReportType>('daily');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'today' | '7d' | '30d' | 'year' | 'custom'>('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  // Date Filtering on Orders
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const d7 = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
    const d30 = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);
    const yStart = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);

    return orders.filter((o) => {
      const oDate = (o.orderDate || '').slice(0, 10);
      if (dateRangeFilter === 'today' && oDate !== todayStr) return false;
      if (dateRangeFilter === '7d' && oDate < d7) return false;
      if (dateRangeFilter === '30d' && oDate < d30) return false;
      if (dateRangeFilter === 'year' && oDate < yStart) return false;
      if (dateRangeFilter === 'custom') {
        if (customStart && oDate < customStart) return false;
        if (customEnd && oDate > customEnd) return false;
      }
      return true;
    });
  }, [orders, dateRangeFilter, customStart, customEnd]);

  // Aggregate Reports Based on Active Type
  const reportData = useMemo(() => {
    if (activeReport === 'daily') {
      const map: Record<string, { date: string; ordersCount: number; grossSales: number; tax: number; netSales: number }> = {};
      filteredOrders.forEach((o) => {
        const d = (o.orderDate || '').slice(0, 10) || 'Unknown';
        if (!map[d]) map[d] = { date: d, ordersCount: 0, grossSales: 0, tax: 0, netSales: 0 };
        map[d].ordersCount++;
        map[d].grossSales += o.grandTotal || 0;
        map[d].tax += o.totalTax || 0;
        map[d].netSales += o.taxableAmount || o.subtotal || 0;
      });
      return Object.values(map).sort((a, b) => b.date.localeCompare(a.date));
    }

    if (activeReport === 'monthly') {
      const map: Record<string, { month: string; ordersCount: number; grossSales: number; tax: number }> = {};
      filteredOrders.forEach((o) => {
        const m = (o.orderDate || '').slice(0, 7) || 'Unknown';
        if (!map[m]) map[m] = { month: m, ordersCount: 0, grossSales: 0, tax: 0 };
        map[m].ordersCount++;
        map[m].grossSales += o.grandTotal || 0;
        map[m].tax += o.totalTax || 0;
      });
      return Object.values(map).sort((a, b) => b.month.localeCompare(a.month));
    }

    if (activeReport === 'yearly') {
      const map: Record<string, { year: string; ordersCount: number; grossSales: number; tax: number }> = {};
      filteredOrders.forEach((o) => {
        const y = (o.orderDate || '').slice(0, 4) || 'Unknown';
        if (!map[y]) map[y] = { year: y, ordersCount: 0, grossSales: 0, tax: 0 };
        map[y].ordersCount++;
        map[y].grossSales += o.grandTotal || 0;
        map[y].tax += o.totalTax || 0;
      });
      return Object.values(map).sort((a, b) => b.year.localeCompare(a.year));
    }

    if (activeReport === 'products') {
      const map: Record<string, { name: string; sku: string; category: string; unitsSold: number; revenue: number }> = {};
      filteredOrders.forEach((o) => {
        (o.items || []).forEach((item) => {
          const pid = item.productId || item.productName;
          if (!map[pid]) {
            const prod = products.find((p) => p.id === item.productId);
            map[pid] = {
              name: item.productName,
              sku: item.sku || prod?.sku || 'N/A',
              category: prod?.category || 'Paper',
              unitsSold: 0,
              revenue: 0,
            };
          }
          map[pid].unitsSold += item.quantity || 1;
          map[pid].revenue += item.totalAmount || (item.rate || 0) * (item.quantity || 1);
        });
      });
      return Object.values(map).sort((a, b) => b.revenue - a.revenue);
    }

    if (activeReport === 'categories') {
      const map: Record<string, { category: string; unitsSold: number; revenue: number }> = {};
      filteredOrders.forEach((o) => {
        (o.items || []).forEach((item) => {
          const prod = products.find((p) => p.id === item.productId);
          const cat = prod?.category || 'Paper';
          if (!map[cat]) map[cat] = { category: cat, unitsSold: 0, revenue: 0 };
          map[cat].unitsSold += item.quantity || 1;
          map[cat].revenue += item.totalAmount || (item.rate || 0) * (item.quantity || 1);
        });
      });
      return Object.values(map).sort((a, b) => b.revenue - a.revenue);
    }

    if (activeReport === 'customers') {
      const map: Record<string, { customerName: string; mobile: string; ordersCount: number; totalSpend: number; lastOrder: string }> = {};
      filteredOrders.forEach((o) => {
        const key = o.customerMobile || o.customerName;
        if (!map[key]) {
          map[key] = {
            customerName: o.customerName,
            mobile: o.customerMobile,
            ordersCount: 0,
            totalSpend: 0,
            lastOrder: o.orderDate || '',
          };
        }
        map[key].ordersCount++;
        map[key].totalSpend += o.grandTotal || 0;
        if (new Date(o.orderDate || 0) > new Date(map[key].lastOrder)) {
          map[key].lastOrder = o.orderDate || '';
        }
      });
      return Object.values(map).sort((a, b) => b.totalSpend - a.totalSpend);
    }

    if (activeReport === 'inventory') {
      return products.map((p) => ({
        name: p.name,
        sku: p.sku,
        category: p.category,
        currentStock: p.currentStock,
        minimumStock: p.minimumStock,
        costPrice: p.costPrice ?? p.purchasePrice ?? 0,
        sellingPrice: p.sellingPrice,
        valuation: (p.costPrice ?? p.purchasePrice ?? 0) * p.currentStock,
        status: p.currentStock <= 0 ? 'Out of Stock' : p.currentStock <= p.minimumStock ? 'Low Stock' : 'In Stock',
      }));
    }

    // Default: 'orders'
    return filteredOrders.map((o) => ({
      orderNumber: o.orderNumber,
      date: (o.orderDate || '').slice(0, 10),
      customerName: o.customerName,
      customerMobile: o.customerMobile,
      subtotal: o.subtotal,
      tax: o.totalTax,
      grandTotal: o.grandTotal,
      paymentStatus: o.paymentStatus,
      orderStatus: o.orderStatus,
    }));
  }, [activeReport, filteredOrders, products]);

  // Overall Report KPI Totals
  const reportTotals = useMemo(() => {
    const gross = filteredOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
    const tax = filteredOrders.reduce((sum, o) => sum + (o.totalTax || 0), 0);
    const count = filteredOrders.length;
    return { gross, tax, count, avg: count > 0 ? gross / count : 0 };
  }, [filteredOrders]);

  // CSV Export Handler
  const handleExportCSV = () => {
    if (!reportData || reportData.length === 0) {
      showToast('No data available to export.');
      return;
    }

    const headers = Object.keys(reportData[0]);
    const csvRows = [headers.join(',')];

    reportData.forEach((row: any) => {
      const values = headers.map((header) => {
        const val = row[header];
        if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
        return val ?? '';
      });
      csvRows.push(values.join(','));
    });

    const csvContent = csvRows.join('\n');
    downloadCSVFile(csvContent, `TREO_${activeReport.toUpperCase()}_REPORT_${new Date().toISOString().slice(0, 10)}.csv`);
    showToast(`Exported ${activeReport} report to CSV.`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-blue-600" />
            Business Reports & Sales Intelligence
          </h2>
          <span className="text-xs text-slate-400">
            Export GST sales registers, product sales, category distribution, and inventory valuation from Supabase.
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Report Types Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-2 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-1 text-xs font-bold min-w-max">
          {[
            { id: 'daily', label: 'Daily Sales' },
            { id: 'weekly', label: 'Weekly Summary' },
            { id: 'monthly', label: 'Monthly Sales' },
            { id: 'yearly', label: 'Yearly Sales' },
            { id: 'products', label: 'Product Sales' },
            { id: 'categories', label: 'Category Sales' },
            { id: 'customers', label: 'Customer Purchases' },
            { id: 'inventory', label: 'Inventory Valuation' },
            { id: 'orders', label: 'Orders & GST Register' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id as ReportType)}
              className={`px-3 py-2 rounded-xl transition cursor-pointer whitespace-nowrap ${
                activeReport === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date Range Selector Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="font-bold text-slate-700 dark:text-slate-300">Date Range:</span>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl">
            {[
              { id: 'today', label: 'Today' },
              { id: '7d', label: 'Last 7 Days' },
              { id: '30d', label: 'Last 30 Days' },
              { id: 'year', label: 'This Year' },
              { id: 'all', label: 'All Time' },
              { id: 'custom', label: 'Custom' },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setDateRangeFilter(d.id as any)}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  dateRangeFilter === d.id
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {dateRangeFilter === 'custom' && (
          <div className="flex items-center gap-2 flex-wrap">
            <span>From:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            />
            <span>To:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            />
          </div>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
            Filtered Gross Sales
          </span>
          <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 block">
            {formatINR(reportTotals.gross)}
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
            GST Liability
          </span>
          <span className="text-xl sm:text-2xl font-black text-orange-600 dark:text-orange-400 mt-1 block">
            {formatINR(reportTotals.tax)}
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
            Invoiced Orders
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 block">
            {reportTotals.count}
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
            Average Order Value
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {formatINR(reportTotals.avg)}
          </span>
        </div>
      </div>

      {/* Dynamic Report Data Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-bold uppercase tracking-wider">
                {reportData.length > 0 &&
                  Object.keys(reportData[0]).map((col) => (
                    <th key={col} className="py-3 px-3 capitalize">
                      {col.replace(/([A-Z])/g, ' $1')}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {reportData.length > 0 ? (
                reportData.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition">
                    {Object.entries(row).map(([key, val]: [string, any], cIdx: number) => {
                      const isMoney =
                        key.toLowerCase().includes('sales') ||
                        key.toLowerCase().includes('revenue') ||
                        key.toLowerCase().includes('spend') ||
                        key.toLowerCase().includes('total') ||
                        key.toLowerCase().includes('price') ||
                        key.toLowerCase().includes('tax') ||
                        key.toLowerCase().includes('valuation');

                      return (
                        <td
                          key={cIdx}
                          className={`py-3 px-3 ${
                            isMoney
                              ? 'font-mono font-semibold text-slate-800 dark:text-slate-200'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {isMoney && typeof val === 'number' ? formatINR(val) : String(val ?? '-')}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No records found for the selected reporting criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
