import React, { useRef } from 'react';
import {
  Printer,
  Download,
  X,
  Building2,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  QrCode,
  Check,
} from 'lucide-react';
import { Order, ShopSettings } from '../../types';
import { formatINR } from '../../utils/gstUtils';
import { useApp } from '../../context/AppContext';

interface AdminInvoiceModalProps {
  order: Order | null;
  onClose: () => void;
}

export const AdminInvoiceModal: React.FC<AdminInvoiceModalProps> = ({ order, onClose }) => {
  const { shopSettings, showToast } = useApp();
  const invoicePrintRef = useRef<HTMLDivElement>(null);

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Triggers browser print to PDF
    window.print();
    showToast('Use "Save as PDF" destination in print dialog.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white text-slate-900 rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl p-6 sm:p-8 my-8 print:border-none print:shadow-none print:p-0 print:my-0 animate-in fade-in zoom-in-95 duration-150">
        {/* Actions Bar (Hidden during print) */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-slate-800">
              Tax Invoice #{order.invoiceNumber || order.orderNumber}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                order.paymentStatus === 'Paid'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              Payment: {order.paymentStatus}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE INVOICE CONTENT */}
        <div ref={invoicePrintRef} className="space-y-6 text-xs text-slate-800 font-sans">
          {/* Header Row: TREO ENTERPRISES Brand & Invoice Metadata */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-200">
            {/* Store Information */}
            <div className="space-y-1.5 max-w-sm">
              <div className="flex items-center gap-3">
                <img
                  src="/treo-logo.svg"
                  alt="TREO ENTERPRISES Logo"
                  className="w-12 h-12 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div>
                  <h1 className="text-xl font-black tracking-tight text-blue-900 leading-none">
                    TREO ENTERPRISES
                  </h1>
                  <span className="text-[10px] text-orange-600 font-bold uppercase tracking-wider block mt-0.5">
                    Paper &amp; Office Supplies
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 leading-relaxed pt-1">
                <p>{shopSettings?.shopAddress || 'Commercial Market Complex, Station Road, Pandri'}</p>
                <p>
                  {shopSettings?.city || 'Raipur'}, {shopSettings?.state || 'Chhattisgarh'} -{' '}
                  {shopSettings?.pinCode || '492001'}
                </p>
                <p>
                  GSTIN: <span className="font-mono font-bold text-slate-900">{shopSettings?.gstin || '22AAAAA0000A1Z5'}</span>
                </p>
                <p>
                  Phone: {shopSettings?.phoneNumber || '+91 98765 43210'} | Email: {shopSettings?.emailAddress || 'contact@treoenterprises.com'}
                </p>
              </div>
            </div>

            {/* Invoice Details Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-right space-y-1 min-w-[200px]">
              <span className="text-sm font-black text-slate-900 block uppercase tracking-wider">
                TAX INVOICE
              </span>
              <div className="text-slate-600 text-[11px]">
                <p>
                  Invoice #: <span className="font-mono font-bold text-slate-900">{order.invoiceNumber || `INV-${order.orderNumber}`}</span>
                </p>
                <p>
                  Order #: <span className="font-mono font-semibold">{order.orderNumber}</span>
                </p>
                <p>
                  Date:{' '}
                  <span className="font-semibold text-slate-900">
                    {order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                  </span>
                </p>
                <p>
                  Payment Mode: <span className="font-bold">{order.paymentMethod || 'UPI / Bank'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Bill To Customer Information */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Billed To (Customer):
              </span>
              <span className="font-bold text-slate-900 text-sm block">
                {order.customerName}
              </span>
              <span className="text-slate-600 block mt-0.5">
                Phone: {order.customerMobile}
              </span>
              {order.customerEmail && (
                <span className="text-slate-600 block">
                  Email: {order.customerEmail}
                </span>
              )}
              {order.customerGstin && (
                <span className="font-mono text-slate-700 block mt-0.5">
                  GSTIN: {order.customerGstin}
                </span>
              )}
            </div>

            <div className="sm:text-right max-w-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Delivery Location:
              </span>
              <p className="text-slate-700 leading-relaxed">
                {order.customerAddress || 'Local Store Pickup, Raipur'}
                {order.customerCity && `, ${order.customerCity}`}
                {order.customerPincode && ` - ${order.customerPincode}`}
              </p>
            </div>
          </div>

          {/* Product Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3 w-8 text-center">#</th>
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3 text-center">HSN</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Tax</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(order.items || []).map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-slate-900 block">{it.productName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        SKU: {it.sku || 'N/A'} • Unit: {it.unit || 'Ream'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                      {it.hsnCode || '4802'}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold">
                      {it.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      {formatINR(it.rate || it.unitPrice || 0)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                      {formatINR(it.totalGst || 0)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {formatINR(it.totalAmount || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Calculations & Bank Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {/* Payment Details & Terms */}
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 block">Bank &amp; Payment Details</span>
                <p className="text-[11px] text-slate-600">
                  Bank: <span className="font-semibold">{shopSettings?.bankName || 'HDFC Bank Ltd'}</span>
                </p>
                <p className="text-[11px] text-slate-600">
                  A/C Number:{' '}
                  <span className="font-mono font-bold text-slate-900">
                    {shopSettings?.bankAccountNumber || '50200012345678'}
                  </span>
                </p>
                <p className="text-[11px] text-slate-600">
                  IFSC Code:{' '}
                  <span className="font-mono font-bold text-slate-900">
                    {shopSettings?.bankIfsc || 'HDFC0001234'}
                  </span>
                </p>
                <p className="text-[11px] text-slate-600">
                  UPI ID:{' '}
                  <span className="font-mono font-bold text-blue-600">
                    {shopSettings?.upiId || 'abcpaper@okhdfcbank'}
                  </span>
                </p>
              </div>

              <div className="text-[10px] text-slate-500 leading-normal">
                <span className="font-bold block text-slate-700">Terms &amp; Conditions:</span>
                <p>1. Goods once sold will be replaced within 3 days if defective in original carton/ream packaging.</p>
                <p>2. Warranty on electronics/printers subject to original manufacturer terms.</p>
                <p>3. This is a computer generated tax invoice for TREO ENTERPRISES.</p>
              </div>
            </div>

            {/* Calculations Box */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Taxable Value):</span>
                <span className="font-mono">{formatINR(order.subtotal)}</span>
              </div>

              {order.totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Special Discount:</span>
                  <span className="font-mono">-{formatINR(order.totalDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>CGST:</span>
                <span className="font-mono">{formatINR(order.cgst || order.totalTax / 2)}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>SGST:</span>
                <span className="font-mono">{order.sgst ? formatINR(order.sgst) : formatINR(order.totalTax / 2)}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Delivery / Transport Charge:</span>
                <span className="font-mono">
                  {order.deliveryCharge > 0 ? formatINR(order.deliveryCharge) : 'FREE'}
                </span>
              </div>

              <div className="border-t border-slate-300 pt-2 flex justify-between text-base font-black text-slate-900">
                <span>Total Amount:</span>
                <span className="text-blue-900 font-mono">{formatINR(order.grandTotal)}</span>
              </div>

              {order.amountInWords && (
                <span className="text-[10px] text-slate-500 italic block pt-1 text-right">
                  Amount in words: {order.amountInWords}
                </span>
              )}

              <div className="pt-4 text-center border-t border-dashed border-slate-200 mt-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">
                  Authorized Signatory - TREO ENTERPRISES
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
