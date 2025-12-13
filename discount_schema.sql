-- =====================================================
-- DISCOUNT MODULE - SQL SCHEMA
-- Jalankan script ini di Supabase SQL Editor
-- =====================================================

-- 1. Tabel discounts (Kupon/Diskon)
CREATE TABLE IF NOT EXISTS discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    -- Tipe diskon: 'auto' = otomatis diterapkan, 'code' = perlu input kode
    discount_type VARCHAR(20) NOT NULL DEFAULT 'code' CHECK (discount_type IN ('auto', 'code')),
    -- Tipe nilai: 'percentage' = persen, 'fixed' = nominal tetap
    discount_value_type VARCHAR(20) NOT NULL DEFAULT 'percentage' CHECK (discount_value_type IN ('percentage', 'fixed')),
    -- Nilai diskon (misal: 10 untuk 10% atau 50000 untuk Rp50.000)
    discount_value DECIMAL(12,2) NOT NULL DEFAULT 0,
    -- Berlaku untuk: 'all' = semua layanan, 'services' = layanan tertentu, 'store' = produk store
    applies_to VARCHAR(20) DEFAULT 'all' CHECK (applies_to IN ('all', 'services', 'store')),
    -- Array ID layanan yang eligible (jika applies_to = 'services')
    service_ids UUID[] DEFAULT '{}',
    -- Array nama paket yang eligible (opsional, jika ingin spesifik per paket)
    package_names TEXT[] DEFAULT '{}',
    -- Minimal order untuk bisa pakai diskon
    min_order_amount DECIMAL(12,2) DEFAULT 0,
    -- Maksimal potongan (untuk percentage type)
    max_discount_amount DECIMAL(12,2),
    -- Batas penggunaan total
    usage_limit INTEGER,
    -- Jumlah sudah digunakan
    usage_count INTEGER DEFAULT 0,
    -- Periode berlaku
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    -- Status aktif
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- INDEXES untuk performa query
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_discounts_code ON discounts(code);
CREATE INDEX IF NOT EXISTS idx_discounts_type ON discounts(discount_type);
CREATE INDEX IF NOT EXISTS idx_discounts_active ON discounts(is_active);
CREATE INDEX IF NOT EXISTS idx_discounts_dates ON discounts(start_date, end_date);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;

-- Policy: Public dapat membaca diskon aktif
CREATE POLICY "Allow public read for active discounts" ON discounts
    FOR SELECT USING (is_active = true);

-- Policy: Authenticated users (admin) full access
CREATE POLICY "Allow authenticated full access to discounts" ON discounts
    FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- UPDATE ORDERS TABLE - Tambah kolom diskon
-- =====================================================

-- Tambah kolom diskon ke tabel orders (jika belum ada)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_id UUID REFERENCES discounts(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_code VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS original_price DECIMAL(12,2);

-- Tambah kolom diskon ke tabel store_purchases (jika belum ada)
ALTER TABLE store_purchases ADD COLUMN IF NOT EXISTS discount_id UUID REFERENCES discounts(id) ON DELETE SET NULL;
ALTER TABLE store_purchases ADD COLUMN IF NOT EXISTS discount_code VARCHAR(50);
ALTER TABLE store_purchases ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE store_purchases ADD COLUMN IF NOT EXISTS original_amount DECIMAL(12,2);

-- =====================================================
-- FUNCTION: Increment usage count
-- =====================================================
CREATE OR REPLACE FUNCTION increment_discount_usage(discount_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE discounts
    SET usage_count = usage_count + 1,
        updated_at = now()
    WHERE id = discount_uuid;
END;
$$ LANGUAGE plpgsql;
