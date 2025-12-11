-- DANGER: This drops the old table
DROP TABLE IF EXISTS package_features;
DROP TABLE IF EXISTS price_packages;
DROP TABLE IF EXISTS packages; -- Just in case

-- Update services table to hold packages as JSON
-- We use JSONB for better querying if needed, or just JSON/TEXT
ALTER TABLE services ADD COLUMN IF NOT EXISTS packages JSONB DEFAULT '[]'::jsonb;
