-- Langkah 1: Ubah constraint NOT NULL menjadi nullable
ALTER TABLE faq_items 
  ALTER COLUMN question DROP NOT NULL,
  ALTER COLUMN answer DROP NOT NULL;

-- Langkah 2: Buat function untuk auto-populate kolom lama dari kolom baru
CREATE OR REPLACE FUNCTION update_faq_legacy_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-populate kolom question dan answer dari kolom multi bahasa
  -- Prioritas: English, lalu Indonesia
  NEW.question := COALESCE(NEW.question_en, NEW.question_id, '');
  NEW.answer := COALESCE(NEW.answer_en, NEW.answer_id, '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Langkah 3: Buat trigger untuk memanggil function tersebut
DROP TRIGGER IF EXISTS faq_legacy_columns_trigger ON faq_items;
CREATE TRIGGER faq_legacy_columns_trigger
  BEFORE INSERT OR UPDATE ON faq_items
  FOR EACH ROW
  EXECUTE FUNCTION update_faq_legacy_columns();

-- Langkah 4: Update data existing untuk mengisi kolom lama
UPDATE faq_items 
SET question = COALESCE(question_en, question_id, question),
    answer = COALESCE(answer_en, answer_id, answer)
WHERE question IS NOT NULL;
