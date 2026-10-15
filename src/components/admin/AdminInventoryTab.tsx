import React, { useState, useMemo, useEffect } from 'react';
import {
  Boxes,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Minus,
  RotateCcw,
  Clock,
  History,
  Download,
  Package,
  Layers,
  X,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, InventoryTransaction } from '../../types';
import {
  recordInventoryTransactionToSupabase,
  fetchInventoryTransactionsFromSupabase,
} from '../../services/supabaseService';
import { generateProductsCSV, downloadCSVFile } from '../../utils/csvUtils';

export const AdminInventoryTab: React.FC = () => {
  const { products, updateProduct, currentAdminUser, showToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');

  // Stock Adjustment Modal
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<'add' | 'remove' | 'set'>('add');
  const [adjustQuantity, setAdjustQuantity] = useState<number | ''>(10);
  const [adjustReason, setAdjustReason] = useState<string>('Restock / Supplier Delivery');
  const [adjustNotes, setAdjustNotes] = useState<string>('');

  // Stock History Modal
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [transactionsList, setTransactionsList] = useState<InventoryTransaction[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Fetch transactions when history modal is opened
  useEffect(() => {
    if (historyProduct) {
      setIsLoadingHistory(true);
      fetchInventoryTransactionsFromSupabase(historyProduct.id)
        .then((txs) => {
          setTransactionsList(txs);
        })
        .finally(() => {
          setIsLoadingHistory(false);
        });
    }
  }, [historyProduct]);

  // Inventory Metrics
  const totalStockItems = useMemo(
    () => products.reduce((sum, p) => sum + (p.currentStock || 0), 0),
    [products]
  );
  const lowStockCount = useMemo(
    () => products.filter((p) => p.currentStock <= p.minimumStock && p.currentStock > 0).length,
    [products]
  );
  const outOfStockCount = useMemo(
    () => products.filter((p) => p.currentStock <= 0).length,
    [products]
  );
  const totalValuation = useMemo(
    () => products.reduce((sum, p) => sum + (p.purchasePrice || p.costPrice || 0) * (p.currentStock || 0), 0),
    [products]
  );

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.brand || '').toLowerCase().includes(q) ||
          (p.supplierName || '').toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (stockStatusFilter === 'in_stock' && p.currentStock <= p.minimumStock) return false;
      if (stockStatusFilter === 'low_stock' && (p.currentStock > p.minimumStock || p.currentStock <= 0))
        return false;
      if (stockStatusFilter === 'out_of_stock' && p.currentStock > 0) return false;

      return true;
    });
  }, [products, searchQuery, stockStatusFilter]);

  // Quick Restock Action
  const handleQuickAdd = async (product: Product, delta: number) => {
    const previousStock = product.currentStock;
    const newStock = Math.max(0, previousStock + delta);

    updateProduct(product.id, { currentStock: newStock });
    showToast(`Updated stock for ${product.name}: ${previousStock} → ${newStock}`);

    // Log to Supabase inventory_transactions
    await recordInventoryTransactionToSupabase({
      productId: product.id,
      transactionType: delta > 0 ? 'stock_in' : 'stock_out',
      quantity: delta,
      previousStock,
      newStock,
      reason: 'Quick Stock Adjustment',
      createdBy: currentAdminUser?.name || 'Admin',
    });
  };

  // Submit Detailed Stock Adjustment
  const handlePerformAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;

    const qty = Number(adjustQuantity);
    if (isNaN(qty) || qty < 0) {
      showToast('Please enter a valid stock quantity.');
      return;
    }

    const previousStock = adjustingProduct.currentStock;
    let newStock = previousStock;

    if (adjustType === 'add') {
      newStock = previousStock + qty;
    } else if (adjustType === 'remove') {
      newStock = Math.max(0, previousStock - qty);
    } else {
      newStock = qty;
    }

    const diff = newStock - previousStock;

    updateProduct(adjustingProduct.id, { currentStock: newStock });
    showToast(`Stock updated for ${adjustingProduct.name}: ${previousStock} → ${newStock}`);

    await recordInventoryTransactionToSupabase({
      productId: adjustingProduct.id,
      transactionType: diff >= 0 ? 'stock_in' : 'stock_out',
      quantity: diff,
      previousStock,
      newStock,
      reason: `${adjustReason}${adjustNotes ? ` - ${adjustNotes}` : ''}`,
      createdBy: currentAdminUser?.name || 'Admin',
    });

    setAdjustingProduct(null);
  };

  // Export Low Stock CSV
  const handleExportLowStock = () => {
    const lowStockItems = products.filter((p) => p.currentStock <= p.minimumStock);
    if (lowStockItems.length === 0) {
      showToast('No low stock products to export.');
      return;
    }
    const csv = generateProductsCSV(lowStockItems);
    downloadCSVFile(csv, `Low_Stock_Alert_${new Date().toISOString().slice(0, 10)}.csv`);
    showToast(`Exported ${lowStockItems.length} low stock items to CSV.`);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Valuation Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
            Total Items in Stock
          </span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
            {totalStockItems} Units
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Across {products.length} catalog SKUs
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
            Inventory Valuation (Cost)
          </span>
          <span className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 block">
            ₹{totalValuation.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            At wholesale purchase cost
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
            Low Stock Alerts
          </span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
            {lowStockCount} Products
          </span>
          <span className="text-[11px] text-amber-600 font-semibold mt-1 block">
            ≤ Minimum stock threshold
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
            Out of Stock
          </span>
          <span className="text-2xl font-black text-red-600 dark:text-red-400 mt-1 block">
            {outOfStockCount} Products
          </span>
          <span className="text-[11px] text-red-600 font-semibold mt-1 block">
            Zero reams / zero quantity
          </span>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product, SKU, supplier..."
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            />
          </div>

          <select
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold"
          >
            <option value="all">All Inventory ({products.length})</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock Alerts ({lowStockCount})</option>
            <option value="out_of_stock">Out of Stock ({outOfStockCount})</option>
          </select>
        </div>

        <button
          onClick={handleExportLowStock}
          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs flex items-center gap-1.5 transition cursor-pointer self-start md:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Low Stock Report</span>
        </button>
      </div>

      {/* Inventory Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-3">Product Name</th>
                <th className="py-3 px-3">SKU</th>
                <th className="py-3 px-3 text-center">Current Stock</th>
                <th className="py-3 px-3 text-center">Min Threshold</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3">Supplier</th>
                <th className="py-3 px-3">Last Updated</th>
                <th className="py-3 px-3 text-center">Stock Adjustment</th>
                <th className="py-3 px-3 text-center">History</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => {
                  const isOut = p.currentStock <= 0;
                  const isLow = p.currentStock <= p.minimumStock && p.currentStock > 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                            {p.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block max-w-xs truncate">
                              {p.name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Unit: {p.unit || 'Piece'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono font-semibold text-slate-600 dark:text-slate-300">
                        {p.sku}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="font-mono text-sm font-black text-slate-900 dark:text-white">
                          {p.currentStock}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-mono text-slate-400">
                        {p.minimumStock}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isOut
                              ? 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                              : isLow
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}
                        >
                          {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {p.supplierName || 'Primary Distributor'}
                      </td>

                      <td className="py-3 px-3 text-slate-400 text-[11px]">
                        {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : 'Active'}
                      </td>

                      {/* Stock Adjustment Actions */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleQuickAdd(p, -5)}
                            disabled={p.currentStock <= 0}
                            className="p-1 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 disabled:opacity-30 cursor-pointer"
                            title="Quick deduct 5"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleQuickAdd(p, 10)}
                            className="p-1 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 cursor-pointer"
                            title="Quick add 10"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setAdjustingProduct(p);
                              setAdjustQuantity(10);
                            }}
                            className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 font-bold hover:bg-blue-100 transition cursor-pointer text-[10px]"
                          >
                            Adjust
                          </button>
                        </div>
                      </td>

                      {/* History */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setHistoryProduct(p)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition cursor-pointer"
                          title="View Inventory Audit History"
                        >
                          <History className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No products found matching inventory criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADJUST STOCK MODAL */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl p-5 sm:p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Boxes className="w-5 h-5 text-blue-600" />
                Adjust Stock Quantity
              </h3>
              <button
                onClick={() => setAdjustingProduct(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePerformAdjustment} className="mt-4 space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">
                  {adjustingProduct.name}
                </span>
                <div className="flex items-center justify-between text-slate-500">
                  <span>SKU: {adjustingProduct.sku}</span>
                  <span className="font-bold text-blue-600">
                    Current: {adjustingProduct.currentStock} {adjustingProduct.unit || 'pcs'}
                  </span>
                </div>
              </div>

              {/* Adjustment Mode */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Adjustment Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'add', label: 'Add Stock (+)' },
                    { id: 'remove', label: 'Deduct (-)' },
                    { id: 'set', label: 'Exact Set (=)' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setAdjustType(t.id as any)}
                      className={`py-2 rounded-xl font-bold transition cursor-pointer text-center ${
                        adjustType === t.id
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Quantity ({adjustingProduct.unit || 'Units'}) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={adjustQuantity}
                  onChange={(e) =>
                    setAdjustQuantity(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold text-sm"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Reason for Adjustment
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-semibold"
                >
                  <option value="Restock / Supplier Delivery">Restock / Supplier Delivery</option>
                  <option value="Damaged / Torn Packaging">Damaged / Torn Packaging</option>
                  <option value="Inventory Audit Count Correction">Inventory Audit Count Correction</option>
                  <option value="Customer Return to Stock">Customer Return to Stock</option>
                  <option value="Sample / Internal Store Use">Sample / Internal Store Use</option>
                  <option value="Other / Notes Specified">Other / Notes Specified</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Remarks / Invoice Reference
                </label>
                <input
                  type="text"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="e.g. Supplier Invoice #9124"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md cursor-pointer"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STOCK HISTORY AUDIT MODAL */}
      {historyProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-700 shadow-2xl p-5 sm:p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-600" />
                  Stock Audit Trail
                </h3>
                <span className="text-xs text-slate-400">{historyProduct.name}</span>
              </div>
              <button
                onClick={() => setHistoryProduct(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
              {isLoadingHistory ? (
                <div className="text-center py-8 text-slate-400">Loading audit history from Supabase...</div>
              ) : transactionsList.length > 0 ? (
                transactionsList.map((tx) => (
                  <div key={tx.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {tx.reason || tx.transactionType}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(tx.createdAt).toLocaleString()} • By {tx.createdBy || 'Staff'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span
                        className={`font-mono font-bold text-xs ${
                          tx.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {tx.previousStock} → {tx.newStock}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400">
                  No stock transactions recorded yet for this product.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={() => setHistoryProduct(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
