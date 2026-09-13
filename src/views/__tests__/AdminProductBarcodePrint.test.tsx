import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { AppProvider } from '../../context/AppContext';
import { AdminDashboardView } from '../AdminDashboardView';

describe('Admin Product Management - Barcode Generation and Printing', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('abc_stationery_v1_admin_auth', 'true');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.className = '';
  });

  it('renders a "Print Barcode" button next to each product entry in the product table', async () => {
    render(
      <AppProvider>
        <AdminDashboardView />
      </AppProvider>
    );

    // Switch to Inventory tab
    const inventoryTabBtn = screen.getByRole('button', { name: /inventory/i });
    await act(async () => {
      fireEvent.click(inventoryTabBtn);
    });

    // Ensure the table is rendered
    const table = document.getElementById('admin-products-table');
    expect(table).toBeInTheDocument();

    // Verify all rows have a Print Barcode button
    const printBarcodeButtons = screen.getAllByTestId('print-barcode-btn');
    expect(printBarcodeButtons.length).toBeGreaterThan(0);

    printBarcodeButtons.forEach((btn) => {
      expect(btn).toHaveTextContent(/Print Barcode/i);
    });
  });

  it('opens the printable barcode modal with the product SKU and barcode graphics when clicked', async () => {
    render(
      <AppProvider>
        <AdminDashboardView />
      </AppProvider>
    );

    // Switch to Inventory tab
    const inventoryTabBtn = screen.getByRole('button', { name: /inventory/i });
    await act(async () => {
      fireEvent.click(inventoryTabBtn);
    });

    const rows = screen.getAllByTestId('product-table-row');
    expect(rows.length).toBeGreaterThan(0);

    // Click Print Barcode on the first row
    const firstRow = rows[0];
    const printBtn = within(firstRow).getByTestId('print-barcode-btn');
    await act(async () => {
      fireEvent.click(printBtn);
    });

    // Verify the barcode modal is visible
    const modal = screen.getByTestId('product-barcode-modal');
    expect(modal).toBeInTheDocument();

    // Verify SVG barcode graphics are generated
    const barcodeSvgs = screen.getAllByTestId('product-barcode-svg');
    expect(barcodeSvgs.length).toBeGreaterThan(0);

    // Verify print actions are available inside the modal
    const printActionBtn = within(modal).getByRole('button', { name: /print.*label/i });
    expect(printActionBtn).toBeInTheDocument();

    // Close the modal
    const closeBtn = within(modal).getByLabelText(/close barcode dialog/i);
    await act(async () => {
      fireEvent.click(closeBtn);
    });

    expect(screen.queryByTestId('product-barcode-modal')).toBeNull();
  });
});
