import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { formatINR } from '../utils/gstUtils';
import {
  AlertTriangle,
  Package,
  Plus,
  Download,
  Search,
  ArrowRight,
  CheckCircle2,
  Building2,
  Edit3,
  TrendingDown,
} from 'lucide-react';

interface LowStockWidgetProps {
  products: Product[];
  onQuickRestock: (productId: string, additionalStock: number) => void;
  onEditProduct: (product: Product) => void;
  onNavigateToInventory: (searchQuery?: string) => void;
  onDownloadLowStockCSV: () => void;
}

export const LowStockWidget: React.FC<LowStockWidgetProps> = ({
  products,
  onQuickRestock,
  onEditProduct,
  onNavigateToInventory,
  onDownloadLowStockCSV,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'out_of_stock' | 'low_stock'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customRestockInputs, setCustomRestockInputs] = useState<Record<string, number>>({});

  // 1. Dynamic filtering: currentStock <= minimumStock
  const allLowStockProducts = useMemo(() => {
    return products.filter((p) => p.currentStock <= p.minimumStock);
  }, [products]);

  const outOfStockProducts = useMemo(() => {
    return allLowStockProducts.filter((p) => p.currentStock <= 0);
  }, [allLowStockProducts]);

  const lowOnlyProducts = useMemo(() => {
    return allLowStockProducts.filter((p) => p.currentStock > 0);
  }, [allLowStockProducts]);

  // 2. Filter by tab & search query
  const displayedProducts = useMemo(() => {
    let list = allLowStockProducts;
    if (filterType === 'out_of_stock') {
      list = outOfStockProducts;
    } else if (filterType === 'low_stock') {
      list = lowOnlyProducts;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          (p.supplierName && p.supplierName.toLowerCase().includes(q))
      );
    }
    return list;
  }, [allLowStockProducts, outOfStockProducts, lowOnlyProducts, filterType, searchQuery]);

  // Total estimated replenishment cost to reach minimum threshold
  const totalReplenishmentCost = useMemo(() => {
    return allLowStockProducts.reduce((sum, p) => {
      const deficit = Math.max(0, p.minimumStock - p.currentStock);
      const unitCost = p.costPrice ?? p.purchasePrice ?? 0;
      return sum + deficit * unitCost;
    }, 0);
  }, [allLowStockProducts]);

  const handleCustomRestock = (productId: string) => {
    const qty = customRestockInputs[productId] || 10;
    if (qty > 0) {
      onQuickRestock(productId, qty);
      setCustomRestockInputs((prev) => ({ ...prev, [productId]: 0 }));
    }
  };

  return (
    <div
      id="low-stock-widget"
      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-xs space-y-5"
    >
      {/* Header with Title and Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700/60 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span>Low Stock & Replenishment Alerts</span>
                <span
                  id="low-stock-badge-count"
                  className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                    allLowStockProducts.length > 0
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                      : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  {allLowStockProducts.length} Items
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Products where current stock is at or below the minimum stock threshold.
              </p>
            </div>
          </div>
        </div>

        {/* Global widget actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {allLowStockProducts.length > 0 && (
            <button
              id="download-low-stock-csv-btn"
              onClick={onDownloadLowStockCSV}
              title="Download low stock replenishment report in CSV"
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Export CSV</span>
            </button>
          )}

          <button
            id="view-inventory-from-widget-btn"
            onClick={() => onNavigateToInventory()}
            className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-2xs"
          >
            <span>Stock Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Summary Stats Strip (When low stock items exist) */}
      {allLowStockProducts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                Total Low Stock Items
              </span>
              <span className="text-lg font-black text-slate-800 dark:text-slate-100">
                {allLowStockProducts.length}
              </span>
            </div>
            <Package className="w-5 h-5 text-slate-400" />
          </div>

          <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium block">
                Critical / Zero Stock
              </span>
              <span className="text-lg font-black text-rose-700 dark:text-rose-300">
                {outOfStockProducts.length} items
              </span>
            </div>
            <TrendingDown className="w-5 h-5 text-rose-500" />
          </div>

          <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium block">
                Est. Replenishment Budget
              </span>
              <span className="text-lg font-black text-amber-700 dark:text-amber-300">
                {formatINR(totalReplenishmentCost)}
              </span>
            </div>
            <Building2 className="w-5 h-5 text-amber-500" />
          </div>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      {allLowStockProducts.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/80 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg transition ${
                filterType === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All ({allLowStockProducts.length})
            </button>
            <button
              onClick={() => setFilterType('out_of_stock')}
              className={`px-3 py-1 rounded-lg transition ${
                filterType === 'out_of_stock'
                  ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Out of Stock ({outOfStockProducts.length})
            </button>
            <button
              onClick={() => setFilterType('low_stock')}
              className={`px-3 py-1 rounded-lg transition ${
                filterType === 'low_stock'
                  ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Under Min ({lowOnlyProducts.length})
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search low stock..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>
      )}

      {/* Dynamic Products List or Healthy State */}
      {allLowStockProducts.length === 0 ? (
        <div
          id="low-stock-healthy-state"
          className="p-8 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/50 text-center space-y-2"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
            All Inventory Healthy & Well-Stocked
          </h4>
          <p className="text-xs text-emerald-700/80 dark:text-emerald-400 max-w-md mx-auto">
            All {products.length} products currently maintain stock levels safely above their replenishment thresholds.
          </p>
        </div>
      ) : displayedProducts.length === 0 ? (
        <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 rounded-xl">
          No low stock products match your filter or search query.
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
          {displayedProducts.map((prod) => {
            const isOutOfStock = prod.currentStock <= 0;
            const deficit = Math.max(0, prod.minimumStock - prod.currentStock);
            const stockRatio =
              prod.minimumStock > 0
                ? Math.min(100, Math.round((prod.currentStock / prod.minimumStock) * 100))
                : 0;

            const unitCost = prod.costPrice ?? prod.purchasePrice ?? 0;
            const deficitCost = deficit * unitCost;

            return (
              <div
                key={prod.id}
                data-testid={`low-stock-item-${prod.id}`}
                className="py-3.5 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-700/20 -mx-2 px-2 rounded-xl transition"
              >
                {/* Product Info & Stock Health */}
                <div className="flex items-start gap-3 min-w-0">
                  <img
                    src={prod.imageUrl}
                    alt={prod.name}
                    className="w-11 h-11 rounded-xl object-cover bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shrink-0 mt-0.5"
                  />
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {prod.name}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          isOutOfStock
                            ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {isOutOfStock ? 'Out of Stock' : 'Low Stock'}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                        {prod.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                      <span className="font-mono text-slate-600 dark:text-slate-300">
                        SKU: {prod.sku}
                      </span>
                      {prod.supplierName && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{prod.supplierName}</span>
                        </span>
                      )}
                      <span>
                        Cost: <strong className="text-slate-700 dark:text-slate-300">{formatINR(unitCost)}</strong>
                      </span>
                    </div>

                    {/* Visual Stock Level Indicator */}
                    <div className="flex items-center gap-2 pt-0.5 max-w-xs">
                      <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isOutOfStock ? 'bg-red-500 w-0' : 'bg-amber-500'
                          }`}
                          style={{ width: `${isOutOfStock ? 0 : Math.max(8, stockRatio)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {prod.currentStock} / {prod.minimumStock} {prod.unit}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Deficit & Replenishment Controls */}
                <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-700/50">
                  <div className="text-left md:text-right">
                    <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 block">
                      Deficit: +{deficit} {prod.unit}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Est. Reorder: {formatINR(deficitCost)}
                    </span>
                  </div>

                  {/* Restock Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onQuickRestock(prod.id, 10)}
                      title={`Add 10 ${prod.unit} to stock`}
                      className="px-2.5 py-1.5 rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 text-teal-700 dark:text-teal-300 text-xs font-bold flex items-center gap-1 transition shadow-2xs"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+10</span>
                    </button>

                    <button
                      onClick={() => onQuickRestock(prod.id, 25)}
                      title={`Add 25 ${prod.unit} to stock`}
                      className="px-2.5 py-1.5 rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 text-teal-700 dark:text-teal-300 text-xs font-bold flex items-center gap-1 transition shadow-2xs"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+25</span>
                    </button>

                    <button
                      onClick={() => onEditProduct(prod)}
                      title="Edit product details or enter custom stock quantity"
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition shadow-2xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
