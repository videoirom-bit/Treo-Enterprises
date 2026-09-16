import React, { useRef, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ABCStoreLogo } from '../components/ABCStoreLogo';
import { formatINR } from '../utils/gstUtils';
import { uploadInvoiceToDrive } from '../services/driveService';
import { googleSignIn, getAccessToken } from '../services/firebaseAuth';
import {
  Printer,
  Download,
  Share2,
  CloudUpload,
  ArrowLeft,
  CheckCircle,
  FileCheck,
  Check,
  Zap,
  FileText,
  HelpCircle,
  Sparkles,
  Truck,
} from 'lucide-react';

export const InvoiceView: React.FC = () => {
  const {
    selectedOrderForInvoice,
    shopSettings,
    setActiveView,
    setSearchTrackingId,
    showToast,
    isAdminLoggedIn,
  } = useApp();

  const printRef = useRef<HTMLDivElement>(null);
  const [isDriveUploading, setIsDriveUploading] = useState(false);
  const [driveUrl, setDriveUrl] = useState<string | null>(null);

  // Auto-print preference state (persisted in localStorage, default to true)
  const [autoPrintEnabled, setAutoPrintEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('abc_stationery_autoprint_invoice');
      return saved === null ? true : saved === 'true';
    }
    return true;
  });

  const hasAutoPrintedRef = useRef<string | null>(null);

  const order = selectedOrderForInvoice;

  // Auto-print trigger on component mount/load when an order is selected
  useEffect(() => {
    if (!order || !autoPrintEnabled) return;
    if (hasAutoPrintedRef.current === order.id) return;

    hasAutoPrintedRef.current = order.id;

    // Provide a small buffer so fonts, styles, and DOM are settled before opening print dialog
    const timer = setTimeout(() => {
      handlePrint(true);
    }, 600);

    return () => clearTimeout(timer);
  }, [order?.id, autoPrintEnabled]);

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-4">
        <p className="text-slate-500">No invoice selected.</p>
        <button
          onClick={() => setActiveView('home')}
          className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-700 transition"
        >
          Return to Home
        </button>
      </div>
    );
  }

  const handlePrint = (isAuto = false) => {
    try {
      if (isAuto) {
        showToast(`Auto-printing Invoice #${order.invoiceNumber}...`);
      }
      window.print();
    } catch (err) {
      console.warn('Printing was cancelled or not supported:', err);
    }
  };

  const toggleAutoPrint = () => {
    const next = !autoPrintEnabled;
    setAutoPrintEnabled(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('abc_stationery_autoprint_invoice', String(next));
    }
    showToast(next ? 'Auto-print on invoice load enabled.' : 'Auto-print on invoice load disabled.');
  };

  const handleDownloadPdf = () => {
    showToast("Opening print dialog. Select 'Save as PDF' under Destination to save this invoice.");
    handlePrint(false);
  };

  const generateStandaloneHtml = () => {
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Tax Invoice - ${order.invoiceNumber} - ${shopSettings.shopName}</title>
    <style>
      @page { size: A4 portrait; margin: 10mm 12mm 10mm 12mm; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
        padding: 20px;
        color: #0f172a;
        background: #ffffff;
        max-width: 210mm;
        margin: 0 auto;
        font-size: 11px;
      }
      table { width: 100%; border-collapse: collapse; margin-top: 15px; }
      th, td { border: 1px solid #cbd5e1; padding: 7px 8px; text-align: left; }
      th { background-color: #f8fafc; font-weight: bold; }
      .header { border-bottom: 2px solid #0f766e; padding-bottom: 12px; margin-bottom: 16px; }
      .flex-between { display: flex; justify-content: space-between; }
      .text-right { text-align: right; }
      .text-center { text-align: center; }
      .avoid-break { page-break-inside: avoid; break-inside: avoid; }
      .badge { display: inline-block; background: #0f172a; color: #fff; padding: 3px 8px; font-weight: bold; border-radius: 4px; font-size: 10px; }
    </style>
  </head>
  <body>
    <div class="header flex-between">
      <div>
        <h1 style="margin:0; color:#0f766e; font-size: 20px;">${shopSettings.shopName}</h1>
        <p style="margin:3px 0 0 0; color:#475569;">${shopSettings.shopAddress}, ${shopSettings.city}, ${shopSettings.state} - ${shopSettings.pinCode}</p>
        <p style="margin:3px 0 0 0; color:#475569;">GSTIN: <strong>${shopSettings.gstin}</strong> | Phone: ${shopSettings.phoneNumber}</p>
      </div>
      <div class="text-right">
        <div class="badge">GST TAX INVOICE</div>
        <p style="margin:4px 0 0 0; font-family: monospace;">Invoice No: <strong>${order.invoiceNumber}</strong></p>
        <p style="margin:2px 0 0 0; font-family: monospace;">Date: ${new Date(order.orderDate).toLocaleDateString('en-IN')}</p>
      </div>
    </div>

    <div class="flex-between avoid-break" style="margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">
      <div>
        <strong style="text-transform: uppercase; font-size: 10px; color: #64748b;">Billed To:</strong>
        <div style="font-size: 13px; font-weight: bold; margin-top: 2px;">${order.customer.name}</div>
        ${order.customer.companyName ? `<div>${order.customer.companyName}</div>` : ''}
        <div>${order.customer.billingAddress}</div>
        <div>${order.customer.city}, ${order.customer.state} - ${order.customer.pincode}</div>
        <div>Mobile: ${order.customer.mobile}</div>
        ${order.customer.gstin ? `<div>Customer GSTIN: <strong>${order.customer.gstin}</strong></div>` : ''}
      </div>
      <div class="text-right">
        <strong style="text-transform: uppercase; font-size: 10px; color: #64748b;">Payment & Dispatch:</strong>
        <div>Mode: <strong>${order.paymentMethod}</strong> (${order.paymentStatus})</div>
        ${order.razorpayPaymentId ? `<div style="font-family: monospace; font-size: 10px; color: #4338ca;">Razorpay Ref: <strong>${order.razorpayPaymentId}</strong></div>` : ''}
        <div>Order Type: <strong>${order.orderType}</strong></div>
        <div>Supply: <strong>${order.isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST+SGST)'}</strong></div>
      </div>
    </div>

    ${printRef.current?.querySelector('#invoice-items-table')?.outerHTML || ''}

    <div class="flex-between avoid-break" style="margin-top: 20px; border-top: 2px solid #cbd5e1; padding-top: 12px;">
      <div style="max-width: 60%;">
        <strong>Amount in Words:</strong>
        <div style="font-style: italic; background: #f8fafc; padding: 6px; border: 1px solid #e2e8f0; margin-top: 4px; border-radius: 4px;">
          ${order.amountInWords}
        </div>
        <div style="margin-top: 10px; font-size: 10px; color: #64748b;">
          Bank: ${shopSettings.bankName || 'HDFC Bank Ltd'} | A/C: ${shopSettings.bankAccountNumber || '50200012345678'} | IFSC: ${shopSettings.bankIfsc || 'HDFC0001234'} | UPI: ${shopSettings.upiId}
        </div>
      </div>
      <div class="text-right" style="font-family: monospace;">
        <div>Taxable Value: ${formatINR(order.taxableAmount)}</div>
        ${!order.isInterState ? `
          <div>CGST: ${formatINR(order.cgst)}</div>
          <div>SGST: ${formatINR(order.sgst)}</div>
        ` : `
          <div>IGST: ${formatINR(order.igst)}</div>
        `}
        ${order.deliveryCharge > 0 ? `<div>Delivery: ${formatINR(order.deliveryCharge)}</div>` : ''}
        <div style="font-size: 15px; font-weight: bold; color: #0f766e; border-top: 2px solid #0f172a; margin-top: 6px; padding-top: 6px;">
          Grand Total: ${formatINR(order.grandTotal)}
        </div>
      </div>
    </div>

    <div class="flex-between avoid-break" style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
      <div style="font-size: 9px; color: #64748b;">
        <p style="margin: 0 0 2px 0; font-weight: bold;">Terms & Conditions:</p>
        <p style="margin: 0;">1. Goods once sold will be replaced within 3 days for manufacturing defect.</p>
        <p style="margin: 0;">2. Subject to local jurisdiction only.</p>
      </div>
      <div class="text-center">
        <p style="margin: 0; font-weight: bold;">For ${shopSettings.shopName}</p>
        <p style="margin: 20px 0 0 0; font-size: 9px; color: #64748b;">Authorized Signatory</p>
      </div>
    </div>
  </body>
</html>`;
  };

  const handleDownloadHtml = () => {
    try {
      const html = generateStandaloneHtml();
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice_${order.invoiceNumber}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(`Downloaded standalone file: Invoice_${order.invoiceNumber}.html`);
    } catch (err) {
      console.error(err);
      showToast('Could not download file.');
    }
  };

  const handleWhatsAppInvoice = () => {
    const cleanNumber = (order.customer.whatsapp || order.customer.mobile).replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Hello ${order.customer.name},\nThank you for shopping at ${shopSettings.shopName}!\n\n📄 Tax Invoice: ${order.invoiceNumber}\n💰 Total Amount: ${formatINR(order.grandTotal)}\n💳 Payment Method: ${order.paymentMethod} (${order.paymentStatus})\nItems: ${order.items.length}\n\nHave a great day!`
    );
    window.open(`https://wa.me/${cleanNumber}?text=${message}`, '_blank');
  };

  const handleDriveBackup = async () => {
    try {
      setIsDriveUploading(true);

      let token = await getAccessToken();
      if (!token) {
        showToast('Connecting to Google Account for Drive Backup...');
        const res = await googleSignIn();
        token = res?.accessToken || null;
      }

      if (!token) {
        showToast('Google authorization was cancelled.');
        setIsDriveUploading(false);
        return;
      }

      if (printRef.current) {
        const invoiceHtml = generateStandaloneHtml();
        const result = await uploadInvoiceToDrive(order.invoiceNumber, invoiceHtml);
        setDriveUrl(result.webViewLink);
        showToast('Invoice backed up to Google Drive successfully!');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Could not upload to Google Drive.');
    } finally {
      setIsDriveUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Dynamic Scoped Print Media Styles for pristine A4 printing */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 10mm 12mm 10mm 12mm;
        }
        @media print {
          /* Hide app shell and toolbar elements */
          header,
          footer,
          nav,
          #floating-whatsapp-btn,
          #invoice-utility-toolbar,
          .print\\:hidden,
          .no-print {
            display: none !important;
          }
          body,
          html {
            width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #printable-invoice-document {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background-color: #ffffff !important;
            color: #0f172a !important;
          }
          #printable-invoice-document * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .avoid-page-break {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          thead {
            display: table-header-group !important;
          }
          tfoot {
            display: table-footer-group !important;
          }
          tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Prominent Print/Download Utility Toolbar (Hidden during print) */}
      <div
        id="invoice-utility-toolbar"
        className="print:hidden bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 sm:p-5 space-y-4"
      >
        {/* Top bar: Navigation, Meta info & Badges */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-3">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              id="invoice-back-btn"
              onClick={() => setActiveView(isAdminLoggedIn ? 'admin' : 'home')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isAdminLoggedIn ? 'Back to Admin' : 'Back to Store'}</span>
            </button>

            <button
              id="invoice-track-live-btn"
              onClick={() => {
                setSearchTrackingId(order.orderNumber);
                setActiveView('track-order');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800/80 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-xs font-semibold text-blue-700 dark:text-blue-300 transition"
            >
              <Truck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Track Delivery Live</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-800 dark:text-slate-100">
                {order.invoiceNumber}
              </span>
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                  order.paymentStatus === 'Paid'
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                }`}
              >
                {order.paymentStatus}
              </span>
            </div>
          </div>

          {/* Paper Format & Auto-Print Badges */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span
              id="a4-paper-badge"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/70 dark:border-teal-800/60 font-semibold text-[11px]"
              title="Calibrated for ISO A4 portrait format (210 x 297 mm)"
            >
              <FileText className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>A4 Paper Calibrated</span>
            </span>

            {/* Auto-print toggle button */}
            <button
              id="autoprint-toggle-btn"
              onClick={toggleAutoPrint}
              title={autoPrintEnabled ? 'Auto-print on load is active. Click to disable.' : 'Auto-print is off. Click to enable.'}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-semibold text-[11px] transition shadow-2xs ${
                autoPrintEnabled
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${autoPrintEnabled ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
              <span>Auto-Print on Load: <strong>{autoPrintEnabled ? 'ON' : 'OFF'}</strong></span>
            </button>
          </div>
        </div>

        {/* Primary Action Buttons Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Primary Print Button */}
            <button
              id="print-invoice-btn"
              onClick={() => handlePrint(false)}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition transform active:scale-95"
            >
              <Printer className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              <span>Print Invoice (A4)</span>
              <span className="hidden sm:inline-block opacity-70 text-[10px] font-normal border border-white/30 rounded px-1.5 py-0.5 ml-1">
                Ctrl+P
              </span>
            </button>

            {/* Save as PDF Button */}
            <button
              id="download-pdf-invoice-btn"
              onClick={handleDownloadPdf}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition"
              title="Print directly or save as PDF file"
            >
              <Download className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-teal-400" />
              <span>Save as PDF</span>
            </button>

            {/* Download Standalone HTML Button */}
            <button
              id="download-html-invoice-btn"
              onClick={handleDownloadHtml}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition shadow-2xs"
              title="Download standalone HTML invoice for offline storage"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Download HTML</span>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* WhatsApp invoice share */}
            <button
              id="whatsapp-invoice-btn"
              onClick={handleWhatsAppInvoice}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            {/* Google Drive backup */}
            <button
              id="drive-backup-invoice-btn"
              onClick={handleDriveBackup}
              disabled={isDriveUploading}
              className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition disabled:opacity-50"
            >
              <CloudUpload className="w-3.5 h-3.5" />
              <span>{isDriveUploading ? 'Uploading...' : 'Save to Drive'}</span>
            </button>
          </div>
        </div>

        {/* Helpful A4 Print Guidance Bar */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400">
          <HelpCircle className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
          <span>
            <strong>A4 Printing Tips:</strong> In your browser print dialog, set Paper Size to <strong>A4</strong> and check <strong>&quot;Background graphics&quot;</strong> to preserve header shading and GST borders.
          </span>
        </div>
      </div>

      {driveUrl && (
        <div className="print:hidden p-3 rounded-xl bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-200 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <span>Saved to Google Drive! File link:</span>
          </span>
          <a
            href={driveUrl}
            target="_blank"
            rel="noreferrer"
            className="font-bold underline text-blue-600 hover:text-blue-800"
          >
            Open in Google Drive
          </a>
        </div>
      )}

      {/* Printable Invoice Container (Optimized for standard A4 portrait paper) */}
      <div
        ref={printRef}
        id="printable-invoice-document"
        className="bg-white text-slate-900 rounded-2xl p-6 sm:p-10 border border-slate-300 shadow-md print:shadow-none print:border-none print:m-0 print:p-0 text-xs"
      >
        {/* Header with Shop Details */}
        <div className="border-b-2 border-slate-800 pb-4 flex justify-between items-start flex-wrap gap-4 avoid-page-break">
          <div>
            <div className="flex items-center gap-4">
              <div className="h-16 w-auto shrink-0 flex items-center">
                <img
                  src="/treo-logo.svg"
                  alt="Treo Enterprises"
                  className="h-14 sm:h-16 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  {shopSettings.shopName}
                </h1>
                <p className="text-slate-600 text-[11px] max-w-sm">
                  {shopSettings.shopAddress}, {shopSettings.city}, {shopSettings.state} - {shopSettings.pinCode}
                </p>
              </div>
            </div>

            <div className="mt-2 text-[11px] text-slate-600 space-x-3">
              <span>Phone: <strong>{shopSettings.phoneNumber}</strong></span>
              <span>•</span>
              <span>Email: <strong>{shopSettings.emailAddress}</strong></span>
            </div>
          </div>

          <div className="text-right">
            <div className="inline-block bg-slate-900 text-white px-3 py-1 rounded text-xs font-black uppercase tracking-wider mb-2">
              GST TAX INVOICE
            </div>
            <div className="font-mono text-xs space-y-0.5">
              <p>Invoice No: <strong>{order.invoiceNumber}</strong></p>
              <p>Date: <strong>{new Date(order.orderDate).toLocaleDateString('en-IN')}</strong></p>
              <p>Shop GSTIN: <strong className="text-teal-900 font-bold">{shopSettings.gstin}</strong></p>
              <p>Shop PAN: <strong>{shopSettings.panNumber}</strong></p>
            </div>
          </div>
        </div>

        {/* Customer / Billed To Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 py-4 border-b border-slate-200 avoid-page-break">
          <div>
            <span className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
              Billed To (Customer):
            </span>
            <p className="font-bold text-sm text-slate-900">{order.customer.name}</p>
            {order.customer.companyName && (
              <p className="font-semibold text-slate-700">{order.customer.companyName}</p>
            )}
            <p className="text-slate-600 text-[11px]">{order.customer.billingAddress}</p>
            <p className="text-slate-600 text-[11px]">{order.customer.city}, {order.customer.state} - {order.customer.pincode}</p>
            <p className="text-slate-600 text-[11px]">Mobile: {order.customer.mobile}</p>
            {order.customer.gstin && (
              <p className="text-slate-800 font-bold text-[11px] mt-1">
                Customer GSTIN: <span className="font-mono">{order.customer.gstin}</span>
              </p>
            )}
          </div>

          <div className="sm:text-right space-y-1">
            <span className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
              Payment & Dispatch Info:
            </span>
            <p>Payment Mode: <strong>{order.paymentMethod}</strong></p>
            {order.razorpayPaymentId && (
              <p className="text-[10px] text-indigo-700 font-mono">
                Razorpay Ref: <strong>{order.razorpayPaymentId}</strong>
              </p>
            )}
            <p>
              Payment Status: 
              <span className={`ml-1 font-bold ${order.paymentStatus === 'Paid' ? 'text-emerald-700' : 'text-amber-700'}`}>
                {order.paymentStatus}
              </span>
            </p>
            <p>Order Type: <strong>{order.orderType}</strong></p>
            <p>Place of Supply: <strong>{order.customer.state} ({order.isInterState ? 'Inter-State IGST' : 'Intra-State CGST+SGST'})</strong></p>
          </div>
        </div>

        {/* Itemized Line Items Table */}
        <div className="py-4 overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
          <table id="invoice-items-table" className="w-full text-left border-collapse print:min-w-full min-w-[620px]">
            <thead>
              <tr className="bg-slate-100 border-y border-slate-300 text-[11px] font-bold text-slate-800">
                <th className="py-2 px-2 text-center w-8">#</th>
                <th className="py-2 px-2">Item Description</th>
                <th className="py-2 px-2 text-center">HSN</th>
                <th className="py-2 px-2 text-center">Qty</th>
                <th className="py-2 px-2 text-right">Unit Rate</th>
                <th className="py-2 px-2 text-right">Taxable Val</th>
                <th className="py-2 px-2 text-center">GST %</th>
                {!order.isInterState ? (
                  <>
                    <th className="py-2 px-2 text-right">CGST</th>
                    <th className="py-2 px-2 text-right">SGST</th>
                  </>
                ) : (
                  <th className="py-2 px-2 text-right">IGST</th>
                )}
                <th className="py-2 px-2 text-right">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-[11px]">
              {(order.items || []).map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2 px-2 text-center">{idx + 1}</td>
                  <td className="py-2 px-2">
                    <span className="font-bold text-slate-900 block">{item.productName}</span>
                    <span className="text-[10px] text-slate-500 font-mono">SKU: {item.sku}</span>
                  </td>
                  <td className="py-2 px-2 text-center font-mono text-[10px]">{item.hsnCode}</td>
                  <td className="py-2 px-2 text-center font-bold">{item.quantity} {item.unit}</td>
                  <td className="py-2 px-2 text-right">{formatINR(item.rate)}</td>
                  <td className="py-2 px-2 text-right">{formatINR(item.taxableAmount)}</td>
                  <td className="py-2 px-2 text-center">{item.gstRate}%</td>
                  {!order.isInterState ? (
                    <>
                      <td className="py-2 px-2 text-right">{formatINR(item.cgstAmount)}</td>
                      <td className="py-2 px-2 text-right">{formatINR(item.sgstAmount)}</td>
                    </>
                  ) : (
                    <td className="py-2 px-2 text-right">{formatINR(item.igstAmount)}</td>
                  )}
                  <td className="py-2 px-2 text-right font-bold text-slate-900">
                    {formatINR(item.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Invoice Summary & Tax Totals */}
        <div className="border-t-2 border-slate-300 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-6 items-start avoid-page-break">
          <div className="space-y-3">
            <div>
              <span className="font-bold text-slate-700 block text-[11px]">Total Amount in Words:</span>
              <p className="font-semibold text-slate-900 italic text-[11px] bg-slate-50 p-2 rounded border border-slate-200">
                {order.amountInWords}
              </p>
            </div>

            {/* Bank and UPI details for payment */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[10px] space-y-1">
              <span className="font-bold text-slate-800 block text-[11px]">Bank & UPI Transfer Details:</span>
              <p>Bank: <strong>{shopSettings.bankName || shopSettings.bankDetails?.bankName || 'HDFC Bank Ltd'}</strong></p>
              <p>Account No: <strong className="font-mono">{shopSettings.bankAccountNumber || shopSettings.bankDetails?.accountNumber || '50200012345678'}</strong></p>
              <p>IFSC Code: <strong className="font-mono">{shopSettings.bankIfsc || shopSettings.bankDetails?.ifscCode || 'HDFC0001234'}</strong></p>
              <p>UPI ID: <strong className="text-teal-700">{shopSettings.upiId}</strong></p>
            </div>
          </div>

          <div className="space-y-1.5 text-right font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600">Total Taxable Value:</span>
              <span className="font-bold">{formatINR(order.taxableAmount)}</span>
            </div>

            {!order.isInterState ? (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-600">Central GST (CGST):</span>
                  <span>{formatINR(order.cgst)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">State GST (SGST):</span>
                  <span>{formatINR(order.sgst)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between">
                <span className="text-slate-600">Integrated GST (IGST):</span>
                <span>{formatINR(order.igst)}</span>
              </div>
            )}

            {order.deliveryCharge > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-600">Delivery Charges:</span>
                <span>{formatINR(order.deliveryCharge)}</span>
              </div>
            )}

            {order.roundOff !== 0 && (
              <div className="flex justify-between text-slate-500 text-[10px]">
                <span>Round-off:</span>
                <span>{order.roundOff > 0 ? `+${order.roundOff}` : order.roundOff}</span>
              </div>
            )}

            <div className="flex justify-between border-t-2 border-slate-900 pt-2 text-sm font-black">
              <span>Grand Total:</span>
              <span className="text-teal-900 text-base">{formatINR(order.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Declaration & Signature */}
        <div className="border-t border-slate-200 mt-8 pt-6 flex justify-between items-end avoid-page-break">
          <div className="max-w-xs text-[10px] text-slate-500">
            <p className="font-bold text-slate-700">Terms & Conditions:</p>
            <p>1. Goods once sold will be replaced within 3 days in case of manufacturing defect.</p>
            <p>2. Dispatched subject to Raipur jurisdiction only.</p>
          </div>

          <div className="text-center">
            <div className="h-10"></div>
            <p className="font-bold text-slate-900 text-xs">For {shopSettings.shopName}</p>
            <p className="text-[10px] text-slate-500">Authorized Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
};

