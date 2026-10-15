import React, { useState, useEffect } from 'react';
import {
  Settings,
  Store,
  Building,
  Phone,
  Mail,
  Receipt,
  CreditCard,
  Palette,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  QrCode,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ShopSettings } from '../../types';

export const AdminSettingsTab: React.FC = () => {
  const {
    shopSettings,
    updateShopSettings,
    resetShopSettingsToDefault,
    refreshShopSettingsFromSupabase,
    showToast,
  } = useApp();

  const [form, setForm] = useState<ShopSettings>({
    shopName: 'TREO ENTERPRISES',
    shopLogo: '/treo-logo.svg',
    tagline: 'Paper & Office Supplies',
    ownerName: 'Ramesh Sharma',
    shopAddress: 'Commercial Market Complex, Station Road, Pandri',
    city: 'Raipur',
    state: 'Chhattisgarh',
    pinCode: '492001',
    phoneNumber: '+91 98765 43210',
    whatsAppNumber: '+91 98765 43210',
    emailAddress: 'contact@treoenterprises.com',
    gstin: '22AAAAA0000A1Z5',
    panNumber: 'AAAAA0000A',
    businessRegistrationNumber: 'UDYAM-CG-03-0012345',
    websiteName: 'treoenterprises.com',
    openingHours: 'Mon - Sat: 9:00 AM – 9:30 PM | Sunday: 10:00 AM – 2:00 PM',
    upiId: 'abcpaper@okhdfcbank',
    bankName: 'HDFC Bank Ltd',
    bankAccountNumber: '50200012345678',
    bankIfsc: 'HDFC0001234',
    bankBranch: 'Main Station Road, Raipur',
    invoicePrefix: 'INV-2026/',
    invoiceNumberStartingValue: 1001,
    primaryBrandColor: '#1e40af', // Royal Blue
    accentColor: '#ea580c', // Treo Vibrant Orange
    stateCode: '22',
    termsAndConditions:
      '1. Goods once sold will be replaced within 3 days if defective in original ream/carton packaging.\n2. Warranty on electronics/printers subject to manufacturer terms.\n3. Please quote invoice number for all correspondence.',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'profile' | 'tax' | 'invoice' | 'bank' | 'brand'>('profile');

  useEffect(() => {
    if (shopSettings) {
      setForm((prev) => ({
        ...prev,
        ...shopSettings,
        shopName: shopSettings.shopName || 'TREO ENTERPRISES',
        shopLogo: shopSettings.shopLogo || '/treo-logo.svg',
        tagline: shopSettings.tagline || 'Paper & Office Supplies',
      }));
    }
  }, [shopSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await updateShopSettings(form);
      if (res.success) {
        showToast('TREO ENTERPRISES settings saved and synchronized to Supabase.');
      } else {
        showToast(res.error || 'Failed to save store settings.');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error saving settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefresh = async () => {
    showToast('Refreshing settings from Supabase...');
    await refreshShopSettingsFromSupabase();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            TREO ENTERPRISES Store Settings
          </h2>
          <span className="text-xs text-slate-400">
            Configure enterprise brand identity, GST details, bank accounts, invoicing prefix, and contacts.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Supabase</span>
          </button>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto text-xs font-bold">
        {[
          { id: 'profile', label: 'Company Profile & Contacts' },
          { id: 'tax', label: 'GST & Legal Registrations' },
          { id: 'invoice', label: 'Invoicing & Terms' },
          { id: 'bank', label: 'Bank & UPI Settlement' },
          { id: 'brand', label: 'Visual Brand & Theme' },
        ].map((sec) => (
          <button
            key={sec.id}
            onClick={() => setActiveSection(sec.id as any)}
            className={`px-4 py-2 rounded-xl transition cursor-pointer whitespace-nowrap ${
              activeSection === sec.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 shadow-xs space-y-6 text-xs">
        {/* SECTION 1: PROFILE & CONTACTS */}
        {activeSection === 'profile' && (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-700">
              Enterprise Identity & Contacts
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.shopName}
                  onChange={(e) => setForm({ ...form, shopName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Tagline / Business Type
                </label>
                <input
                  type="text"
                  value={form.tagline || ''}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                  placeholder="Paper & Office Supplies"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Managing Director / Owner
                </label>
                <input
                  type="text"
                  value={form.ownerName || ''}
                  onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={form.phoneNumber || ''}
                  onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  WhatsApp Contact
                </label>
                <input
                  type="text"
                  value={form.whatsAppNumber || ''}
                  onChange={(e) => setForm({ ...form, whatsAppNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Official Email Address
                </label>
                <input
                  type="email"
                  value={form.emailAddress || ''}
                  onChange={(e) => setForm({ ...form, emailAddress: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Website URL
                </label>
                <input
                  type="text"
                  value={form.websiteName || ''}
                  onChange={(e) => setForm({ ...form, websiteName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Commercial Address
              </label>
              <input
                type="text"
                value={form.shopAddress || ''}
                onChange={(e) => setForm({ ...form, shopAddress: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={form.city || ''}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={form.state || ''}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  PIN Code
                </label>
                <input
                  type="text"
                  value={form.pinCode || ''}
                  onChange={(e) => setForm({ ...form, pinCode: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: TAX & REGISTRATIONS */}
        {activeSection === 'tax' && (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-700">
              GST, PAN &amp; Legal Compliance
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  GSTIN *
                </label>
                <input
                  type="text"
                  value={form.gstin || ''}
                  onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                  placeholder="22AAAAA0000A1Z5"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-slate-900 dark:text-white uppercase"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  PAN Number
                </label>
                <input
                  type="text"
                  value={form.panNumber || ''}
                  onChange={(e) => setForm({ ...form, panNumber: e.target.value })}
                  placeholder="AAAAA0000A"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-slate-900 dark:text-white uppercase"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  State GST Code
                </label>
                <input
                  type="text"
                  value={form.stateCode || '22'}
                  onChange={(e) => setForm({ ...form, stateCode: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                MSME / Business Registration Number
              </label>
              <input
                type="text"
                value={form.businessRegistrationNumber || ''}
                onChange={(e) => setForm({ ...form, businessRegistrationNumber: e.target.value })}
                placeholder="UDYAM-CG-03-0012345"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-slate-900 dark:text-white"
              />
            </div>
          </div>
        )}

        {/* SECTION 3: INVOICE SETTINGS */}
        {activeSection === 'invoice' && (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-700">
              Tax Invoice Configuration
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Invoice Number Prefix
                </label>
                <input
                  type="text"
                  value={form.invoicePrefix || 'INV-2026/'}
                  onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value })}
                  placeholder="e.g. TREO/26-27/"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Starting Invoice Counter
                </label>
                <input
                  type="number"
                  value={form.invoiceNumberStartingValue || 1001}
                  onChange={(e) =>
                    setForm({ ...form, invoiceNumberStartingValue: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Standard Terms &amp; Conditions (Printed on Invoice)
              </label>
              <textarea
                rows={4}
                value={form.termsAndConditions || ''}
                onChange={(e) => setForm({ ...form, termsAndConditions: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        )}

        {/* SECTION 4: BANK & SETTLEMENT */}
        {activeSection === 'bank' && (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-700">
              Bank Accounts &amp; UPI
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={form.bankName || ''}
                  onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                  placeholder="HDFC Bank Ltd"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  value={form.bankAccountNumber || ''}
                  onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })}
                  placeholder="50200012345678"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  IFSC Code
                </label>
                <input
                  type="text"
                  value={form.bankIfsc || ''}
                  onChange={(e) => setForm({ ...form, bankIfsc: e.target.value })}
                  placeholder="HDFC0001234"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-slate-900 dark:text-white uppercase"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  UPI ID (VPA)
                </label>
                <input
                  type="text"
                  value={form.upiId || ''}
                  onChange={(e) => setForm({ ...form, upiId: e.target.value })}
                  placeholder="abcpaper@okhdfcbank"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 5: BRAND & THEME */}
        {activeSection === 'brand' && (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-700">
              Visual Brand Identity (TREO Blue &amp; Orange)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Primary Brand Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.primaryBrandColor || '#1e40af'}
                    onChange={(e) => setForm({ ...form, primaryBrandColor: e.target.value })}
                    className="w-10 h-10 rounded-xl border-none cursor-pointer"
                  />
                  <input
                    type="text"
                    value={form.primaryBrandColor || '#1e40af'}
                    onChange={(e) => setForm({ ...form, primaryBrandColor: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Default: #1e40af (Royal Blue)</span>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Accent Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.accentColor || '#ea580c'}
                    onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                    className="w-10 h-10 rounded-xl border-none cursor-pointer"
                  />
                  <input
                    type="text"
                    value={form.accentColor || '#ea580c'}
                    onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Default: #ea580c (Treo Vibrant Orange)</span>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Official Logo URL
              </label>
              <input
                type="text"
                value={form.shopLogo || '/treo-logo.svg'}
                onChange={(e) => setForm({ ...form, shopLogo: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              />
            </div>
          </div>
        )}

        {/* Submit Bar */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-900/20 flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving to Supabase...' : 'Save All Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
