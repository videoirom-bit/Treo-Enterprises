import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  MessageCircle,
  FileText,
  CreditCard,
  Building2,
} from 'lucide-react';

export const Footer: React.FC = () => {
  const { shopSettings, setActiveView, setSelectedCategoryFilter } = useApp();

  const openWhatsApp = () => {
    const cleanNumber = (shopSettings?.whatsAppNumber || '').replace(/[^0-9]/g, '');
    const text = encodeURIComponent(`Hello ${shopSettings?.shopName || 'ABC Paper & Stationery'}, I have a query regarding stationery items.`);
    window.open(`https://wa.me/${cleanNumber}?text=${text}`, '_blank');
  };

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 transition-colors pt-12 pb-8 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand and Description */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black text-lg">
                ABC
              </div>
              <span className="font-extrabold text-lg text-white tracking-tight">
                {shopSettings.shopName}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Your neighborhood stationery and paper specialist. Supplying premium copier paper, executive pens, student notebooks, corporate registers, and school kits with genuine GST invoices.
            </p>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span className="font-mono text-amber-300">GSTIN: {shopSettings.gstin}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                PAN: <span className="font-mono text-slate-300">{shopSettings.panNumber}</span> | Udyam Reg: <span className="font-mono text-slate-300">{shopSettings.businessRegistrationNumber}</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              Explore Store
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <button
                  onClick={() => {
                    setSelectedCategoryFilter(null);
                    setActiveView('products');
                  }}
                  className="hover:text-teal-400 transition"
                >
                  All Stationery Products
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveView('categories')}
                  className="hover:text-teal-400 transition"
                >
                  Product Categories
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveView('offers')}
                  className="hover:text-teal-400 transition"
                >
                  Special Deals & Discounts
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveView('track-order')}
                  className="hover:text-teal-400 transition font-semibold text-blue-400"
                >
                  Track Your Order Live
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveView('customer-portal')}
                  className="hover:text-teal-400 transition font-semibold text-emerald-400"
                >
                  My Account & Orders
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveView('cart')}
                  className="hover:text-teal-400 transition"
                >
                  Shopping Cart & Billing
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveView('about')}
                  className="hover:text-teal-400 transition"
                >
                  About {shopSettings.shopName}
                </button>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              Popular Sections
            </h4>
            <ul className="space-y-2 text-slate-400">
              {['Paper', 'Notebooks', 'Pens', 'Office Supplies', 'Art & Craft'].map((cat) => (
                <li key={cat}>
                  <button
                    onClick={() => {
                      setSelectedCategoryFilter(cat);
                      setActiveView('products');
                    }}
                    className="hover:text-teal-400 transition"
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Store Contacts & Timings */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              Shop Visit & Contact
            </h4>
            <div className="space-y-2.5 text-slate-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span className="leading-snug">
                  {shopSettings.shopAddress}, {shopSettings.city}, {shopSettings.state} - {shopSettings.pinCode}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-teal-400 shrink-0" />
                <span>{shopSettings.phoneNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-teal-400 shrink-0" />
                <span>{shopSettings.emailAddress}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{shopSettings.openingHours}</span>
              </div>
            </div>

            <button
              onClick={openWhatsApp}
              className="mt-2 w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2 transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Store Chat</span>
            </button>
          </div>
        </div>

        {/* Bottom bar with legal & admin shortcut */}
        <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {shopSettings.shopName}. All rights reserved.</p>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveView('admin')}
              className="text-slate-400 hover:text-white transition flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>Shop Owner Dashboard</span>
            </button>
            <span>•</span>
            <span>Indian GST Compliance Ready</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
