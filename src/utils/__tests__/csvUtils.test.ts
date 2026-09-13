import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateProductsCSV, escapeCSVField, downloadCSVFile } from '../csvUtils';
import { Product } from '../../types';

const mockCatalog: Product[] = [
  {
    id: 'prod-1',
    sku: 'PEN-001',
    barcode: '8901234567890',
    name: 'Reynolds Trimax "Liquid" Gel Pen, Blue',
    category: 'Pens',
    brand: 'Reynolds',
    currentStock: 50,
    openingStock: 60,
    minimumStock: 10,
    mrp: 60,
    sellingPrice: 50,
    purchasePrice: 35,
    discountPercentage: 16.6,
    gstRate: 18,
    hsnCode: '9608',
    unit: 'Piece',
    description: 'Smooth writing gel pen with waterproof ink',
    specifications: ['0.5mm tip'],
    packageContents: '1 Pen',
    suitableFor: 'Office and school',
    imageUrl: 'https://example.com/pen.jpg',
    createdAt: '2026-01-01',
    supplierName: 'National Stationery Mart',
  },
  {
    id: 'prod-2',
    sku: 'PAP-001',
    barcode: '8901234567891',
    name: 'JK Copier A4 Paper 75 GSM',
    category: 'Paper',
    brand: 'JK Paper',
    currentStock: 4, // currentStock <= minimumStock -> Low Stock
    openingStock: 20,
    minimumStock: 10,
    mrp: 350,
    sellingPrice: 310,
    purchasePrice: 260,
    discountPercentage: 11.4,
    gstRate: 12,
    hsnCode: '4802',
    unit: 'Ream',
    description: 'Multipurpose A4 sheets',
    specifications: ['75 GSM'],
    packageContents: '500 sheets',
    suitableFor: 'Photocopy and printing',
    imageUrl: 'https://example.com/paper.jpg',
    createdAt: '2026-01-01',
  },
  {
    id: 'prod-3',
    sku: 'FIL-001',
    barcode: '8901234567892',
    name: 'Solo Lever Arch Box File',
    category: 'Files & Folders',
    brand: 'Solo',
    currentStock: 0, // currentStock <= 0 -> Out of Stock
    openingStock: 15,
    minimumStock: 5,
    mrp: 180,
    sellingPrice: 155,
    purchasePrice: 110,
    discountPercentage: 13.8,
    gstRate: 18,
    hsnCode: '4820',
    unit: 'Piece',
    description: 'Sturdy document holder',
    specifications: ['Lever arch'],
    packageContents: '1 File',
    suitableFor: 'Office archive',
    imageUrl: 'https://example.com/file.jpg',
    createdAt: '2026-01-01',
  },
];

describe('CSV Utility & Catalog Export (csvUtils)', () => {
  describe('escapeCSVField', () => {
    it('should return plain string for strings without delimiters', () => {
      expect(escapeCSVField('PEN-001')).toBe('PEN-001');
      expect(escapeCSVField(120)).toBe('120');
    });

    it('should return empty string for null and undefined', () => {
      expect(escapeCSVField(null)).toBe('');
      expect(escapeCSVField(undefined)).toBe('');
    });

    it('should escape fields containing commas by wrapping in double quotes', () => {
      expect(escapeCSVField('Pen, Blue')).toBe('"Pen, Blue"');
    });

    it('should escape double quotes by doubling them inside quotes', () => {
      expect(escapeCSVField('Solo 2" File')).toBe('"Solo 2"" File"');
    });

    it('should wrap multiline text in double quotes', () => {
      expect(escapeCSVField('Line 1\nLine 2')).toBe('"Line 1\nLine 2"');
    });
  });

  describe('generateProductsCSV', () => {
    it('should generate CSV with standard header row containing SKU, Price, and Stock fields', () => {
      const csv = generateProductsCSV(mockCatalog);
      const lines = csv.split('\r\n');

      const headers = lines[0].split(',');
      expect(headers).toContain('SKU');
      expect(headers).toContain('Product Name');
      expect(headers).toContain('Cost Price (INR)');
      expect(headers).toContain('Selling Price (INR)');
      expect(headers).toContain('MRP (INR)');
      expect(headers).toContain('Current Stock');
      expect(headers).toContain('Stock Status');
    });

    it('should correctly format product rows and assign accurate stock status badges', () => {
      const csv = generateProductsCSV(mockCatalog);
      const lines = csv.split('\r\n');

      expect(lines).toHaveLength(4); // 1 header + 3 products

      // Product 1: In Stock (50 > minimumStock 10)
      expect(lines[1]).toContain('PEN-001');
      expect(lines[1]).toContain('"Reynolds Trimax ""Liquid"" Gel Pen, Blue"');
      expect(lines[1]).toContain('35,50,60'); // Cost 35, Selling 50, MRP 60
      expect(lines[1]).toContain('60,50,10'); // Opening 60, Current 50, Minimum 10
      expect(lines[1]).toContain('In Stock');

      // Product 2: Low Stock (4 <= minimumStock 10)
      expect(lines[2]).toContain('PAP-001');
      expect(lines[2]).toContain('Low Stock');

      // Product 3: Out of Stock (0)
      expect(lines[3]).toContain('FIL-001');
      expect(lines[3]).toContain('Out of Stock');
    });

    it('should return just the header line if products array is empty', () => {
      const csv = generateProductsCSV([]);
      expect(csv).toContain('SKU,Product Name,Category');
      expect(csv.split('\r\n')).toHaveLength(1);
    });
  });

  describe('downloadCSVFile', () => {
    let originalCreateObjectURL: typeof URL.createObjectURL;
    let originalRevokeObjectURL: typeof URL.revokeObjectURL;

    beforeEach(() => {
      originalCreateObjectURL = URL.createObjectURL;
      originalRevokeObjectURL = URL.revokeObjectURL;
      URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      URL.revokeObjectURL = vi.fn();
    });

    afterEach(() => {
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
    });

    it('should trigger an anchor click to download the generated CSV blob', () => {
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      const removeChildSpy = vi.spyOn(document.body, 'removeChild');

      downloadCSVFile('SKU,Name\nP-1,Pen', 'products.csv');

      expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
  });
});
