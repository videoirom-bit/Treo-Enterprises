-- ==============================================================================
-- ABC Paper & Stationery - RBAC Security & PostgreSQL Row Level Security (RLS)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. USER PROFILES TABLE (Database-Authoritative RBAC)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
    email TEXT,
    name TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for rapid role lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. SECURITY DEFINER HELPER FUNCTIONS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin(check_uid uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
    IF check_uid IS NULL THEN
        RETURN false;
    END IF;
    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_id = check_uid
          AND role IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_super_admin(check_uid uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
    IF check_uid IS NULL THEN
        RETURN false;
    END IF;
    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_id = check_uid
          AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ------------------------------------------------------------------------------
-- 3. AUTOMATIC PROFILE CREATION TRIGGER ON AUTH.USERS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    initial_role TEXT := 'user';
BEGIN
    -- Check if super admin email or metadata
    IF new.email = 'videoirom@gmail.com' 
       OR new.email = 'superadmin@treoenterprises.com'
       OR new.email = 'admin@treoenterprises.com'
       OR (new.raw_user_meta_data->>'role') = 'super_admin' THEN
        initial_role := 'super_admin';
    ELSIF (new.raw_user_meta_data->>'role') = 'admin' THEN
        initial_role := 'admin';
    ELSE
        initial_role := 'user';
    END IF;

    INSERT INTO public.user_profiles (user_id, email, name, phone, role)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'phone',
        initial_role
    )
    ON CONFLICT (user_id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = now();

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 4. RLS POLICIES FOR USER_PROFILES
-- ------------------------------------------------------------------------------
-- Normal users can read their own profile; Admins can read all profiles
DROP POLICY IF EXISTS "Users can read own profile or admin can read all" ON public.user_profiles;
CREATE POLICY "Users can read own profile or admin can read all" ON public.user_profiles
    FOR SELECT USING (
        auth.uid() = user_id OR public.is_admin()
    );

-- Normal users can update non-role profile fields; Only super_admin/admin can update role
DROP POLICY IF EXISTS "Users update own profile non-role fields" ON public.user_profiles;
CREATE POLICY "Users update own profile non-role fields" ON public.user_profiles
    FOR UPDATE USING (
        auth.uid() = user_id OR public.is_admin()
    ) WITH CHECK (
        public.is_admin() OR (auth.uid() = user_id AND role = (SELECT role FROM public.user_profiles WHERE user_id = auth.uid()))
    );

-- ------------------------------------------------------------------------------
-- 5. RLS POLICIES FOR PRODUCTS (Public Read, Admin Write)
-- ------------------------------------------------------------------------------
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view products" ON public.products;
CREATE POLICY "Public can view products" ON public.products
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admin can insert products" ON public.products;
CREATE POLICY "Only admin can insert products" ON public.products
    FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Only admin can update products" ON public.products;
CREATE POLICY "Only admin can update products" ON public.products
    FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Only admin can delete products" ON public.products;
CREATE POLICY "Only admin can delete products" ON public.products
    FOR DELETE USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 6. RLS POLICIES FOR CATEGORIES (Public Read, Admin Write)
-- ------------------------------------------------------------------------------
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
CREATE POLICY "Public can view categories" ON public.categories
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admin can modify categories" ON public.categories;
CREATE POLICY "Only admin can modify categories" ON public.categories
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 7. RLS POLICIES FOR ORDERS (Normal users: own orders; Admin: all orders)
-- ------------------------------------------------------------------------------
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own orders or admin views all" ON public.orders;
CREATE POLICY "Users view own orders or admin views all" ON public.orders
    FOR SELECT USING (
        public.is_admin()
        OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
        OR (auth.jwt()->>'email' IS NOT NULL AND customer_email = auth.jwt()->>'email')
    );

DROP POLICY IF EXISTS "Anyone can place orders" ON public.orders;
CREATE POLICY "Anyone can place orders" ON public.orders
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Only admin can update or delete orders" ON public.orders;
CREATE POLICY "Only admin can update or delete orders" ON public.orders
    FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Only admin can delete orders" ON public.orders;
CREATE POLICY "Only admin can delete orders" ON public.orders
    FOR DELETE USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 8. RLS POLICIES FOR CUSTOMERS (Normal users: own customer record; Admin: all)
-- ------------------------------------------------------------------------------
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own customer profile or admin views all" ON public.customers;
CREATE POLICY "Users view own customer profile or admin views all" ON public.customers
    FOR SELECT USING (
        public.is_admin()
        OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
        OR (auth.jwt()->>'email' IS NOT NULL AND email = auth.jwt()->>'email')
    );

DROP POLICY IF EXISTS "Users insert or update own customer record" ON public.customers;
CREATE POLICY "Users insert or update own customer record" ON public.customers
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users update own customer record or admin updates any" ON public.customers;
CREATE POLICY "Users update own customer record or admin updates any" ON public.customers
    FOR UPDATE USING (
        public.is_admin()
        OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
        OR (auth.jwt()->>'email' IS NOT NULL AND email = auth.jwt()->>'email')
    );

DROP POLICY IF EXISTS "Only admin can delete customer records" ON public.customers;
CREATE POLICY "Only admin can delete customer records" ON public.customers
    FOR DELETE USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 9. ADMIN-ONLY TABLES (SUPPLIERS, EXPENSES, DAILY RECORDS, SETTINGS, STAFF)
-- ------------------------------------------------------------------------------
-- Suppliers: Strict Admin Only
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Only admin can access suppliers" ON public.suppliers;
CREATE POLICY "Only admin can access suppliers" ON public.suppliers
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Expenses: Strict Admin Only
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Only admin can access expenses" ON public.expenses;
CREATE POLICY "Only admin can access expenses" ON public.expenses
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Daily Sales Records: Strict Admin Only
ALTER TABLE public.daily_sales_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Only admin can access daily_sales_records" ON public.daily_sales_records;
CREATE POLICY "Only admin can access daily_sales_records" ON public.daily_sales_records
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Shop Settings: Public can read, only admin can modify
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view shop settings" ON public.shop_settings;
CREATE POLICY "Public can view shop settings" ON public.shop_settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admin can modify shop settings" ON public.shop_settings;
CREATE POLICY "Only admin can modify shop settings" ON public.shop_settings
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Staff Users: Strict Admin Only
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Only admin can access staff_users" ON public.staff_users;
CREATE POLICY "Only admin can access staff_users" ON public.staff_users
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Inventory Transactions & Audit Logs: Strict Admin Only
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Only admin can access inventory_transactions" ON public.inventory_transactions;
CREATE POLICY "Only admin can access inventory_transactions" ON public.inventory_transactions
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Only admin can access audit_logs" ON public.audit_logs;
CREATE POLICY "Only admin can access audit_logs" ON public.audit_logs
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
