import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LowStockWidget } from '../LowStockWidget';
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
    minimumStock: 10, // Stock is healthy (50 > 10)
    mrp: 60,
    sellingPrice: 50,
    costPrice: 35,
    purchasePrice: 35,
    discountPercentage: 16.6,
    gstRate: 18,
    hsnCode: '9608',
    unit: 'Piece',
    description: 'Smooth writing gel pen',
    specifications: ['0.5mm tip', 'Waterproof'],
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
    currentStock: 4,
    openingStock: 20,
    minimumStock: 10, // Low stock (4 <= 10)
    mrp: 350,
    sellingPrice: 310,
    costPrice: 260,
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
    supplierName: 'JK Paper Mills Ltd',
    createdAt: '2026-01-01',
  },
  {
    id: 'prod-3',
    sku: 'MKT-001',
    barcode: '8901234567892',
    name: 'Faber-Castell Textliner Highlighter',
    category: 'Office Supplies',
    brand: 'Faber-Castell',
    currentStock: 0,
    openingStock: 15,
    minimumStock: 5, // Out of stock (0 <= 5)
    mrp: 30,
    sellingPrice: 25,
    costPrice: 18,
    purchasePrice: 18,
    discountPercentage: 16.6,
    gstRate: 12,
    hsnCode: '9608',
    unit: 'Piece',
    description: 'Fluorescent yellow highlighter',
    specifications: ['Chisel tip', 'Non-toxic'],
    packageContents: '1 Highlighter',
    suitableFor: 'Document marking',
    imageUrl: 'https://example.com/highlighter.jpg',
    createdAt: '2026-01-01',
  },
];

describe('LowStockWidget', () => {
  it('renders low stock items dynamically where currentStock <= minimumStock', () => {
    const onQuickRestock = vi.fn();
    const onEditProduct = vi.fn();
    const onNavigateToInventory = vi.fn();
    const onDownloadLowStockCSV = vi.fn();

    render(
      <LowStockWidget
        products={mockProducts}
        onQuickRestock={onQuickRestock}
        onEditProduct={onEditProduct}
        onNavigateToInventory={onNavigateToInventory}
        onDownloadLowStockCSV={onDownloadLowStockCSV}
      />
    );

    // Header counter should show 2 items (PAP-001 and MKT-001)
    expect(screen.getByText('Low Stock & Replenishment Alerts')).toBeInTheDocument();
    expect(screen.getByText('2 Items')).toBeInTheDocument();

    // High-stock item should NOT be shown in low stock list
    expect(screen.queryByText('Reynolds Trimax Liquid Gel Pen')).not.toBeInTheDocument();

    // Low stock item and Out of stock item SHOULD be shown
    expect(screen.getByText('JK Copier A4 Paper 75 GSM')).toBeInTheDocument();
    expect(screen.getByText('Faber-Castell Textliner Highlighter')).toBeInTheDocument();

    // Out of Stock and Low Stock badges
    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
    expect(screen.getByText('Low Stock')).toBeInTheDocument();
  });

  it('triggers quick restock callback with +10 and +25', () => {
    const onQuickRestock = vi.fn();
    const onEditProduct = vi.fn();
    const onNavigateToInventory = vi.fn();
    const onDownloadLowStockCSV = vi.fn();

    render(
      <LowStockWidget
        products={mockProducts}
        onQuickRestock={onQuickRestock}
        onEditProduct={onEditProduct}
        onNavigateToInventory={onNavigateToInventory}
        onDownloadLowStockCSV={onDownloadLowStockCSV}
      />
    );

    // Find +10 restock buttons
    const plusTenButtons = screen.getAllByRole('button', { name: /\+10/i });
    expect(plusTenButtons.length).toBeGreaterThan(0);

    fireEvent.click(plusTenButtons[0]);
    expect(onQuickRestock).toHaveBeenCalledWith('prod-2', 10);

    // Find +25 restock buttons
    const plusTwentyFiveButtons = screen.getAllByRole('button', { name: /\+25/i });
    fireEvent.click(plusTwentyFiveButtons[0]);
    expect(onQuickRestock).toHaveBeenCalledWith('prod-2', 25);
  });

  it('filters items when search input is typed', () => {
    const onQuickRestock = vi.fn();
    const onEditProduct = vi.fn();
    const onNavigateToInventory = vi.fn();
    const onDownloadLowStockCSV = vi.fn();

    render(
      <LowStockWidget
        products={mockProducts}
        onQuickRestock={onQuickRestock}
        onEditProduct={onEditProduct}
        onNavigateToInventory={onNavigateToInventory}
        onDownloadLowStockCSV={onDownloadLowStockCSV}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search low stock...');
    fireEvent.change(searchInput, { target: { value: 'Copier' } });

    expect(screen.getByText('JK Copier A4 Paper 75 GSM')).toBeInTheDocument();
    expect(screen.queryByText('Faber-Castell Textliner Highlighter')).not.toBeInTheDocument();
  });

  it('filters out of stock only when tab clicked', () => {
    const onQuickRestock = vi.fn();
    const onEditProduct = vi.fn();
    const onNavigateToInventory = vi.fn();
    const onDownloadLowStockCSV = vi.fn();

    render(
      <LowStockWidget
        products={mockProducts}
        onQuickRestock={onQuickRestock}
        onEditProduct={onEditProduct}
        onNavigateToInventory={onNavigateToInventory}
        onDownloadLowStockCSV={onDownloadLowStockCSV}
      />
    );

    const outOfStockTab = screen.getByRole('button', { name: /Out of Stock \(1\)/i });
    fireEvent.click(outOfStockTab);

    expect(screen.getByText('Faber-Castell Textliner Highlighter')).toBeInTheDocument();
    expect(screen.queryByText('JK Copier A4 Paper 75 GSM')).not.toBeInTheDocument();
  });

  it('shows healthy state when no items are low stock', () => {
    const healthyProducts: Product[] = [
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
    ];

    render(
      <LowStockWidget
        products={healthyProducts}
        onQuickRestock={vi.fn()}
        onEditProduct={vi.fn()}
        onNavigateToInventory={vi.fn()}
        onDownloadLowStockCSV={vi.fn()}
      />
    );

    expect(screen.getByText('All Inventory Healthy & Well-Stocked')).toBeInTheDocument();
    expect(screen.getByText('0 Items')).toBeInTheDocument();
  });
});
