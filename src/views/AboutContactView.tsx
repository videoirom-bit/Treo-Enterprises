import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Store,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  Send,
  MessageCircle,
  CheckCircle,
  Building2,
} from 'lucide-react';

export const AboutContactView: React.FC = () => {
  const { shopSettings, showToast } = useApp();
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    showToast('Your message has been sent to the shop owner!');
    setTimeout(() => {
      setSubmitted(false);
      setContactName('');
      setContactPhone('');
      setContactSubject('');
      setContactMessage('');
    }, 3000);
  };

  const openWhatsApp = () => {
    const cleanNumber = (shopSettings?.whatsAppNumber || '').replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `Hello ${shopSettings?.shopName || 'ABC Paper & Stationery'}, I would like to enquire about wholesale supplies or school order quotation.`
    );
    window.open(`https://wa.me/${cleanNumber}?text=${text}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* About Section */}
      <section className="bg-white dark:bg-slate-800/90 rounded-3xl p-6 sm:p-12 border border-slate-200 dark:border-slate-700/80 shadow-md space-y-6">
        <div className="max-w-3xl space-y-4">
          <span className="text-teal-600 dark:text-teal-400 font-bold text-xs uppercase tracking-wider">
            About Our Business
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Welcome to {shopSettings.shopName}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Founded with a passion for quality school and office tools, <strong>{shopSettings.shopName}</strong> is one of the region's trusted stationery merchants. We specialize in bulk paper supplies, executive writing instruments, office registers, computer consumables, and art materials.
          </p>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Whether you run a school, college, coaching academy, corporate accounting office, or are a student preparing for examinations, we guarantee genuine branded stationery with immediate GST compliant billing and competitive rates.
          </p>
        </div>

        {/* Business Credentials Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-slate-100 dark:border-slate-700">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 text-xs block mb-1">Proprietor / Owner</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{shopSettings.ownerName}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 text-xs block mb-1">GSTIN Number</span>
            <span className="font-mono font-bold text-teal-600 text-sm">{shopSettings.gstin}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 text-xs block mb-1">Permanent Account No (PAN)</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">{shopSettings.panNumber}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 text-xs block mb-1">MSME / Udyam Reg</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">{shopSettings.businessRegistrationNumber}</span>
          </div>
        </div>
      </section>

      {/* Contact & Inquiry Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Contact info */}
        <div className="lg:col-span-5 bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl border border-slate-800 flex flex-col justify-between">
          <div className="space-y-4">
            <span className="text-amber-400 font-bold text-xs uppercase tracking-wider">
              Get in Touch
            </span>
            <h2 className="text-2xl font-bold">Contact Store Front</h2>
            <p className="text-slate-300 text-xs leading-relaxed">
              Have questions regarding paper reams, bulk institutional orders, or store pickup? Reach us directly via phone, WhatsApp, or email.
            </p>

            <div className="space-y-4 pt-4 text-xs">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Shop Address</span>
                  <span className="text-slate-300">
                    {shopSettings.shopAddress}, {shopSettings.city}, {shopSettings.state} - {shopSettings.pinCode}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-teal-400 shrink-0" />
                <div>
                  <span className="font-bold text-white block">Phone Line</span>
                  <span className="text-slate-300">{shopSettings.phoneNumber}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-white block">WhatsApp Business</span>
                  <span className="text-emerald-300">{shopSettings.whatsAppNumber}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-teal-400 shrink-0" />
                <div>
                  <span className="font-bold text-white block">Email Address</span>
                  <span className="text-slate-300">{shopSettings.emailAddress}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <span className="font-bold text-white block">Working Hours</span>
                  <span className="text-slate-300">{shopSettings.openingHours}</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={openWhatsApp}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat Directly on WhatsApp</span>
          </button>
        </div>

        {/* Contact / Quotation Form */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800/90 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700/80 shadow-md space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Send Quotation / Bulk Inquiry Message
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              We respond to institutional quotations and bulk copier paper queries within 2 hours.
            </p>
          </div>

          {submitted ? (
            <div className="p-8 text-center space-y-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="font-bold text-emerald-900 dark:text-emerald-200 text-base">
                Inquiry Received!
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Our shop manager will contact you at {contactPhone} shortly with pricing.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Rajesh Sharma"
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Subject / Requirement *</label>
                <input
                  type="text"
                  required
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  placeholder="e.g. Bulk quote for 50 reams JK Copier paper"
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Detailed Message / List of Items</label>
                <textarea
                  rows={4}
                  required
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Please mention quantities, preferred brands (Classmate, Doms, Reynolds), or delivery location..."
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition"
              >
                <Send className="w-4 h-4" />
                <span>Submit Inquiry</span>
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};
