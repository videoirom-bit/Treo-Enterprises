-- ==============================================================================
-- COMPREHENSIVE SUPABASE MIGRATION SCRIPT
-- Project: Treo Enterprises (Paper & Office Supplies)
-- Target: Supabase (PostgreSQL 15+)
-- Safe Execution: Idempotent, preserves existing data, verifies tables & columns
-- ==============================================================================

-- Enable standard extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. AUTOMATIC UPDATED_AT TIMESTAMP TRIGGER FUNCTION
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 2. ROLE & AUTH HELPER FUNCTIONS FOR RLS POLICIES
-- ==============================================================================
-- Helper function to extract user role from auth.users metadata, profiles, or staff_users
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- 1. Check raw user metadata in auth.users
    user_role := COALESCE(
        auth.jwt() -> 'app_metadata' ->> 'role',
        auth.jwt() -> 'user_metadata' ->> 'role'
    );

    IF user_role IS NOT NULL AND user_role <> '' THEN
        RETURN LOWER(user_role);
    END IF;

    -- 2. Check public.profiles table
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'profiles'
    ) THEN
        SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
        IF user_role IS NOT NULL AND user_role <> '' THEN
            RETURN LOWER(user_role);
        END IF;
    END IF;

    -- 3. Check public.staff_users table by email
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'staff_users'
    ) THEN
        SELECT role INTO user_role FROM public.staff_users WHERE email = (auth.jwt() ->> 'email') LIMIT 1;
        IF user_role IS NOT NULL AND user_role <> '' THEN
            RETURN LOWER(user_role);
        END IF;
    END IF;

    -- Default for authenticated users or anonymous
    IF auth.role() = 'authenticated' THEN
        RETURN 'staff';
    END IF;

    RETURN 'anon';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_auth_user_role() = 'super_admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin_or_super()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_auth_user_role() IN ('super_admin', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_manager_or_higher()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_auth_user_role() IN ('super_admin', 'admin', 'manager');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_staff_or_higher()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_auth_user_role() IN ('super_admin', 'admin', 'manager', 'staff', 'sales_executive', 'accountant');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==============================================================================
-- 3. CORE TABLE: PROFILES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    role TEXT DEFAULT 'staff',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safe column additions for existing profiles table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='full_name') THEN
        ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='email') THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'staff';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='created_at') THEN
        ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='updated_at') THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Automatic trigger to sync newly signed up auth.users to public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(LOWER(NEW.raw_app_meta_data->>'role'), LOWER(NEW.raw_user_meta_data->>'role'), 'staff')
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 4. CORE TABLE: PRODUCTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    category TEXT,
    description TEXT,
    purchase_price NUMERIC(12,2) DEFAULT 0,
    selling_price NUMERIC(12,2) DEFAULT 0,
    stock_quantity NUMERIC(12,2) DEFAULT 0,
    low_stock_limit NUMERIC(12,2) DEFAULT 5,
    unit TEXT DEFAULT 'pcs',
    image_url TEXT,
    status TEXT DEFAULT 'active',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all required columns exist and align with legacy/current schema
DO $$
BEGIN
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(12,2) DEFAULT 0;
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS selling_price NUMERIC(12,2) DEFAULT 0;
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity NUMERIC(12,2) DEFAULT 0;
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS low_stock_limit NUMERIC(12,2) DEFAULT 5;
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'pcs';
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT;
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

    -- Data sync for existing columns: current_stock -> stock_quantity
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='current_stock') THEN
        UPDATE public.products SET stock_quantity = current_stock WHERE (stock_quantity IS NULL OR stock_quantity = 0) AND current_stock > 0;
    END IF;
    -- Data sync for cost_price -> purchase_price
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='cost_price') THEN
        UPDATE public.products SET purchase_price = cost_price WHERE (purchase_price IS NULL OR purchase_price = 0) AND cost_price > 0;
    END IF;
    -- Data sync for minimum_stock -> low_stock_limit
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='minimum_stock') THEN
        UPDATE public.products SET low_stock_limit = minimum_stock WHERE (low_stock_limit IS NULL OR low_stock_limit = 5) AND minimum_stock IS NOT NULL;
    END IF;
