// components/PageContent.js
'use client';

import { useLanguage } from '@/lib/LanguageContext';

export default function PageContent({ page }) {
    const { language, t } = useLanguage();

    // Format date based on language
    const formatDate = (dateString) => {
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString(
            language === 'id' ? 'id-ID' : 'en-US',
            options
        );
    };

    // Get content based on language - use content_en if available and language is English
    const getContent = () => {
        if (language === 'en' && page.content_en) {
            return page.content_en;
        }
        // Default to main content (Indonesian or fallback)
        return page.content;
    };

    // Get title based on language
    const getTitle = () => {
        if (language === 'en' && page.title_en) {
            return page.title_en;
        }
        return page.title;
    };

    const homeText = language === 'id' ? 'Beranda' : 'Home';
    const createdText = language === 'id' ? 'Dibuat' : 'Created';
    const updatedText = language === 'id' ? 'Diperbarui' : 'Updated';
    const shareText = language === 'id' ? 'Bagikan halaman ini:' : 'Share this page:';
    const backText = language === 'id' ? 'Kembali ke Beranda' : 'Back to Home';

    return (
        <div className="min-h-screen mt-12 bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    {/* Breadcrumb */}
                    <nav className="flex mb-6" aria-label="Breadcrumb">
                        <ol className="inline-flex items-center space-x-2 text-sm">
                            <li className="inline-flex items-center">
                                <a href="/" className="text-slate-600 hover:text-primary transition-colors flex">
                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                                    </svg>
                                    {homeText}
                                </a>
                            </li>
                            <li>
                                <div className="flex items-center">
                                    <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                                    </svg>
                                    <span className="ml-2 text-slate-500">Pages</span>
                                </div>
                            </li>
                            <li aria-current="page">
                                <div className="flex items-center">
                                    <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                                    </svg>
                                    <span className="ml-2 text-slate-700 font-medium">{getTitle()}</span>
                                </div>
                            </li>
                        </ol>
                    </nav>

                    {/* Main Content Card */}
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        {/* Header Section */}
                        <div className="px-6 py-8 border-b border-gray-200">
                            <h1 className="text-3xl lg:text-4xl font-bold text-slate-800 mb-4">
                                {getTitle()}
                            </h1>

                            {/* Metadata Info */}
                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span>{createdText}: {formatDate(page.created_at)}</span>
                                </div>

                                {page.updated_at && page.updated_at !== page.created_at && (
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        <span>{updatedText}: {formatDate(page.updated_at)}</span>
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span>Agus Triana</span>
                                </div>
                            </div>
                        </div>

                        {/* Content Section */}
                        <div className="px-6 py-8">
                            <div
                                className="ql-editor prose prose-lg max-w-none text-slate-700"
                                dangerouslySetInnerHTML={{ __html: getContent() }}
                                style={{
                                    padding: 0,
                                    border: 'none'
                                }}
                            />
                        </div>

                        {/* Footer Section dengan Share Buttons */}
                        <div className="px-6 py-6 bg-gray-50 border-t border-gray-200">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="text-sm text-slate-600">
                                    {shareText}
                                </div>
                                {/* Share buttons passed as children */}
                            </div>
                        </div>
                    </div>

                    {/* Back Button */}
                    <div className="mt-8">
                        <a
                            href="/"
                            className="inline-flex items-center gap-2 text-slate-600 hover:text-primary transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            {backText}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
