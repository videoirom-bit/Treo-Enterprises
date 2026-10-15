import { Product, Order } from '../types';

/**
 * Escapes a single cell value for standard RFC 4180 CSV format.
 */
export function escapeCSVField(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Converts a list of Orders into a well-formatted CSV string.
 */
export function generateOrdersCSV(orders: Order[]): string {
  const headers = [
    'Order Number',
    'Invoice Number',
    'Order Date',
    'Customer Name',
    'Customer Mobile',
    'Customer Email',
    'Customer City',
    'Items Count',
    'Subtotal (INR)',
    'Total Tax (INR)',
    'Discount (INR)',
    'Grand Total (INR)',
    'Payment Method',
    'Payment Status',
    'Order Status',
    'Order Type',
  ];

  const rows = orders.map((o) => {
    const custName = o.customer?.name || o.customerName || 'Customer';
    const custMobile = o.customer?.mobile || o.customerMobile || '';
    const custEmail = o.customer?.email || o.customerEmail || '';
    const custCity = o.customer?.city || o.customerCity || '';

    const row = [
      o.orderNumber,
      o.invoiceNumber,
      o.orderDate || '',
      custName,
      custMobile,
      custEmail,
      custCity,
      (o.items || []).length,
      o.subtotal || 0,
      o.totalTax || 0,
      o.totalDiscount || 0,
      o.grandTotal || 0,
      o.paymentMethod || 'Cash',
      o.paymentStatus || 'Pending',
      o.orderStatus || 'Pending',
      o.orderType || 'Home Delivery',
    ];
    return row.map(escapeCSVField).join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Converts a list of Products into a well-formatted CSV string.
 */
export function generateProductsCSV(products: Product[]): string {
  const headers = [
    'SKU',
    'Product Name',
    'Category',
    'Brand',
    'Barcode',
    'HSN Code',
    'Unit',
    'Cost Price (INR)',
    'Selling Price (INR)',
    'MRP (INR)',
    'Discount (%)',
    'GST Rate (%)',
    'Opening Stock',
    'Current Stock',
    'Minimum Stock',
    'Stock Status',
    'Supplier',
    'Description',
  ];

  const rows = products.map((prod) => {
    let stockStatus = 'In Stock';
    if (prod.currentStock <= 0) {
      stockStatus = 'Out of Stock';
    } else if (prod.currentStock <= prod.minimumStock) {
      stockStatus = 'Low Stock';
    }

    const row = [
      prod.sku,
      prod.name,
      prod.category,
      prod.brand,
      prod.barcode,
      prod.hsnCode,
      prod.unit,
      prod.purchasePrice ?? prod.costPrice ?? 0,
      prod.sellingPrice,
      prod.mrp,
      prod.discountPercentage || 0,
      prod.gstRate,
      prod.openingStock,
      prod.currentStock,
      prod.minimumStock,
      stockStatus,
      prod.supplierName || 'N/A',
      prod.description || '',
    ];

    return row.map(escapeCSVField).join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Triggers a browser download of CSV content with UTF-8 BOM for spreadsheet compatibility.
 */
export function downloadCSVFile(csvContent: string, fileName: string): void {
  // UTF-8 BOM ensures Excel and Sheets open special characters/INR correctly
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