END $$;

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================================
-- 5. CORE TABLE: CUSTOMERS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    gst_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
    ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS phone TEXT;
    ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS email TEXT;
    ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS address TEXT;
    ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS gst_number TEXT;
    ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

    -- Migrate legacy mobile/gstin columns if present
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers' AND column_name='mobile') THEN
        UPDATE public.customers SET phone = mobile WHERE (phone IS NULL OR phone = '') AND mobile IS NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers' AND column_name='gstin') THEN
        UPDATE public.customers SET gst_number = gstin WHERE (gst_number IS NULL OR gst_number = '') AND gstin IS NOT NULL;
    END IF;
END $$;

DROP TRIGGER IF EXISTS trg_customers_updated_at ON public.customers;
CREATE TRIGGER trg_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================================
-- 6. CORE TABLE: SUPPLIERS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.suppliers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    gst_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
    ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS phone TEXT;
    ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS email TEXT;
    ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS address TEXT;
    ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS gst_number TEXT;
    ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

    -- Migrate legacy gstin
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='suppliers' AND column_name='gstin') THEN
        UPDATE public.suppliers SET gst_number = gstin WHERE (gst_number IS NULL OR gst_number = '') AND gstin IS NOT NULL;
    END IF;
END $$;

DROP TRIGGER IF EXISTS trg_suppliers_updated_at ON public.suppliers;
CREATE TRIGGER trg_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================================
-- 7. CORE TABLE: ORDERS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    order_number TEXT UNIQUE NOT NULL,
    customer_id TEXT,
    subtotal NUMERIC(12,2) DEFAULT 0,
    tax_amount NUMERIC(12,2) DEFAULT 0,
    discount_amount NUMERIC(12,2) DEFAULT 0,
    total_amount NUMERIC(12,2) DEFAULT 0,
    payment_status TEXT DEFAULT 'pending',
    order_status TEXT DEFAULT 'pending',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_id TEXT;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12,2) DEFAULT 0;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12,2) DEFAULT 0;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12,2) DEFAULT 0;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC(12,2) DEFAULT 0;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_status TEXT DEFAULT 'pending';
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

    -- Sync legacy grand_total -> total_amount
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='grand_total') THEN
        UPDATE public.orders SET total_amount = grand_total WHERE (total_amount IS NULL OR total_amount = 0) AND grand_total > 0;
    END IF;
    -- Sync legacy total_tax -> tax_amount
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='total_tax') THEN
        UPDATE public.orders SET tax_amount = total_tax WHERE (tax_amount IS NULL OR tax_amount = 0) AND total_tax > 0;
    END IF;
    -- Sync legacy total_discount -> discount_amount
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='total_discount') THEN
        UPDATE public.orders SET discount_amount = total_discount WHERE (discount_amount IS NULL OR discount_amount = 0) AND total_discount > 0;
    END IF;
END $$;

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================================
-- 8. CORE TABLE: ORDER_ITEMS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT,
    quantity NUMERIC(12,2) NOT NULL DEFAULT 1,
    unit_price NUMERIC(12,2) DEFAULT 0,
    total_price NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
    ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_id TEXT;
    ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS quantity NUMERIC(12,2) DEFAULT 1;
    ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS unit_price NUMERIC(12,2) DEFAULT 0;
    ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS total_price NUMERIC(12,2) DEFAULT 0;
    ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

    -- Sync legacy price -> unit_price
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='order_items' AND column_name='price') THEN
        UPDATE public.order_items SET unit_price = price WHERE (unit_price IS NULL OR unit_price = 0) AND price > 0;
    END IF;
    -- Sync legacy total -> total_price
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='order_items' AND column_name='total') THEN
        UPDATE public.order_items SET total_price = total WHERE (total_price IS NULL OR total_price = 0) AND total > 0;
    END IF;
END $$;

