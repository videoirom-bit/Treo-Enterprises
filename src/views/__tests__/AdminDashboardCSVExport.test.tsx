import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AppProvider } from '../../context/AppContext';
import { AdminDashboardView } from '../AdminDashboardView';
import * as csvUtils from '../../utils/csvUtils';

describe('Admin Product Management - Download CSV', () => {
  let downloadCSVFileSpy: any;

  beforeEach(() => {
    localStorage.clear();
    // Simulate logged-in admin state
    localStorage.setItem('abc_stationery_v1_admin_auth', 'true');
    downloadCSVFileSpy = vi.spyOn(csvUtils, 'downloadCSVFile').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render the Download CSV button in the inventory/product management tab', async () => {
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

    const downloadBtn = screen.getByRole('button', { name: /download csv/i });
    expect(downloadBtn).toBeInTheDocument();
    expect(downloadBtn).toHaveAttribute('id', 'download-products-csv-btn');
  });

  it('should trigger downloadCSVFile with generated product catalog CSV when clicked', async () => {
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

    const downloadBtn = screen.getByRole('button', { name: /download csv/i });
    await act(async () => {
      fireEvent.click(downloadBtn);
    });

    expect(downloadCSVFileSpy).toHaveBeenCalledTimes(1);
    const [csvContent, fileName] = downloadCSVFileSpy.mock.calls[0];

    // Validate filename format
    expect(fileName).toMatch(/^Product_Catalog_\d{4}-\d{2}-\d{2}\.csv$/);

    // Validate CSV content headers and fields (SKU, Price, Stock)
    expect(csvContent).toContain('SKU');
    expect(csvContent).toContain('Product Name');
    expect(csvContent).toContain('Cost Price (INR)');
    expect(csvContent).toContain('Selling Price (INR)');
    expect(csvContent).toContain('Current Stock');
  });

  it('should export filtered products when search query is applied in inventory', async () => {
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

    // Search for a specific product
    const searchInput = screen.getByPlaceholderText(/search sku, barcode, brand, product/i);
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'Copier' } });
    });

    const downloadBtn = screen.getByRole('button', { name: /download csv/i });
    await act(async () => {
      fireEvent.click(downloadBtn);
    });

    expect(downloadCSVFileSpy).toHaveBeenCalledTimes(1);
    const [csvContent] = downloadCSVFileSpy.mock.calls[0];
    expect(csvContent.toLowerCase()).toContain('copier');
  });
});
