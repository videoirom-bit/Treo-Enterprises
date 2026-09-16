import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Order, OrderStatus } from '../types';
import { ABCStoreLogo } from '../components/ABCStoreLogo';
import { formatINR } from '../utils/gstUtils';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  FileText,
  RotateCw,
  AlertCircle,
  Share2,
  Copy,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Calendar,
  CreditCard,
  Building,
  ArrowRight,
  ExternalLink,
  Bell,
  Navigation,
} from 'lucide-react';

export const TrackOrderView: React.FC = () => {
  const {
    orders,
    searchTrackingId,
    setSearchTrackingId,
    quickTrackOrder,
    setSelectedOrderForInvoice,
    setActiveView,
    reorderItems,
    showToast,
    shopSettings,
  } = useApp();

  const [inputQuery, setInputQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'items' | 'notifications'>('timeline');

  // If searchTrackingId is provided from another component (e.g. Header, Home, Cart), trigger auto search
  useEffect(() => {
    if (searchTrackingId) {
      setInputQuery(searchTrackingId);
      const found = quickTrackOrder(searchTrackingId);
      if (found) {
        setSelectedOrder(found);
        setHasSearched(true);
      }
    } else if (orders.length > 0 && !selectedOrder) {
      // Default to the first order (Out for delivery Rahul Sharma) to present immediate rich experience
      const defaultOrder =
        orders.find((o) => o.orderNumber === 'ABC-2026-00125') ||
        orders.find((o) => o.orderStatus === 'Out for Delivery') ||
        orders[0];
      if (defaultOrder) {
        setSelectedOrder(defaultOrder);
        setInputQuery(defaultOrder.orderNumber);
      }
    }
  }, [searchTrackingId, orders]);

  const handleSearch = (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const q = customQuery !== undefined ? customQuery : inputQuery;
    const cleaned = q.trim();
    if (!cleaned) {
      showToast('Please enter an Order ID or Mobile number');
      return;
    }

    setHasSearched(true);
    const found = quickTrackOrder(cleaned);
    if (found) {
      setSelectedOrder(found);
      setSearchTrackingId(found.orderNumber);
      showToast(`Order found: ${found.orderNumber} for ${found.customer.name}`);
    } else {
      setSelectedOrder(null);
      showToast('No matching order found. Please check Order ID or Mobile Number.');
    }
  };

  const handleQuickChipClick = (ordNum: string) => {
    setInputQuery(ordNum);
    handleSearch(undefined, ordNum);
  };

  const copyTrackingLink = () => {
    if (!selectedOrder) return;
    navigator.clipboard.writeText(
      `${window.location.origin}/?track=${selectedOrder.orderNumber}`
    );
    showToast(`Tracking link for #${selectedOrder.orderNumber} copied!`);
  };

  const openWhatsAppHelp = () => {
    if (!selectedOrder) return;
    const cleanNumber = (shopSettings?.whatsAppNumber || '').replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Hello ${shopSettings?.shopName || 'ABC Paper & Stationery'}, I would like an update on my Order #${selectedOrder.orderNumber} (Status: ${selectedOrder.orderStatus}, Name: ${selectedOrder.customer.name}).`
    );
    window.open(`https://wa.me/${cleanNumber}?text=${message}`, '_blank');
  };

  const callDeliveryPerson = () => {
    if (!selectedOrder?.assignedDeliveryPerson?.mobile) return;
    window.location.href = `tel:${selectedOrder.assignedDeliveryPerson.mobile.replace(/\s+/g, '')}`;
  };

  // 7 standard workflow milestones
  const ORDER_STAGES: Array<{ status: OrderStatus; label: string; icon: any; description: string }> = [
    {
      status: 'Order Placed',
      label: 'Order Placed',
      icon: Clock,
      description: 'Order logged and registered in the store system.',
    },
    {
      status: 'Confirmed',
      label: 'Order Confirmed',
      icon: CheckCircle2,
      description: 'Order confirmed and inventory reserved.',
    },
    {
      status: 'Processing',
      label: 'Processing',
      icon: Package,
      description: 'Items are being picked from warehouse racks.',
    },
    {
      status: 'Packed',
      label: 'Packed',
      icon: Package,
      description: 'Items packed in protective stationery cartons.',
    },
    {
      status: 'Ready for Dispatch',
      label: 'Ready for Dispatch',
      icon: Building,
      description: 'Staged at dispatch dock with shipping label.',
    },
    {
      status: 'Out for Delivery',
      label: 'Out for Delivery',
      icon: Truck,
      description: 'Assigned rider is on route with your parcel.',
    },
    {
      status: 'Delivered',
      label: 'Delivered',
      icon: UserCheck,
      description: 'Successfully handed over to customer.',
    },
  ];

  // Helper to determine index in pipeline
  const getStageIndex = (status: OrderStatus): number => {
    switch (status) {
      case 'Order Placed':
      case 'New':
        return 0;
      case 'Confirmed':
        return 1;
      case 'Processing':
        return 2;
      case 'Packed':
      case 'Ready':
        return 3;
      case 'Ready for Dispatch':
      case 'Shipped':
        return 4;
      case 'Out for Delivery':
        return 5;
      case 'Delivered':
        return 6;
      case 'Cancelled':
      case 'Returned':
        return -1;
      default:
        return 0;
    }
  };

  const currentStageIndex = selectedOrder ? getStageIndex(selectedOrder.orderStatus) : 0;
  const isCancelled = selectedOrder?.orderStatus === 'Cancelled';
  const isReturned = selectedOrder?.orderStatus === 'Returned';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-3 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Page Title & Breadcrumb */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold">
            <Truck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-pulse" />
            <span>Real-Time Order Tracking</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Track Your Order
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Enter your Order ID or Registered Mobile number to check real-time packaging, dispatch, and delivery status.
          </p>
        </div>

        {/* Search Box Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 dark:border-slate-800">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  id="track-order-input"
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder="Enter Order ID (e.g., ABC-2026-00125) or Mobile (9876500125)"
                  className="w-full min-h-[48px] pl-11 pr-14 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm sm:text-base text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                />
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                {inputQuery && (
                  <button
                    type="button"
                    onClick={() => setInputQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 min-h-[36px] px-2 text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <button
                id="track-order-search-btn"
                type="submit"
                className="w-full sm:w-auto min-h-[48px] px-6 py-3.5 bg-blue-700 hover:bg-blue-600 active:scale-98 text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer shrink-0 text-sm sm:text-base touch-manipulation"
              >
                <Search className="w-4 h-4" />
                <span>Track Order</span>
              </button>
            </div>

            {/* Quick Demo Order Chips */}
            <div className="pt-2">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-2 flex items-center gap-1.5">
                <span>Quick Test Orders:</span>
                <span className="text-[11px] text-slate-400">(Click to test live tracking)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'ABC-2026-00125', label: 'Rahul Sharma (Out for Delivery)', color: 'blue' },
                  { id: 'ABC-2026-00124', label: 'Pooja Verma (Delivered)', color: 'emerald' },
                  { id: 'ABC-2026-00123', label: 'Kavita Patel (Ready for Dispatch)', color: 'indigo' },
                  { id: 'ABC-2026-00122', label: 'Zenith Tech (Processing)', color: 'amber' },
                  { id: 'ABC-2026-00118', label: "St. Xavier's (Order Placed)", color: 'slate' },
                ].map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => handleQuickChipClick(chip.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                      inputQuery === chip.id
                        ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-600 text-blue-700 dark:text-blue-300'
                        : 'bg-slate-100 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="font-mono">{chip.id}</span>
                    <span className="opacity-70 ml-1.5 hidden md:inline">· {chip.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* If Search Attempted and Order Not Found */}
        {hasSearched && !selectedOrder && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              No Order Found with "{inputQuery}"
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Please make sure you entered the correct Order ID (e.g.,{' '}
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">ABC-2026-00125</span>)
              or the 10-digit mobile number used while placing the order.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => handleQuickChipClick('ABC-2026-00125')}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold rounded-xl"
              >
                Load Demo Order ABC-2026-00125
              </button>
              <button
                onClick={openWhatsAppHelp}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Contact Helpdesk
              </button>
            </div>
          </div>
        )}

        {/* Loaded Order View */}
        {selectedOrder && (
          <div className="space-y-6">
            {/* Top Order Summary Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden">
              {/* Background accent wave */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/10 via-emerald-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 font-mono font-extrabold text-sm sm:text-base">
                      #{selectedOrder.orderNumber}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                        selectedOrder.orderStatus === 'Delivered'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                          : selectedOrder.orderStatus === 'Out for Delivery'
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 animate-pulse'
                          : selectedOrder.orderStatus === 'Cancelled'
                          ? 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-current" />
                      {selectedOrder.orderStatus}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                        selectedOrder.paymentStatus === 'Paid'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : selectedOrder.paymentStatus === 'Partial'
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      }`}
                    >
                      {selectedOrder.paymentStatus} · {selectedOrder.paymentMethod}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Placed on{' '}
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {new Date(selectedOrder.orderDate).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>{' '}
                    · Invoice:{' '}
                    <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                      {selectedOrder.invoiceNumber}
                    </span>
                  </p>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    id="track-view-invoice-btn"
                    onClick={() => {
                      setSelectedOrderForInvoice(selectedOrder);
                      setActiveView('invoice-view');
                    }}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer touch-manipulation"
                  >
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>View GST Invoice</span>
                  </button>

                  <button
                    id="track-reorder-btn"
                    onClick={() => reorderItems(selectedOrder)}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-1.5 transition border border-blue-200 dark:border-blue-800 cursor-pointer touch-manipulation"
                  >
                    <RotateCw className="w-4 h-4 text-blue-600" />
                    <span>Reorder All</span>
                  </button>

                  <button
                    onClick={copyTrackingLink}
                    title="Share tracking link"
                    className="min-h-[44px] min-w-[44px] p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs transition flex items-center justify-center cursor-pointer touch-manipulation"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* High-level metrics grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Customer Name
                  </span>
                  <div className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base truncate">
                    {selectedOrder.customer.name}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    {selectedOrder.customer.mobile}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Expected Delivery
                  </span>
                  <div className="font-bold text-emerald-700 dark:text-emerald-400 text-sm sm:text-base flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>
                      {selectedOrder.expectedDeliveryDate
                        ? new Date(selectedOrder.expectedDeliveryDate).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })
                        : 'Within 24 Hours'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {selectedOrder.orderStatus === 'Delivered' ? 'Completed' : 'On Schedule'}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Grand Total (Inc. GST)
                  </span>
                  <div className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg">
                    {formatINR(selectedOrder.grandTotal ?? 0)}
                  </div>
                  <div className="text-xs text-slate-500">
                    {selectedOrder.items.reduce((s, i) => s + i.quantity, 0)} items in carton
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Delivery Destination
                  </span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm line-clamp-1">
                    {selectedOrder.customer.billingAddress}
                  </div>
                  <div className="text-xs text-slate-500">
                    {selectedOrder.customer.city}, {selectedOrder.customer.pincode}
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Executive Card (Prominent if assigned) */}
            {selectedOrder.assignedDeliveryPerson && (
              <div className="bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-950/40 dark:to-emerald-950/40 rounded-3xl p-5 sm:p-6 border border-blue-200/80 dark:border-blue-800/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-lg shadow-md shrink-0">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                      Assigned Delivery Executive
                    </div>
                    <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{selectedOrder.assignedDeliveryPerson.deliveryPerson}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                        Verified Rider
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                      <span className="font-medium">
                        Area: {selectedOrder.assignedDeliveryPerson.deliveryArea}
                      </span>
                      {selectedOrder.assignedDeliveryPerson.vehicleDetails && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-slate-500">
                            {selectedOrder.assignedDeliveryPerson.vehicleDetails}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={callDeliveryPerson}
                    className="flex-1 sm:flex-none min-h-[44px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs cursor-pointer touch-manipulation"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Rider</span>
                  </button>
                  <button
                    onClick={openWhatsAppHelp}
                    className="flex-1 sm:flex-none min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs cursor-pointer touch-manipulation"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            )}

            {/* Main Tabs: Visual Timeline vs Items Breakdown vs Notification Log */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 pt-4 gap-4 sm:gap-6 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('timeline')}
                  className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
                    activeTab === 'timeline'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Navigation className="w-4 h-4" />
                  <span>Tracking Timeline</span>
                </button>

                <button
                  onClick={() => setActiveTab('items')}
                  className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
                    activeTab === 'items'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>Order Items ({selectedOrder.items.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
                    activeTab === 'notifications'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  <span>SMS & WhatsApp Logs ({selectedOrder.notificationLog?.length || 0})</span>
                </button>
              </div>

              <div className="p-6 sm:p-8">
                {/* TAB 1: VISUAL TIMELINE */}
                {activeTab === 'timeline' && (
                  <div className="space-y-10">
                    {/* Horizontal Stepper Tracker on Desktop */}
                    <div className="hidden lg:block py-4">
                      <div className="relative flex justify-between items-start">
                        {/* Connecting background bar */}
                        <div className="absolute top-5 left-8 right-8 h-1 bg-slate-200 dark:bg-slate-700 -z-0" />
                        {/* Connecting active fill bar */}
                        <div
                          className="absolute top-5 left-8 h-1 bg-blue-600 dark:bg-blue-500 transition-all duration-500 -z-0"
                          style={{
                            width: `${Math.min(100, Math.max(0, (currentStageIndex / (ORDER_STAGES.length - 1)) * 100))}%`,
                          }}
                        />

                        {ORDER_STAGES.map((stage, idx) => {
                          const isCompleted = idx < currentStageIndex;
                          const isCurrent = idx === currentStageIndex;
                          const isUpcoming = idx > currentStageIndex;
                          const IconComp = stage.icon;

                          return (
                            <div
                              key={stage.status}
                              className="flex flex-col items-center text-center relative z-10 max-w-[110px]"
                            >
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all shadow-sm ${
                                  isCompleted
                                    ? 'bg-emerald-600 text-white'
                                    : isCurrent
                                    ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900 scale-110 animate-bounce'
                                    : 'bg-white dark:bg-slate-800 text-slate-400 border-2 border-slate-300 dark:border-slate-600'
                                }`}
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="w-5 h-5" />
                                ) : (
                                  <IconComp className="w-5 h-5" />
                                )}
                              </div>

                              <span
                                className={`text-xs font-bold mt-3 leading-tight ${
                                  isCurrent
                                    ? 'text-blue-700 dark:text-blue-400'
                                    : isCompleted
                                    ? 'text-slate-800 dark:text-slate-200'
                                    : 'text-slate-400'
                                }`}
                              >
                                {stage.label}
                              </span>

                              {isCurrent && (
                                <span className="mt-1 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold rounded-md uppercase tracking-wider">
                                  Current
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Vertical Visual Pipeline for Mobile & Tablet (< lg) */}
                    <div className="block lg:hidden py-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                        7-Stage Delivery Progress
                      </div>
                      <div className="relative pl-7 space-y-3 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                        {ORDER_STAGES.map((stage, idx) => {
                          const isCompleted = idx < currentStageIndex;
                          const isCurrent = idx === currentStageIndex;
                          const IconComp = stage.icon;

                          return (
                            <div
                              key={stage.status}
                              className={`relative flex items-start gap-3 p-3 rounded-2xl transition border ${
                                isCurrent
                                  ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60 shadow-xs'
                                  : isCompleted
                                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-100/60 dark:border-emerald-900/40'
                                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-60'
                              }`}
                            >
                              {/* Left icon circle */}
                              <div
                                className={`absolute -left-7 top-3 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-2xs ${
                                  isCompleted
                                    ? 'bg-emerald-600 text-white'
                                    : isCurrent
                                    ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900 animate-pulse'
                                    : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-700'
                                }`}
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                ) : (
                                  <IconComp className="w-3.5 h-3.5" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <span
                                    className={`text-xs font-bold ${
                                      isCurrent
                                        ? 'text-blue-800 dark:text-blue-300 font-extrabold'
                                        : isCompleted
                                        ? 'text-emerald-900 dark:text-emerald-300'
                                        : 'text-slate-600 dark:text-slate-400'
                                    }`}
                                  >
                                    {stage.label}
                                  </span>
                                  {isCurrent && (
                                    <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-md uppercase tracking-wider animate-pulse">
                                      Current
                                    </span>
                                  )}
                                  {isCompleted && (
                                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Done
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                                  {stage.description}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Vertical Event History Log */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                        <h4 className="font-bold text-slate-900 dark:text-white text-base">
                          Order Progress Log & Timestamps
                        </h4>
                        <span className="text-xs text-slate-500">
                          {selectedOrder.trackingTimeline?.length || 1} recorded milestones
                        </span>
                      </div>

                      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                        {(selectedOrder.trackingTimeline || []).map((event, idx) => {
                          const isLatest = idx === (selectedOrder.trackingTimeline?.length || 1) - 1;
                          return (
                            <div key={event.id || idx} className="relative group">
                              {/* Timeline indicator node */}
                              <div
                                className={`absolute -left-6 sm:-left-8 top-1 w-5 h-5 rounded-full flex items-center justify-center ${
                                  isLatest
                                    ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-950'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                {isLatest ? (
                                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                                ) : (
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                )}
                              </div>

                              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 transition">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                                      {event.status}
                                    </span>
                                    {isLatest && (
                                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                                        Active State
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-slate-500 font-mono">
                                    {new Date(event.timestamp).toLocaleString('en-IN', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>

                                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                                  {event.message}
                                </p>

                                <div className="mt-2.5 flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                                  {event.location && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3 text-slate-400" />
                                      <span>Location: {event.location}</span>
                                    </span>
                                  )}
                                  {event.updatedBy && (
                                    <span className="flex items-center gap-1">
                                      <UserCheck className="w-3 h-3 text-slate-400" />
                                      <span>Updated by: {event.updatedBy}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: ORDER ITEMS */}
                {activeTab === 'items' && (
                  <div className="space-y-6">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs sm:text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="py-3 px-4">Item Details</th>
                            <th className="py-3 px-3 text-center">HSN</th>
                            <th className="py-3 px-3 text-right">Unit Rate</th>
                            <th className="py-3 px-3 text-center">Qty</th>
                            <th className="py-3 px-3 text-center">GST %</th>
                            <th className="py-3 px-4 text-right">Total Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {(selectedOrder.items || []).map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                                    <img
                                      src={item.imageUrl || 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=100&auto=format&fit=crop&q=60'}
                                      alt={item.productName}
                                      className="w-full h-full object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-800 dark:text-slate-200">
                                      {item.productName}
                                    </div>
                                    <div className="text-[11px] text-slate-400 font-mono">
                                      SKU: {item.sku}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-3 text-center font-mono text-slate-500">
                                {item.hsnCode}
                              </td>
                              <td className="py-3.5 px-3 text-right font-medium text-slate-700 dark:text-slate-300">
                                {formatINR(item.rate ?? 0)}
                              </td>
                              <td className="py-3.5 px-3 text-center font-bold text-slate-900 dark:text-white">
                                {item.quantity} {item.unit || 'units'}
                              </td>
                              <td className="py-3.5 px-3 text-center font-mono text-slate-600 dark:text-slate-400">
                                {item.gstRate}%
                              </td>
                              <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                                {formatINR(item.totalAmount ?? 0)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Financial Totals Breakdown */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-700 max-w-sm ml-auto space-y-2 text-xs sm:text-sm">
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Taxable Amount (Subtotal):</span>
                        <span className="font-mono">
                          {formatINR(selectedOrder.taxableAmount ?? (selectedOrder as any).taxableSubtotal ?? selectedOrder.subtotal ?? 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>CGST + SGST (Total GST):</span>
                        <span className="font-mono">
                          {formatINR(selectedOrder.totalTax ?? (selectedOrder as any).totalGst ?? ((selectedOrder.cgst || 0) + (selectedOrder.sgst || 0) + (selectedOrder.igst || 0)))}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Delivery & Packaging:</span>
                        <span className="font-mono text-emerald-600">
                          {selectedOrder.deliveryCharge ? formatINR(selectedOrder.deliveryCharge) : 'Free / Standard'}
                        </span>
                      </div>
                      <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between font-extrabold text-slate-900 dark:text-white text-base">
                        <span>Grand Total:</span>
                        <span className="text-blue-700 dark:text-blue-400 font-mono">
                          {formatINR(selectedOrder.grandTotal ?? 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: SMS & WHATSAPP LOGS */}
                {activeTab === 'notifications' && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Real-time log of automated notifications dispatched to the customer's registered phone number:
                    </p>

                    {selectedOrder.notificationLog?.length ? (
                      <div className="space-y-3">
                        {selectedOrder.notificationLog.map((notif) => (
                          <div
                            key={notif.id}
                            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-start gap-3.5"
                          >
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                notif.channel === 'WhatsApp'
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                              }`}
                            >
                              {notif.channel === 'WhatsApp' ? (
                                <MessageCircle className="w-5 h-5" />
                              ) : (
                                <Bell className="w-5 h-5" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                                  {notif.title} · {notif.channel}
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  {new Date(notif.timestamp).toLocaleString('en-IN')}
                                </span>
                              </div>
                              <p className="text-xs text-slate-700 dark:text-slate-300 font-sans">
                                {notif.message}
                              </p>
                              <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-400">
                                <span>Recipient: {notif.recipient}</span>
                                <span>•</span>
                                <span className="text-emerald-600 font-medium">Delivered to Handset</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400 text-xs">
                        No external alerts recorded for this order yet.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Need Help Box */}
            <div className="bg-slate-100 dark:bg-slate-800/60 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div>
                <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  Have questions about this delivery?
                </h5>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Our Raipur stationery helpdesk is active from 9:00 AM to 9:00 PM every day.
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={openWhatsAppHelp}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp Helpdesk</span>
                </button>
                <button
                  onClick={() => {
                    setActiveView('contact');
                  }}
                  className="px-4 py-2 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-bold text-xs transition border border-slate-200 dark:border-slate-600"
                >
                  Store Contact
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrderView;
