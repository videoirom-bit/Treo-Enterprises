import { PaymentRecord, InventoryTransaction, OrderStatusHistoryEntry, AuditLogEntry } from '../types';

export const samplePayments: PaymentRecord[] = [
  {
    id: 'PAY-2026-0891',
    orderId: 'ord-2026-001',
    customerId: 'cust-1',
    amount: 1450,
    paymentMethod: 'UPI',
    paymentStatus: 'Completed',
    transactionId: 'UPI-HDFC-9982736152',
    paymentDate: '2026-09-12T14:32:00.000Z',
    notes: 'Paid via Google Pay QR code at store counter',
    createdBy: 'Sunita Patel (Billing)',
    createdAt: '2026-09-12T14:32:00.000Z',
  },
  {
    id: 'PAY-2026-0890',
    orderId: 'ord-2026-002',
    customerId: 'cust-2',
    amount: 4200,
    paymentMethod: 'Bank Transfer (NEFT)',
    paymentStatus: 'Completed',
    transactionId: 'NEFT-SBIN00482910',
    paymentDate: '2026-09-11T11:15:00.000Z',
    notes: 'Direct institutional transfer from St. Xavier School',
    createdBy: 'Pooja Verma (Accounts)',
    createdAt: '2026-09-11T11:15:00.000Z',
  },
  {
    id: 'PAY-2026-0889',
    orderId: 'ord-2026-003',
    customerId: 'cust-3',
    amount: 850,
    paymentMethod: 'Cash',
    paymentStatus: 'Completed',
    transactionId: 'CASH-REC-10492',
    paymentDate: '2026-09-10T16:45:00.000Z',
    notes: 'Cash collected by counter staff with GST receipt',
    createdBy: 'Sunita Patel (Billing)',
    createdAt: '2026-09-10T16:45:00.000Z',
  },
  {
    id: 'PAY-2026-0888',
    orderId: 'ord-2026-004',
    customerId: 'cust-4',
    amount: 3200,
    paymentMethod: 'Credit Card',
    paymentStatus: 'Completed',
    transactionId: 'POS-HDFC-492019',
    paymentDate: '2026-09-09T18:20:00.000Z',
    notes: 'Swipe on Pine Labs POS machine (Visa Credit)',
    createdBy: 'Amit Sharma (Manager)',
    createdAt: '2026-09-09T18:20:00.000Z',
  },
  {
    id: 'PAY-2026-0887',
    orderId: 'ord-2026-005',
    customerId: 'cust-5',
    amount: 1890,
    paymentMethod: 'UPI',
    paymentStatus: 'Pending',
    transactionId: 'UPI-REQ-887261',
    paymentDate: '2026-09-08T10:05:00.000Z',
    notes: 'Online dynamic QR payment link sent via WhatsApp',
    createdBy: 'System (Online Checkout)',
    createdAt: '2026-09-08T10:05:00.000Z',
  },
  {
    id: 'PAY-2026-0886',
    orderId: 'ord-2026-006',
    customerId: 'cust-6',
    amount: 640,
    paymentMethod: 'Cash',
    paymentStatus: 'Completed',
    transactionId: 'CASH-REC-10488',
    paymentDate: '2026-09-07T12:10:00.000Z',
    notes: 'Counter sale - register cash drawer verified',
    createdBy: 'Sunita Patel (Billing)',
    createdAt: '2026-09-07T12:10:00.000Z',
  },
];

export const sampleInventoryTransactions: InventoryTransaction[] = [
  {
    id: 'IT-1092',
    productId: 'prod-paper-1',
    transactionType: 'stock_in',
    quantity: 50,
    previousStock: 35,
    newStock: 85,
    reason: 'Received shipment from JK Paper Mill distributor invoice #JK-8829',
    referenceId: 'PO-2026-041',
    createdBy: 'Vikash Dewangan (Inventory)',
    createdAt: '2026-09-12T09:30:00.000Z',
  },
  {
    id: 'IT-1091',
    productId: 'prod-pen-1',
    transactionType: 'order_sale',
    quantity: -12,
    previousStock: 60,
    newStock: 48,
    reason: 'Dispatched for customer order #ord-2026-001',
    referenceId: 'ord-2026-001',
    createdBy: 'System Dispatch',
    createdAt: '2026-09-12T14:40:00.000Z',
  },
  {
    id: 'IT-1090',
    productId: 'prod-calc-1',
    transactionType: 'adjustment',
    quantity: -1,
    previousStock: 15,
    newStock: 14,
    reason: 'Damaged packaging during shelf stocking (written off)',
    referenceId: 'AUDIT-ADJ-009',
    createdBy: 'Ramesh Sharma (Owner)',
    createdAt: '2026-09-10T17:15:00.000Z',
  },
  {
    id: 'IT-1089',
    productId: 'prod-notebook-1',
    transactionType: 'stock_in',
    quantity: 100,
    previousStock: 42,
    newStock: 142,
    reason: 'Bulk stock arrival from Classmate ITC Wholesale',
    referenceId: 'PO-2026-039',
    createdBy: 'Vikash Dewangan (Inventory)',
    createdAt: '2026-09-08T11:00:00.000Z',
  },
  {
    id: 'IT-1088',
    productId: 'prod-art-1',
    transactionType: 'order_sale',
    quantity: -4,
    previousStock: 28,
    newStock: 24,
    reason: 'Sold to St. Xavier Art Department',
    referenceId: 'ord-2026-002',
    createdBy: 'Amit Sharma (Manager)',
    createdAt: '2026-09-07T15:20:00.000Z',
  },
];

