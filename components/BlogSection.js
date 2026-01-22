"use client";

import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';

const BlogSection = ({ data = [] }) => {
    const { t } = useLanguage();

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const displayedArticles = data.slice(0, 6);

    return (
        <section className="text-slate-600 py-12 max-w-7xl mx-auto">
            <div className="container flex flex-col justify-center p-4 mx-auto md:p-8">
                <div className="blogSection">
                    <h1 className="max-w-2xl mx-auto text-center font-manrope font-bold text-4xl text-primarys mb-5 md:text-6xl leading-[50px]">
                        Artikel & Blog
                    </h1>
                    <p className="sm:max-w-2xl sm:mx-auto text-center text-base font-normal leading-7 text-gray-500 mb-9">
                        Jelajahi artikel seputar desain, tips, dan informasi menarik lainnya
                    </p>
                </div>

                {displayedArticles.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Tidak ada artikel</h3>
                        <p className="text-gray-500">Belum ada artikel yang dipublikasikan</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {displayedArticles.map((article) => (
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
                                            <span className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-full shadow-lg">
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

                        <div className="text-center">
                            <Link
                                href="/blogs"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                            >
                                Lihat Semua Artikel
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
};

export default BlogSection;
