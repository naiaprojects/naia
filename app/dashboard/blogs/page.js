'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase-client';
import Link from 'next/link';
import LogoPathAnimation from '@/components/LogoPathAnimation';

export default function BlogManagementPage() {
    const supabase = createClient();
    const [articles, setArticles] = useState([]);
    const [filteredArticles, setFilteredArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [pageDropdownOpen, setPageDropdownOpen] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const pageDropdownRef = useRef(null);

    const stats = {
        total: articles.length,
        published: articles.filter(a => a.status === 'published').length,
        draft: articles.filter(a => a.status === 'draft').length,
    };

    const totalPages = Math.ceil(filteredArticles.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredArticles.slice(indexOfFirstItem, indexOfLastItem);

    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    useEffect(() => {
        let filtered = articles;

        if (activeTab !== 'all') {
            filtered = filtered.filter(a => a.status === activeTab);
        }

        if (searchQuery.trim() !== '') {
            filtered = filtered.filter(
                (article) =>
                    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    article.slug.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredArticles(filtered);
        setCurrentPage(1);
    }, [searchQuery, articles, activeTab]);

    useEffect(() => {
        if (!pageDropdownOpen) return;

        const handleClickOutside = (event) => {
            if (pageDropdownRef.current && !pageDropdownRef.current.contains(event.target)) {
                setPageDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [pageDropdownOpen]);

    const fetchArticles = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('articles')
                .select(`
                    *,
                    category:categories(name, slug)
                `)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching articles:', error);
                showMessage('Gagal memuat artikel', 'error');
            } else {
                setArticles(data || []);
                setFilteredArticles(data || []);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error fetching articles:', error);
            showMessage('Terjadi kesalahan saat memuat artikel', 'error');
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchArticles();
    }, [fetchArticles]);

    const handleDelete = async (article) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus artikel "${article.title}"?`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from('articles')
                .delete()
                .eq('id', article.id);

            if (error) {
                console.error('Error deleting article:', error);
                showMessage('Gagal menghapus artikel', 'error');
            } else {
                showMessage('Artikel berhasil dihapus');
                fetchArticles();
            }
        } catch (error) {
            console.error('Error deleting article:', error);
            showMessage('Terjadi kesalahan saat menghapus artikel', 'error');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex justify-center items-center bg-white">
                <LogoPathAnimation />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8">
            {message.text && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${message.type === 'error' ? 'bg-red-500' : 'bg-green-500'} text-white`}>
                    {message.text}
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="hidden h-11 items-center gap-0.5 rounded-lg bg-slate-100 p-0.5 lg:inline-flex">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`text-sm h-10 rounded-md px-3 py-2 font-medium transition-all ${activeTab === 'all'
                                ? 'shadow-sm text-slate-900 bg-white'
                                : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            Semua ({stats.total})
                        </button>
                        <button
                            onClick={() => setActiveTab('published')}
                            className={`text-sm h-10 rounded-md px-3 py-2 font-medium transition-all ${activeTab === 'published'
                                ? 'shadow-sm text-slate-900 bg-white'
                                : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            Dipublikasikan ({stats.published})
                        </button>
                        <button
                            onClick={() => setActiveTab('draft')}
                            className={`text-sm h-10 rounded-md px-3 py-2 font-medium transition-all ${activeTab === 'draft'
                                ? 'shadow-sm text-slate-900 bg-white'
                                : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            Draft ({stats.draft})
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Cari artikel..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary w-full sm:w-48"
                            />
                        </div>

                        <Link
                            href="/dashboard/blogs/category"
                            className="inline-flex items-center justify-center px-4 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            Kategori
                        </Link>
                        <Link
                            href="/dashboard/blogs/comment"
                            className="inline-flex items-center justify-center px-4 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                            Komentar
                        </Link>

                        <Link
                            href="/dashboard/blogs/new"
                            className="inline-flex items-center justify-center px-4 py-3 bg-primary text-white font-medium rounded-lg shadow-sm hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Tulis Artikel
                        </Link>
                    </div>
                </div>
            </div>

            {currentItems.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                    <svg className="h-12 w-12 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-slate-900">
                        {searchQuery ? 'Tidak ada artikel yang ditemukan' : 'Tidak ada artikel'}
                    </h3>
                    <p className="text-slate-500 mt-1">
                        {searchQuery
                            ? 'Coba ubah kata kunci pencarian Anda.'
                            : activeTab === 'all'
                                ? 'Belum ada artikel yang dibuat.'
                                : `Tidak ada artikel dengan status "${activeTab === 'published' ? 'Dipublikasikan' : 'Draft'}".`}
                    </p>
                </div>
            ) : (
                <>
                    <div className="hidden md:block bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-primary text-white font-medium">
                                    <tr>
                                        <th className="px-6 py-4 rounded-tl-lg">Judul</th>
                                        <th className="px-6 py-4">Kategori</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Tanggal Dibuat</th>
                                        <th className="px-6 py-4">Views</th>
                                        <th className="px-6 py-4">Dipublikasikan</th>
                                        <th className="px-6 py-4 text-right rounded-tr-lg">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {currentItems.map((article) => (
                                        <tr key={article.id} className="hover:bg-slate-50 transition">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <svg className="h-5 w-5 text-slate-400 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    <span className="font-medium text-slate-900">{article.title}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">
                                                {article.category?.name || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${article.status === 'published'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-slate-100 text-slate-800'
                                                    }`}>
                                                    {article.status === 'published' ? 'Dipublikasikan' : 'Draft'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">
                                                {formatDate(article.created_at)}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">
                                                {article.views || 0}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">
                                                {formatDate(article.published_at)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {article.published_at && (
                                                        <Link
                                                            href={`/blogs/${article.slug}`}
                                                            target="_blank"
                                                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                                                            title="Lihat"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        </Link>
                                                    )}
                                                    <Link
                                                        href={`/dashboard/blogs/edit/${article.id}`}
                                                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                                                        title="Edit"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(article)}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                                        title="Hapus"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="md:hidden space-y-4">
                        {currentItems.map((article) => (
                            <div key={article.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-start flex-1">
                                            <svg className="h-5 w-5 text-slate-400 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <h3 className="text-lg font-medium text-slate-900">{article.title}</h3>
                                        </div>
                                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ml-2 flex-shrink-0 ${article.status === 'published'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-slate-100 text-slate-800'
                                            }`}>
                                            {article.status === 'published' ? 'Dipublikasikan' : 'Draft'}
                                        </span>
                                    </div>
                                    <div className="text-sm text-slate-500 mb-3 ml-8">
                                        <p className="mb-1"><span className="font-medium">Kategori:</span> {article.category?.name || '-'}</p>
                                        <p className="mb-1"><span className="font-medium">Dibuat:</span> {formatDate(article.created_at)}</p>
                                        <p className="mb-1"><span className="font-medium">Views:</span> {article.views || 0}</p>
                                        <p><span className="font-medium">Dipublikasikan:</span> {formatDate(article.published_at)}</p>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                        {article.published_at && (
                                            <Link
                                                href={`/blogs/${article.slug}`}
                                                target="_blank"
                                                className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                                                title="Lihat"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </Link>
                                        )}
                                        <Link
                                            href={`/dashboard/blogs/edit/${article.id}`}
                                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                                            title="Edit"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(article)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                            title="Hapus"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {filteredArticles.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 p-4 mt-6">
                    <nav className="flex items-center space-x-4">
                        <ul className="flex -space-x-px text-sm gap-2">
                            <li>
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="flex items-center justify-center text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 shadow-xs font-medium leading-5 rounded-lg text-sm px-3 h-9 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Sebelumnya
                                </button>
                            </li>
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1))
                                .map((page, idx) => (
                                    <li key={idx}>
                                        <button
                                            onClick={() => setCurrentPage(page)}
                                            className={`flex items-center justify-center border shadow-xs font-medium leading-5 text-sm w-9 h-9 focus:outline-none rounded-lg ${currentPage === page
                                                ? 'text-primary bg-primary/10 border-primary'
                                                : 'text-slate-700 bg-white border-slate-300 hover:bg-slate-100'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    </li>
                                ))}
                            <li>
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className="flex items-center justify-center text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 shadow-xs font-medium leading-5 rounded-lg text-sm px-3 h-9 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Selanjutnya
                                </button>
                            </li>
                        </ul>
                    </nav>

                    <div className="hidden sm:inline relative" ref={pageDropdownRef}>
                        <button
                            onClick={() => setPageDropdownOpen(!pageDropdownOpen)}
                            className="h-9 flex items-center gap-2 px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white hover:bg-slate-50 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                        >
                            <span className="text-slate-700">{itemsPerPage} halaman</span>
                            <svg className={`w-4 h-4 text-slate-400 transition-transform ${pageDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {pageDropdownOpen && (
                            <div className="absolute bottom-full left-0 mb-1 w-32 bg-white border border-slate-200 rounded-lg shadow-lg z-20">
                                {[10, 25, 50, 100].map((value) => (
                                    <button
                                        key={value}
                                        onClick={() => {
                                            setItemsPerPage(value);
                                            setPageDropdownOpen(false);
                                            setCurrentPage(1);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 first:rounded-t-lg last:rounded-b-lg transition-colors ${itemsPerPage === value
                                            ? 'bg-primary/10 text-primary font-medium'
                                            : 'text-slate-700'
                                            }`}
                                    >
                                        {value} halaman
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
