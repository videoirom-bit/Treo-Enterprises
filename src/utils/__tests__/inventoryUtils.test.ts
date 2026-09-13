import { describe, it, expect } from 'vitest';
import {
  validateStockAvailability,
  deductInventory,
  deductInventoryWithAudit,
  restoreInventory,
} from '../inventoryUtils';
import { Product } from '../../types';

const mockProducts: Product[] = [
  {
    id: 'prod-1',
    sku: 'PEN-001',
    barcode: '8901234567890',
    name: 'Reynolds Trimax Liquid Gel Pen',
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
    description: 'Smooth writing gel pen',
    specifications: ['0.5mm tip', 'Blue ink'],
    packageContents: '1 Pen',
    suitableFor: 'Office and student use',
    imageUrl: 'https://example.com/pen.jpg',
    createdAt: '2026-01-01',
  },
  {
    id: 'prod-2',
    sku: 'PAP-001',
    barcode: '8901234567891',
    name: 'JK Copier A4 Paper 75 GSM',
    category: 'Paper',
    brand: 'JK Paper',
    currentStock: 5,
    openingStock: 20,
    minimumStock: 10, // low stock initially
    mrp: 350,
    sellingPrice: 310,
    purchasePrice: 260,
    discountPercentage: 11.4,
    gstRate: 12,
    hsnCode: '4802',
    unit: 'Ream',
    description: 'High quality printing paper',
    specifications: ['A4 size', '75 GSM'],
    packageContents: '500 sheets',
    suitableFor: 'Photocopy and laser printing',
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
    currentStock: 0, // completely out of stock
    openingStock: 15,
    minimumStock: 5,
    mrp: 180,
    sellingPrice: 155,
    purchasePrice: 110,
    discountPercentage: 13.8,
    gstRate: 18,
    hsnCode: '4820',
    unit: 'Piece',
    description: 'Heavy duty office box file',
    specifications: ['Lever arch clip'],
    packageContents: '1 File',
    suitableFor: 'Office documentation',
    imageUrl: 'https://example.com/file.jpg',
    createdAt: '2026-01-01',
  },
];

describe('Inventory Stock Engine (inventoryUtils)', () => {
  describe('validateStockAvailability', () => {
    it('should validate successfully when all requested items have sufficient stock', () => {
      const orderItems = [
        { productId: 'prod-1', quantity: 10 },
        { productId: 'prod-2', quantity: 2 },
      ];

      const result = validateStockAvailability(mockProducts, orderItems);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject when an item is completely out of stock', () => {
      const orderItems = [{ productId: 'prod-3', quantity: 1 }];

      const result = validateStockAvailability(mockProducts, orderItems);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('"Solo Lever Arch Box File" is completely out of stock.');
    });

    it('should reject when requested quantity exceeds available stock', () => {
      const orderItems = [{ productId: 'prod-2', quantity: 10 }]; // only 5 available

      const result = validateStockAvailability(mockProducts, orderItems);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Insufficient stock for "JK Copier A4 Paper 75 GSM"');
      expect(result.errors[0]).toContain('Requested: 10, Available: 5');
    });

    it('should report an error if a requested product ID is missing from the catalog', () => {
      const orderItems = [{ productId: 'unknown-id', quantity: 1 }];

      const result = validateStockAvailability(mockProducts, orderItems);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Product with ID "unknown-id" was not found');
    });
  });

  describe('deductInventory', () => {
    it('should accurately decrement product stock by ordered quantity', () => {
      const orderItems = [
        { productId: 'prod-1', quantity: 15 },
        { productId: 'prod-2', quantity: 3 },
      ];

      const updated = deductInventory(mockProducts, orderItems);

      const p1 = updated.find((p) => p.id === 'prod-1')!;
      const p2 = updated.find((p) => p.id === 'prod-2')!;
      const p3 = updated.find((p) => p.id === 'prod-3')!;

      expect(p1.currentStock).toBe(35); // 50 - 15
      expect(p2.currentStock).toBe(2);  // 5 - 3
      expect(p3.currentStock).toBe(0);  // Unaltered
    });

    it('should never drop stock below zero even if requested quantity exceeds current stock', () => {
      const orderItems = [{ productId: 'prod-2', quantity: 20 }]; // 5 in stock

      const updated = deductInventory(mockProducts, orderItems);
      const p2 = updated.find((p) => p.id === 'prod-2')!;

      expect(p2.currentStock).toBe(0);
    });

    it('should leave un-ordered products completely unchanged', () => {
      const orderItems = [{ productId: 'prod-1', quantity: 5 }];
      const updated = deductInventory(mockProducts, orderItems);

      const p2 = updated.find((p) => p.id === 'prod-2')!;
      expect(p2.currentStock).toBe(5);
    });
  });

  describe('deductInventoryWithAudit', () => {
    it('should produce a detailed audit report tracking previous stock, new stock, and status flags', () => {
      const orderItems = [
        { productId: 'prod-1', quantity: 45 }, // 50 - 45 = 5 (minimumStock: 10 => isLowStock: true)
        { productId: 'prod-2', quantity: 5 },  // 5 - 5 = 0 (isOutOfStock: true)
      ];

      const report = deductInventoryWithAudit(mockProducts, orderItems);

      expect(report.deductedItems).toHaveLength(2);

      const auditP1 = report.deductedItems.find((d) => d.productId === 'prod-1')!;
      expect(auditP1.previousStock).toBe(50);
      expect(auditP1.newStock).toBe(5);
      expect(auditP1.quantityDeducted).toBe(45);
      expect(auditP1.isLowStock).toBe(true);
      expect(auditP1.isOutOfStock).toBe(false);

      const auditP2 = report.deductedItems.find((d) => d.productId === 'prod-2')!;
      expect(auditP2.previousStock).toBe(5);
      expect(auditP2.newStock).toBe(0);
      expect(auditP2.quantityDeducted).toBe(5);
      expect(auditP2.isOutOfStock).toBe(true);
      expect(auditP2.isLowStock).toBe(false);
    });
  });

  describe('restoreInventory', () => {
    it('should restore stock correctly when an order is cancelled or items are restocked', () => {
      const itemsToRestore = [
        { productId: 'prod-1', quantity: 15 },
        { productId: 'prod-2', quantity: 5 },
      ];

      const restored = restoreInventory(mockProducts, itemsToRestore);

      const p1 = restored.find((p) => p.id === 'prod-1')!;
      const p2 = restored.find((p) => p.id === 'prod-2')!;

      expect(p1.currentStock).toBe(65); // 50 + 15
      expect(p2.currentStock).toBe(10); // 5 + 5
    });
  });
});
