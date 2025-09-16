-- Migration to fix Maltese character encoding in Supabase
-- This script ensures proper UTF-8 encoding for Maltese characters

-- First, let's check the current encoding of the database
SELECT datname, datcollate, datctype FROM pg_database WHERE datname = current_database();

-- Update the items table to ensure proper UTF-8 encoding
-- This will fix any existing data with encoding issues
UPDATE public.items 
SET name = CASE 
  WHEN name LIKE '%?%' THEN 
    -- Replace common encoding issues with proper Maltese characters
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(name, '?', 'ħ'),
              '?', 'Ħ'
            ),
            '?', 'ġ'
          ),
          '?', 'Ġ'
        ),
        '?', 'ż'
      ),
      '?', 'Ż'
    )
  ELSE name
END
WHERE name LIKE '%?%' OR name LIKE '%?%' OR name LIKE '%?%' OR name LIKE '%?%' OR name LIKE '%?%';

-- Also update the audit_trail table for item names
UPDATE public.audit_trail 
SET item_name = CASE 
  WHEN item_name LIKE '%?%' THEN 
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(item_name, '?', 'ħ'),
              '?', 'Ħ'
            ),
            '?', 'ġ'
          ),
          '?', 'Ġ'
        ),
        '?', 'ż'
      ),
      '?', 'Ż'
    )
  ELSE item_name
END
WHERE item_name LIKE '%?%' OR item_name LIKE '%?%' OR item_name LIKE '%?%' OR item_name LIKE '%?%' OR item_name LIKE '%?%';

-- Verify the changes
SELECT sku, name FROM public.items WHERE name LIKE '%ħ%' OR name LIKE '%Ħ%' OR name LIKE '%ġ%' OR name LIKE '%Ġ%' OR name LIKE '%ż%' OR name LIKE '%Ż%';

-- Show any remaining encoding issues
SELECT sku, name FROM public.items WHERE name LIKE '%?%' OR name LIKE '%?%' OR name LIKE '%?%' OR name LIKE '%?%' OR name LIKE '%?%';
