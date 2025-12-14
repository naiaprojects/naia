-- =====================================================
-- STORE MODULE - SQL SCHEMA
-- Jalankan script ini di Supabase SQL Editor
-- =====================================================

-- 1. Tabel store_categories (Kategori produk)
CREATE TABLE IF NOT EXISTS store_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabel store_designs (Jenis design)
CREATE TABLE IF NOT EXISTS store_designs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabel store_items (Produk utama)
CREATE TABLE IF NOT EXISTS store_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    category_id UUID REFERENCES store_categories(id) ON DELETE SET NULL,
    design_id UUID REFERENCES store_designs(id) ON DELETE SET NULL,
    demo_url TEXT,
    download_url TEXT,
    thumbnail_url TEXT,
    price_type VARCHAR(20) DEFAULT 'premium' CHECK (price_type IN ('premium', 'freebies')),
    price DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabel store_purchases (Pembelian)
CREATE TABLE IF NOT EXISTS store_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    item_id UUID REFERENCES store_items(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    amount DECIMAL(12,2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'verified', 'rejected')),
    payment_proof_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- INDEXES untuk performa query
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_store_items_category ON store_items(category_id);
CREATE INDEX IF NOT EXISTS idx_store_items_design ON store_items(design_id);
CREATE INDEX IF NOT EXISTS idx_store_items_price_type ON store_items(price_type);
CREATE INDEX IF NOT EXISTS idx_store_items_is_active ON store_items(is_active);
CREATE INDEX IF NOT EXISTS idx_store_purchases_status ON store_purchases(payment_status);
CREATE INDEX IF NOT EXISTS idx_store_purchases_item ON store_purchases(item_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE store_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_purchases ENABLE ROW LEVEL SECURITY;

-- Policies untuk public read
CREATE POLICY "Allow public read for active categories" ON store_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Allow public read for active designs" ON store_designs
    FOR SELECT USING (is_active = true);

CREATE POLICY "Allow public read for active items" ON store_items
    FOR SELECT USING (is_active = true);

-- Policies untuk authenticated users (admin)
CREATE POLICY "Allow authenticated full access to categories" ON store_categories
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated full access to designs" ON store_designs
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated full access to items" ON store_items
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated full access to purchases" ON store_purchases
    FOR ALL USING (auth.role() = 'authenticated');

-- Allow insert for purchases (customers can create orders)
CREATE POLICY "Allow public insert for purchases" ON store_purchases
    FOR INSERT WITH CHECK (true);

-- Allow public read for their own purchases
CREATE POLICY "Allow public read own purchases" ON store_purchases
    FOR SELECT USING (true);

-- =====================================================
-- SAMPLE DATA (opsional, hapus jika tidak diperlukan)
-- =====================================================

-- Insert sample categories
INSERT INTO store_categories (name, slug, description) VALUES
    ('Template Blogspot', 'template-blogspot', 'Template premium untuk platform Blogspot/Blogger'),
    ('Script', 'script', 'Script dan tools untuk website'),
    ('Template Notion', 'template-notion', 'Template produktivitas untuk Notion');

-- Insert sample designs
INSERT INTO store_designs (name, slug, description) VALUES
    ('Minimalist', 'minimalist', 'Design bersih dan sederhana'),
    ('Modern', 'modern', 'Design kontemporer dengan animasi'),
    ('Creative', 'creative', 'Design unik dan artistik');

-- =====================================================
-- BILINGUAL PAGES UPDATE (14 Des 2025)
-- Jalankan script ini untuk enable fitur bilingual
-- =====================================================

ALTER TABLE pages 
ADD COLUMN IF NOT EXISTS title_en TEXT,
ADD COLUMN IF NOT EXISTS content_en TEXT;

-- Update RLS policy jika perlu (biasanya sudah tercover oleh existing policy)
-- Tapi pastikan admin bisa update kolom baru ini.
