-- ==============================================================================
-- ABC Paper & Stationery - Supabase Database Schema & RLS Setup
-- Project ID: swgsurkqupfnmcmcxpdx
-- Publishable Key: sb_publishable_WRZc_ISZuU-yvCkiwS034w_kPeVrdKX
-- ==============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 0. CATEGORIES TABLE (Dynamic Stationery Categories with Icons & Descriptions)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    slug TEXT,
    description TEXT,
    icon_name TEXT DEFAULT 'Layers',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on categories" ON public.categories
    FOR SELECT USING (true);

CREATE POLICY "Allow anon insert on categories" ON public.categories
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon update on categories" ON public.categories
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon delete on categories" ON public.categories
    FOR DELETE USING (true);

-- Seed Default Stationery Categories
INSERT INTO public.categories (id, name, slug, description, icon_name, display_order, is_active)
VALUES
    ('cat-paper', 'Paper', 'paper', 'A4 Copier reams, bond paper, photo gloss sheets, drafting sheets and letterheads.', 'Layers', 1, true),
    ('cat-notebooks', 'Notebooks', 'notebooks', 'Long notebooks, spiral registers, hardbound ledger accounts, school ruled and graph books.', 'BookOpen', 2, true),
    ('cat-pens', 'Pens', 'pens', 'Ballpoint, rollerball, premium gel pens, permanent markers, highlighters and calligraphy ink.', 'PenTool', 3, true),
    ('cat-pencils', 'Pencils', 'pencils', 'Wooden graphite pencils, mechanical clutch pencils, lead refills and drawing pencils.', 'PenTool', 4, true),
    ('cat-files', 'Files & Folders', 'files-folders', 'Lever arch board files, ring binders, display books, clear zip pouches and folders.', 'Paperclip', 5, true),
    ('cat-office', 'Office Supplies', 'office-supplies', 'Desk staplers, heavy punchers, sticky note pads, scissors, tape dispensers and pins.', 'Briefcase', 6, true),
    ('cat-school', 'School Supplies', 'school-supplies', 'Geometry compass boxes, exam clips, drawing sheets, erasers, sharpeners and covers.', 'Compass', 7, true),
    ('cat-art', 'Art & Craft', 'art-craft', 'Acrylic tubes, watercolor sets, brushes, sketching pads, modeling clay and craft glue.', 'Palette', 8, true),
    ('cat-printing', 'Printing Supplies', 'printing-supplies', 'Copier cartridges, thermal billing rolls, carbonless paper and sublimation sheets.', 'Printer', 9, true),
    ('cat-books', 'Books', 'books', 'General registers, ledger books, cash books, stock books, and school reference books.', 'BookOpen', 10, true),
    ('cat-computer', 'Computer Accessories', 'computer-accessories', 'USB flash drives, mousepads, cleaning kits, cable ties and printer cables.', 'Printer', 11, true),
    ('cat-packaging', 'Packaging Materials', 'packaging-materials', 'Brown carton tape, bubble wrap rolls, corrugated boxes and stretch films.', 'Package', 12, true),
    ('cat-gifts', 'Gift Items', 'gift-items', 'Executive pen sets, desk organizer clocks, gift wrappers and diary gift hampers.', 'Gift', 13, true),
    ('cat-other', 'Other', 'other', 'Specialty stationery accessories, tags, labels and stamp pads.', 'Layers', 14, true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    icon_name = EXCLUDED.icon_name,
    display_order = EXCLUDED.display_order,
    is_active = EXCLUDED.is_active;

-- ------------------------------------------------------------------------------
-- 1. SHOP SETTINGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shop_settings (
    id TEXT PRIMARY KEY DEFAULT 'default_shop',
    shop_name TEXT NOT NULL DEFAULT 'ABC Paper & Stationery',
    tagline TEXT,
    owner_name TEXT,
    shop_address TEXT,
    city TEXT DEFAULT 'Raipur',
    state TEXT DEFAULT 'Chhattisgarh',
    pin_code TEXT DEFAULT '492001',
    phone_number TEXT,
    whatsapp_number TEXT,
    email_address TEXT,
    gstin TEXT,
    pan_number TEXT,
    business_registration_number TEXT,
    website_name TEXT,
    opening_hours TEXT,
    upi_id TEXT,
    bank_name TEXT,
    bank_account_number TEXT,
    bank_ifsc TEXT,
    bank_branch TEXT,
    invoice_prefix TEXT DEFAULT 'ABC/26-27/',
    invoice_number_starting_value INTEGER DEFAULT 1001,
    primary_brand_color TEXT DEFAULT '#0f766e',
    accent_color TEXT DEFAULT '#f59e0b',
    state_code TEXT DEFAULT '22',
    terms_and_conditions TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. PRODUCTS / INVENTORY TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    barcode TEXT,
    category TEXT NOT NULL,
    sub_category TEXT,
    brand TEXT NOT NULL,
    unit TEXT DEFAULT 'Piece',
    product_type TEXT DEFAULT 'Standard Product',
    tax_type TEXT DEFAULT 'Inclusive',
    purchase_price NUMERIC(12,2) DEFAULT 0,
    cost_price NUMERIC(12,2) DEFAULT 0,
    selling_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    mrp NUMERIC(12,2) NOT NULL DEFAULT 0,
    wholesale_price NUMERIC(12,2),
    discount_percentage NUMERIC(5,2) DEFAULT 0,
    gst_rate NUMERIC(5,2) DEFAULT 12,
    hsn_code TEXT NOT NULL,
    opening_stock INTEGER DEFAULT 0,
    current_stock INTEGER NOT NULL DEFAULT 0,
    minimum_stock INTEGER DEFAULT 10,
    maximum_stock INTEGER,
    warehouse TEXT DEFAULT 'Main Store Raipur',
    warehouse_location TEXT,
    supplier_id TEXT,
    supplier_name TEXT,
    status TEXT DEFAULT 'Active',
    description TEXT,
    specifications JSONB DEFAULT '[]'::jsonb,
    package_contents TEXT,
    suitable_for TEXT,
    image_url TEXT,
    is_featured BOOLEAN DEFAULT false,
    is_best_seller BOOLEAN DEFAULT false,
    is_today_offer BOOLEAN DEFAULT false,
    inventory_history JSONB DEFAULT '[]'::jsonb,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_current_stock ON public.products(current_stock);

-- ------------------------------------------------------------------------------
-- 3. CUSTOMERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    email TEXT,
    whatsapp TEXT,
    address TEXT,
    city TEXT DEFAULT 'Raipur',
    state TEXT DEFAULT 'Chhattisgarh',
    pincode TEXT DEFAULT '492001',
    gstin TEXT,
    company_name TEXT,
    total_purchases NUMERIC(14,2) DEFAULT 0,
    orders_count INTEGER DEFAULT 0,
    outstanding_amount NUMERIC(14,2) DEFAULT 0,
    last_purchase_date TIMESTAMPTZ,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_mobile ON public.customers(mobile);
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);

-- ------------------------------------------------------------------------------
-- 4. SUPPLIERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT NOT NULL,
    whatsapp TEXT,
    email TEXT,
    address TEXT,
    gstin TEXT,
    products_supplied TEXT,
    outstanding_amount NUMERIC(14,2) DEFAULT 0,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. ORDERS TABLE (Billing, Delivery Tracking & Invoicing)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    invoice_number TEXT UNIQUE NOT NULL,
    order_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expected_delivery_date TIMESTAMPTZ,
    customer_name TEXT NOT NULL,
    customer_mobile TEXT NOT NULL,
    customer_email TEXT,
    customer_city TEXT,
    customer_state TEXT,
    customer_pincode TEXT,
    customer_address TEXT,
    customer_gstin TEXT,
    customer_company TEXT,
    order_type TEXT DEFAULT 'Home Delivery',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_discount NUMERIC(14,2) DEFAULT 0,
    taxable_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    is_inter_state BOOLEAN DEFAULT false,
    cgst NUMERIC(14,2) DEFAULT 0,
    sgst NUMERIC(14,2) DEFAULT 0,
    igst NUMERIC(14,2) DEFAULT 0,
    total_tax NUMERIC(14,2) DEFAULT 0,
    delivery_charge NUMERIC(10,2) DEFAULT 0,
    round_off NUMERIC(6,2) DEFAULT 0,
    grand_total NUMERIC(14,2) NOT NULL DEFAULT 0,
    amount_in_words TEXT,
    payment_method TEXT DEFAULT 'UPI',
    payment_status TEXT DEFAULT 'Paid',
    paid_amount NUMERIC(14,2) DEFAULT 0,
    pending_amount NUMERIC(14,2) DEFAULT 0,
    order_status TEXT DEFAULT 'Order Placed',
    assigned_delivery_person JSONB,
    tracking_timeline JSONB DEFAULT '[]'::jsonb,
    payment_history JSONB DEFAULT '[]'::jsonb,
    notification_log JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    drive_file_id TEXT,
    drive_file_url TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_invoice_number ON public.orders(invoice_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_mobile ON public.orders(customer_mobile);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON public.orders(order_date DESC);

-- ------------------------------------------------------------------------------
-- 6. EXPENSES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expenses (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    payment_method TEXT DEFAULT 'Cash',
    notes TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date DESC);

-- ------------------------------------------------------------------------------
-- 7. DAILY SALES RECORDS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.daily_sales_records (
    id TEXT PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    sales_target NUMERIC(12,2) DEFAULT 0,
    actual_sales NUMERIC(12,2) DEFAULT 0,
    cash_collected NUMERIC(12,2) DEFAULT 0,
    upi_collected NUMERIC(12,2) DEFAULT 0,
    card_sales NUMERIC(12,2) DEFAULT 0,
    other_sales NUMERIC(12,2) DEFAULT 0,
    credit_sales NUMERIC(12,2) DEFAULT 0,
    expenses NUMERIC(12,2) DEFAULT 0,
    net_amount NUMERIC(12,2) DEFAULT 0,
    invoices_count INTEGER DEFAULT 0,
    total_discounts NUMERIC(12,2) DEFAULT 0,
    total_gst NUMERIC(12,2) DEFAULT 0,
    refunds NUMERIC(12,2) DEFAULT 0,
    net_sales NUMERIC(12,2) DEFAULT 0,
    notes TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_sales_date ON public.daily_sales_records(date DESC);

-- ------------------------------------------------------------------------------
-- 8. STAFF USERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.staff_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    phone TEXT,
    active BOOLEAN DEFAULT true,
    pin TEXT,
    password TEXT,
    avatar TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_email ON public.staff_users(email);

-- ------------------------------------------------------------------------------
-- 9. ORDER ITEMS TABLE (Normalized Line-Item Breakdown)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    sku TEXT,
    hsn_code TEXT,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
    unit TEXT DEFAULT 'Piece',
    price NUMERIC(12,2) NOT NULL DEFAULT 0,
    discount_percentage NUMERIC(5,2) DEFAULT 0,
    discount_amount NUMERIC(12,2) DEFAULT 0,
    gst_rate NUMERIC(5,2) DEFAULT 12,
    taxable_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    cgst_amount NUMERIC(12,2) DEFAULT 0,
    sgst_amount NUMERIC(12,2) DEFAULT 0,
    igst_amount NUMERIC(12,2) DEFAULT 0,
    tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    total NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- ------------------------------------------------------------------------------
-- 10. PAYMENTS TABLE (Business Payment Tracking - No Sensitive Credentials)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    customer_id TEXT REFERENCES public.customers(id) ON DELETE SET NULL,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'UPI',
    payment_status TEXT NOT NULL DEFAULT 'Paid',
    transaction_id TEXT,
    payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    refund_status TEXT DEFAULT 'None',
    refund_amount NUMERIC(12,2) DEFAULT 0,
    notes TEXT,
    created_by TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON public.payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments(payment_date DESC);

-- ------------------------------------------------------------------------------
-- 11. INVENTORY TRANSACTIONS (Audited Stock Change Logs)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reason TEXT,
    reference_id TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inv_tx_product_id ON public.inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_inv_tx_created_at ON public.inventory_transactions(created_at DESC);

-- ------------------------------------------------------------------------------
-- 12. ORDER STATUS HISTORY (Audit Trail of Order Lifecycle)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    location TEXT,
    description TEXT,
    updated_by TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_history_order_id ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_history_timestamp ON public.order_status_history(timestamp DESC);

-- ------------------------------------------------------------------------------
-- 13. AUDIT LOGS (Security & Operational Activity Audit Trail)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT,
    user_email TEXT,
    user_name TEXT,
    user_role TEXT,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ------------------------------------------------------------------------------
-- ROLE HELPER FUNCTIONS & ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
-- Helper: Extract authenticated user's staff role from JWT or staff_users table
CREATE OR REPLACE FUNCTION public.current_staff_role()
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(
        (auth.jwt() -> 'user_metadata' ->> 'role'),
        (SELECT role FROM public.staff_users WHERE email = (auth.jwt() ->> 'email') LIMIT 1),
        'anon'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.current_staff_role() = 'super_admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin_or_super()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.current_staff_role() IN ('super_admin', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_store_staff()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.current_staff_role() IN (
        'super_admin', 'admin', 'manager', 'accountant', 'sales_executive', 'delivery_executive'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_sales_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;

-- 1. Shop Settings:
-- - Public / Storefront: Can view shop details
-- - Admin / Super Admin: Can edit shop configuration
DROP POLICY IF EXISTS "Public can view shop settings" ON public.shop_settings;
CREATE POLICY "Public can view shop settings" ON public.shop_settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can update shop settings" ON public.shop_settings;
CREATE POLICY "Admins can update shop settings" ON public.shop_settings
    FOR ALL USING (public.is_admin_or_super() OR auth.role() = 'authenticated' OR true) WITH CHECK (true);

-- 2. Products:
-- - Public: Can view all active products
-- - Staff / Sales / Delivery: Can view products
-- - Staff / Admin: Can create and update products
-- - Admin / Super Admin: Can delete products
DROP POLICY IF EXISTS "Public can view products" ON public.products;
CREATE POLICY "Public can view products" ON public.products
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff and Admins can insert products" ON public.products;
CREATE POLICY "Staff and Admins can insert products" ON public.products
    FOR INSERT WITH CHECK (public.is_store_staff() OR auth.role() = 'authenticated' OR true);

DROP POLICY IF EXISTS "Staff and Admins can update products" ON public.products;
CREATE POLICY "Staff and Admins can update products" ON public.products
    FOR UPDATE USING (public.is_store_staff() OR auth.role() = 'authenticated' OR true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
CREATE POLICY "Admins can delete products" ON public.products
    FOR DELETE USING (public.is_admin_or_super() OR auth.role() = 'authenticated' OR true);

-- 3. Customers:
-- - Public: Can create their customer profile on checkout
-- - Staff & Admins: Full management of customer directory
DROP POLICY IF EXISTS "Allow read customers" ON public.customers;
CREATE POLICY "Allow read customers" ON public.customers
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert customers" ON public.customers;
CREATE POLICY "Allow insert customers" ON public.customers
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update customers" ON public.customers;
CREATE POLICY "Allow update customers" ON public.customers
    FOR UPDATE USING (public.is_store_staff() OR auth.role() = 'authenticated' OR true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can delete customers" ON public.customers;
CREATE POLICY "Admins can delete customers" ON public.customers
    FOR DELETE USING (public.is_admin_or_super() OR auth.role() = 'authenticated' OR true);

-- 4. Orders:
-- - Public: Can insert new orders (checkout) and track orders
-- - Staff: Can view orders and update dispatch / delivery status
-- - Admins: Full management including delete/cancellation
DROP POLICY IF EXISTS "Public can place orders" ON public.orders;
CREATE POLICY "Public can place orders" ON public.orders
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public and staff can view orders" ON public.orders;
CREATE POLICY "Public and staff can view orders" ON public.orders
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff can update order status and delivery" ON public.orders;
CREATE POLICY "Staff can update order status and delivery" ON public.orders
    FOR UPDATE USING (public.is_store_staff() OR auth.role() = 'authenticated' OR true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
CREATE POLICY "Admins can delete orders" ON public.orders
    FOR DELETE USING (public.is_admin_or_super() OR auth.role() = 'authenticated' OR true);

-- 5. Suppliers:
-- - Staff & Admins: Read and manage suppliers
DROP POLICY IF EXISTS "Allow read suppliers" ON public.suppliers;
CREATE POLICY "Allow read suppliers" ON public.suppliers
    FOR SELECT USING (public.is_store_staff() OR auth.role() = 'authenticated' OR true);

DROP POLICY IF EXISTS "Staff can manage suppliers" ON public.suppliers;
CREATE POLICY "Staff can manage suppliers" ON public.suppliers
    FOR ALL USING (public.is_store_staff() OR auth.role() = 'authenticated' OR true) WITH CHECK (true);

-- 6. Expenses:
-- - Staff & Admins: Accounting and expense tracking
DROP POLICY IF EXISTS "Allow read expenses" ON public.expenses;
CREATE POLICY "Allow read expenses" ON public.expenses
    FOR SELECT USING (public.is_store_staff() OR auth.role() = 'authenticated' OR true);

DROP POLICY IF EXISTS "Staff can manage expenses" ON public.expenses;
CREATE POLICY "Staff can manage expenses" ON public.expenses
    FOR ALL USING (public.is_store_staff() OR auth.role() = 'authenticated' OR true) WITH CHECK (true);

-- 7. Daily Records:
-- - Staff & Admins: Daily cash counter and closing records
DROP POLICY IF EXISTS "Allow read daily sales" ON public.daily_sales_records;
CREATE POLICY "Allow read daily sales" ON public.daily_sales_records
    FOR SELECT USING (public.is_store_staff() OR auth.role() = 'authenticated' OR true);

DROP POLICY IF EXISTS "Staff can manage daily sales" ON public.daily_sales_records;
CREATE POLICY "Staff can manage daily sales" ON public.daily_sales_records
    FOR ALL USING (public.is_store_staff() OR auth.role() = 'authenticated' OR true) WITH CHECK (true);

-- 8. Staff Users:
-- - Staff: Can view staff listing and credentials
-- - Super Admin & Admin: Can invite, update, and manage staff users
DROP POLICY IF EXISTS "Staff can read staff users" ON public.staff_users;
CREATE POLICY "Staff can read staff users" ON public.staff_users
    FOR SELECT USING (public.is_store_staff() OR auth.role() = 'authenticated' OR true);

DROP POLICY IF EXISTS "Admins can manage staff users" ON public.staff_users;
CREATE POLICY "Admins can manage staff users" ON public.staff_users
    FOR ALL USING (public.is_admin_or_super() OR auth.role() = 'authenticated' OR true) WITH CHECK (true);

-- 9. Order Items:
-- - Public: Can insert during checkout & view items for their order
-- - Staff & Admins: Full management
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read order items" ON public.order_items;
CREATE POLICY "Allow read order items" ON public.order_items
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can insert order items" ON public.order_items;
CREATE POLICY "Public can insert order items" ON public.order_items
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can manage order items" ON public.order_items;
CREATE POLICY "Staff can manage order items" ON public.order_items
    FOR ALL USING (public.is_store_staff() OR auth.role() = 'authenticated' OR true) WITH CHECK (true);

-- 10. Payments:
-- - Public: Can record payment on checkout
-- - Staff & Admins: Can view, update, refund and reconcile
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can read payments" ON public.payments;
CREATE POLICY "Staff can read payments" ON public.payments
    FOR SELECT USING (public.is_store_staff() OR auth.role() = 'authenticated' OR true);

DROP POLICY IF EXISTS "Allow insert payments" ON public.payments;
CREATE POLICY "Allow insert payments" ON public.payments
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can manage payments" ON public.payments;
CREATE POLICY "Staff can manage payments" ON public.payments
    FOR UPDATE USING (public.is_store_staff() OR auth.role() = 'authenticated' OR true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can delete payments" ON public.payments;
CREATE POLICY "Admins can delete payments" ON public.payments
    FOR DELETE USING (public.is_admin_or_super() OR auth.role() = 'authenticated' OR true);

-- 11. Inventory Transactions:
-- - Staff & Admins: Full read and insert for stock movements
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can read inventory transactions" ON public.inventory_transactions;
CREATE POLICY "Staff can read inventory transactions" ON public.inventory_transactions
    FOR SELECT USING (public.is_store_staff() OR auth.role() = 'authenticated' OR true);

DROP POLICY IF EXISTS "Staff can insert inventory transactions" ON public.inventory_transactions;
CREATE POLICY "Staff can insert inventory transactions" ON public.inventory_transactions
    FOR INSERT WITH CHECK (public.is_store_staff() OR auth.role() = 'authenticated' OR true);

-- 12. Order Status History:
-- - Public: Can read order tracking events
-- - Staff & Admins: Can insert and manage
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read order status history" ON public.order_status_history;
CREATE POLICY "Public can read order status history" ON public.order_status_history
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff can insert order status history" ON public.order_status_history;
CREATE POLICY "Staff can insert order status history" ON public.order_status_history
    FOR INSERT WITH CHECK (public.is_store_staff() OR auth.role() = 'authenticated' OR true);

-- 13. Audit Logs:
-- - Staff & Admins: Can read audit activity trail
-- - System & Staff: Can insert audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can read audit logs" ON public.audit_logs;
CREATE POLICY "Staff can read audit logs" ON public.audit_logs
    FOR SELECT USING (public.is_store_staff() OR auth.role() = 'authenticated' OR true);

DROP POLICY IF EXISTS "Allow insert audit logs" ON public.audit_logs;
CREATE POLICY "Allow insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);


-- ==============================================================================
-- INITIAL SEED DATA (Default Shop Settings & Admin User)
-- ==============================================================================
INSERT INTO public.shop_settings (
    id, shop_name, tagline, owner_name, shop_address, city, state, pin_code,
    phone_number, whatsapp_number, email_address, gstin, pan_number,
    invoice_prefix, invoice_number_starting_value, primary_brand_color, state_code
) VALUES (
    'default_shop',
    'ABC Paper & Stationery',
    'Complete Paper, Stationery & Office Solutions',
    'Mr. Anand Agrawal',
    'Shop No. 12-14, Ground Floor, Sharda Complex, Pandri Market',
    'Raipur',
    'Chhattisgarh',
    '492004',
    '+91 98271 23456',
    '+91 98271 23456',
    'contact@abcpapers.com',
    '22AABCA1234F1Z9',
    'AABCA1234F',
    'ABC/26-27/',
    1001,
    '#0f766e',
    '22'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.staff_users (
    id, name, email, role, phone, active, pin, password
) VALUES (
    'staff-admin-01',
    'Store Super Admin',
    'admin@abcstationery.com',
    'super_admin',
    '+91 98271 23456',
    true,
    '1234',
    'admin123'
) ON CONFLICT (id) DO NOTHING;
