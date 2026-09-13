import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { calculateGST, formatINR, numberToWordsINR, isValidGSTIN, isValidIndianMobile } from '../utils/gstUtils';
import { OrderType, PaymentMethod, OrderItem } from '../types';
import {
  CreditCard,
  Building2,
  Truck,
  Store,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  FileCheck,
  QrCode,
} from 'lucide-react';

export const CheckoutView: React.FC = () => {
  const {
    cart,
    shopSettings,
    createOrder,
    setActiveView,
    setSelectedOrderForInvoice,
    showToast,
  } = useApp();

  // Form states
  const [customerName, setCustomerName] = useState('Anil Agarwal');
  const [mobile, setMobile] = useState('9826123456');
  const [whatsapp, setWhatsapp] = useState('9826123456');
  const [email, setEmail] = useState('anil.agarwal@gmail.com');
  const [billingAddress, setBillingAddress] = useState('B-44, Civil Lines');
  const [shippingAddress, setShippingAddress] = useState('B-44, Civil Lines');
  const [city, setCity] = useState('Raipur');
  const [customerState, setCustomerState] = useState(shopSettings.state); // Intra-state by default
  const [pincode, setPincode] = useState('492001');
  const [gstin, setGstin] = useState('22ABCDE1234F1Z5');
  const [companyName, setCompanyName] = useState('Agarwal Coaching Academy');

  const [orderType, setOrderType] = useState<OrderType>('Store Pickup');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your Cart is Empty</h2>
        <p className="text-xs text-slate-500">Please add items to your cart before proceeding to checkout.</p>
        <button
          onClick={() => setActiveView('products')}
          className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  const deliveryCharge = orderType === 'Home Delivery' ? 40 : 0;

  // Real Indian GST calculation
  const gstDetails = calculateGST(
    cart.map((item) => ({
      sellingPrice: item.product.sellingPrice,
      quantity: item.quantity,
      gstRate: item.product.gstRate,
      discount: 0,
    })),
    shopSettings.state,
    customerState,
    deliveryCharge
  );

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validation rules
    if (!customerName.trim()) {
      setValidationError('Please enter customer full name.');
      return;
    }

    if (!isValidIndianMobile(mobile)) {
      setValidationError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (gstin.trim() && !isValidGSTIN(gstin)) {
      setValidationError('The entered GSTIN is not formatted correctly (15 characters expected).');
      return;
    }

    // Verify stock availability
    for (const item of cart) {
      if (item.quantity > item.product.currentStock) {
        setValidationError(`Only ${item.product.currentStock} units of "${item.product.name}" are currently available.`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Prepare line items
      const orderItems: OrderItem[] = cart.map((item) => {
        const lineGross = item.product.sellingPrice * item.quantity;
        const rate = item.product.gstRate;
        const lineBase = Number((lineGross / (1 + rate / 100)).toFixed(2));
        const lineTax = Number((lineGross - lineBase).toFixed(2));

        const cgstAmount = gstDetails.isInterState ? 0 : Number((lineTax / 2).toFixed(2));
        const sgstAmount = gstDetails.isInterState ? 0 : Number((lineTax / 2).toFixed(2));
        const igstAmount = gstDetails.isInterState ? lineTax : 0;

        return {
          productId: item.product.id,
          productName: item.product.name,
          sku: item.product.sku,
          hsnCode: item.product.hsnCode,
          unit: item.product.unit,
          rate: item.product.sellingPrice,
          quantity: item.quantity,
          discountPerUnit: 0,
          taxableAmount: lineBase,
          gstRate: item.product.gstRate,
          cgstAmount,
          sgstAmount,
          igstAmount,
          totalGst: lineTax,
          totalAmount: lineGross,
        };
      });

      const paymentStatus = paymentMethod === 'Credit' ? 'Pending' : 'Paid';
      const paidAmount = paymentStatus === 'Paid' ? gstDetails.grandTotal : 0;
      const pendingAmount = paymentStatus === 'Pending' ? gstDetails.grandTotal : 0;

      const newOrder = createOrder({
        customer: {
          name: customerName.trim(),
          mobile: mobile.trim(),
          whatsapp: (whatsapp || mobile).trim(),
          email: email.trim(),
          billingAddress: billingAddress.trim(),
          shippingAddress: (shippingAddress || billingAddress).trim(),
          city: city.trim(),
          state: customerState.trim(),
          pincode: pincode.trim(),
          gstin: gstin.trim() ? gstin.trim().toUpperCase() : undefined,
          companyName: companyName.trim() || undefined,
        },
        orderType,
        items: orderItems,
        subtotal: gstDetails.subtotal,
        totalDiscount: gstDetails.totalDiscount,
        taxableAmount: gstDetails.taxableAmount,
        isInterState: gstDetails.isInterState,
        cgst: gstDetails.cgst,
        sgst: gstDetails.sgst,
        igst: gstDetails.igst,
        totalTax: gstDetails.totalTax,
        deliveryCharge,
        roundOff: gstDetails.roundOff,
        grandTotal: gstDetails.grandTotal,
        amountInWords: numberToWordsINR(gstDetails.grandTotal),
        paymentMethod,
        paymentStatus,
        paidAmount,
        pendingAmount,
        orderStatus: 'Confirmed',
      });

      setSelectedOrderForInvoice(newOrder);
      setActiveView('invoice-view');
    } catch (err: any) {
      setValidationError(err.message || 'Something went wrong while placing order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <button
        onClick={() => setActiveView('cart')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Shopping Cart</span>
      </button>

      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Checkout & GST Billing
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete customer billing details to generate legal tax invoice.
        </p>
      </div>

      {validationError && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 flex items-center gap-3 text-red-700 dark:text-red-300 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Customer & Billing Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* Order Delivery Type */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-teal-600" />
              <span>Select Fulfillment Method</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOrderType('Store Pickup')}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition ${
                  orderType === 'Store Pickup'
                    ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/50 text-teal-900 dark:text-teal-100 ring-2 ring-teal-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Store className="w-5 h-5 text-teal-600 mt-0.5" />
                <div>
                  <span className="block font-bold text-xs">Self Store Pickup</span>
                  <span className="text-[11px] text-slate-500">Collect free at counter</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setOrderType('Home Delivery')}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition ${
                  orderType === 'Home Delivery'
                    ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/50 text-teal-900 dark:text-teal-100 ring-2 ring-teal-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Truck className="w-5 h-5 text-teal-600 mt-0.5" />
                <div>
                  <span className="block font-bold text-xs">Local Delivery (+₹40)</span>
                  <span className="text-[11px] text-slate-500">Delivered within 24 hours</span>
                </div>
              </button>
            </div>
          </div>

          {/* Customer Details */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Customer & Billing Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Customer / Contact Name *
                </label>
                <input
                  id="checkout-customer-name"
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mobile Number (10-Digit) *
                </label>
                <input
                  id="checkout-mobile-number"
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  WhatsApp Number (For Bill Copy)
                </label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="Same as mobile"
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address (For Invoice PDF)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Billing Address
                </label>
                <textarea
                  rows={2}
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Customer State (For CGST/SGST/IGST)
                </label>
                <input
                  type="text"
                  value={customerState}
                  onChange={(e) => setCustomerState(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  PIN Code
                </label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  GSTIN (Optional for Tax Credit)
                </label>
                <input
                  type="text"
                  value={gstin}
                  placeholder="e.g. 22ABCDE1234F1Z5"
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono uppercase"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Company / Organization Name (Optional)
                </label>
                <input
                  type="text"
                  value={companyName}
                  placeholder="School, Coaching, Corporate Firm name"
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-teal-600" />
              <span>Select Payment Option</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-semibold">
              {(['UPI', 'Cash', 'Card', 'Bank Transfer', 'Pay at Shop', 'Credit'] as PaymentMethod[]).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`p-3 rounded-xl border text-center transition ${
                    paymentMethod === method
                      ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 ring-1 ring-teal-600'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>

            {/* UPI details box */}
            {paymentMethod === 'UPI' && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block">Shop UPI ID:</span>
                  <span className="font-mono font-bold text-teal-700 dark:text-teal-300">{shopSettings.upiId}</span>
                </div>
                <QrCode className="w-6 h-6 text-slate-400" />
              </div>
            )}
          </div>
        </div>

        {/* Order Review & GST Total Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              Order Items ({cart.length})
            </h3>

            {/* Micro items list */}
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 text-xs">
              {cart.map(({ product, quantity }) => (
                <div key={product.id} className="flex justify-between items-start gap-2">
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block line-clamp-1">
                      {product.name}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {quantity} × {formatINR(product.sellingPrice)} (GST {product.gstRate}%)
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white shrink-0">
                    {formatINR(product.sellingPrice * quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Tax Computation Table */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Taxable Base Value</span>
                <span className="font-medium">{formatINR(gstDetails.taxableAmount)}</span>
              </div>

              {gstDetails.isInterState ? (
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>IGST (Inter-State Tax)</span>
                  <span className="font-medium">{formatINR(gstDetails.igst)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>CGST (Central Tax)</span>
                    <span className="font-medium">{formatINR(gstDetails.cgst)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>SGST (State Tax)</span>
                    <span className="font-medium">{formatINR(gstDetails.sgst)}</span>
                  </div>
                </>
              )}

              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Delivery Charge</span>
                <span>{deliveryCharge === 0 ? 'FREE' : formatINR(deliveryCharge)}</span>
              </div>

              {gstDetails.roundOff !== 0 && (
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Round-off</span>
                  <span>{gstDetails.roundOff > 0 ? `+${gstDetails.roundOff}` : gstDetails.roundOff}</span>
                </div>
              )}

              <div className="flex justify-between items-baseline pt-3 border-t border-slate-200 dark:border-slate-700">
                <span className="text-base font-extrabold text-slate-900 dark:text-white">
                  Payable Amount
                </span>
                <span className="text-2xl font-black text-teal-600 dark:text-teal-400">
                  {formatINR(gstDetails.grandTotal)}
                </span>
              </div>

              <div className="text-[11px] text-slate-500 italic pt-1">
                Amount in Words: {numberToWordsINR(gstDetails.grandTotal)}
              </div>
            </div>

            {/* Place Order CTA */}
            <button
              id="confirm-order-button"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-900/20 transition disabled:opacity-50"
            >
              <FileCheck className="w-5 h-5" />
              <span>{isSubmitting ? 'Generating Invoice...' : 'Confirm Order & Generate GST Bill'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
