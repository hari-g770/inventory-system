-- ============================================================================
-- Finefix Technology — Customer Details & Warranty Database Migration
-- Safe to run multiple times in Supabase SQL Editor
-- ============================================================================

-- 1. Add customer columns to sales table if they do not exist
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS customer_name TEXT DEFAULT 'Walk-in Customer';
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS customer_phone TEXT DEFAULT '';
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS customer_address TEXT DEFAULT '';
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS gst_rate NUMERIC DEFAULT 18;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS apply_gst BOOLEAN DEFAULT true;

-- 2. Add warranty column to sale_items table if it does not exist
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS warranty TEXT DEFAULT '';

-- 3. Optional: Create dedicated customers table for customer directory
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY DEFAULT ('c_' || gen_random_uuid()),
  phone TEXT UNIQUE,
  full_name TEXT NOT NULL,
  address TEXT DEFAULT '',
  email TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  total_spent NUMERIC DEFAULT 0,
  orders_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS on customers table
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public customers CRUD" ON public.customers;
CREATE POLICY "Public customers CRUD" ON public.customers FOR ALL USING (true);

-- 5. Seed sample customer records if table is empty
INSERT INTO public.customers (id, phone, full_name, address, total_spent, orders_count)
VALUES
  ('c1', '9876543210', 'Rahul Sharma', 'Flat 402, Green Glen Layout, Bangalore', 23449.00, 2),
  ('c2', '9123456780', 'Priya Patel', '12th Cross, Indiranagar, Bangalore', 21330.59, 1)
ON CONFLICT (phone) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  address = EXCLUDED.address;

-- 6. Confirm columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('sales', 'sale_items', 'customers') 
  AND column_name IN ('customer_name', 'customer_phone', 'customer_address', 'warranty', 'full_name');
