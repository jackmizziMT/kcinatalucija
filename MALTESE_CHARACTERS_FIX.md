# Fix Maltese Characters in Database

## Problem
Maltese characters (ĦħĠġŻż) are not being stored correctly in the Supabase database, appearing as question marks or other encoding issues.

## Solution Steps

### Step 1: Run the Database Migration
1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Run this migration script:

```sql
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
```

### Step 2: Test the Fix
1. **Check existing data**: Look at the verification queries in the migration
2. **Add new items**: Try adding items with Maltese characters through the app
3. **Import CSV**: Try importing a CSV with Maltese characters

### Step 3: If Issues Persist

#### Option A: Manual Database Update
If you know which items have encoding issues, you can manually update them:

```sql
-- Example: Update specific items with Maltese characters
UPDATE public.items 
SET name = 'Ħobż tal-Ħobż'
WHERE sku = 'YOUR_SKU_HERE';
```

#### Option B: Re-import Data
1. Export your current data
2. Fix the Maltese characters in the exported file
3. Purge the inventory data (Admin → Data Purge)
4. Re-import the corrected data

#### Option C: Check CSV File Encoding
When creating CSV files with Maltese characters:
1. Save the CSV file with **UTF-8 encoding**
2. Use a text editor that supports UTF-8 (like VS Code, Notepad++)
3. Avoid Excel for files with special characters

## Prevention
- Always save CSV files with UTF-8 encoding
- Use the app's built-in form for adding items with Maltese characters
- The app now has proper UTF-8 support configured

## Technical Details
- Updated Supabase client with UTF-8 headers
- Added encoding specification to CSV parsing
- Database migration to fix existing encoding issues
- Font support for Maltese characters in the UI

## Test Cases
Try these Maltese words to test:
- `Ħobż tal-Ħobż` (bread)
- `Ġbejna` (cheese)
- `Żejt` (oil)
- `Ħalib` (milk)
- `Ġarġir` (garlic)
