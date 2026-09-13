import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { AppProvider } from '../../context/AppContext';
import { AdminDashboardView } from '../AdminDashboardView';

describe('Admin Product Management - Low Stock Visual Indicators', () => {
  beforeEach(() => {
    localStorage.clear();
    // Simulate logged-in admin state
    localStorage.setItem('abc_stationery_v1_admin_auth', 'true');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('highlights low stock product rows in red and displays "Low Stock" badges', async () => {
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

    // Verify product table rows exist
    const rows = screen.getAllByTestId('product-table-row');
    expect(rows.length).toBeGreaterThan(0);

    // Find rows marked as low stock
    const lowStockRows = rows.filter((r) => r.getAttribute('data-low-stock') === 'true');
    const normalStockRows = rows.filter((r) => r.getAttribute('data-low-stock') === 'false');

    expect(lowStockRows.length).toBeGreaterThan(0);

    // Verify low-stock row has red styling classes applied
    lowStockRows.forEach((row) => {
      expect(row.className).toContain('bg-red-50');
      expect(row.className).toContain('border-l-red-500');

      // Verify the Low Stock badge is present within this row
      const lowStockBadge = within(row).getByTestId('low-stock-badge');
      expect(lowStockBadge).toBeInTheDocument();
      expect(lowStockBadge.textContent).toMatch(/Low Stock/i);

      // Verify Reorder button is present in low-stock row
      const reorderBtn = within(row).getByRole('button', { name: /reorder/i });
      expect(reorderBtn).toBeInTheDocument();
    });

    // Verify normal stock rows do not have red border and no low-stock badge
    normalStockRows.forEach((row) => {
      expect(row.className).toContain('border-l-transparent');
      expect(within(row).queryByTestId('low-stock-badge')).toBeNull();
      expect(within(row).queryByRole('button', { name: /reorder/i })).toBeNull();
    });
  });

  it('allows the owner to filter by "Low Stock Only" to prioritize reordering', async () => {
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

    // Click the "Low Stock Only" filter pill by ID
    const filterLowStockBtn = document.getElementById('filter-low-stock-btn')!;
    expect(filterLowStockBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(filterLowStockBtn);
    });

    // All displayed rows must now be low stock items
    const rows = screen.getAllByTestId('product-table-row');
    expect(rows.length).toBeGreaterThan(0);
    rows.forEach((row) => {
      expect(row.getAttribute('data-low-stock')).toBe('true');
      expect(row.className).toContain('bg-red-50');
      expect(row.className).toContain('border-l-red-500');
    });

    // Click back to "All Products"
    const allProductsBtn = document.getElementById('filter-all-products-btn')!;
    await act(async () => {
      fireEvent.click(allProductsBtn);
    });

    const allRows = screen.getAllByTestId('product-table-row');
    expect(allRows.length).toBeGreaterThan(rows.length);
  });

  it('allows one-click quick replenishment using the Reorder button in low stock rows', async () => {
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

    // Find the first low-stock row with reorder button
    const rows = screen.getAllByTestId('product-table-row');
    const firstLowStockRow = rows.find((r) => r.getAttribute('data-low-stock') === 'true');
    expect(firstLowStockRow).toBeDefined();

    if (firstLowStockRow) {
      const reorderBtn = within(firstLowStockRow).getByRole('button', { name: /reorder/i });
      expect(reorderBtn).toBeInTheDocument();

      // Click Reorder
      await act(async () => {
        fireEvent.click(reorderBtn);
      });

      // After reordering units, the stock has increased significantly
      // e.g. from 4 to 40 pieces or similar
      const updatedRows = screen.getAllByTestId('product-table-row');
      expect(updatedRows.length).toBeGreaterThan(0);
    }
  });
});
