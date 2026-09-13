import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppProvider } from '../../context/AppContext';
import { AdminDashboardView } from '../AdminDashboardView';
import { AddInventoryView } from '../../components/AddInventoryView';

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('Super Admin Inventory Management & Add Inventory Module', () => {
  beforeEach(() => {
    localStorageMock.clear();
    // Simulate authenticated super admin
    localStorageMock.setItem('abc_stationery_v1_admin_auth', 'true');
    localStorageMock.setItem('ais-dev-admin_auth', 'true');
    localStorageMock.setItem('abc_stationery_v1_admin_role', 'super_admin');
  });

  it('renders the Add Inventory page title, breadcrumbs, and required action buttons', () => {
    const handleBack = vi.fn();

    render(
      <AppProvider>
        <AddInventoryView onBackToInventory={handleBack} />
      </AppProvider>
    );

    // 1. Page title: Add Inventory
    expect(screen.getByRole('heading', { level: 1, name: /add inventory/i })).toBeInTheDocument();

    // 2. Breadcrumb: Dashboard → Inventory → Add Inventory
    const breadcrumb = screen.getByLabelText(/breadcrumb/i);
    expect(breadcrumb).toBeInTheDocument();
    expect(breadcrumb).toHaveTextContent('Dashboard');
    expect(breadcrumb).toHaveTextContent('Inventory');
    expect(breadcrumb).toHaveTextContent('Add Inventory');

    // 3. Action buttons
    expect(screen.getAllByRole('button', { name: /back to inventory/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('button', { name: /save inventory/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('button', { name: /save & add another/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('button', { name: /cancel/i }).length).toBeGreaterThanOrEqual(1);

    // 4. Draft/Save status
    expect(screen.getByText(/draft status/i)).toBeInTheDocument();
  });

  it('renders all structured product information fields including exact Units of Measurement', () => {
    render(
      <AppProvider>
        <AddInventoryView onBackToInventory={vi.fn()} />
      </AppProvider>
    );

    // Product Name *, SKU *, Barcode
    expect(screen.getByPlaceholderText(/e.g. JK Copier Paper A4/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g. JK-PAP-101/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g. 8901234567890/i)).toBeInTheDocument();

    // Category *, Subcategory, Brand, Description
    expect(screen.getByDisplayValue('Paper')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g. Copier Paper, Ball Pen/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g. JK Copier, Classmate/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter detailed specifications/i)).toBeInTheDocument();

    // Unit of Measurement with all required values: Piece, Box, Packet, Dozen, Kg, Gram, Litre, Meter
    const uomSelect = document.getElementById('unit-of-measurement-select') as HTMLSelectElement;
    expect(uomSelect).toBeInTheDocument();
    const options = Array.from(uomSelect.options).map((o) => o.value);
    expect(options).toEqual(
      expect.arrayContaining(['Piece', 'Box', 'Packet', 'Dozen', 'Kg', 'Gram', 'Litre', 'Meter'])
    );

    // HSN/SAC Code, GST Rate, Tax Type
    expect(screen.getByPlaceholderText(/e.g. 4802/i)).toBeInTheDocument();
    expect(document.getElementById('gst-rate-select')).toBeInTheDocument();
    expect(document.getElementById('tax-type-select')).toBeInTheDocument();

    // Product Type
    expect(document.getElementById('product-type-select')).toBeInTheDocument();
  });

  it('validates required fields and warns on duplicate SKU/barcode', async () => {
    render(
      <AppProvider>
        <AddInventoryView onBackToInventory={vi.fn()} />
      </AppProvider>
    );

    const nameInput = screen.getByPlaceholderText(/e.g. JK Copier Paper A4/i);
    const skuInput = screen.getByPlaceholderText(/e.g. JK-PAP-101/i);
    const saveBtn = screen.getByTestId('save-inventory-btn');

    // Clear inputs and attempt to save
    fireEvent.change(nameInput, { target: { value: '' } });
    fireEvent.change(skuInput, { target: { value: '' } });
    fireEvent.click(saveBtn);

    // Validation alert banner appears
    await waitFor(() => {
      expect(screen.getByText(/please resolve the following required fields/i)).toBeInTheDocument();
      expect(screen.getAllByText(/product name is required/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/product sku is required/i).length).toBeGreaterThanOrEqual(1);
    });

    // Enter an existing sample SKU (e.g. JK-COP-A4-75) to verify duplicate prevention
    fireEvent.change(skuInput, { target: { value: 'JK-COP-A4-75' } });
    await waitFor(() => {
      expect(screen.getByText(/duplicate sku!/i)).toBeInTheDocument();
    });
  });

  it('grants Super Admin complete control over stock quantities, pricing, suppliers, GST, and warehouse', () => {
    render(
      <AppProvider>
        <AddInventoryView onBackToInventory={vi.fn()} />
      </AppProvider>
    );

    // Stock Quantities: Opening, Current, Min (Reorder), Max Capacity
    expect(document.getElementById('inventory-opening-stock-input')).toBeInTheDocument();
    expect(document.getElementById('inventory-current-stock-input')).toBeInTheDocument();
    expect(document.getElementById('inventory-min-stock-input')).toBeInTheDocument();
    expect(document.getElementById('inventory-max-stock-input')).toBeInTheDocument();

    // Pricing: Purchase, Selling, MRP, Wholesale
    expect(document.getElementById('inventory-purchase-price-input')).toBeInTheDocument();
    expect(document.getElementById('inventory-selling-price-input')).toBeInTheDocument();
    expect(document.getElementById('inventory-mrp-input')).toBeInTheDocument();
    expect(document.getElementById('inventory-wholesale-price-input')).toBeInTheDocument();

    // Suppliers & Warehouse Facility / Location
    expect(document.getElementById('inventory-supplier-select')).toBeInTheDocument();
    expect(document.getElementById('inventory-warehouse-select')).toBeInTheDocument();
    expect(document.getElementById('inventory-location-input')).toBeInTheDocument();

    // Inventory Ledger / History Initial Note
    expect(document.getElementById('inventory-initial-note-input')).toBeInTheDocument();
    expect(screen.getByText(/initial_stock_record/i)).toBeInTheDocument();
  });

  it('enforces Super Admin access restriction for non-super-admin roles', () => {
    // Set non-super admin role with both prefixes
    localStorageMock.setItem('abc_stationery_v1_admin_role', 'inventory_staff');
    localStorageMock.setItem('abc_paper_store_v2_admin_role', 'inventory_staff');
    const staffUser = JSON.stringify({
      id: 'staff-2',
      name: 'Sunil Verma',
      role: 'inventory_staff',
      mobile: '9876543211',
      assignedWarehouse: 'Main Warehouse',
      activeStatus: true,
    });
    localStorageMock.setItem('abc_stationery_v1_current_admin_user', staffUser);
    localStorageMock.setItem('abc_paper_store_v2_current_admin_user', staffUser);

    render(
      <AppProvider>
        <AddInventoryView onBackToInventory={vi.fn()} />
      </AppProvider>
    );

    expect(screen.getByText(/super admin authorization required/i)).toBeInTheDocument();
    expect(screen.getByText(/restricted inventory management/i)).toBeInTheDocument();
    expect(screen.getByText(/switch to super admin/i)).toBeInTheDocument();
  });
});