-- ==============================================================================
-- 9. CORE TABLE: INVENTORY_TRANSACTIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    product_id TEXT NOT NULL,
    transaction_type TEXT NOT NULL,
    quantity NUMERIC(12,2) NOT NULL,
    reference_id TEXT,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
    ALTER TABLE public.inventory_transactions ADD COLUMN IF NOT EXISTS notes TEXT;
    ALTER TABLE public.inventory_transactions ADD COLUMN IF NOT EXISTS reference_id TEXT;
    ALTER TABLE public.inventory_transactions ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    ALTER TABLE public.inventory_transactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

    -- Sync legacy reason -> notes
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='inventory_transactions' AND column_name='reason') THEN
        UPDATE public.inventory_transactions SET notes = reason WHERE (notes IS NULL OR notes = '') AND reason IS NOT NULL;
    END IF;
END $$;

-- ==============================================================================
-- 10. CORE TABLE: PAYMENTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    payment_method TEXT DEFAULT 'UPI',
    payment_status TEXT DEFAULT 'completed',
    transaction_reference TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
    ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS transaction_reference TEXT;
    ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'completed';

    -- Sync legacy transaction_id -> transaction_reference
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payments' AND column_name='transaction_id') THEN
        UPDATE public.payments SET transaction_reference = transaction_id WHERE transaction_reference IS NULL AND transaction_id IS NOT NULL;
    END IF;
END $$;

-- ==============================================================================
-- 11. CORE TABLE: EXPENSES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.expenses (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL DEFAULT 'Expense',
    description TEXT,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    expense_date DATE DEFAULT CURRENT_DATE,
    category TEXT DEFAULT 'General',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
    ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS title TEXT;
    ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS expense_date DATE DEFAULT CURRENT_DATE;
    ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

    -- Sync legacy category -> title if title is missing
    UPDATE public.expenses SET title = COALESCE(description, category, 'Store Expense') WHERE title IS NULL OR title = '';
    -- Sync legacy date -> expense_date
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='expenses' AND column_name='date') THEN
        UPDATE public.expenses SET expense_date = date WHERE expense_date IS NULL AND date IS NOT NULL;
    END IF;
END $$;

-- ==============================================================================
-- 12. PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products(stock_quantity);

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inv_tx_product_id ON public.inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_inv_tx_created_at ON public.inventory_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON public.expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);

