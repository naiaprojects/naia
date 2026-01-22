-- Setup Storage Bucket untuk Articles
-- Jalankan script ini di Supabase SQL Editor

-- 1. Buat bucket 'articles' jika belum ada
INSERT INTO storage.buckets (id, name, public)
VALUES ('articles', 'articles', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Policy untuk SELECT (public read)
CREATE POLICY "Public Access untuk Articles"
ON storage.objects FOR SELECT
USING (bucket_id = 'articles');

-- 3. Policy untuk INSERT (authenticated users dapat upload)
CREATE POLICY "Authenticated users dapat upload articles"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'articles' 
  AND auth.role() = 'authenticated'
);

-- 4. Policy untuk UPDATE (authenticated users dapat update)
CREATE POLICY "Authenticated users dapat update articles"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'articles' 
  AND auth.role() = 'authenticated'
);

-- 5. Policy untuk DELETE (authenticated users dapat delete)
CREATE POLICY "Authenticated users dapat delete articles"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'articles' 
  AND auth.role() = 'authenticated'
);
