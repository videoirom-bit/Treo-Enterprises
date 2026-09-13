import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ProductBarcodeModal } from '../ProductBarcodeModal';
import { Product } from '../../types';

const mockProduct: Product = {
  id: 'prod-test-1',
  sku: 'PILOT-V5-BLU',
  barcode: '8901234567890',
  name: 'Pilot V5 Hi-Techpoint Liquid Ink Rollerball Pen - Blue',
  category: 'Pens',
  brand: 'Pilot',
  unit: 'Piece',
  purchasePrice: 40,
  costPrice: 40,
  sellingPrice: 55,
  mrp: 60,
  discountPercentage: 8.3,
  gstRate: 18,
  hsnCode: '9608',
  openingStock: 100,
  currentStock: 4,
  minimumStock: 20,
  description: 'Precision Japanese pen',
  specifications: ['0.5mm tip'],
  packageContents: '1 Pen',
  imageUrl: 'https://example.com/pen.jpg',
  createdAt: '2026-01-01',
};

describe('ProductBarcodeModal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.className = '';
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ProductBarcodeModal product={mockProduct} isOpen={false} onClose={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders product details and live barcode graphic when open', () => {
    render(<ProductBarcodeModal product={mockProduct} isOpen={true} onClose={() => {}} />);

    // Checks header SKU and title
    expect(screen.getAllByText('PILOT-V5-BLU').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Pilot V5 Hi-Techpoint/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/HSN: 9608/i).length).toBeGreaterThan(0);

    // Checks that barcode SVGs exist (in live preview and printable sheet)
    const barcodeSvgs = screen.getAllByTestId('product-barcode-svg');
    expect(barcodeSvgs.length).toBeGreaterThan(0);
    expect(barcodeSvgs[0]).toBeInTheDocument();
  });

  it('allows changing label copies and layout presets', () => {
    render(<ProductBarcodeModal product={mockProduct} isOpen={true} onClose={() => {}} />);

    // Click on 4 copies
    const copy4Btn = screen.getByRole('button', { name: /^4/i });
    fireEvent.click(copy4Btn);

    expect(screen.getAllByText(/4 labels/i).length).toBeGreaterThan(0);

    // Click on Compact Shelf preset
    const compactBtn = screen.getByRole('button', { name: /compact shelf/i });
    fireEvent.click(compactBtn);

    // Printable container has 4 labels
    const printableContainer = screen.getByTestId('printable-barcode-container');
    const sheetLabels = printableContainer.querySelectorAll('[data-testid="barcode-label-item"]');
    expect(sheetLabels.length).toBe(4);
  });

  it('triggers window.print and sets printing-barcode-mode on document.body', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

    render(<ProductBarcodeModal product={mockProduct} isOpen={true} onClose={() => {}} />);

    const printBtn = screen.getByRole('button', { name: /print 1 barcode label/i });
    fireEvent.click(printBtn);

    // After slight timeout for DOM rendering, window.print is called
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(printSpy).toHaveBeenCalled();
    expect(document.body.classList.contains('printing-barcode-mode')).toBe(true);

    // After timer fallback, clean up happens
    act(() => {
      vi.advanceTimersByTime(1600);
    });
    expect(document.body.classList.contains('printing-barcode-mode')).toBe(false);
  });

  it('calls onClose when close button is clicked', () => {
    const onCloseMock = vi.fn();
    render(<ProductBarcodeModal product={mockProduct} isOpen={true} onClose={onCloseMock} />);

    const closeBtn = screen.getByLabelText(/close barcode dialog/i);
    fireEvent.click(closeBtn);

    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