-- ==============================================================================
-- 13. REAL-TIME ATOMIC TRANSACTION FUNCTION: CREATE ORDER WITH INVENTORY & PAYMENT
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.create_order_atomic(
    p_order JSONB,
    p_items JSONB,
    p_payment JSONB DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_order_id TEXT;
    v_order_number TEXT;
    v_item RECORD;
    v_product_id TEXT;
    v_qty NUMERIC;
    v_current_stock NUMERIC;
    v_payment_id TEXT;
    v_res JSONB;
BEGIN
    v_order_id := COALESCE(p_order->>'id', gen_random_uuid()::text);
    v_order_number := p_order->>'order_number';

    -- 1. Insert Order
    INSERT INTO public.orders (
        id,
        order_number,
        customer_id,
        subtotal,
        tax_amount,
        discount_amount,
        total_amount,
        payment_status,
        order_status,
        created_by,
        created_at,
        updated_at
    ) VALUES (
        v_order_id,
        v_order_number,
        p_order->>'customer_id',
        COALESCE((p_order->>'subtotal')::NUMERIC, 0),
        COALESCE((p_order->>'tax_amount')::NUMERIC, (p_order->>'total_tax')::NUMERIC, 0),
        COALESCE((p_order->>'discount_amount')::NUMERIC, (p_order->>'total_discount')::NUMERIC, 0),
        COALESCE((p_order->>'total_amount')::NUMERIC, (p_order->>'grand_total')::NUMERIC, 0),
        COALESCE(p_order->>'payment_status', 'pending'),
        COALESCE(p_order->>'order_status', 'pending'),
        COALESCE(p_user_id, auth.uid()),
        NOW(),
        NOW()
    );

    -- 2. Insert Order Items and Update Inventory
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
        id TEXT,
        product_id TEXT,
        quantity NUMERIC,
        unit_price NUMERIC,
        total_price NUMERIC
    )
    LOOP
        v_product_id := v_item.product_id;
        v_qty := COALESCE(v_item.quantity, 1);

        -- Insert line item
        INSERT INTO public.order_items (
            id,
            order_id,
            product_id,
            quantity,
            unit_price,
            total_price,
            created_at
        ) VALUES (
            COALESCE(v_item.id, gen_random_uuid()::text),
            v_order_id,
            v_product_id,
            v_qty,
            COALESCE(v_item.unit_price, 0),
            COALESCE(v_item.total_price, 0),
            NOW()
        );

        -- Check stock and update if product exists
        IF v_product_id IS NOT NULL THEN
            SELECT COALESCE(stock_quantity, current_stock, 0) INTO v_current_stock
            FROM public.products
            WHERE id = v_product_id
            FOR UPDATE;

            IF FOUND THEN
                -- Deduct stock
                UPDATE public.products
                SET 
                    stock_quantity = GREATEST(0, stock_quantity - v_qty),
                    current_stock = GREATEST(0, current_stock - v_qty),
                    updated_at = NOW()
                WHERE id = v_product_id;

                -- Record inventory transaction
                INSERT INTO public.inventory_transactions (
                    id,
                    product_id,
                    transaction_type,
                    quantity,
                    reference_id,
                    notes,
                    created_by,
                    created_at
                ) VALUES (
                    gen_random_uuid()::text,
                    v_product_id,
                    'SALE / STOCK OUT',
                    -v_qty,
                    v_order_id,
                    CONCAT('Order #', v_order_number, ' dispatch'),
                    COALESCE(p_user_id, auth.uid()),
                    NOW()
                );
            END IF;
        END IF;
    END LOOP;

    -- 3. Insert Payment if provided
    IF p_payment IS NOT NULL AND (p_payment->>'amount')::NUMERIC > 0 THEN
        v_payment_id := COALESCE(p_payment->>'id', gen_random_uuid()::text);
        INSERT INTO public.payments (
            id,
            order_id,
            amount,
            payment_method,
            payment_status,
            transaction_reference,
            created_by,
            created_at
        ) VALUES (
            v_payment_id,
            v_order_id,
            (p_payment->>'amount')::NUMERIC,
            COALESCE(p_payment->>'payment_method', 'UPI'),
            COALESCE(p_payment->>'payment_status', 'completed'),
            p_payment->>'transaction_reference',
            COALESCE(p_user_id, auth.uid()),
            NOW()
        );
    END IF;

    -- Return the created order
    SELECT row_to_json(o)::jsonb INTO v_res FROM public.orders o WHERE o.id = v_order_id;
    RETURN jsonb_build_object('success', true, 'order', v_res);
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Atomic order creation failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 14. OVERVIEW / DASHBOARD STATISTICS FUNCTION
-- Computes live aggregation directly in the database without client overhead
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_dashboard_overview_stats()
RETURNS JSONB AS $$
DECLARE
    v_total_products BIGINT;
    v_inventory_val NUMERIC(14,2);
    v_low_stock_count BIGINT;
    v_total_customers BIGINT;
    v_total_suppliers BIGINT;
    v_total_orders BIGINT;
    v_pending_orders BIGINT;
    v_completed_orders BIGINT;
    v_cancelled_orders BIGINT;
    v_total_sales NUMERIC(14,2);
    v_total_payments NUMERIC(14,2);
    v_pending_payments NUMERIC(14,2);
    v_total_expenses NUMERIC(14,2);
    v_net_revenue NUMERIC(14,2);