export const sampleOrderStatusHistories: OrderStatusHistoryEntry[] = [
  {
    id: 'OSH-9901',
    orderId: 'ord-2026-001',
    status: 'Delivered',
    location: 'Pandri Market, Raipur',
    description: 'Package delivered and OTP signed by Rahul Verma',
    updatedBy: 'Ramesh Sharma (Owner)',
    timestamp: '2026-09-12T16:00:00.000Z',
  },
  {
    id: 'OSH-9900',
    orderId: 'ord-2026-001',
    status: 'Out for Delivery',
    location: 'Central Dispatch Van #3',
    description: 'Assigned to delivery agent Manoj Kumar',
    updatedBy: 'Amit Sharma (Manager)',
    timestamp: '2026-09-12T13:45:00.000Z',
  },
  {
    id: 'OSH-9899',
    orderId: 'ord-2026-001',
    status: 'Packed',
    location: 'Warehouse Bay 2',
    description: 'Bubble wrapped with tax invoice enclosed',
    updatedBy: 'Vikash Dewangan (Inventory)',
    timestamp: '2026-09-12T11:30:00.000Z',
  },
  {
    id: 'OSH-9898',
    orderId: 'ord-2026-001',
    status: 'Confirmed',
    location: 'Store Order Desk',
    description: 'Order verified and payment confirmed via UPI',
    updatedBy: 'Sunita Patel (Billing)',
    timestamp: '2026-09-12T09:10:00.000Z',
  },
];

export const sampleAuditLogs: AuditLogEntry[] = [
  {
    id: 'AUD-501',
    userId: 'staff-1',
    userEmail: 'admin@abcstationery.com',
    userName: 'Ramesh Sharma',
    userRole: 'super_admin',
    action: 'SUPER_ADMIN_LOGIN',
    entity: 'auth',
    entityId: 'staff-1',
    details: {
      authMethod: 'supabase_auth',
      ip: '103.212.144.18',
      sessionScope: 'full_system_access',
    },
    createdAt: '2026-09-13T07:15:00.000Z',
  },
  {
    id: 'AUD-500',
    userId: 'staff-1',
    userEmail: 'admin@abcstationery.com',
    userName: 'Ramesh Sharma',
    userRole: 'super_admin',
    action: 'ROLE_CHANGE',
    entity: 'staff_users',
    entityId: 'staff-2',
    details: {
      targetUser: 'Amit Sharma (manager@abcstationery.com)',
      previousRole: 'sales_staff',
      newRole: 'admin',
      reason: 'Promoted to Store Manager with inventory editing privileges',
    },
    createdAt: '2026-09-12T18:40:00.000Z',
  },
  {
    id: 'AUD-499',
    userId: 'staff-1',
    userEmail: 'admin@abcstationery.com',
    userName: 'Ramesh Sharma',
    userRole: 'super_admin',
    action: 'SHOP_SETTINGS_UPDATED',
    entity: 'shop_settings',
    entityId: 'default_shop',
    details: {
      updatedFields: ['shopName', 'tagline', 'gstin'],
      syncedToSupabase: true,
    },
    createdAt: '2026-09-12T16:22:00.000Z',
  },
  {
    id: 'AUD-498',
    userId: 'staff-1',
    userEmail: 'admin@abcstationery.com',
    userName: 'Ramesh Sharma',
    userRole: 'super_admin',
    action: 'STOCK_ADJUSTMENT',
    entity: 'products',
    entityId: 'prod-calc-1',
    details: {
      productName: 'Casio MJ-120D Plus Desktop Calculator',
      previousStock: 15,
      newStock: 14,
      delta: -1,
      reason: 'Damaged item written off after physical audit',
    },
    createdAt: '2026-09-10T17:15:00.000Z',
  },
  {
    id: 'AUD-497',
    userId: 'staff-1',
    userEmail: 'admin@abcstationery.com',
    userName: 'Ramesh Sharma',
    userRole: 'super_admin',
    action: 'USER_ACTIVATION_CHANGE',
    entity: 'staff_users',
    entityId: 'staff-5',
    details: {
      targetUser: 'Pooja Verma',
      newStatus: 'Active',
      reason: 'Accounts onboarding confirmed',
    },
    createdAt: '2026-09-09T10:00:00.000Z',
  },
  {
    id: 'AUD-496',
    userId: 'staff-2',
    userEmail: 'manager@abcstationery.com',
    userName: 'Amit Sharma',
    userRole: 'admin',
    action: 'GST_INVOICE_GENERATED',
    entity: 'orders',
    entityId: 'ord-2026-002',
    details: {
      invoiceNumber: 'INV-2026-1002',
      taxableValue: 3559.32,
      gstAmount: 640.68,
      grandTotal: 4200,
    },
    createdAt: '2026-09-08T15:30:00.000Z',
  },
];

