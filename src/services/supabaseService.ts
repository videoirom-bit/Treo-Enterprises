import { supabase } from './supabaseClient';
import {
  Product,
  Order,
  CustomerUser,
  Supplier,
  Expense,
  DailySalesRecord,
  ShopSettings,
  StaffUser,
  InventoryTransaction,
  AuditLogEntry,
  OrderStatusHistoryEntry,
  PaymentRecord,
  CartItem,
  OrderItem,
  CategoryItem,
} from '../types';

/**
 * Normalizes Supabase errors and checks if the table does not exist yet (PGRST205 / 42P01).
 */
function isTableMissingError(error: any): boolean {
  if (!error) return false;
  return (
    error.code === 'PGRST205' ||
    error.code === '42P01' ||
    String(error.message || '').includes('schema cache') ||
    String(error.message || '').includes('relation') ||
    String(error.message || '').includes('does not exist')
  );
}

// ---------------------------------------------------------------------------
// 1. PRODUCTS CRUD
// ---------------------------------------------------------------------------
export async function fetchProductsFromSupabase(): Promise<Product[] | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (!isTableMissingError(error)) {
        console.warn('Supabase fetchProducts warning:', error.message);
      }
      return null;
    }

    if (!data || data.length === 0) return null;

    return data.map((row) => {
      const full = row.data && typeof row.data === 'object' ? row.data : {};
      return {
        ...full,
        id: row.id,
        name: row.name ?? full.name,
        sku: row.sku ?? full.sku,
        barcode: row.barcode ?? full.barcode ?? '',
        category: row.category ?? full.category ?? 'Other',
        subCategory: row.sub_category ?? full.subCategory,
        brand: row.brand ?? full.brand ?? '',
        unit: row.unit ?? full.unit ?? 'Piece',
        productType: row.product_type ?? full.productType ?? 'Standard Product',
        taxType: row.tax_type ?? full.taxType ?? 'Inclusive',
        purchasePrice: Number(row.purchase_price ?? full.purchasePrice ?? 0),
        costPrice: Number(row.cost_price ?? full.costPrice ?? row.purchase_price ?? 0),
        sellingPrice: Number(row.selling_price ?? full.sellingPrice ?? 0),
        mrp: Number(row.mrp ?? full.mrp ?? 0),
        wholesalePrice: row.wholesale_price ? Number(row.wholesale_price) : full.wholesalePrice,
        discountPercentage: Number(row.discount_percentage ?? full.discountPercentage ?? 0),
        gstRate: Number(row.gst_rate ?? full.gstRate ?? 12),
        hsnCode: row.hsn_code ?? full.hsnCode ?? '',
        openingStock: Number(row.opening_stock ?? full.openingStock ?? 0),
        currentStock: Number(row.current_stock ?? full.currentStock ?? 0),
        minimumStock: Number(row.minimum_stock ?? full.minimumStock ?? 10),
        warehouse: row.warehouse ?? full.warehouse,
        supplierName: row.supplier_name ?? full.supplierName,
        status: row.status ?? full.status ?? 'Active',
        description: row.description ?? full.description ?? '',
        imageUrl: row.image_url ?? full.imageUrl ?? '',
        isFeatured: row.is_featured ?? full.isFeatured ?? false,
        isBestSeller: row.is_best_seller ?? full.isBestSeller ?? false,
        isTodayOffer: row.is_today_offer ?? full.isTodayOffer ?? false,
        createdAt: row.created_at ?? full.createdAt ?? new Date().toISOString(),
      } as Product;
    });
  } catch (err) {
    console.warn('Error connecting to Supabase for products:', err);
    return null;
  }
}

