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

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS value_id TEXT,
  ADD COLUMN IF NOT EXISTS value_en TEXT;

UPDATE site_settings
SET value_en = value,
    value_id = value
WHERE key IN ('cta_button_text', 'cta_button_portfolio_text') AND value_en IS NULL;
