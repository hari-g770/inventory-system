-- ============================================================================
-- Finefix Technology — Master Database Setup Script
-- Safe to run MULTIPLE TIMES in Supabase SQL Editor without errors
-- ============================================================================

-- 1. Profiles (users/staff) table adjustments
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password TEXT DEFAULT '';

-- 2. Sales table adjustments (Customer details & GST)
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS customer_name TEXT DEFAULT 'Walk-in Customer';
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS customer_phone TEXT DEFAULT '';
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS customer_address TEXT DEFAULT '';
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS gst_rate NUMERIC DEFAULT 18;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS apply_gst BOOLEAN DEFAULT true;

-- 3. Sale items table adjustments (Warranty)
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS warranty TEXT DEFAULT '';

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies so recreation is clean
DROP POLICY IF EXISTS "Public profiles CRUD" ON public.profiles;
DROP POLICY IF EXISTS "Public products CRUD" ON public.products;
DROP POLICY IF EXISTS "Public sales CRUD" ON public.sales;
DROP POLICY IF EXISTS "Public sale items CRUD" ON public.sale_items;

-- 6. Create clean policies
CREATE POLICY "Public profiles CRUD" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Public products CRUD" ON public.products FOR ALL USING (true);
CREATE POLICY "Public sales CRUD" ON public.sales FOR ALL USING (true);
CREATE POLICY "Public sale items CRUD" ON public.sale_items FOR ALL USING (true);

-- 7. Upsert default admin and staff users
INSERT INTO public.profiles (id, username, full_name, password, role, email)
VALUES
  ('u1', 'admin', 'Alexandra Vance', 'admin123', 'admin', 'admin@finefix.io'),
  ('u2', 'staff', 'Marcus Brody',    'staff123', 'staff', 'marcus@finefix.io')
ON CONFLICT (id) DO UPDATE SET
  password = EXCLUDED.password,
  role     = EXCLUDED.role,
  email    = EXCLUDED.email;

-- 8. Verification
SELECT id, username, full_name, role FROM public.profiles;
