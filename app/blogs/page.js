'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase-client';
import Link from 'next/link';
import LogoPathAnimation from '@/components/LogoPathAnimation';
import AdSense from '@/components/AdSense';

export default function BlogsPage() {
    const supabase = createClient();
    const [articles, setArticles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [featuredArticle, setFeaturedArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState({ id: 'all', name: 'Semua Kategori', slug: 'all' });
    const [searchQuery, setSearchQuery] = useState('');
    const [heroBackground, setHeroBackground] = useState('');
    const [gridCols, setGridCols] = useState(4);

    useEffect(() => {
        fetchData();
        fetchHeroBackground();
    }, []);

    const fetchHeroBackground = async () => {
        try {
            const response = await fetch('/api/hero');
            const data = await response.json();
            if (data?.background_image) {
                setHeroBackground(data.background_image);
            }
        } catch (error) {
            console.error('Error fetching hero background:', error);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [articlesRes, categoriesRes, featuredRes] = await Promise.all([
                supabase
                    .from('articles')
                    .select(`
                        *,
                        category:categories(id, name, slug)
                    `)
                    .eq('status', 'published')
                    .order('published_at', { ascending: false }),
                supabase
                    .from('categories')
                    .select('*')
                    .eq('is_active', true)
                    .order('name', { ascending: true }),
                supabase
                    .from('articles')
                    .select(`
                        *,
                        category:categories(id, name, slug)
                    `)
                    .eq('status', 'published')
                    .eq('is_featured', true)
                    .order('published_at', { ascending: false })
                    .limit(1)
                    .single()
            ]);

            if (articlesRes.data) setArticles(articlesRes.data);
            if (categoriesRes.data) setCategories(categoriesRes.data);
            if (featuredRes.data) setFeaturedArticle(featuredRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredArticles = articles.filter(article => {
        const matchesCategory = selectedCategory.slug === 'all' || article.category?.slug === selectedCategory.slug;
        const matchesSearch = !searchQuery ||
            article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const gridColsClass = useMemo(() => {
        switch (gridCols) {
            case 3: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
            case 5: return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
            default: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
        }
    }, [gridCols]);

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedCategory({ id: 'all', name: 'Semua Kategori', slug: 'all' });
    };

    const hasActiveFilters = searchQuery || selectedCategory.slug !== 'all';

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex justify-center items-center bg-white">
                <LogoPathAnimation />
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <section
                id="hero-section"
                className="mx-4 rounded-b-3xl bg-primary pt-32 pb-20 relative overflow-hidden bg-center bg-cover shadow-2xl mb-12"
                style={heroBackground ? { backgroundImage: `url('${heroBackground}')` } : {}}
            >
                <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>

                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight leading-tight text-white">
                        Artikel & Blog
                    </h1>
                    <p className="text-lg md:text-xl text-orange-100 max-w-3xl mx-auto leading-relaxed">
                        Jelajahi artikel seputar desain, tips, dan informasi menarik lainnya
                    </p>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {featuredArticle && (
                    <Link href={`/blogs/${featuredArticle.slug}`} className="block mb-12 group">
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300">
                            <div className="grid md:grid-cols-2 gap-6">
                                {featuredArticle.featured_image_url && (
                                    <div className="relative h-64 md:h-auto overflow-hidden">
                                        <img
                                            src={featuredArticle.featured_image_url}
                                            alt={featuredArticle.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute top-4 left-4 bg-gradient-to-r from-primary to-orange-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                                            Featured
                                        </div>
                                    </div>
                                )}
                                <div className="p-6 md:p-8 flex flex-col justify-center">
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider">
                                            {featuredArticle.category?.name}
                                        </span>
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3 group-hover:text-primary transition-colors">
                                        {featuredArticle.title}
                                    </h2>
                                    <p className="text-gray-500 mb-4 line-clamp-3">
                                        {featuredArticle.excerpt}
                                    </p>
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto w-full">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-medium text-gray-900">{formatDate(featuredArticle.published_at)}</span>
                                        </div>
                                        <span className="text-sm text-gray-400 flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            {featuredArticle.views || 0}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>
                )}

                {/* Filters Bar - Header Card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6 shadow-sm mb-8">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Cari artikel..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition text-sm outline-none"
                            />
                        </div>

                        {/* Category Filter */}
                        <select
                            value={selectedCategory.id === 'all' ? '' : selectedCategory.id}
                            onChange={(e) => {
                                const selectedId = e.target.value;
                                if (selectedId === "") {
                                    setSelectedCategory({ id: 'all', name: 'Semua Kategori', slug: 'all' });
                                } else {
                                    const cat = categories.find(c => c.id === selectedId);
                                    if (cat) setSelectedCategory(cat);
                                }
                            }}
                            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition text-sm outline-none min-w-[200px]"
                        >
                            <option value="">Semua Kategori</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Bottom Bar */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-4">
                            <p className="text-sm text-gray-500">
                                Menampilkan <span className="font-medium text-gray-800">{filteredArticles.length}</span> dari <span className="font-medium text-gray-800">{articles.length}</span> artikel
                            </p>

                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="text-sm text-primary hover:text-orange-700 font-medium flex items-center gap-1"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Reset Filter
                                </button>
                            )}
                        </div>

                        {/* Grid Toggle */}
                        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
                            <span className="text-xs text-gray-500 px-2">Grid:</span>
                            {[3, 4, 5].map(cols => (
                                <button
                                    key={cols}
                                    onClick={() => setGridCols(cols)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${gridCols === cols
                                        ? 'bg-white text-primary shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {cols}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Top Multiplex Ad */}
                <div className="mb-8">
                    <AdSense
                        slot="3086683905"
                        format="autorelaxed"
                        style={{ display: 'block' }}
                    />
                </div>

                {filteredArticles.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Tidak ada artikel</h3>
                        <p className="text-gray-500 mb-4">Coba ubah filter atau kata kunci pencarian</p>
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition"
                            >
                                Reset Filter
                            </button>
                        )}
                    </div>
                ) : (
                    <div className={`grid ${gridColsClass} gap-6`}>
                        {filteredArticles.map((article) => (
                            <Link
                                key={article.id}
                                href={`/blogs/${article.slug}`}
                                className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300 flex flex-col h-full"
                            >
                                <div className="bg-gray-100 relative overflow-hidden aspect-[4/3]">
                                    {article.featured_image_url ? (
                                        <img
                                            src={article.featured_image_url}
                                            alt={article.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                            <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}

                                    <div className="absolute top-3 right-3">
                                        <span className="px-3 py-1 bg-gradient-to-r from-primary to-orange-600 text-white text-xs font-bold rounded-full shadow-lg">
                                            {article.category?.name || 'Blog'}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-4 flex flex-col flex-1">
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-medium rounded-full">
                                            {formatDate(article.published_at)}
                                        </span>
                                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-medium rounded-full">
                                            {article.reading_time} min baca
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-gray-800 group-hover:text-primary transition-colors line-clamp-2 mb-2 text-lg">
                                        {article.title}
                                    </h3>

                                    <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-1">
                                        {article.excerpt}
                                    </p>

                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
                                        <div className="font-bold text-sm text-primary group-hover:underline">
                                            Baca Selengkapnya
                                        </div>
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            {article.views || 0}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Bottom Multiplex Ad */}
                <div className="mt-8">
                    <AdSense
                        slot="3086683905"
                        format="autorelaxed"
                        style={{ display: 'block' }}
                    />
                </div>
            </div>
        </main>
    );
}
