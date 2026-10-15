import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  ShoppingCart,
  Eye,
  Plus,
  X,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../utils/gstUtils';
import { CustomerUser, Order } from '../../types';

interface AdminCustomersTabProps {
  onViewOrderDetails: (order: Order) => void;
}

export const AdminCustomersTab: React.FC<AdminCustomersTabProps> = ({ onViewOrderDetails }) => {
  const { customers, orders, addCustomer, showToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerUser | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Customer Form
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustCity, setNewCustCity] = useState('Raipur');
  const [newCustGstin, setNewCustGstin] = useState('');
  const [newCustCompany, setNewCustCompany] = useState('');

  // Calculate actual total spending and orders for each customer from real orders in Supabase
  const customerAnalyticsMap = useMemo(() => {
    const map: Record<string, { totalOrders: number; totalSpending: number; lastOrderDate: string; orders: Order[] }> = {};

    customers.forEach((c) => {
      map[c.id] = { totalOrders: 0, totalSpending: 0, lastOrderDate: '', orders: [] };
    });

    orders.forEach((o) => {
      // Match by customer phone or name or customerId
      const matchedCust = customers.find(
        (c) =>
          c.mobile === o.customerMobile ||
          c.name.toLowerCase() === o.customerName.toLowerCase() ||
          (c.email && o.customerEmail && c.email.toLowerCase() === o.customerEmail.toLowerCase())
      );

      if (matchedCust) {
        if (!map[matchedCust.id]) {
          map[matchedCust.id] = { totalOrders: 0, totalSpending: 0, lastOrderDate: '', orders: [] };
        }
        map[matchedCust.id].totalOrders += 1;
        map[matchedCust.id].totalSpending += o.grandTotal || 0;
        map[matchedCust.id].orders.push(o);
        if (!map[matchedCust.id].lastOrderDate || new Date(o.orderDate || 0) > new Date(map[matchedCust.id].lastOrderDate)) {
          map[matchedCust.id].lastOrderDate = o.orderDate || '';
        }
      }
    });

    return map;
  }, [customers, orders]);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.mobile.includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.city || '').toLowerCase().includes(q) ||
        (c.companyName || '').toLowerCase().includes(q)
      );
    });
  }, [customers, searchQuery]);

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) {
      showToast('Customer name and phone number are required.');
      return;
    }

    addCustomer({
      name: newCustName.trim(),
      mobile: newCustPhone.trim(),
      email: newCustEmail.trim() || undefined,
      address: newCustAddress.trim() || undefined,
      city: newCustCity.trim(),
      state: 'Chhattisgarh',
      pincode: '492001',
      gstin: newCustGstin.trim() || undefined,
      companyName: newCustCompany.trim() || undefined,
    });

    showToast(`Added customer "${newCustName}".`);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustEmail('');
    setNewCustAddress('');
    setNewCustGstin('');
    setNewCustCompany('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Customer Directory ({customers.length})
          </h2>
          <span className="text-xs text-slate-400">
            Client accounts, contact info, total lifetime spend, and order history.
          </span>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-3 shadow-xs max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client name, mobile, email, city..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-3">Customer Name</th>
                <th className="py-3 px-3">Contact Details</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3 text-center">Total Orders</th>
                <th className="py-3 px-3 text-right">Total Spending</th>
                <th className="py-3 px-3">Last Order</th>
                <th className="py-3 px-3">Registered On</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((cust) => {
                  const analytics = customerAnalyticsMap[cust.id] || {
                    totalOrders: cust.ordersCount || 0,
                    totalSpending: cust.totalPurchases || 0,
                    lastOrderDate: cust.lastPurchaseDate || '',
                    orders: [],
                  };

                  return (
                    <tr
                      key={cust.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition"
                    >
                      {/* Name & Company */}
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {cust.name}
                        </span>
                        {cust.companyName && (
                          <span className="text-[10px] text-slate-400 block">
                            {cust.companyName}
                          </span>
                        )}
                      </td>

                      {/* Phone & Email */}
                      <td className="py-3 px-3">
                        <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 block">
                          {cust.mobile}
                        </span>
                        {cust.email && (
                          <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">
                            {cust.email}
                          </span>
                        )}
                      </td>

                      {/* Location */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {cust.city || 'Raipur'}, {cust.state || 'CG'}
                      </td>

                      {/* Total Orders */}
                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700">
                          {analytics.totalOrders}
                        </span>
                      </td>

                      {/* Total Spending */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                        {formatINR(analytics.totalSpending)}
                      </td>

                      {/* Last Order */}
                      <td className="py-3 px-3 text-slate-500 text-[11px]">
                        {analytics.lastOrderDate
                          ? new Date(analytics.lastOrderDate).toLocaleDateString()
                          : 'No orders yet'}
                      </td>

                      {/* Registration Date */}
                      <td className="py-3 px-3 text-slate-400 text-[11px]">
                        {cust.createdAt ? new Date(cust.createdAt).toLocaleDateString() : 'Active client'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setSelectedCustomer(cust)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 font-bold hover:bg-blue-100 transition cursor-pointer flex items-center gap-1 mx-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>History</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No customers found matching search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CUSTOMER DETAILS & ORDER HISTORY MODAL */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl p-5 sm:p-6 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Customer Profile & Purchase History
                </h3>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Customer Info Card */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-slate-400 block text-[10px]">Client Name:</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm block">
                    {selectedCustomer.name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Phone Number:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white block">
                    {selectedCustomer.mobile}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Total Orders:</span>
                  <span className="font-black text-slate-900 dark:text-white text-sm block">
                    {customerAnalyticsMap[selectedCustomer.id]?.totalOrders || 0}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Total Spend:</span>
                  <span className="font-mono font-black text-blue-600 text-sm block">
                    {formatINR(customerAnalyticsMap[selectedCustomer.id]?.totalSpending || 0)}
                  </span>
                </div>
              </div>

              {/* Order History */}
              <div>
                <span className="font-bold text-slate-900 dark:text-white block mb-2">
                  Order History ({(customerAnalyticsMap[selectedCustomer.id]?.orders || []).length} Orders)
                </span>
                <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-700/60">
                  {(customerAnalyticsMap[selectedCustomer.id]?.orders || []).length > 0 ? (
                    customerAnalyticsMap[selectedCustomer.id].orders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-750 transition"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-blue-600">
                              {ord.orderNumber}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(ord.orderDate).toLocaleDateString()}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500">
                            {ord.items?.length || 0} items • {ord.orderStatus}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {formatINR(ord.grandTotal)}
                          </span>
                          <button
                            onClick={() => {
                              onViewOrderDetails(ord);
                              setSelectedCustomer(null);
                            }}
                            className="p-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-blue-600 hover:bg-blue-50 cursor-pointer"
                            title="View Order"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-slate-400">
                      No orders found placed by this customer.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD CUSTOMER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl p-5 sm:p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Add New Customer
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    placeholder="+91 98271 23456"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newCustEmail}
                    onChange={(e) => setNewCustEmail(e.target.value)}
                    placeholder="client@gmail.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Company / Organization
                </label>
                <input
                  type="text"
                  value={newCustCompany}
                  onChange={(e) => setNewCustCompany(e.target.value)}
                  placeholder="e.g. Apex Prints & Stationers"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  GSTIN (For B2B Tax Invoices)
                </label>
                <input
                  type="text"
                  value={newCustGstin}
                  onChange={(e) => setNewCustGstin(e.target.value)}
                  placeholder="22AAAAA0000A1Z5"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="Shop No. 5, Pandri Market"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md cursor-pointer"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