export async function upsertProductToSupabase(product: Product): Promise<boolean> {
  try {
    const payload = {
      id: product.id,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode || null,
      category: product.category,
      sub_category: product.subCategory || null,
      brand: product.brand,
      unit: product.unit || 'Piece',
      product_type: product.productType || 'Standard Product',
      tax_type: product.taxType || 'Inclusive',
      purchase_price: product.purchasePrice,
      cost_price: product.costPrice ?? product.purchasePrice,
      selling_price: product.sellingPrice,
      mrp: product.mrp,
      wholesale_price: product.wholesalePrice || null,
      discount_percentage: product.discountPercentage || 0,
      gst_rate: product.gstRate,
      hsn_code: product.hsnCode,
      opening_stock: product.openingStock || 0,
      current_stock: product.currentStock,
      minimum_stock: product.minimumStock,
      warehouse: product.warehouse || null,
      supplier_name: product.supplierName || null,
      status: product.status || 'Active',
      description: product.description || '',
      image_url: product.imageUrl || '',
      is_featured: product.isFeatured || false,
      is_best_seller: product.isBestSeller || false,
      is_today_offer: product.isTodayOffer || false,
      data: product,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('products').upsert(payload, { onConflict: 'id' });
    if (error) {
      if (!isTableMissingError(error)) {
        console.warn('Failed to upsert product to Supabase:', error.message);
      }
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Upsert product error:', err);
    return false;
  }
}

export async function deleteProductFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error && !isTableMissingError(error)) {
      console.warn('Failed to delete product from Supabase:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// 2. ORDERS CRUD
// ---------------------------------------------------------------------------
export async function fetchOrdersFromSupabase(): Promise<Order[] | null> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('order_date', { ascending: false });

    if (error) {
      if (!isTableMissingError(error)) {
        console.warn('Supabase fetchOrders warning:', error.message);
      }
      return null;
    }

    if (!data || data.length === 0) return null;

    return data.map((row) => {
      const full = row.data && typeof row.data === 'object' ? row.data : {};
      return {
        ...full,
        id: row.id,
        orderNumber: row.order_number ?? full.orderNumber,
        invoiceNumber: row.invoice_number ?? full.invoiceNumber,
        orderDate: row.order_date ?? full.orderDate,
        expectedDeliveryDate: row.expected_delivery_date ?? full.expectedDeliveryDate,
        customer: full.customer || {
          name: row.customer_name ?? '',
          mobile: row.customer_mobile ?? '',
          email: row.customer_email ?? '',
          billingAddress: row.customer_address ?? '',
          shippingAddress: row.customer_address ?? '',
          city: row.customer_city ?? '',
          state: row.customer_state ?? '',
          pincode: row.customer_pincode ?? '',
          gstin: row.customer_gstin,
          companyName: row.customer_company,
        },
        orderType: row.order_type ?? full.orderType ?? 'Home Delivery',
        items: row.items ?? full.items ?? [],
        subtotal: Number(row.subtotal ?? full.subtotal ?? 0),
        totalDiscount: Number(row.total_discount ?? full.totalDiscount ?? 0),
        taxableAmount: Number(row.taxable_amount ?? full.taxableAmount ?? 0),
        isInterState: row.is_inter_state ?? full.isInterState ?? false,
        cgst: Number(row.cgst ?? full.cgst ?? 0),
        sgst: Number(row.sgst ?? full.sgst ?? 0),
        igst: Number(row.igst ?? full.igst ?? 0),
        totalTax: Number(row.total_tax ?? full.totalTax ?? 0),
        deliveryCharge: Number(row.delivery_charge ?? full.deliveryCharge ?? 0),
        roundOff: Number(row.round_off ?? full.roundOff ?? 0),
        grandTotal: Number(row.grand_total ?? full.grandTotal ?? 0),
        amountInWords: row.amount_in_words ?? full.amountInWords ?? '',
        paymentMethod: row.payment_method ?? full.paymentMethod ?? 'UPI',
        paymentStatus: row.payment_status ?? full.paymentStatus ?? 'Paid',
        paidAmount: Number(row.paid_amount ?? full.paidAmount ?? 0),
        pendingAmount: Number(row.pending_amount ?? full.pendingAmount ?? 0),
        orderStatus: row.order_status ?? full.orderStatus ?? 'Order Placed',
        trackingTimeline: row.tracking_timeline ?? full.trackingTimeline ?? [],
        paymentHistory: row.payment_history ?? full.paymentHistory ?? [],
        notificationLog: row.notification_log ?? full.notificationLog ?? [],
        assignedDeliveryPerson: row.assigned_delivery_person ?? full.assignedDeliveryPerson,
      } as Order;
    });
  } catch (err) {
    console.warn('Error connecting to Supabase for orders:', err);
    return null;
  }
}

export async function upsertOrderToSupabase(order: Order): Promise<boolean> {
  try {
    const payload = {
      id: order.id,
      order_number: order.orderNumber,
      invoice_number: order.invoiceNumber,
      order_date: order.orderDate,
      expected_delivery_date: order.expectedDeliveryDate || null,
      customer_name: order.customer.name,
      customer_mobile: order.customer.mobile,
      customer_email: order.customer.email || null,
      customer_city: order.customer.city || null,
      customer_state: order.customer.state || null,
      customer_pincode: order.customer.pincode || null,
      customer_address: order.customer.billingAddress || null,
      customer_gstin: order.customer.gstin || null,
      customer_company: order.customer.companyName || null,
      order_type: order.orderType,
      items: order.items,
      subtotal: order.subtotal,
      total_discount: order.totalDiscount || 0,
      taxable_amount: order.taxableAmount,
      is_inter_state: order.isInterState || false,
      cgst: order.cgst || 0,
      sgst: order.sgst || 0,
      igst: order.igst || 0,
      total_tax: order.totalTax || 0,
      delivery_charge: order.deliveryCharge || 0,
      round_off: order.roundOff || 0,
      grand_total: order.grandTotal,
      amount_in_words: order.amountInWords || '',
      payment_method: order.paymentMethod,
      payment_status: order.paymentStatus,
      paid_amount: order.paidAmount || 0,
      pending_amount: order.pendingAmount || 0,
      order_status: order.orderStatus,
      assigned_delivery_person: order.assignedDeliveryPerson || null,
      tracking_timeline: order.trackingTimeline || [],
      payment_history: order.paymentHistory || [],
      notification_log: order.notificationLog || [],
      notes: order.notes || null,
      data: order,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('orders').upsert(payload, { onConflict: 'id' });
    if (error) {
      if (!isTableMissingError(error)) {
        console.warn('Failed to upsert order to Supabase:', error.message);
      }
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Upsert order error:', err);
    return false;
  }
}

export async function deleteOrderFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error && !isTableMissingError(error)) {
      console.warn('Failed to delete order from Supabase:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// 3. CUSTOMERS CRUD
// ---------------------------------------------------------------------------
export async function fetchCustomersFromSupabase(): Promise<CustomerUser[] | null> {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) return null;

    return data.map((row) => {
      const full = row.data && typeof row.data === 'object' ? row.data : {};
      return {
        ...full,
        id: row.id,
        name: row.name ?? full.name,
        mobile: row.mobile ?? full.mobile,
        email: row.email ?? full.email ?? '',
        whatsapp: row.whatsapp ?? full.whatsapp,
        address: row.address ?? full.address ?? '',
        city: row.city ?? full.city ?? 'Raipur',
        state: row.state ?? full.state ?? 'Chhattisgarh',
        pincode: row.pincode ?? full.pincode ?? '492001',
        gstin: row.gstin ?? full.gstin,
        companyName: row.company_name ?? full.companyName,
        totalPurchases: Number(row.total_purchases ?? full.totalPurchases ?? 0),
        ordersCount: Number(row.orders_count ?? full.ordersCount ?? 0),
        outstandingAmount: Number(row.outstanding_amount ?? full.outstandingAmount ?? 0),
        lastPurchaseDate: row.last_purchase_date ?? full.lastPurchaseDate,
        createdAt: row.created_at ?? full.createdAt ?? new Date().toISOString(),
      } as CustomerUser;
    });
  } catch {
    return null;
  }
}

export async function upsertCustomerToSupabase(cust: CustomerUser): Promise<boolean> {
  try {
    const payload = {
      id: cust.id,
      name: cust.name,
      mobile: cust.mobile,
      email: cust.email || null,
      whatsapp: cust.whatsapp || null,
      address: cust.address || null,
      city: cust.city || 'Raipur',
      state: cust.state || 'Chhattisgarh',
      pincode: cust.pincode || '492001',
      gstin: cust.gstin || null,
      company_name: cust.companyName || null,
      total_purchases: cust.totalPurchases || 0,
      orders_count: cust.ordersCount || 0,
      outstanding_amount: cust.outstandingAmount || 0,
      last_purchase_date: cust.lastPurchaseDate || null,
      data: cust,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('customers').upsert(payload, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteCustomerFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// 4. SUPPLIERS CRUD
// ---------------------------------------------------------------------------
export async function fetchSuppliersFromSupabase(): Promise<Supplier[] | null> {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) return null;

    return data.map((row) => {
      const full = row.data && typeof row.data === 'object' ? row.data : {};
      const productsSuppliedStr = row.products_supplied ?? full.productsSupplied ?? '';
      const categoriesSupplied =
        full.categoriesSupplied ||
        (productsSuppliedStr ? productsSuppliedStr.split(',').map((c: string) => c.trim()) : ['Stationery']);
      const balance = Number(row.outstanding_amount ?? full.outstandingBalance ?? full.outstandingAmount ?? 0);

      return {
        ...full,
        id: row.id,
        name: row.name ?? full.name,
        contactPerson: row.contact_person ?? full.contactPerson ?? '',
        phone: row.phone ?? full.phone ?? '',
        whatsapp: row.whatsapp ?? full.whatsapp,
        email: row.email ?? full.email,
        address: row.address ?? full.address ?? '',
        city: full.city || (row.address ? row.address.split(',').pop()?.trim() : 'Raipur'),
        state: full.state || 'Chhattisgarh',
        gstin: row.gstin ?? full.gstin,
        productsSupplied: productsSuppliedStr,
        categoriesSupplied,
        outstandingAmount: balance,
        outstandingBalance: balance,
        createdAt: row.created_at ?? full.createdAt ?? new Date().toISOString(),
      } as Supplier;
    });
  } catch {
    return null;
  }
}

export async function upsertSupplierToSupabase(sup: Supplier): Promise<boolean> {
  try {
    const payload = {
      id: sup.id,
      name: sup.name,
      contact_person: sup.contactPerson || null,
      phone: sup.phone,
      whatsapp: sup.whatsapp || null,
      email: sup.email || null,
      address: sup.address || null,
      gstin: sup.gstin || null,
      products_supplied: sup.productsSupplied || null,
      outstanding_amount: sup.outstandingAmount || 0,
      data: sup,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('suppliers').upsert(payload, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteSupplierFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// 5. EXPENSES CRUD
// ---------------------------------------------------------------------------
export async function fetchExpensesFromSupabase(): Promise<Expense[] | null> {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });

    if (error || !data || data.length === 0) return null;

    return data.map((row) => {
      const full = row.data && typeof row.data === 'object' ? row.data : {};
      return {
        ...full,
        id: row.id,
        date: row.date ?? full.date,
        category: row.category ?? full.category,
        description: row.description ?? full.description ?? '',
        amount: Number(row.amount ?? full.amount ?? 0),
        paymentMethod: row.payment_method ?? full.paymentMethod ?? 'Cash',
        notes: row.notes ?? full.notes,
      } as Expense;
    });
  } catch {
    return null;
  }
}

export async function upsertExpenseToSupabase(exp: Expense): Promise<boolean> {
  try {
    const payload = {
      id: exp.id,
      date: exp.date,
      category: exp.category,
      description: exp.description || null,
      amount: exp.amount,
      payment_method: exp.paymentMethod,
      notes: exp.notes || null,
      data: exp,
    };
    const { error } = await supabase.from('expenses').upsert(payload, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteExpenseFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// 6. DAILY SALES RECORDS CRUD
// ---------------------------------------------------------------------------
export async function fetchDailyRecordsFromSupabase(): Promise<DailySalesRecord[] | null> {
  try {
    const { data, error } = await supabase
      .from('daily_sales_records')
      .select('*')
      .order('date', { ascending: false });

    if (error || !data || data.length === 0) return null;

    return data.map((row) => {
      const full = row.data && typeof row.data === 'object' ? row.data : {};
      return {
        ...full,
        id: row.id,
        date: row.date ?? full.date,
        salesTarget: Number(row.sales_target ?? full.salesTarget ?? 0),
        actualSales: Number(row.actual_sales ?? full.actualSales ?? 0),
        cashCollected: Number(row.cash_collected ?? full.cashCollected ?? 0),
        upiCollected: Number(row.upi_collected ?? full.upiCollected ?? 0),
        cardSales: Number(row.card_sales ?? full.cardSales ?? 0),
        otherSales: Number(row.other_sales ?? full.otherSales ?? 0),
        creditSales: Number(row.credit_sales ?? full.creditSales ?? 0),
        expenses: Number(row.expenses ?? full.expenses ?? 0),
        netAmount: Number(row.net_amount ?? full.netAmount ?? 0),
        invoicesCount: Number(row.invoices_count ?? full.invoicesCount ?? 0),
        totalDiscounts: Number(row.total_discounts ?? full.totalDiscounts ?? 0),
        totalGst: Number(row.total_gst ?? full.totalGst ?? 0),
        refunds: Number(row.refunds ?? full.refunds ?? 0),
        netSales: Number(row.net_sales ?? full.netSales ?? (Number(row.actual_sales ?? full.actualSales ?? 0) - Number(row.expenses ?? full.expenses ?? 0))),
        notes: row.notes ?? full.notes,
      } as DailySalesRecord;
    });
  } catch {
    return null;
  }
}

export async function upsertDailyRecordToSupabase(rec: DailySalesRecord): Promise<boolean> {
  try {
    const payload = {
      id: rec.id,
      date: rec.date,
      sales_target: rec.salesTarget,
      actual_sales: rec.actualSales,
      cash_collected: rec.cashCollected,
      upi_collected: rec.upiCollected,
      card_sales: rec.cardSales || 0,
      other_sales: rec.otherSales || 0,
      credit_sales: rec.creditSales,
      expenses: rec.expenses,
      net_amount: rec.netAmount,
      invoices_count: rec.invoicesCount,
      total_discounts: rec.totalDiscounts || 0,
      total_gst: rec.totalGst || 0,
      refunds: rec.refunds || 0,
      net_sales: rec.netSales ?? (rec.actualSales - rec.expenses),
      notes: rec.notes || null,
      data: rec,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('daily_sales_records').upsert(payload, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteDailyRecordFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('daily_sales_records').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// 7. SHOP SETTINGS
// ---------------------------------------------------------------------------
export async function fetchShopSettingsFromSupabase(): Promise<ShopSettings | null> {
  try {
    const { data, error } = await supabase
      .from('shop_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    const full = data.data && typeof data.data === 'object' ? data.data : {};
    const bankName = data.bank_name || full.bankName || full.bankDetails?.bankName || 'HDFC Bank Ltd';
    const bankAccountNumber = data.bank_account_number || full.bankAccountNumber || full.bankDetails?.accountNumber || '50200012345678';
    const bankIfsc = data.bank_ifsc || full.bankIfsc || full.bankDetails?.ifscCode || 'HDFC0001234';
    const bankBranch = data.bank_branch || full.bankBranch || full.bankDetails?.branch || 'Main Station Road, Raipur';

    return {
      shopName: data.shop_name || full.shopName || 'ABC Paper & Stationery',
      shopLogo: data.shop_logo || full.shopLogo || '/treo-logo.svg',
      tagline: data.tagline || full.tagline || 'Order Tracking, GST Invoicing & Premium Stationery',
      ownerName: data.owner_name || full.ownerName || 'Mr. Anand Agrawal',
      shopAddress: data.shop_address || full.shopAddress || 'Shop No. 12-14, Ground Floor, Sharda Complex, Pandri Market',
      city: data.city || full.city || 'Raipur',
      state: data.state || full.state || 'Chhattisgarh',
      pinCode: data.pin_code || full.pinCode || '492004',
      phoneNumber: data.phone_number || full.phoneNumber || '+91 98271 23456',
      whatsAppNumber: data.whatsapp_number || full.whatsAppNumber || '+91 98271 23456',
      emailAddress: data.email_address || full.emailAddress || 'contact@abcpapers.com',
      gstin: data.gstin || full.gstin || '22AABCA1234F1Z9',
      panNumber: data.pan_number || full.panNumber || 'AABCA1234F',
      businessRegistrationNumber: data.business_registration_number || full.businessRegistrationNumber || 'UDYAM-CG-03-0012345',
      websiteName: data.website_name || full.websiteName || 'abcpapers.com',
      openingHours: data.opening_hours || full.openingHours || 'Mon - Sat: 9:00 AM – 9:30 PM | Sunday: 10:00 AM – 2:00 PM',
      upiId: data.upi_id || full.upiId || 'abcpaper@okhdfcbank',
      bankName,
      bankAccountNumber,
      bankIfsc,
      bankBranch,
      bankDetails: {
        bankName,
        accountNumber: bankAccountNumber,
        ifscCode: bankIfsc,
        branch: bankBranch,
      },
      invoicePrefix: data.invoice_prefix || full.invoicePrefix || 'ABC/26-27/',
      invoiceNumberStartingValue: Number(data.invoice_number_starting_value || full.invoiceNumberStartingValue || 1001),
      primaryBrandColor: data.primary_brand_color || full.primaryBrandColor || '#0f766e',
      accentColor: data.accent_color || full.accentColor || '#f59e0b',
      stateCode: data.state_code || full.stateCode || '22',
      termsAndConditions: data.terms_and_conditions || full.termsAndConditions || '1. Goods once sold will be replaced within 3 days if defective in original packaging.\n2. Warranty on electronics/calculators subject to manufacturer terms.\n3. Please quote invoice number for queries.',
    } as ShopSettings;
  } catch (err) {
    console.warn('Supabase fetchShopSettings error:', err);
    return null;
  }
}

export async function saveShopSettingsToSupabase(settings: ShopSettings): Promise<{ success: boolean; error?: string }> {
  try {
    const bankName = settings.bankName || settings.bankDetails?.bankName || 'HDFC Bank Ltd';
    const bankAccountNumber = settings.bankAccountNumber || settings.bankDetails?.accountNumber || '50200012345678';
    const bankIfsc = settings.bankIfsc || settings.bankDetails?.ifscCode || 'HDFC0001234';
    const bankBranch = settings.bankBranch || settings.bankDetails?.branch || 'Main Station Road, Raipur';

    const normalizedSettings: ShopSettings = {
      ...settings,
      bankName,
      bankAccountNumber,
      bankIfsc,
      bankBranch,
      bankDetails: {
        bankName,
        accountNumber: bankAccountNumber,
        ifscCode: bankIfsc,
        branch: bankBranch,
      },
    };

    const payload = {
      id: 'default_shop',
      shop_name: normalizedSettings.shopName,
      tagline: normalizedSettings.tagline || null,
      owner_name: normalizedSettings.ownerName || null,
      shop_address: normalizedSettings.shopAddress || null,
      city: normalizedSettings.city || 'Raipur',
      state: normalizedSettings.state || 'Chhattisgarh',
      pin_code: normalizedSettings.pinCode || '492001',
      phone_number: normalizedSettings.phoneNumber || null,
      whatsapp_number: normalizedSettings.whatsAppNumber || null,
      email_address: normalizedSettings.emailAddress || null,
      gstin: normalizedSettings.gstin || null,
      pan_number: normalizedSettings.panNumber || null,
      business_registration_number: normalizedSettings.businessRegistrationNumber || null,
      website_name: normalizedSettings.websiteName || null,
      opening_hours: normalizedSettings.openingHours || null,
      upi_id: normalizedSettings.upiId || null,
      bank_name: bankName,
      bank_account_number: bankAccountNumber,
      bank_ifsc: bankIfsc,
      bank_branch: bankBranch,
      invoice_prefix: normalizedSettings.invoicePrefix || 'ABC/26-27/',
      invoice_number_starting_value: normalizedSettings.invoiceNumberStartingValue || 1001,
      primary_brand_color: normalizedSettings.primaryBrandColor || '#0f766e',
      accent_color: normalizedSettings.accentColor || '#f59e0b',
      state_code: normalizedSettings.stateCode || '22',
      terms_and_conditions: normalizedSettings.termsAndConditions || null,
      data: normalizedSettings,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('shop_settings').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase shop_settings upsert error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.warn('Supabase saveShopSettings exception:', err);
    return { success: false, error: err?.message || 'Network error saving shop settings' };
  }
}

// ---------------------------------------------------------------------------
// 8. STAFF USERS CRUD
// ---------------------------------------------------------------------------
export async function fetchStaffUsersFromSupabase(): Promise<StaffUser[] | null> {
  try {
    const { data, error } = await supabase
      .from('staff_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) return null;

    return data.map((row) => {
      const full = row.data && typeof row.data === 'object' ? row.data : {};
      return {
        ...full,
        id: row.id,
        name: row.name ?? full.name,
        email: row.email ?? full.email,
        role: row.role ?? full.role ?? 'admin',
        phone: row.phone ?? full.phone ?? '',
        active: row.active ?? full.active ?? true,
        pin: row.pin ?? full.pin,
        password: row.password ?? full.password,
        avatar: row.avatar ?? full.avatar,
        createdAt: row.created_at ?? full.createdAt,
      } as StaffUser;
    });
  } catch {
    return null;
  }
}

export async function upsertStaffUserToSupabase(user: StaffUser): Promise<boolean> {
  try {
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || null,
      active: user.active !== false,
      pin: user.pin || null,
      password: user.password || null,
      avatar: user.avatar || null,
      data: user,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('staff_users').upsert(payload, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteStaffUserFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('staff_users').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// 9. SUPABASE AUTH INTEGRATION
// ---------------------------------------------------------------------------
export async function supabaseAuthSignIn(identifier: string, secret?: string) {
  const email = identifier.includes('@') ? identifier.trim().toLowerCase() : `${identifier.trim().replace(/[^a-zA-Z0-9]/g, '')}@treoenterprises.com`;
  const password = secret || 'AbcAdmin2026!';

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function supabaseAuthSignUp(email: string, password: string, metadata?: Record<string, any>) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: metadata,
      },
    });
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function supabaseAuthSignOut() {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('Supabase signout warning:', err);
  }
}

export async function supabaseAuthResetPassword(email: string) {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: window.location.origin,
    });
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function supabaseAuthUpdatePassword(newPassword: string) {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function supabaseAuthUpdateEmail(newEmail: string) {
  try {
    const { data, error } = await supabase.auth.updateUser({
      email: newEmail.trim().toLowerCase(),
    });
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

// ---------------------------------------------------------------------------
// 10. ORDER ITEMS TABLE
// ---------------------------------------------------------------------------
export async function saveOrderItemsToSupabase(
  orderId: string,
  items: (OrderItem | CartItem | any)[]
): Promise<boolean> {
  try {
    if (!items || items.length === 0) return true;
    const records = items.map((rawItem, idx) => {
      const isCart = Boolean(rawItem.product);
      const prod = isCart ? rawItem.product : null;
      const productId = isCart ? prod?.id : (rawItem.productId || rawItem.id);
      const productName = isCart ? prod?.name : (rawItem.productName || rawItem.name || 'Item');
      const sku = isCart ? prod?.sku : rawItem.sku;
      const hsnCode = isCart ? prod?.hsnCode : rawItem.hsnCode;
      const quantity = rawItem.quantity || 1;
      const unit = isCart ? (prod?.unit || 'Piece') : (rawItem.unit || 'Piece');
      const price = isCart ? (prod?.sellingPrice || 0) : (rawItem.rate || rawItem.price || 0);
      const discountPercentage = isCart
        ? (prod?.discountPercentage || 0)
        : (rawItem.discountPerUnit ? (rawItem.discountPerUnit / price) * 100 : 0);
      const discountAmount = isCart
        ? ((prod?.sellingPrice || 0) * (discountPercentage / 100)) * quantity
        : ((rawItem.discountPerUnit || 0) * quantity);
      const gstRate = isCart ? (prod?.gstRate || 18) : (rawItem.gstRate ?? 18);
      const taxableAmount = isCart
        ? ((price * quantity) - discountAmount)
        : (rawItem.taxableAmount ?? (price * quantity));
      const cgstAmount = isCart ? (taxableAmount * (gstRate / 200)) : (rawItem.cgstAmount ?? 0);
      const sgstAmount = isCart ? (taxableAmount * (gstRate / 200)) : (rawItem.sgstAmount ?? 0);
      const igstAmount = isCart ? 0 : (rawItem.igstAmount ?? 0);
      const taxAmount = isCart ? (cgstAmount + sgstAmount) : (rawItem.totalGst ?? (cgstAmount + sgstAmount + igstAmount));
      const total = isCart ? (taxableAmount + taxAmount) : (rawItem.totalAmount ?? (taxableAmount + taxAmount));

      return {
        id: `${orderId}-item-${idx + 1}`,
        order_id: orderId,
        product_id: productId || null,
        product_name: productName,
        sku: sku || null,
        hsn_code: hsnCode || null,
        quantity,
        unit,
        price,
        discount_percentage: Number(discountPercentage.toFixed(2)),
        discount_amount: Number(discountAmount.toFixed(2)),
        gst_rate: gstRate,
        taxable_amount: Number(taxableAmount.toFixed(2)),
        cgst_amount: Number(cgstAmount.toFixed(2)),
        sgst_amount: Number(sgstAmount.toFixed(2)),
        igst_amount: Number(igstAmount.toFixed(2)),
        tax_amount: Number(taxAmount.toFixed(2)),
        total: Number(total.toFixed(2)),
        created_at: new Date().toISOString(),
      };
    });
    const { error } = await supabase.from('order_items').upsert(records, { onConflict: 'id' });
    if (error && !isTableMissingError(error)) {
      console.warn('Order items sync warning:', error.message);
    }
    return !error;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// 11. PAYMENTS TABLE (Business payment records)
// ---------------------------------------------------------------------------
export async function recordPaymentToSupabase(payment: {
  orderId: string;
  customerId?: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  transactionId?: string;
  notes?: string;
  createdBy?: string;
}): Promise<boolean> {
  try {
    const id = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const { error } = await supabase.from('payments').insert({
      id,
      order_id: payment.orderId,
      customer_id: payment.customerId || null,
      amount: payment.amount,
      payment_method: payment.paymentMethod,
      payment_status: payment.paymentStatus,
      transaction_id: payment.transactionId || null,
      payment_date: new Date().toISOString(),
      notes: payment.notes || null,
      created_by: payment.createdBy || null,
      created_at: new Date().toISOString(),
    });
    return !error;
  } catch {
    return false;
  }
}

export async function fetchPaymentsFromSupabase(orderId?: string): Promise<any[]> {
  try {
    let query = supabase.from('payments').select('*').order('payment_date', { ascending: false });
    if (orderId) {
      query = query.eq('order_id', orderId);
    }
    const { data, error } = await query;
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// 12. INVENTORY TRANSACTIONS (Audited stock movements)
// ---------------------------------------------------------------------------
export async function recordInventoryTransactionToSupabase(tx: {
  productId: string;
  transactionType: 'stock_in' | 'stock_out' | 'adjustment' | 'initial' | 'order_sale' | 'order_return' | 'damage';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  referenceId?: string;
  createdBy?: string;
}): Promise<boolean> {
  try {
    const id = `IT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const { error } = await supabase.from('inventory_transactions').insert({
      id,
      product_id: tx.productId,
      transaction_type: tx.transactionType,
      quantity: tx.quantity,
      previous_stock: tx.previousStock,
      new_stock: tx.newStock,
      reason: tx.reason || null,
      reference_id: tx.referenceId || null,
      created_by: tx.createdBy || null,
      created_at: new Date().toISOString(),
    });
    return !error;
  } catch {
    return false;
  }
}

export async function fetchInventoryTransactionsFromSupabase(productId?: string): Promise<InventoryTransaction[]> {
  try {
    let query = supabase.from('inventory_transactions').select('*').order('created_at', { ascending: false });
    if (productId) {
      query = query.eq('product_id', productId);
    }
    const { data, error } = await query.limit(200);
    if (error || !data) return [];
    return data.map((row) => ({
      id: row.id,
      productId: row.product_id,
      transactionType: row.transaction_type,
      quantity: row.quantity,
      previousStock: row.previous_stock,
      newStock: row.new_stock,
      reason: row.reason,
      referenceId: row.reference_id,
      createdBy: row.created_by,
      createdAt: row.created_at,
    }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// 13. ORDER STATUS HISTORY
// ---------------------------------------------------------------------------
export async function recordOrderStatusHistoryToSupabase(history: {
  orderId: string;
  status: string;
  location?: string;
  description?: string;
  updatedBy?: string;
}): Promise<boolean> {
  try {
    const id = `OSH-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const { error } = await supabase.from('order_status_history').insert({
      id,
      order_id: history.orderId,
      status: history.status,
      location: history.location || null,
      description: history.description || null,
      updated_by: history.updatedBy || null,
      timestamp: new Date().toISOString(),
    });
    return !error;
  } catch {
    return false;
  }
}

export async function fetchOrderStatusHistoryFromSupabase(orderId?: string): Promise<OrderStatusHistoryEntry[]> {
  try {
    let query = supabase.from('order_status_history').select('*').order('timestamp', { ascending: false });
    if (orderId) {
      query = query.eq('order_id', orderId);
    }
    const { data, error } = await query.limit(200);
    if (error || !data) return [];
    return data.map((row) => ({
      id: row.id,
      orderId: row.order_id,
      status: row.status,
      location: row.location || undefined,
      description: row.description || undefined,
      updatedBy: row.updated_by || undefined,
      timestamp: row.timestamp,
    }));
  } catch {
    return [];
  }
}

export async function fetchDatabaseHealthStats(): Promise<{
  latencyMs: number;
  status: 'healthy' | 'degraded' | 'offline';
  tables: Record<string, { count: number; status: string }>;
}> {
  const startTime = performance.now();
  const tables: Record<string, { count: number; status: string }> = {
    products: { count: 0, status: 'checking' },
    orders: { count: 0, status: 'checking' },
    staff_users: { count: 0, status: 'checking' },
    payments: { count: 0, status: 'checking' },
    inventory_transactions: { count: 0, status: 'checking' },
    audit_logs: { count: 0, status: 'checking' },
    expenses: { count: 0, status: 'checking' },
    categories: { count: 0, status: 'checking' },
    shop_settings: { count: 0, status: 'checking' },
  };

  try {
    const tableKeys = Object.keys(tables);
    await Promise.allSettled(
      tableKeys.map(async (table) => {
        try {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
          if (error) {
            tables[table] = { count: 0, status: error.code === '42P01' || error.code === 'PGRST205' ? 'not_created' : 'error' };
          } else {
            tables[table] = { count: count ?? 0, status: 'active' };
          }
        } catch {
          tables[table] = { count: 0, status: 'offline' };
        }
      })
    );

    const latencyMs = Math.round(performance.now() - startTime);
    const activeCount = Object.values(tables).filter((t) => t.status === 'active').length;
    const status = activeCount >= 4 ? 'healthy' : activeCount > 0 ? 'degraded' : 'offline';

    return { latencyMs, status, tables };
  } catch {
    return {
      latencyMs: Math.round(performance.now() - startTime),
      status: 'offline',
      tables,
    };
  }
}

// ---------------------------------------------------------------------------
// 14. AUDIT LOGS
// ---------------------------------------------------------------------------
export async function recordAuditLogToSupabase(log: {
  action: string;
  entity: string;
  entityId?: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  details?: Record<string, any>;
}): Promise<boolean> {
  try {
    const { error } = await supabase.from('audit_logs').insert({
      action: log.action,
      entity: log.entity,
      entity_id: log.entityId || null,
      user_id: log.userId || null,
      user_email: log.userEmail || null,
      user_name: log.userName || null,
      user_role: log.userRole || null,
      details: log.details || {},
      created_at: new Date().toISOString(),
    });
    return !error;
  } catch {
    return false;
  }
}

export async function fetchAuditLogsFromSupabase(limit = 100): Promise<AuditLogEntry[]> {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data.map((row) => ({
      id: row.id,
      userId: row.user_id,
      userEmail: row.user_email,
      userName: row.user_name,
      userRole: row.user_role,
      action: row.action,
      entity: row.entity,
      entityId: row.entity_id,
      details: row.details,
      createdAt: row.created_at,
    }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// 12. CATEGORIES CRUD
// ---------------------------------------------------------------------------
export async function fetchCategoriesFromSupabase(): Promise<CategoryItem[] | null> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      if (!isTableMissingError(error)) {
        console.warn('Supabase fetchCategories warning:', error.message);
      }
      return null;
    }

    if (!data || data.length === 0) return null;

    return data.map((row) => {
      const full = row.data && typeof row.data === 'object' ? row.data : {};
      return {
        ...full,
        id: row.id,
        name: row.name ?? full.name,
        slug: row.slug ?? full.slug ?? (row.name || '').toLowerCase().replace(/\s+/g, '-'),
        description: row.description ?? full.description ?? '',
        iconName: row.icon_name ?? full.iconName ?? 'Layers',
        displayOrder: Number(row.display_order ?? full.displayOrder ?? 0),
        isActive: row.is_active ?? full.isActive ?? true,
        createdAt: row.created_at ?? full.createdAt,
        updatedAt: row.updated_at ?? full.updatedAt,
      } as CategoryItem;
    });
  } catch (err: any) {
    console.warn('fetchCategoriesFromSupabase exception:', err?.message);
    return null;
  }
}

export async function saveCategoryToSupabase(
  category: CategoryItem
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      id: category.id,
      name: category.name,
      slug: category.slug || category.name.toLowerCase().replace(/\s+/g, '-'),
      description: category.description || '',
      icon_name: category.iconName || 'Layers',
      display_order: category.displayOrder || 0,
      is_active: category.isActive !== false,
      data: category,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('categories')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to save category' };
  }
}

export async function deleteCategoryFromSupabase(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete category' };
  }
}

export async function seedCategoriesToSupabase(
  categoriesList: CategoryItem[]
): Promise<{ success: boolean; error?: string; count?: number }> {
  try {
    const payloads = categoriesList.map((cat, idx) => ({
      id: cat.id || `cat-${cat.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      name: cat.name,
      slug: cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      description: cat.description || '',
      icon_name: cat.iconName || 'Layers',
      display_order: cat.displayOrder ?? idx + 1,
      is_active: cat.isActive !== false,
      data: cat,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('categories')
      .upsert(payloads, { onConflict: 'id' });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, count: payloads.length };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to seed categories' };
  }
}


