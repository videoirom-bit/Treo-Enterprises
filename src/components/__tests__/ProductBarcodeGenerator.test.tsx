import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProductBarcodeGenerator } from '../ProductBarcodeGenerator';

describe('ProductBarcodeGenerator', () => {
  it('renders an SVG element with generated barcode elements for a product SKU', () => {
    render(<ProductBarcodeGenerator sku="PILOT-V5-BLU" />);
    const svg = screen.getByTestId('product-barcode-svg');
    expect(svg).toBeInTheDocument();
    expect(svg.getAttribute('data-sku')).toBe('PILOT-V5-BLU');
    // jsbarcode creates child rect/path/g/text elements inside the SVG
    expect(svg.children.length).toBeGreaterThan(0);
  });

  it('renders barcode with custom dimensions and formats', () => {
    render(
      <ProductBarcodeGenerator
        sku="CLASSMATE-NB-A4"
        width={2.2}
        height={60}
        displayValue={true}
        format="CODE128"
      />
    );
    const svg = screen.getByTestId('product-barcode-svg');
    expect(svg).toBeInTheDocument();
    expect(svg.children.length).toBeGreaterThan(0);
  });

  it('handles missing SKU gracefully by displaying a fallback message', () => {
    render(<ProductBarcodeGenerator sku="" />);
    expect(screen.getByText(/Missing SKU or Barcode data/i)).toBeInTheDocument();
  });
});
