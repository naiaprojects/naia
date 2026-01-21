ALTER TABLE services 
  ADD COLUMN IF NOT EXISTS title_id TEXT,
  ADD COLUMN IF NOT EXISTS title_en TEXT,
  ADD COLUMN IF NOT EXISTS description_id TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT;

UPDATE services 
SET title_en = title,
    title_id = title,
    description_en = description,
    description_id = description
WHERE title_en IS NULL;

ALTER TABLE services 
  ALTER COLUMN title DROP NOT NULL,
  ALTER COLUMN description DROP NOT NULL;

CREATE OR REPLACE FUNCTION update_services_legacy_columns()
RETURNS TRIGGER AS $$
BEGIN
  NEW.title := COALESCE(NEW.title_en, NEW.title_id, '');
  NEW.description := COALESCE(NEW.description_en, NEW.description_id, '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS services_legacy_columns_trigger ON services;
CREATE TRIGGER services_legacy_columns_trigger
  BEFORE INSERT OR UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_services_legacy_columns();
