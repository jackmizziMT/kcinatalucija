-- Minimal Supabase Schema - Safe to run without permission issues
-- This creates only the essential tables without conflicting with existing ones

-- Create items table
CREATE TABLE IF NOT EXISTS public.items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sku TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    cost_price_euro_cents INTEGER NOT NULL DEFAULT 0,
    selling_price_euro_cents INTEGER NOT NULL DEFAULT 0,
    quantity_kind TEXT NOT NULL DEFAULT 'unit' CHECK (quantity_kind IN ('unit', 'kg')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create locations table
CREATE TABLE IF NOT EXISTS public.locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create stock_by_location table
CREATE TABLE IF NOT EXISTS public.stock_by_location (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sku TEXT NOT NULL,
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sku, location_id)
);

-- Create audit_trail table
CREATE TABLE IF NOT EXISTS public.audit_trail (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp_iso TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    type TEXT NOT NULL CHECK (type IN ('add', 'deduct', 'transfer')),
    sku TEXT NOT NULL,
    location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    from_location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    to_location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    reason TEXT,
    note TEXT,
    user_id TEXT, -- Changed to TEXT to avoid auth.users reference
    item_name TEXT,
    location_name TEXT,
    from_location_name TEXT,
    to_location_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create app_users table
CREATE TABLE IF NOT EXISTS public.app_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor', 'viewer')),
    security_question TEXT,
    security_answer TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (this should work without permission issues)
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_by_location ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- Create simple policies (allow all for now, can be tightened later)
CREATE POLICY "Allow all operations" ON public.items FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.locations FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.stock_by_location FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.audit_trail FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.app_users FOR ALL USING (true);

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_items_sku ON public.items(sku);
CREATE INDEX IF NOT EXISTS idx_locations_name ON public.locations(name);
CREATE INDEX IF NOT EXISTS idx_stock_by_location_sku_location ON public.stock_by_location(sku, location_id);

-- Insert default data
INSERT INTO public.locations (name) VALUES 
    ('A'),
    ('B'),
    ('C'),
    ('D')
ON CONFLICT (name) DO NOTHING;

-- Insert default admin user
INSERT INTO public.app_users (username, email, role, security_question, security_answer) VALUES 
    ('admin', 'admin@example.com', 'admin', 'What is the name of your first pet?', 'SecureAdmin2025!')
ON CONFLICT (username) DO NOTHING;
