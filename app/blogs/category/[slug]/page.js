'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import LogoPathAnimation from '@/components/LogoPathAnimation';
import AdSense from '@/components/AdSense';

export default function CategoryPage() {
    const supabase = createClient();
    const params = useParams();
    const [category, setCategory] = useState(null);
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [gridCols, setGridCols] = useState(4);

    useEffect(() => {
        if (params?.slug) {
            fetchCategoryAndArticles();
        }
    }, [params?.slug]);

    const fetchCategoryAndArticles = async () => {
        setLoading(true);
        try {
            const { data: categoryData, error: categoryError } = await supabase
                .from('categories')
                .select('*')
                .eq('slug', params.slug)
                .eq('is_active', true)
                .single();

            if (categoryError) throw categoryError;
            setCategory(categoryData);

            const { data: articlesData, error: articlesError } = await supabase
                .from('articles')
                .select(`
                    *,
                    category:categories(name, slug)
                `)
                .eq('status', 'published')
                .eq('category_id', categoryData.id)
                .order('published_at', { ascending: false });

            if (articlesError) throw articlesError;
            setArticles(articlesData || []);
        } catch (error) {
            console.error('Error fetching category:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const gridColsClass = (() => {
        switch (gridCols) {
            case 3: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
            case 5: return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
            default: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
        }
    })();

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex justify-center items-center bg-white">
                <LogoPathAnimation />
            </div>
        );
    }

    if (!category) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Kategori tidak ditemukan</h1>
                    <Link href="/blogs" className="text-primary hover:underline">
                        Kembali ke Blog
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen py-12 bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link href="/blogs" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Kembali ke Blog
                </Link>

                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        Kategori
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
                        {category.name}
                    </h1>
                    {category.description && (
                        <p className="text-slate-600 max-w-xl mx-auto">
                            {category.description}
                        </p>
                    )}
                    <p className="text-sm text-slate-500 mt-2">
                        {articles.length} artikel
                    </p>
                </div>

                {/* Filters Bar - Mini Version for Category */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm mb-8 flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                        Menampilkan <span className="font-medium text-gray-800">{articles.length}</span> artikel
                    </div>

                    {/* Grid Toggle */}
                    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
                        <span className="text-xs text-gray-500 px-2 hidden sm:inline">Grid:</span>
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

                {/* Top Multiplex Ad */}
                <div className="mb-8">
                    <AdSense
                        slot="3086683905"
                        format="autorelaxed"
                        style={{ display: 'block' }}
                    />
                </div>

                {articles.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl">
                        <svg className="h-12 w-12 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="text-lg font-medium text-slate-900">Belum ada artikel</h3>
                        <p className="text-slate-500 mt-1">Belum ada artikel di kategori ini</p>
                    </div>
                ) : (
                    <div className={`grid ${gridColsClass} gap-6`}>
                        {articles.map((article) => (
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
                                            {article.category?.name}
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

                                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                                        {article.title}
                                    </h3>

                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">
                                        {article.excerpt}
                                    </p>

                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
                                        <span className="text-sm font-medium text-primary group-hover:underline">
                                            Baca Selengkapnya
                                        </span>
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