export const SUPABASE_RLS_SQL = `-- ==============================================================================
-- SUPABASE ROW LEVEL SECURITY (RLS) & SUPER ADMIN ACCESS CONTROL SPECIFICATION
-- Database: PostgreSQL / Supabase
-- Project: ABC Paper & Stationery (Treo Enterprises)
-- ==============================================================================

-- 1. Helper function: Get user role from JWT app_metadata or staff_users table
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role'),
    (SELECT role FROM public.staff_users WHERE email = auth.jwt() ->> 'email' LIMIT 1),
    'anonymous'
  );
$$;

-- 2. Helper function: Is current user Super Admin?
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT (public.get_current_user_role() = 'super_admin');
$$;

-- 3. Helper function: Is current user Admin or Super Admin?
CREATE OR REPLACE FUNCTION public.is_admin_or_super()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT (public.get_current_user_role() IN ('super_admin', 'admin'));
$$;

-- ==============================================================================
-- ENABLE RLS ON ALL TABLES
-- ==============================================================================
ALTER TABLE IF EXISTS public.staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.shop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categories ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- TABLE: staff_users POLICIES
-- Super Admin: Full Control (Select, Insert, Update, Delete)
-- Admin / Staff: Read own record only
-- ==============================================================================
DROP POLICY IF EXISTS "Super Admin full access to staff_users" ON public.staff_users;
CREATE POLICY "Super Admin full access to staff_users"
  ON public.staff_users
  FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Users can read own staff profile" ON public.staff_users;
CREATE POLICY "Users can read own staff profile"
  ON public.staff_users
  FOR SELECT
  TO authenticated
  USING (email = auth.jwt() ->> 'email' OR public.is_admin_or_super());

-- ==============================================================================
-- TABLE: audit_logs POLICIES (Immutable Ledger)
-- Super Admin: Read all logs
-- All Roles: Insert logs only
-- Delete/Update: Strictly blocked for everyone to preserve audit integrity
-- ==============================================================================
DROP POLICY IF EXISTS "Super Admin can view audit logs" ON public.audit_logs;
CREATE POLICY "Super Admin can view audit logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "System & Users can append audit logs" ON public.audit_logs;
CREATE POLICY "System & Users can append audit logs"
  ON public.audit_logs
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- ==============================================================================
-- TABLE: payments POLICIES
-- Super Admin: Full Control
-- Admin: Select & Insert
-- Staff: Select only
-- ==============================================================================
DROP POLICY IF EXISTS "Super Admin full access to payments" ON public.payments;
CREATE POLICY "Super Admin full access to payments"
  ON public.payments
  FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Admin and billing staff can insert payments" ON public.payments;
CREATE POLICY "Admin and billing staff can insert payments"
  ON public.payments
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_super() OR public.get_current_user_role() IN ('sales_staff', 'accountant'));

DROP POLICY IF EXISTS "Staff can view payments" ON public.payments;
CREATE POLICY "Staff can view payments"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (public.get_current_user_role() IN ('super_admin', 'admin', 'sales_staff', 'accountant'));

-- ==============================================================================
-- TABLE: inventory_transactions POLICIES
-- Super Admin: Full Control
-- Inventory Staff & Admin: Insert & Select
-- ==============================================================================
DROP POLICY IF EXISTS "Super Admin full access to inventory transactions" ON public.inventory_transactions;
CREATE POLICY "Super Admin full access to inventory transactions"
  ON public.inventory_transactions
  FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Inventory team can record stock movements" ON public.inventory_transactions;
CREATE POLICY "Inventory team can record stock movements"
  ON public.inventory_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (public.get_current_user_role() IN ('super_admin', 'admin', 'inventory_staff'));

DROP POLICY IF EXISTS "Staff can view inventory transactions" ON public.inventory_transactions;
CREATE POLICY "Staff can view inventory transactions"
  ON public.inventory_transactions
  FOR SELECT
  TO authenticated
  USING (public.get_current_user_role() IN ('super_admin', 'admin', 'inventory_staff'));

-- ==============================================================================
-- TABLE: shop_settings POLICIES
-- Super Admin: Full Control (Update Master identity, bank, GSTIN)
-- Everyone: Read public store settings
-- ==============================================================================
DROP POLICY IF EXISTS "Public can read shop settings" ON public.shop_settings;
CREATE POLICY "Public can read shop settings"
  ON public.shop_settings
  FOR SELECT
  TO public, authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "Super Admin can update shop settings" ON public.shop_settings;
CREATE POLICY "Super Admin can update shop settings"
  ON public.shop_settings
  FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());
`;
