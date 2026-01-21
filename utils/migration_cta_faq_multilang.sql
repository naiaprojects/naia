ALTER TABLE faq_items 
  ADD COLUMN IF NOT EXISTS question_id TEXT,
  ADD COLUMN IF NOT EXISTS question_en TEXT,
  ADD COLUMN IF NOT EXISTS answer_id TEXT,
  ADD COLUMN IF NOT EXISTS answer_en TEXT;

UPDATE faq_items 
SET question_en = question,
    question_id = question,
    answer_en = answer,
    answer_id = answer
WHERE question_en IS NULL;

ALTER TABLE faq_items 
  ALTER COLUMN question DROP NOT NULL,
  ALTER COLUMN answer DROP NOT NULL;

CREATE OR REPLACE FUNCTION update_faq_legacy_columns()
RETURNS TRIGGER AS $$
BEGIN
  NEW.question := COALESCE(NEW.question_en, NEW.question_id, '');
  NEW.answer := COALESCE(NEW.answer_en, NEW.answer_id, '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS faq_legacy_columns_trigger ON faq_items;
CREATE TRIGGER faq_legacy_columns_trigger
  BEFORE INSERT OR UPDATE ON faq_items
  FOR EACH ROW
  EXECUTE FUNCTION update_faq_legacy_columns();

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS value_id TEXT,
  ADD COLUMN IF NOT EXISTS value_en TEXT;

UPDATE site_settings
SET value_en = value,
    value_id = value
WHERE key IN ('cta_button_text', 'cta_button_portfolio_text') AND value_en IS NULL;
