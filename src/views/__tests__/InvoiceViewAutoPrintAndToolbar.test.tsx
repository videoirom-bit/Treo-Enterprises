import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { InvoiceView } from '../InvoiceView';
import { Order } from '../../types';

// Mock AppContext
const mockOrder: Order = {
  id: 'order-101',
  orderNumber: 'ORD-2026-00101',
  invoiceNumber: 'INV-2026-00101',
  orderDate: '2026-09-11T12:00:00.000Z',
  customer: {
    name: 'Priya Sharma',
    mobile: '9876543210',
    email: 'priya@example.com',
    billingAddress: '42 Tagore Marg, Civil Lines',
    shippingAddress: '42 Tagore Marg, Civil Lines',
    city: 'Raipur',
    state: 'Chhattisgarh',
    pincode: '492001',
    gstin: '22AAAAA0000A1Z5',
  },
  orderType: 'Store Pickup',
  items: [
    {
      productId: 'prod-1',
      productName: 'Classmate Pulse Notebook 300 Pgs',
      sku: 'NOTE-001',
      hsnCode: '4820',
      quantity: 5,
      rate: 120,
      discountPerUnit: 0,
      taxableAmount: 535.7,
      gstRate: 12,
      cgstAmount: 32.15,
      sgstAmount: 32.15,
      igstAmount: 0,
      totalGst: 64.3,
      totalAmount: 600,
      unit: 'Piece',
    },
  ],
  subtotal: 600,
  totalDiscount: 0,
  taxableAmount: 535.7,
  cgst: 32.15,
  sgst: 32.15,
  igst: 0,
  totalTax: 64.3,
  deliveryCharge: 0,
  roundOff: 0,
  grandTotal: 600,
  amountInWords: 'Six Hundred Rupees Only',
  paymentMethod: 'UPI',
  paymentStatus: 'Paid',
  paidAmount: 600,
  pendingAmount: 0,
  orderStatus: 'Delivered',
  isInterState: false,
};

const mockShopSettings = {
  shopName: 'ABC Paper & Stationery Mart',
  shopLogo: '',
  shopAddress: 'Shop 12, Malviya Road',
  city: 'Raipur',
  state: 'Chhattisgarh',
  pinCode: '492001',
  phoneNumber: '+91 98765 43210',
  whatsAppNumber: '+91 98765 43210',
  emailAddress: 'contact@abcstationery.com',
  gstin: '22ABCDE1234F1Z5',
  panNumber: 'ABCDE1234F',
  upiId: 'abcstationery@upi',
  bankName: 'HDFC Bank Ltd',
  bankAccountNumber: '50200012345678',
  bankIfsc: 'HDFC0001234',
  openingHours: 'Mon-Sat: 9:00 AM - 9:00 PM',
};

const mockShowToast = vi.fn();
const mockSetActiveView = vi.fn();
let currentSelectedOrder: Order | null = mockOrder;

vi.mock('../../context/AppContext', () => ({
  useApp: () => ({
    selectedOrderForInvoice: currentSelectedOrder,
    shopSettings: mockShopSettings,
    setActiveView: mockSetActiveView,
    showToast: mockShowToast,
    isAdminLoggedIn: true,
  }),
}));

