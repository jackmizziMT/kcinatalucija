-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

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
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    item_name TEXT,
    location_name TEXT,
    from_location_name TEXT,
    to_location_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create users table (for app-specific user data)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor', 'viewer')),
    security_question TEXT,
    security_answer TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_by_location ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
-- Items policies
CREATE POLICY "Allow all operations for authenticated users" ON public.items
    FOR ALL USING (auth.role() = 'authenticated');

-- Locations policies
CREATE POLICY "Allow all operations for authenticated users" ON public.locations
    FOR ALL USING (auth.role() = 'authenticated');

-- Stock policies
CREATE POLICY "Allow all operations for authenticated users" ON public.stock_by_location
    FOR ALL USING (auth.role() = 'authenticated');

-- Audit trail policies
CREATE POLICY "Allow all operations for authenticated users" ON public.audit_trail
    FOR ALL USING (auth.role() = 'authenticated');

-- Users policies
CREATE POLICY "Allow all operations for authenticated users" ON public.users
    FOR ALL USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_items_sku ON public.items(sku);
CREATE INDEX IF NOT EXISTS idx_locations_name ON public.locations(name);
CREATE INDEX IF NOT EXISTS idx_stock_by_location_sku_location ON public.stock_by_location(sku, location_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_timestamp ON public.audit_trail(timestamp_iso DESC);
CREATE INDEX IF NOT EXISTS idx_audit_trail_sku ON public.audit_trail(sku);
CREATE INDEX IF NOT EXISTS idx_audit_trail_type ON public.audit_trail(type);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- Create functions to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON public.items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON public.locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_by_location_updated_at BEFORE UPDATE ON public.stock_by_location
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default data
INSERT INTO public.locations (id, name) VALUES 
    (gen_random_uuid(), 'A'),
    (gen_random_uuid(), 'B'),
    (gen_random_uuid(), 'C'),
    (gen_random_uuid(), 'D')
ON CONFLICT (name) DO NOTHING;

-- Insert default admin user
INSERT INTO public.users (username, role, security_question, security_answer) VALUES 
    ('admin', 'admin', 'What is the name of your first pet?', 'admin')
ON CONFLICT (username) DO NOTHING;