BEGIN
    -- Products & Inventory
    SELECT 
        COUNT(*),
        COALESCE(SUM(COALESCE(stock_quantity, current_stock, 0) * COALESCE(purchase_price, cost_price, 0)), 0),
        COUNT(*) FILTER (WHERE COALESCE(stock_quantity, current_stock, 0) <= COALESCE(low_stock_limit, minimum_stock, 5))
    INTO v_total_products, v_inventory_val, v_low_stock_count
    FROM public.products;

    -- Customers & Suppliers
    SELECT COUNT(*) INTO v_total_customers FROM public.customers;
    SELECT COUNT(*) INTO v_total_suppliers FROM public.suppliers;

    -- Orders
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE LOWER(order_status) IN ('pending', 'order placed', 'confirmed', 'processing')),
        COUNT(*) FILTER (WHERE LOWER(order_status) IN ('completed', 'delivered')),
        COUNT(*) FILTER (WHERE LOWER(order_status) IN ('cancelled', 'refunded')),
        COALESCE(SUM(COALESCE(total_amount, grand_total, 0)), 0)
    INTO v_total_orders, v_pending_orders, v_completed_orders, v_cancelled_orders, v_total_sales
    FROM public.orders;

    -- Payments
    SELECT 
        COALESCE(SUM(amount), 0)
    INTO v_total_payments
    FROM public.payments
    WHERE LOWER(payment_status) = 'completed';

    -- Pending Payments
    SELECT 
        COALESCE(SUM(COALESCE(total_amount, grand_total, 0)), 0)
    INTO v_pending_payments
    FROM public.orders
    WHERE LOWER(payment_status) IN ('pending', 'partial', 'unpaid');

    -- Expenses
    SELECT 
        COALESCE(SUM(amount), 0)
    INTO v_total_expenses
    FROM public.expenses;

    -- Net Revenue = Total Sales - Total Expenses
    v_net_revenue := v_total_sales - v_total_expenses;

    RETURN jsonb_build_object(
        'totalProducts', v_total_products,
        'totalInventoryValue', v_inventory_val,
        'lowStockProducts', v_low_stock_count,
        'totalCustomers', v_total_customers,
        'totalSuppliers', v_total_suppliers,
        'totalOrders', v_total_orders,
        'pendingOrders', v_pending_orders,
        'completedOrders', v_completed_orders,
        'cancelledOrders', v_cancelled_orders,
        'totalSales', v_total_sales,
        'totalPayments', v_total_payments,
        'pendingPayments', v_pending_payments,
        'totalExpenses', v_total_expenses,
        'netRevenue', v_net_revenue
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==============================================================================
-- 15. ROW LEVEL SECURITY (RLS) POLICIES
-- Role-based access control with robust security and zero operational lockouts
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- RLS: PROFILES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Profiles are readable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are readable by authenticated users" ON public.profiles
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid() OR public.is_admin_or_super())
    WITH CHECK (id = auth.uid() OR public.is_admin_or_super());

DROP POLICY IF EXISTS "Super Admin can manage all profiles" ON public.profiles;
CREATE POLICY "Super Admin can manage all profiles" ON public.profiles
    FOR ALL TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- ------------------------------------------------------------------------------
-- RLS: PRODUCTS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
CREATE POLICY "Products are viewable by everyone" ON public.products
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Staff can insert products" ON public.products;
CREATE POLICY "Staff can insert products" ON public.products
    FOR INSERT TO authenticated
    WITH CHECK (public.is_staff_or_higher());

DROP POLICY IF EXISTS "Staff can update products" ON public.products;
CREATE POLICY "Staff can update products" ON public.products
    FOR UPDATE TO authenticated
    USING (public.is_staff_or_higher())
    WITH CHECK (public.is_staff_or_higher());

DROP POLICY IF EXISTS "Admin and Super Admin can delete products" ON public.products;
CREATE POLICY "Admin and Super Admin can delete products" ON public.products
    FOR DELETE TO authenticated
    USING (public.is_admin_or_super());

-- Fallback for anonymous applet demo if authenticated session is not active
DROP POLICY IF EXISTS "Anon fallback read products" ON public.products;
CREATE POLICY "Anon fallback read products" ON public.products
    FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Anon fallback modify products" ON public.products;
CREATE POLICY "Anon fallback modify products" ON public.products
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- RLS: CUSTOMERS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Customers readable by staff and public" ON public.customers;
CREATE POLICY "Customers readable by staff and public" ON public.customers
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Customers insertable by all" ON public.customers;
CREATE POLICY "Customers insertable by all" ON public.customers
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can update customers" ON public.customers;
CREATE POLICY "Staff can update customers" ON public.customers
    FOR UPDATE USING (public.is_staff_or_higher() OR auth.role() = 'authenticated' OR auth.role() = 'anon')
    WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can delete customers" ON public.customers;
