import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TrackOrderView } from '../TrackOrderView';
import { Order } from '../../types';

const testOrder: Order = {
  id: 'test-order-001',
  orderNumber: 'ABC-2026-00001',
  invoiceNumber: 'INV-2026-00001',
  orderDate: '2026-09-12T10:00:00Z',
  expectedDeliveryDate: '2026-09-12T16:00:00Z',
  customer: {
    name: 'Rajesh Verma',
    mobile: '9876543210',
    billingAddress: '12 Gandhi Road',
    shippingAddress: '12 Gandhi Road',
    city: 'Raipur',
    state: 'Chhattisgarh',
    pincode: '492001',
  },
  orderType: 'Home Delivery',
  items: [
    {
      productId: 'prod-test-1',
      productName: 'A4 Copier Paper Ream',
      sku: 'A4-COP-01',
      hsnCode: '4802',
      unit: 'Ream',
      rate: 300,
      quantity: 2,
      discountPerUnit: 0,
      taxableAmount: 535.71,
      gstRate: 12,
      cgstAmount: 32.14,
      sgstAmount: 32.14,
      igstAmount: 0,
      totalGst: 64.28,
      totalAmount: 600,
    },
  ],
  subtotal: 600,
  totalDiscount: 0,
  taxableAmount: 535.71,
  isInterState: false,
  cgst: 32.14,
  sgst: 32.14,
  igst: 0,
  totalTax: 64.28,
  deliveryCharge: 0,
  roundOff: 0,
  grandTotal: 600,
  amountInWords: 'Six Hundred Rupees Only',
  paymentMethod: 'UPI',
  paymentStatus: 'Paid',
  paidAmount: 600,
  pendingAmount: 0,
  orderStatus: 'Out for Delivery',
};

vi.mock('../../context/AppContext', () => ({
  useApp: () => ({
    orders: [testOrder],
    searchTrackingId: testOrder.orderNumber,
    setSearchTrackingId: vi.fn(),
    quickTrackOrder: (id: string) => testOrder,
    setSelectedOrderForInvoice: vi.fn(),
    setActiveView: vi.fn(),
    reorderItems: vi.fn(),
    showToast: vi.fn(),
    shopSettings: {
      shopName: 'ABC Paper & Stationery',
      address: 'Shop No. 12, ABC Complex, Raipur',
      phone: '+91 98765 43210',
      email: 'sales@abcstationery.com',
      gstin: '22AAAAA0000A1Z5',
    },
  }),
}));

describe('TrackOrderView Financial Totals & Items Tab', () => {
  it('renders order details and navigates to Items tab without throwing on taxableSubtotal', () => {
    render(<TrackOrderView />);

    // Check order header renders
    expect(screen.getByText('Rajesh Verma')).toBeDefined();

    // Click "Order Items" tab
    const itemsTab = screen.getByText(/Order Items/i);
    expect(itemsTab).toBeDefined();
    fireEvent.click(itemsTab);

    // Verify items are displayed
    expect(screen.getByText('A4 Copier Paper Ream')).toBeDefined();

    // Verify Financial Breakdown renders correctly without throwing TypeError
    expect(screen.getByText(/Taxable Amount \(Subtotal\):/i)).toBeDefined();
    expect(screen.getByText(/CGST \+ SGST \(Total GST\):/i)).toBeDefined();
    expect(screen.getByText(/Grand Total:/i)).toBeDefined();
  });
});
