-- =====================================================
-- TESTIMONIALS MODULE - SQL SCHEMA
-- Jalankan script ini di Supabase SQL Editor
-- =====================================================

CREATE TABLE IF NOT EXISTS testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Legacy support (untuk testimoni lama berbasis gambar)
    image_url TEXT,
    alt_text TEXT,
    
    -- Integrasi dengan orders
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    store_order_id UUID REFERENCES store_purchases(id) ON DELETE SET NULL,
    
    -- Data customer
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    
    -- Rating per kategori (1-5)
    rating_service INTEGER DEFAULT 5 CHECK (rating_service >= 1 AND rating_service <= 5),
    rating_design INTEGER DEFAULT 5 CHECK (rating_design >= 1 AND rating_design <= 5),
    rating_communication INTEGER DEFAULT 5 CHECK (rating_communication >= 1 AND rating_communication <= 5),
    
    -- Review dan info
    review_text TEXT,
    service_name VARCHAR(255),
    product_name VARCHAR(255),
    package_name VARCHAR(255),
    
    -- Management
    token VARCHAR(100) UNIQUE,
    is_featured BOOLEAN DEFAULT false,
    
    -- Review link expiration tracking
    review_link_generated_at TIMESTAMPTZ,
    review_link_expires_at TIMESTAMPTZ,
    
    -- Timestamps
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- INDEXES untuk performa query
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_testimonials_order ON testimonials(order_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_store_order ON testimonials(store_order_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_token ON testimonials(token);
CREATE INDEX IF NOT EXISTS idx_testimonials_featured ON testimonials(is_featured);
CREATE INDEX IF NOT EXISTS idx_testimonials_submitted ON testimonials(submitted_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Public dapat melihat testimonials yang sudah submitted
CREATE POLICY "Allow public read submitted testimonials" ON testimonials
    FOR SELECT USING (submitted_at IS NOT NULL);

-- Public dapat insert testimonial baru (dari form)
CREATE POLICY "Allow public insert testimonials" ON testimonials
    FOR INSERT WITH CHECK (true);

-- Public dapat update testimonial mereka sendiri via token
CREATE POLICY "Allow public update own testimonials" ON testimonials
    FOR UPDATE USING (true);

-- Authenticated users (admin) full access
CREATE POLICY "Allow authenticated full access to testimonials" ON testimonials
    FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- FUNCTION untuk auto-update updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_testimonials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER testimonials_updated_at
    BEFORE UPDATE ON testimonials
    FOR EACH ROW
    EXECUTE FUNCTION update_testimonials_updated_at();
