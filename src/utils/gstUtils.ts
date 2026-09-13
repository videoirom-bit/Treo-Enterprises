// Indian Rupee & Number Formatting Helpers

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

export function formatNumber(val: number): string {
  return new Intl.NumberFormat('en-IN').format(val || 0);
}

// Convert amount in numbers to words (Indian numbering system)
export function numberToWordsINR(num: number): string {
  const rounded = Math.round(num);
  if (rounded === 0) return 'Rupees Zero Only';

  const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = [
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n: number): string {
    if (n < 10) return singleDigits[n];
    if (n < 20) return teens[n - 10];
    const unit = n % 10;
    return tens[Math.floor(n / 10)] + (unit ? ' ' + singleDigits[unit] : '');
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let res = '';
    if (hundred) {
      res += singleDigits[hundred] + ' Hundred';
    }
    if (rest) {
      if (res) res += ' and ';
      res += convertTwoDigits(rest);
    }
    return res;
  }

  let crore = Math.floor(rounded / 10000000);
  let remainder = rounded % 10000000;
  let lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;
  let thousand = Math.floor(remainder / 1000);
  let hundred = remainder % 1000;

  const parts: string[] = [];

  if (crore > 0) {
    parts.push(convertThreeDigits(crore) + ' Crore');
  }
  if (lakh > 0) {
    parts.push(convertThreeDigits(lakh) + ' Lakh');
  }
  if (thousand > 0) {
    parts.push(convertThreeDigits(thousand) + ' Thousand');
  }
  if (hundred > 0) {
    parts.push(convertThreeDigits(hundred));
  }

  return 'Rupees ' + parts.join(' ') + ' Only';
}

// Calculate GST details for cart items or sales
export interface GSTCalculationResult {
  subtotal: number;
  totalDiscount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  roundOff: number;
  grandTotal: number;
  isInterState: boolean;
}

export function calculateGST(
  items: Array<{
    sellingPrice: number;
    quantity: number;
    gstRate: number;
    discount?: number;
  }>,
  shopState: string,
  customerState: string,
  deliveryCharge: number = 0
): GSTCalculationResult {
  const isInterState =
    Boolean(customerState && shopState && customerState.trim().toLowerCase() !== shopState.trim().toLowerCase());

  let subtotal = 0;
  let totalDiscount = 0;
  let taxableAmount = 0;
  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  items.forEach((item) => {
    const gross = item.sellingPrice * item.quantity;
    const discount = item.discount || 0;
    const itemDiscountTotal = discount * item.quantity;
    const netItemPrice = gross - itemDiscountTotal;

    subtotal += gross;
    totalDiscount += itemDiscountTotal;

    // GST inclusive or exclusive calculation:
    // Standard retail selling price in Indian stationery is GST-inclusive.
    // Base Taxable = Net / (1 + GST/100)
    const rate = item.gstRate || 0;
    const baseAmount = netItemPrice / (1 + rate / 100);
    const tax = netItemPrice - baseAmount;

    taxableAmount += baseAmount;

    if (isInterState) {
      igst += tax;
    } else {
      cgst += tax / 2;
      sgst += tax / 2;
    }
  });

  const totalTax = isInterState ? igst : cgst + sgst;
  const rawTotal = taxableAmount + totalTax + deliveryCharge;
  const roundedTotal = Math.round(rawTotal);
  const roundOff = Number((roundedTotal - rawTotal).toFixed(2));

  return {
    subtotal: Number(subtotal.toFixed(2)),
    totalDiscount: Number(totalDiscount.toFixed(2)),
    taxableAmount: Number(taxableAmount.toFixed(2)),
    cgst: Number(cgst.toFixed(2)),
    sgst: Number(sgst.toFixed(2)),
    igst: Number(igst.toFixed(2)),
    totalTax: Number(totalTax.toFixed(2)),
    roundOff,
    grandTotal: roundedTotal,
    isInterState,
  };
}

// Generate next invoice code based on prefix and number
export function formatInvoiceNumber(prefix: string, counter: number): string {
  const pad = String(counter).padStart(5, '0');
  return `${prefix}-${pad}`;
}

// Validate GSTIN (15 character standard Indian GSTIN format)
export function isValidGSTIN(gstin: string): boolean {
  if (!gstin) return false;
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin.trim().toUpperCase());
}

// Validate Indian 10-digit mobile number
export function isValidIndianMobile(phone: string): boolean {
  if (!phone) return false;
  const clean = phone.replace(/[^0-9]/g, '');
  return clean.length === 10 || (clean.length === 12 && clean.startsWith('91'));
}
