-- =====================================================
-- BLOG MODULE - SQL SCHEMA
-- Jalankan script ini di Supabase SQL Editor
-- =====================================================

-- 1. Tabel categories (Kategori artikel)
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabel articles (Artikel blog)
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Content
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    
    -- Author
    author_id UUID,
    author_name VARCHAR(255),
    
    -- Category
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    
    -- Media
    featured_image_url TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    is_featured BOOLEAN DEFAULT false,
    
    -- Stats
    views INTEGER DEFAULT 0,
    reading_time INTEGER,
    
    -- SEO
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT,
    
    -- Timestamps
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabel comments (Komentar artikel)
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    
    -- Author
    author_name VARCHAR(255) NOT NULL,
    author_email VARCHAR(255) NOT NULL,
    
    -- Content
    content TEXT NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- INDEXES untuk performa query
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);

CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at);
CREATE INDEX IF NOT EXISTS idx_articles_featured ON articles(is_featured);

CREATE INDEX IF NOT EXISTS idx_comments_article ON comments(article_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Categories: Public read active, admin full access
CREATE POLICY "Allow public read active categories" ON categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Allow authenticated full access to categories" ON categories
    FOR ALL USING (auth.role() = 'authenticated');

-- Articles: Public read published, admin full access
CREATE POLICY "Allow public read published articles" ON articles
    FOR SELECT USING (status = 'published');

CREATE POLICY "Allow authenticated full access to articles" ON articles
    FOR ALL USING (auth.role() = 'authenticated');

-- Comments: Public insert, read approved, admin full access
CREATE POLICY "Allow public insert comments" ON comments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read approved comments" ON comments
    FOR SELECT USING (status = 'approved');

CREATE POLICY "Allow authenticated full access to comments" ON comments
    FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- FUNCTIONS untuk auto-update updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_articles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_categories_updated_at();

CREATE TRIGGER articles_updated_at
    BEFORE UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION update_articles_updated_at();

CREATE TRIGGER comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_comments_updated_at();

-- =====================================================
-- SAMPLE DATA (opsional)
-- =====================================================

-- Insert sample categories
INSERT INTO categories (name, slug, description) VALUES
    ('Tutorial', 'tutorial', 'Tutorial dan panduan lengkap'),
    ('Tips & Trik', 'tips-trik', 'Tips dan trik berguna'),
    ('Berita', 'berita', 'Berita dan update terbaru'),
    ('Review', 'review', 'Review produk dan layanan')
ON CONFLICT (slug) DO NOTHING;
