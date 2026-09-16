import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Order, CustomerUser } from '../types';
import {
  User,
  ShoppingBag,
  FileText,
  Truck,
  RotateCw,
  Search,
  Calendar,
  CreditCard,
  MapPin,
  Building,
  Phone,
  Mail,
  Edit2,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Receipt,
  Download,
} from 'lucide-react';

export const CustomerPortalView: React.FC = () => {
  const {
    orders,
    customers,
    currentCustomer,
    setCurrentCustomer,
    setActiveView,
    setSearchTrackingId,
    setSelectedOrderForInvoice,
    reorderItems,
    showToast,
    updateCustomer,
  } = useApp();

  // Active customer state (defaults to Rahul Sharma if none selected)
  const activeCustomer: CustomerUser =
    currentCustomer ||
    customers.find((c) => c.mobile === '9876500125') ||
    customers[0] || {
      id: 'cust-default',
      name: 'Rahul Sharma',
      mobile: '9876500125',
      email: 'rahul.sharma@example.com',
      whatsapp: '9876500125',
      address: 'House 42, Civil Lines, Near Raj Bhavan',
      city: 'Raipur',
      state: 'Chhattisgarh',
      pincode: '492001',
      gstin: '22AAAAA0000A1Z5',
      companyName: 'Sharma & Associates',
      totalPurchases: 4500,
      ordersCount: 3,
      outstandingAmount: 0,
      createdAt: new Date().toISOString(),
    };

  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    name: activeCustomer.name,
    email: activeCustomer.email,
    mobile: activeCustomer.mobile,
    whatsapp: activeCustomer.whatsapp || '',
    address: activeCustomer.address,
    city: activeCustomer.city,
    state: activeCustomer.state,
    pincode: activeCustomer.pincode,
    gstin: activeCustomer.gstin || '',
    companyName: activeCustomer.companyName || '',
  });

  // Filter customer's orders
  const customerOrders = orders.filter((o) => {
    const isThisCust =
      o.customer.mobile.replace(/\D/g, '') === activeCustomer.mobile.replace(/\D/g, '') ||
      o.customer.name.toLowerCase() === activeCustomer.name.toLowerCase();

    if (!isThisCust) return false;

    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        if (o.orderStatus === 'Delivered' || o.orderStatus === 'Cancelled') return false;
      } else if (statusFilter === 'delivered') {
        if (o.orderStatus !== 'Delivered') return false;
      }
    }

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const matchId = o.orderNumber.toLowerCase().includes(q);
      const matchInv = o.invoiceNumber.toLowerCase().includes(q);
      const matchItems = o.items.some((it) => it.productName.toLowerCase().includes(q));
      return matchId || matchInv || matchItems;
    }

    return true;
  });

  // Handle profile save
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateCustomer(activeCustomer.id, editForm);
    if (setCurrentCustomer) {
      setCurrentCustomer({ ...activeCustomer, ...editForm });
    }
    setIsEditingProfile(false);
    showToast('Customer profile updated successfully.');
  };

  const handleTrackOrder = (order: Order) => {
    setSearchTrackingId(order.orderNumber);
    setActiveView('track-order');
  };

  const handleViewInvoice = (order: Order) => {
    setSelectedOrderForInvoice(order);
    setActiveView('invoice-view');
  };

  // Switch demo customer
  const handleSwitchCustomer = (cust: CustomerUser) => {
    setCurrentCustomer(cust);
    setEditForm({
      name: cust.name,
      email: cust.email,
      mobile: cust.mobile,
      whatsapp: cust.whatsapp || '',
      address: cust.address,
      city: cust.city,
      state: cust.state,
      pincode: cust.pincode,
      gstin: cust.gstin || '',
      companyName: cust.companyName || '',
    });
    showToast(`Switched account to ${cust.name}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-3 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Customer Account Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 to-teal-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-md shrink-0">
              {activeCustomer.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                  {activeCustomer.name}
                </h1>
                {activeCustomer.companyName && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {activeCustomer.companyName}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {activeCustomer.mobile}
                </span>
                {activeCustomer.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    {activeCustomer.email}
                  </span>
                )}
                {activeCustomer.gstin && (
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                    GSTIN: {activeCustomer.gstin}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{isEditingProfile ? 'Cancel Edit' : 'Edit Profile'}</span>
            </button>

            {/* Switch user dropdown/chips for demo */}
            <div className="relative group">
              <button
                className="px-3.5 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-1 transition"
                title="Switch customer account to view other order histories"
              >
                <User className="w-3.5 h-3.5" />
                <span>Switch Account</span>
              </button>
              <div className="absolute right-0 top-full mt-2 w-64 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl hidden group-hover:block z-30 space-y-1 text-xs">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Demo Customer
                </div>
                {customers.slice(0, 5).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSwitchCustomer(c)}
                    className={`w-full text-left p-2 rounded-xl transition flex items-center justify-between ${
                      c.id === activeCustomer.id
                        ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 font-bold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{c.name}</div>
                      <div className="text-[10px] text-slate-400">{c.mobile}</div>
                    </div>
                    {c.id === activeCustomer.id && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Edit Modal / Collapsible */}
        {isEditingProfile && (
          <form
            onSubmit={handleSaveProfile}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-blue-200 dark:border-blue-900 shadow-sm space-y-4"
          >
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Edit Account & Delivery Address Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-500 mb-1 font-medium">Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                  className="w-full min-h-[44px] p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1 font-medium">Mobile Number</label>
                <input
                  type="text"
                  value={editForm.mobile}
                  onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                  required
                  className="w-full min-h-[44px] p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1 font-medium">Email Address</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full min-h-[44px] p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1 font-medium">Company Name (Optional)</label>
                <input
                  type="text"
                  value={editForm.companyName}
                  onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                  className="w-full min-h-[44px] p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1 font-medium">GSTIN (Optional)</label>
                <input
                  type="text"
                  value={editForm.gstin}
                  onChange={(e) => setEditForm({ ...editForm, gstin: e.target.value })}
                  placeholder="22AAAAA0000A1Z5"
                  className="w-full min-h-[44px] p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1 font-medium">PIN Code</label>
                <input
                  type="text"
                  value={editForm.pincode}
                  onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })}
                  className="w-full min-h-[44px] p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-slate-500 mb-1 font-medium">Delivery Address</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full min-h-[44px] p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1 font-medium">City</label>
                <input
                  type="text"
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  className="w-full min-h-[44px] p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer touch-manipulation"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto min-h-[44px] px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold shadow-xs flex items-center justify-center cursor-pointer touch-manipulation"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}

        {/* Stats summary banner */}
        <div className="grid grid-cols-1 min-[380px]:grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Total Orders
            </span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {customerOrders.length}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">Lifetime purchase records</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Total Spent
            </span>
            <div className="text-2xl font-extrabold text-blue-700 dark:text-blue-400 mt-1 font-mono">
              ₹
              {customerOrders
                .reduce((s, o) => s + o.grandTotal, 0)
                .toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Including GST taxes</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Active Shipments
            </span>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              {
                customerOrders.filter(
                  (o) => o.orderStatus !== 'Delivered' && o.orderStatus !== 'Cancelled'
                ).length
              }
            </div>
            <span className="text-[11px] text-slate-400 font-medium">In transit / processing</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Preferred Store
            </span>
            <div className="text-base font-bold text-slate-800 dark:text-slate-200 mt-2 truncate">
              ABC Paper & Store
            </div>
            <span className="text-[11px] text-slate-400">Raipur Central Station</span>
          </div>
        </div>

        {/* Order History Section */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Order History & Invoices
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track live progress, download tax invoices, and reorder stationery in one click.
              </p>
            </div>

            {/* Filter and search controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search item, order #..."
                  className="w-full min-h-[44px] pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs dark:text-white placeholder-slate-400"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto min-h-[44px] py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs dark:text-white cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Orders</option>
                <option value="delivered">Delivered Only</option>
              </select>
            </div>
          </div>

          {/* Orders List */}
          {customerOrders.length > 0 ? (
            <div className="space-y-4">
              {customerOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 transition space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                        #{order.orderNumber}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          order.orderStatus === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : order.orderStatus === 'Out for Delivery'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 animate-pulse'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {order.orderStatus}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          order.paymentStatus === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-amber-50 text-amber-700 border border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 font-mono flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(order.orderDate).toLocaleDateString('en-IN')}</span>
                      <span>·</span>
                      <span>Invoice: {order.invoiceNumber}</span>
                    </div>
                  </div>

                  {/* Items snapshot */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5">
                      <div className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                        Items ({(order.items || []).length})
                      </div>
                      {(order.items || []).map((item, idx) => (
                        <div key={idx} className="flex justify-between text-slate-700 dark:text-slate-300">
                          <span className="truncate max-w-[280px]">
                            {item.quantity}x {item.productName}
                          </span>
                          <span className="font-mono text-slate-500">
                            ₹{item.totalAmount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1.5 md:border-l md:border-slate-200 dark:md:border-slate-700 md:pl-4">
                      <div className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                        Delivery & Amount
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Destination:</span>
                        <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[200px]">
                          {order.customer.city} ({order.customer.pincode})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Grand Total:</span>
                        <span className="font-extrabold text-blue-700 dark:text-blue-400 font-mono text-sm">
                          ₹{order.grandTotal.toLocaleString('en-IN')}
                        </span>
                      </div>
                      {order.assignedDeliveryPerson && (
                        <div className="flex justify-between text-[11px] text-emerald-600 font-medium">
                          <span>Rider:</span>
                          <span>{order.assignedDeliveryPerson.deliveryPerson}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action row */}
                  <div className="pt-2 flex items-center sm:justify-end gap-2 flex-wrap border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleTrackOrder(order)}
                      className="flex-1 sm:flex-none justify-center min-h-[44px] px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-2xs cursor-pointer touch-manipulation"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Track Order</span>
                    </button>

                    <button
                      onClick={() => handleViewInvoice(order)}
                      className="flex-1 sm:flex-none justify-center min-h-[44px] px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition border border-slate-200 dark:border-slate-700 cursor-pointer touch-manipulation"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>GST Invoice</span>
                    </button>

                    <button
                      onClick={() => reorderItems(order)}
                      className="flex-1 sm:flex-none justify-center min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer touch-manipulation"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Reorder Items</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 space-y-3">
              <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <div className="text-slate-600 dark:text-slate-400 font-medium text-sm">
                No orders found matching your search filters.
              </div>
              <button
                onClick={() => setActiveView('products')}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs rounded-xl"
              >
                Browse Stationery Catalog
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerPortalView;