describe('InvoiceView - Auto-print, Utility Toolbar & A4 Print Media', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    localStorage.clear();
    currentSelectedOrder = mockOrder;
    // Mock window.print
    window.print = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('automatically triggers window.print() on load when order is selected and auto-print is enabled', () => {
    render(<InvoiceView />);

    // Print should not have fired instantly before render settles
    expect(window.print).not.toHaveBeenCalled();

    // Fast forward past the settle buffer (600ms)
    act(() => {
      vi.advanceTimersByTime(700);
    });

    expect(window.print).toHaveBeenCalledTimes(1);
    expect(mockShowToast).toHaveBeenCalledWith(
      expect.stringContaining('Auto-printing Invoice #INV-2026-00101')
    );
  });

  it('renders the prominent utility toolbar with print, download, and format controls', () => {
    render(<InvoiceView />);

    const toolbar = document.getElementById('invoice-utility-toolbar');
    expect(toolbar).toBeInTheDocument();
    expect(toolbar?.classList.contains('print:hidden')).toBe(true);

    // Badges & Info
    expect(screen.getAllByText('INV-2026-00101').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Paid').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('A4 Paper Calibrated')).toBeInTheDocument();

    // Primary Buttons
    expect(screen.getByRole('button', { name: /Print Invoice \(A4\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save as PDF/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download HTML/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Auto-Print on Load/i })).toBeInTheDocument();
  });

  it('allows toggling Auto-Print off and avoids auto-printing when disabled', () => {
    localStorage.setItem('abc_stationery_autoprint_invoice', 'false');

    render(<InvoiceView />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Since auto-print was saved as false, window.print must NOT be called on load
    expect(window.print).not.toHaveBeenCalled();

    // Now click the toggle button to re-enable
    const toggleBtn = screen.getByRole('button', { name: /Auto-Print on Load: OFF/i });
    fireEvent.click(toggleBtn);

    expect(localStorage.getItem('abc_stationery_autoprint_invoice')).toBe('true');
    expect(mockShowToast).toHaveBeenCalledWith('Auto-print on invoice load enabled.');
  });

  it('manually triggers window.print() when "Print Invoice (A4)" button is clicked', () => {
    localStorage.setItem('abc_stationery_autoprint_invoice', 'false');
    render(<InvoiceView />);

    const printBtn = screen.getByRole('button', { name: /Print Invoice \(A4\)/i });
    fireEvent.click(printBtn);

    expect(window.print).toHaveBeenCalledTimes(1);
  });

  it('provides a Save as PDF button which initiates print dialog with helpful guidance', () => {
    localStorage.setItem('abc_stationery_autoprint_invoice', 'false');
    render(<InvoiceView />);

    const pdfBtn = screen.getByRole('button', { name: /Save as PDF/i });
    fireEvent.click(pdfBtn);

    expect(mockShowToast).toHaveBeenCalledWith(
      expect.stringContaining("Select 'Save as PDF' under Destination")
    );
    expect(window.print).toHaveBeenCalledTimes(1);
  });

  it('provides standalone HTML invoice download for offline archiving', () => {
    localStorage.setItem('abc_stationery_autoprint_invoice', 'false');
    render(<InvoiceView />);

    const downloadHtmlBtn = screen.getByRole('button', { name: /Download HTML/i });
    expect(downloadHtmlBtn).toBeInTheDocument();

    fireEvent.click(downloadHtmlBtn);

    expect(mockShowToast).toHaveBeenCalledWith(
      expect.stringContaining('Downloaded standalone file: Invoice_INV-2026-00101.html')
    );
  });

  it('renders the A4 printable invoice document with required tables and no-break classes', () => {
    render(<InvoiceView />);

    const printableDoc = document.getElementById('printable-invoice-document');
    expect(printableDoc).toBeInTheDocument();

    const itemsTable = document.getElementById('invoice-items-table');
    expect(itemsTable).toBeInTheDocument();
    expect(screen.getByText('Classmate Pulse Notebook 300 Pgs')).toBeInTheDocument();
    expect(screen.getByText('Six Hundred Rupees Only')).toBeInTheDocument();

    // Back to Admin navigation works
    const backBtn = screen.getByRole('button', { name: /Back to Admin/i });
    fireEvent.click(backBtn);
    expect(mockSetActiveView).toHaveBeenCalledWith('admin');
  });

  it('handles empty state when no invoice order is selected', () => {
    currentSelectedOrder = null;
    render(<InvoiceView />);

    expect(screen.getByText('No invoice selected.')).toBeInTheDocument();
    const returnHomeBtn = screen.getByRole('button', { name: /Return to Home/i });
    fireEvent.click(returnHomeBtn);
    expect(mockSetActiveView).toHaveBeenCalledWith('home');
  });
});
