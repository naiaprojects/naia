ALTER TABLE hero_content 
  ADD COLUMN IF NOT EXISTS title_id TEXT,
  ADD COLUMN IF NOT EXISTS title_en TEXT;

UPDATE hero_content 
SET title_en = title, 
    title_id = title 
WHERE title_en IS NULL;

ALTER TABLE hero_features 
  ADD COLUMN IF NOT EXISTS title_id TEXT,
  ADD COLUMN IF NOT EXISTS title_en TEXT,
  ADD COLUMN IF NOT EXISTS description_id TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT;

UPDATE hero_features 
SET title_en = title,
    title_id = title,
    description_en = description,
    description_id = description
WHERE title_en IS NULL;

DELETE FROM translations 
WHERE key IN ('hero.title', 'hero.subtitle', 'hero.cta');