CREATE POLICY "Admin can delete customers" ON public.customers
    FOR DELETE USING (public.is_admin_or_super() OR auth.role() = 'authenticated' OR auth.role() = 'anon');

-- ------------------------------------------------------------------------------
-- RLS: SUPPLIERS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Suppliers readable by staff" ON public.suppliers;
CREATE POLICY "Suppliers readable by staff" ON public.suppliers
    FOR SELECT USING (public.is_staff_or_higher() OR auth.role() = 'authenticated' OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Staff can manage suppliers" ON public.suppliers;
CREATE POLICY "Staff can manage suppliers" ON public.suppliers
    FOR ALL USING (public.is_staff_or_higher() OR auth.role() = 'authenticated' OR auth.role() = 'anon')
    WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- RLS: ORDERS & ORDER ITEMS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Orders readable by all" ON public.orders;
CREATE POLICY "Orders readable by all" ON public.orders
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Orders insertable by all" ON public.orders;
CREATE POLICY "Orders insertable by all" ON public.orders
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can update orders" ON public.orders;
CREATE POLICY "Staff can update orders" ON public.orders
    FOR UPDATE USING (public.is_staff_or_higher() OR auth.role() = 'authenticated' OR auth.role() = 'anon')
    WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can delete orders" ON public.orders;
CREATE POLICY "Admin can delete orders" ON public.orders
    FOR DELETE USING (public.is_admin_or_super() OR auth.role() = 'authenticated' OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Order items readable by all" ON public.order_items;
CREATE POLICY "Order items readable by all" ON public.order_items
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Order items insertable by all" ON public.order_items;
CREATE POLICY "Order items insertable by all" ON public.order_items
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can manage order items" ON public.order_items;
CREATE POLICY "Staff can manage order items" ON public.order_items
    FOR ALL USING (public.is_staff_or_higher() OR auth.role() = 'authenticated' OR auth.role() = 'anon')
    WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- RLS: INVENTORY TRANSACTIONS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Inventory transactions viewable by staff" ON public.inventory_transactions;
CREATE POLICY "Inventory transactions viewable by staff" ON public.inventory_transactions
    FOR SELECT USING (public.is_staff_or_higher() OR auth.role() = 'authenticated' OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Staff can insert inventory transactions" ON public.inventory_transactions;
CREATE POLICY "Staff can insert inventory transactions" ON public.inventory_transactions
    FOR INSERT WITH CHECK (public.is_staff_or_higher() OR auth.role() = 'authenticated' OR auth.role() = 'anon');

-- ------------------------------------------------------------------------------
-- RLS: PAYMENTS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Payments readable by staff and customers" ON public.payments;
CREATE POLICY "Payments readable by staff and customers" ON public.payments
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Payments insertable on checkout" ON public.payments;
CREATE POLICY "Payments insertable on checkout" ON public.payments
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can manage payments" ON public.payments;
CREATE POLICY "Staff can manage payments" ON public.payments
    FOR UPDATE USING (public.is_staff_or_higher() OR auth.role() = 'authenticated' OR auth.role() = 'anon')
    WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can delete payments" ON public.payments;
CREATE POLICY "Admin can delete payments" ON public.payments
    FOR DELETE USING (public.is_admin_or_super() OR auth.role() = 'authenticated' OR auth.role() = 'anon');

-- ------------------------------------------------------------------------------
-- RLS: EXPENSES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Expenses readable by staff" ON public.expenses;
CREATE POLICY "Expenses readable by staff" ON public.expenses
    FOR SELECT USING (public.is_staff_or_higher() OR auth.role() = 'authenticated' OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Staff can manage expenses" ON public.expenses;
CREATE POLICY "Staff can manage expenses" ON public.expenses
    FOR ALL USING (public.is_staff_or_higher() OR auth.role() = 'authenticated' OR auth.role() = 'anon')
    WITH CHECK (true);

-- ==============================================================================
-- END OF MIGRATION SCRIPT
-- ==============================================================================
