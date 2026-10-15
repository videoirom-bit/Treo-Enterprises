import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  Search,
  Filter,
  Eye,
  Receipt,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Send,
  MessageCircle,
  Download,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../utils/gstUtils';
import { Order } from '../../types';
import { generateOrdersCSV, downloadCSVFile } from '../../utils/csvUtils';

interface AdminOrdersTabProps {
  onGenerateInvoice: (order: Order) => void;
  selectedOrderForModal?: Order | null;
  onCloseOrderModal?: () => void;
}

export const AdminOrdersTab: React.FC<AdminOrdersTabProps> = ({
  onGenerateInvoice,
  selectedOrderForModal,
  onCloseOrderModal,
}) => {
  const {
    orders,
    updateOrderStatus,
    updatePaymentStatus,
    assignDeliveryPerson,
    sendOrderNotification,
    showToast,
    currentUserRole,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [activeModalOrder, setActiveModalOrder] = useState<Order | null>(
    selectedOrderForModal || null
  );

  // Sync external prop if passed
  React.useEffect(() => {
    if (selectedOrderForModal) {
      setActiveModalOrder(selectedOrderForModal);
    }
  }, [selectedOrderForModal]);

  // Delivery rider assignment modal inside order details
  const [showRiderForm, setShowRiderForm] = useState(false);
  const [riderForm, setRiderForm] = useState({
    deliveryPerson: 'Ramesh Sahu',
    mobile: '+91 98765 43210',
    deliveryArea: 'Station Road / Commercial Hub',
    vehicleDetails: 'Hero Splendor Plus (CG-04-AB-1294)',
  });

  const isAuthorizedToChangeStatus =
    currentUserRole === 'admin' || currentUserRole === 'super_admin';

  // Order status options
  const ORDER_STATUSES = [
    'Pending',
    'Confirmed',
    'Processing',
    'Shipped',
    'Delivered',
    'Cancelled',
  ] as const;

  // Payment status options
  const PAYMENT_STATUSES = ['Pending', 'Paid', 'Failed', 'Refunded'] as const;

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerMobile.includes(q) ||
          (o.customerEmail || '').toLowerCase().includes(q) ||
          (o.customerCity || '').toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (statusFilter !== 'all') {
        if ((o.orderStatus || '').toLowerCase() !== statusFilter.toLowerCase()) return false;
      }

      if (paymentFilter !== 'all') {
        if ((o.paymentStatus || '').toLowerCase() !== paymentFilter.toLowerCase()) return false;
      }

      return true;
    });
  }, [orders, searchQuery, statusFilter, paymentFilter]);

  const handleStatusChange = (orderId: string, newStatus: any) => {
    if (!isAuthorizedToChangeStatus) {
      showToast('Unauthorized: Only administrators can update order status.');
      return;
    }
    updateOrderStatus(orderId, newStatus);
    showToast(`Order #${orderId} status set to ${newStatus}.`);

    // Update active modal order view if open
    if (activeModalOrder && activeModalOrder.id === orderId) {
      setActiveModalOrder((prev) => (prev ? { ...prev, orderStatus: newStatus } : null));
    }
  };

  const handlePaymentChange = (orderId: string, newPaymentStatus: any) => {
    if (!isAuthorizedToChangeStatus) {
      showToast('Unauthorized: Only administrators can update payment status.');
      return;
    }
    updatePaymentStatus(orderId, newPaymentStatus);
    showToast(`Payment status updated to ${newPaymentStatus}.`);

    if (activeModalOrder && activeModalOrder.id === orderId) {
      setActiveModalOrder((prev) => (prev ? { ...prev, paymentStatus: newPaymentStatus } : null));
    }
  };

  const handleSaveRider = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalOrder) return;
    assignDeliveryPerson(activeModalOrder.id, {
      ...riderForm,
      assignedAt: new Date().toISOString(),
      status: 'Assigned',
    });
    showToast(`Assigned ${riderForm.deliveryPerson} to order #${activeModalOrder.orderNumber}`);
    setShowRiderForm(false);
  };

  const handleExportCSV = () => {
    if (orders.length === 0) {
      showToast('No orders to export.');
      return;
    }
    const csv = generateOrdersCSV(filteredOrders);
    downloadCSVFile(csv, `Treo_Orders_${new Date().toISOString().slice(0, 10)}.csv`);
    showToast(`Exported ${filteredOrders.length} orders to CSV.`);
  };

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-orange-600" />
            Order Fulfillment & Dispatch ({orders.length})
          </h2>
          <span className="text-xs text-slate-400">
            Real-time orders tracking, customer invoices, delivery executive assignments, and payments.
          </span>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Orders CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-3 sm:p-4 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order #, customer, mobile..."
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold"
          >
            <option value="all">All Order Statuses</option>
            {ORDER_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold"
          >
            <option value="all">All Payment Statuses</option>
            {PAYMENT_STATUSES.map((pst) => (
              <option key={pst} value={pst}>
                {pst}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-3">Order Number</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3 text-center">Items & Qty</th>
                <th className="py-3 px-3 text-right">Grand Total</th>
                <th className="py-3 px-3 text-center">Payment Status</th>
                <th className="py-3 px-3 text-center">Order Status</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((ord) => {
                  const totalItemsQty = (ord.items || []).reduce(
                    (sum, i) => sum + (i.quantity || 1),
                    0
                  );

                  return (
                    <tr
                      key={ord.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition"
                    >
                      {/* Order Number */}
                      <td className="py-3 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {ord.orderNumber}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 text-slate-500 text-[11px]">
                        {ord.orderDate ? new Date(ord.orderDate).toLocaleString() : 'N/A'}
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {ord.customerName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {ord.customerMobile}
                        </span>
                      </td>

                      {/* Items & Quantity */}
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 font-semibold text-slate-700 dark:text-slate-300">
                          {ord.items?.length || 0} items ({totalItemsQty} qty)
                        </span>
                      </td>

                      {/* Grand Total */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatINR(ord.grandTotal)}
                      </td>

                      {/* Payment Status Dropdown / Badge */}
                      <td className="py-3 px-3 text-center">
                        <select
                          value={ord.paymentStatus || 'Pending'}
                          onChange={(e) => handlePaymentChange(ord.id, e.target.value)}
                          disabled={!isAuthorizedToChangeStatus}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold border-none focus:outline-none cursor-pointer ${
                            ord.paymentStatus === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : ord.paymentStatus === 'Failed'
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                          }`}
                        >
                          {PAYMENT_STATUSES.map((pst) => (
                            <option key={pst} value={pst}>
                              {pst}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Order Status Dropdown */}
                      <td className="py-3 px-3 text-center">
                        <select
                          value={ord.orderStatus || 'Pending'}
                          onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                          disabled={!isAuthorizedToChangeStatus}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
                        >
                          {ORDER_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setActiveModalOrder(ord)}
                            className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 hover:bg-blue-100 transition cursor-pointer"
                            title="View Order Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onGenerateInvoice(ord)}
                            className="p-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-300 hover:bg-orange-100 transition cursor-pointer"
                            title="Generate GST Invoice"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No orders found matching the filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ORDER DETAILS MODAL */}
      {activeModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl p-5 sm:p-6 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-orange-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Order Details #{activeModalOrder.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => {
                  setActiveModalOrder(null);
                  if (onCloseOrderModal) onCloseOrderModal();
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Customer & Address Info */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3 border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Customer Information
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm block">
                    {activeModalOrder.customerName}
                  </span>
                  <span className="text-slate-500 block flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" /> {activeModalOrder.customerMobile}
                  </span>
                  {activeModalOrder.customerEmail && (
                    <span className="text-slate-500 block flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3" /> {activeModalOrder.customerEmail}
                    </span>
                  )}
                  {activeModalOrder.customerGstin && (
                    <span className="text-slate-500 block font-mono text-[10px] mt-0.5">
                      GSTIN: {activeModalOrder.customerGstin}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Delivery Address
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>
                      {activeModalOrder.customerAddress || 'Local Store Pickup / Pandri Complex'}
                      {activeModalOrder.customerCity && `, ${activeModalOrder.customerCity}`}
                      {activeModalOrder.customerPincode && ` - ${activeModalOrder.customerPincode}`}
                    </span>
                  </p>
                  <span className="text-slate-500 block mt-1">
                    Order Type: {activeModalOrder.orderType || 'Home Delivery'}
                  </span>
                </div>
              </div>

              {/* Status Management Row */}
              <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900/50 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Order Status:</span>
                  <select
                    value={activeModalOrder.orderStatus}
                    onChange={(e) => handleStatusChange(activeModalOrder.id, e.target.value)}
                    disabled={!isAuthorizedToChangeStatus}
                    className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                  >
                    {ORDER_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Payment:</span>
                  <select
                    value={activeModalOrder.paymentStatus}
                    onChange={(e) => handlePaymentChange(activeModalOrder.id, e.target.value)}
                    disabled={!isAuthorizedToChangeStatus}
                    className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                  >
                    {PAYMENT_STATUSES.map((pst) => (
                      <option key={pst} value={pst}>
                        {pst}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => setShowRiderForm(!showRiderForm)}
                  className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Assign Rider</span>
                </button>
              </div>

              {/* Rider Assignment Form */}
              {showRiderForm && (
                <form
                  onSubmit={handleSaveRider}
                  className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 animate-in fade-in duration-150"
                >
                  <span className="font-bold text-slate-900 dark:text-white block">
                    Assign Delivery Executive
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Delivery Person Name"
                      value={riderForm.deliveryPerson}
                      onChange={(e) => setRiderForm({ ...riderForm, deliveryPerson: e.target.value })}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Mobile Number"
                      value={riderForm.mobile}
                      onChange={(e) => setRiderForm({ ...riderForm, mobile: e.target.value })}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowRiderForm(false)}
                      className="px-3 py-1 rounded-lg text-slate-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                      Save Assignment
                    </button>
                  </div>
                </form>
              )}

              {/* Line Items Table */}
              <div>
                <span className="font-bold text-slate-900 dark:text-white block mb-2">
                  Ordered Products ({(activeModalOrder.items || []).length})
                </span>
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-2 px-3">Item</th>
                        <th className="py-2 px-3 text-center">Qty</th>
                        <th className="py-2 px-3 text-right">Unit Price</th>
                        <th className="py-2 px-3 text-right">Tax</th>
                        <th className="py-2 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                      {(activeModalOrder.items || []).map((it, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">
                              {it.productName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              SKU: {it.sku || 'N/A'} • HSN: {it.hsnCode || '4802'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold font-mono">
                            {it.quantity}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                            {formatINR(it.rate || it.unitPrice || 0)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                            {formatINR(it.totalGst || 0)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {formatINR(it.totalAmount || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals Summary */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 ml-auto max-w-xs space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-mono">{formatINR(activeModalOrder.subtotal)}</span>
                </div>
                {activeModalOrder.totalDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span className="font-mono">-{formatINR(activeModalOrder.totalDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>GST Taxes:</span>
                  <span className="font-mono">{formatINR(activeModalOrder.totalTax)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Delivery Charges:</span>
                  <span className="font-mono">
                    {activeModalOrder.deliveryCharge > 0 ? formatINR(activeModalOrder.deliveryCharge) : 'FREE'}
                  </span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-1.5 flex justify-between font-black text-sm text-slate-900 dark:text-white">
                  <span>Grand Total:</span>
                  <span className="text-orange-600 dark:text-orange-400 font-mono">
                    {formatINR(activeModalOrder.grandTotal)}
                  </span>
                </div>
              </div>

              {/* Modal Bottom Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => onGenerateInvoice(activeModalOrder)}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Generate Treo Invoice</span>
                </button>

                <button
                  onClick={() => {
                    setActiveModalOrder(null);
                    if (onCloseOrderModal) onCloseOrderModal();
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
