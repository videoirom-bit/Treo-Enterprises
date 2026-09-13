import { describe, it, expect } from 'vitest';
import {
  calculateGST,
  formatInvoiceNumber,
  isValidGSTIN,
  isValidIndianMobile,
  numberToWordsINR,
  formatINR,
} from '../gstUtils';

describe('GST Calculation Engine (gstUtils)', () => {
  const shopState = 'Chhattisgarh';

  describe('Intra-State GST (CGST + SGST Split)', () => {
    it('should split GST equally between CGST (50%) and SGST (50%) for intra-state sales', () => {
      const items = [
        {
          sellingPrice: 118,
          quantity: 1,
          gstRate: 18,
        },
      ];

      const result = calculateGST(items, shopState, 'Chhattisgarh');

      expect(result.isInterState).toBe(false);
      expect(result.subtotal).toBe(118);
      expect(result.totalDiscount).toBe(0);
      expect(result.taxableAmount).toBe(100);
      expect(result.cgst).toBe(9);
      expect(result.sgst).toBe(9);
      expect(result.igst).toBe(0);
      expect(result.totalTax).toBe(18);
      expect(result.grandTotal).toBe(118);
      expect(result.roundOff).toBe(0);
    });

    it('should treat customer state case-insensitively and ignore whitespace', () => {
      const items = [{ sellingPrice: 112, quantity: 2, gstRate: 12 }];
      const result = calculateGST(items, 'Chhattisgarh', '  chhattisgarh  ');

      expect(result.isInterState).toBe(false);
      expect(result.igst).toBe(0);
      expect(result.cgst).toBeGreaterThan(0);
      expect(result.sgst).toBe(result.cgst);
    });
  });

  describe('Inter-State GST (IGST 100%)', () => {
    it('should levy 100% of tax as IGST with 0 CGST and 0 SGST when customer state differs from shop state', () => {
      const items = [
        {
          sellingPrice: 118,
          quantity: 2,
          gstRate: 18,
        },
      ];

      const result = calculateGST(items, shopState, 'Maharashtra');

      expect(result.isInterState).toBe(true);
      expect(result.subtotal).toBe(236);
      expect(result.taxableAmount).toBe(200);
      expect(result.cgst).toBe(0);
      expect(result.sgst).toBe(0);
      expect(result.igst).toBe(36);
      expect(result.totalTax).toBe(36);
      expect(result.grandTotal).toBe(236);
    });
  });

  describe('Mixed GST Slabs & Item Discounts', () => {
    it('should accurately calculate taxable amounts and taxes across multiple items with different tax rates (0%, 5%, 12%, 18%)', () => {
      const items = [
        // 0% GST (e.g. school textbooks / notebooks)
        { sellingPrice: 100, quantity: 2, gstRate: 0 },
        // 5% GST
        { sellingPrice: 105, quantity: 1, gstRate: 5 },
        // 12% GST
        { sellingPrice: 112, quantity: 1, gstRate: 12 },
        // 18% GST
        { sellingPrice: 118, quantity: 1, gstRate: 18 },
      ];

      const result = calculateGST(items, shopState, 'Chhattisgarh');

      // 100*2 = 200 (taxable: 200, tax: 0)
      // 105*1 = 105 (taxable: 100, tax: 5)
      // 112*1 = 112 (taxable: 100, tax: 12)
      // 118*1 = 118 (taxable: 100, tax: 18)
      // Total taxable = 200 + 100 + 100 + 100 = 500
      // Total tax = 0 + 5 + 12 + 18 = 35
      expect(result.taxableAmount).toBe(500);
      expect(result.totalTax).toBe(35);
      expect(result.cgst).toBe(17.5);
      expect(result.sgst).toBe(17.5);
      expect(result.grandTotal).toBe(535);
    });

    it('should apply unit discounts before computing base taxable amount and tax', () => {
      const items = [
        {
          sellingPrice: 150,
          quantity: 2,
          gstRate: 18,
          discount: 32, // Net selling price = 118 per unit
        },
      ];

      const result = calculateGST(items, shopState, 'Chhattisgarh');

      expect(result.subtotal).toBe(300);
      expect(result.totalDiscount).toBe(64);
      // Net amount = 236. At 18% GST, taxable = 200, tax = 36.
      expect(result.taxableAmount).toBe(200);
      expect(result.totalTax).toBe(36);
      expect(result.cgst).toBe(18);
      expect(result.sgst).toBe(18);
      expect(result.grandTotal).toBe(236);
    });
  });

  describe('Delivery Charges and Rounding Off', () => {
    it('should factor in delivery charges and calculate round-off correctly to nearest whole rupee', () => {
      const items = [
        {
          sellingPrice: 100,
          quantity: 1,
          gstRate: 18, // 100 / 1.18 = 84.7457...
        },
      ];

      const deliveryCharge = 49;
      const result = calculateGST(items, shopState, 'Chhattisgarh', deliveryCharge);

      // Raw total = 100 + 49 = 149
      expect(result.grandTotal).toBe(149);
      expect(result.roundOff).toBe(0);
    });

    it('should return 0 totals when items array is empty', () => {
      const result = calculateGST([], shopState, 'Chhattisgarh', 0);

      expect(result.subtotal).toBe(0);
      expect(result.taxableAmount).toBe(0);
      expect(result.totalTax).toBe(0);
      expect(result.grandTotal).toBe(0);
      expect(result.cgst).toBe(0);
      expect(result.sgst).toBe(0);
      expect(result.igst).toBe(0);
    });
  });

  describe('Invoice Formatting & Validation Helpers', () => {
    it('should format invoice number with prefix and 5-digit zero padding', () => {
      expect(formatInvoiceNumber('INV', 1)).toBe('INV-00001');
      expect(formatInvoiceNumber('INV', 1042)).toBe('INV-01042');
      expect(formatInvoiceNumber('ABC', 99999)).toBe('ABC-99999');
    });

    it('should validate Indian GSTIN numbers according to the statutory 15-character standard', () => {
      // 2 digits state code + 5 chars PAN alphabets + 4 chars PAN digits + 1 char entity + 1 char check/alphanumeric + Z + 1 char check digit
      expect(isValidGSTIN('22AAAAA0000A1Z5')).toBe(true);
      expect(isValidGSTIN('27ABCDE1234F1Z5')).toBe(true);

      // Invalid GSTINs
      expect(isValidGSTIN('')).toBe(false);
      expect(isValidGSTIN('INVALIDGST')).toBe(false);
      expect(isValidGSTIN('12345')).toBe(false);
      expect(isValidGSTIN('22AAAAA0000A1Z')).toBe(false); // only 14 chars
    });

    it('should validate Indian 10-digit mobile numbers with optional country code', () => {
      expect(isValidIndianMobile('9876543210')).toBe(true);
      expect(isValidIndianMobile('+91 98765 43210')).toBe(true);
      expect(isValidIndianMobile('919876543210')).toBe(true);

      // Invalid mobile numbers
      expect(isValidIndianMobile('')).toBe(false);
      expect(isValidIndianMobile('12345')).toBe(false);
      expect(isValidIndianMobile('abcdefghij')).toBe(false);
    });

    it('should convert numbers into Indian numbering words correctly', () => {
      expect(numberToWordsINR(0)).toBe('Rupees Zero Only');
      expect(numberToWordsINR(500)).toBe('Rupees Five Hundred Only');
      expect(numberToWordsINR(1250)).toBe('Rupees One Thousand Two Hundred and Fifty Only');
      expect(numberToWordsINR(100000)).toBe('Rupees One Lakh Only');
    });

    it('should format Indian Rupee currency with symbol', () => {
      const formatted = formatINR(1250);
      expect(formatted).toContain('1,250');
    });
  });
});
