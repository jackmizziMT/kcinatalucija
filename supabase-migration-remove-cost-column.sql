-- Migration to remove cost_price_euro_cents column from items table
-- This removes the cost field that is no longer needed

-- Remove the cost_price_euro_cents column from items table
ALTER TABLE public.items DROP COLUMN IF EXISTS cost_price_euro_cents;

-- Verify the column has been removed
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'items' AND table_schema = 'public'
ORDER BY ordinal_position;
