'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';
import LogoPathAnimation from '@/components/LogoPathAnimation';

export default function PagesManagementPage() {
    const supabase = createClient();
    const router = useRouter();

    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid');
    const [message, setMessage] = useState({ text: '', type: '' });
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        checkAuthAndFetchData();
    }, []);

    const checkAuthAndFetchData = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            showMessage('Error: Session not found. Please login again.', 'error');
            setLoading(false);
            return;
        }
        await fetchData();
    };

    const fetchData = async () => {
        try {
            const { data, error } = await supabase
                .from('pages')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPages(data || []);
        } catch (error) {
            console.error('Error fetching pages:', error);
            showMessage('Error: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this page?')) return;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { error } = await supabase
                .from('pages')
                .delete()
                .eq('id', id);

            if (error) throw error;

            showMessage('Page deleted successfully!');
            fetchData();
            await fetch('/api/revalidate', { method: 'POST' });
            router.refresh();
        } catch (error) {
            console.error('Error deleting page:', error);
            showMessage('Error: ' + error.message, 'error');
        }
    };

    const filteredPages = pages.filter(page =>
        page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        page.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <LogoPathAnimation />
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-8">
            <div className="space-y-6">

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <Breadcrumb />
                        <h1 className="text-3xl font-bold text-slate-800 tracking-tight mt-2">Pages Management</h1>
                        <p className="text-slate-500 mt-1">Manage static pages and website content</p>
                    </div>
                    <button
                        onClick={() => router.push('/dashboard/pages/new')}
                        className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-slate-200 active:scale-95"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Add Page
                    </button>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex w-full gap-3">
                        <div className="relative flex-1">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search pages..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                            />
                        </div>
                        <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {message.text && (
                    <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-xl shadow-2xl z-50 text-white font-medium animate-fade-in-up ${message.type === 'error' ? 'bg-red-500' : 'bg-slate-900'
                        }`}>
                        {message.text}
                    </div>
                )}

                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
                        {filteredPages.map((page) => (
                            <div key={page.id} className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 p-6 flex flex-col relative overflow-hidden">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${page.is_active
                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                        : 'bg-slate-50 text-slate-500 border-slate-200'
                                        }`}>
                                        {page.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                <h3 className="font-bold text-slate-800 text-xl mb-2 line-clamp-1">{page.title}</h3>
                                <div className="text-sm text-slate-500 mb-4 bg-slate-50 p-2 rounded-lg break-all">
                                    /pages/{page.slug}
                                </div>

                                {page.meta_description && (
                                    <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">
                                        {page.meta_description}
                                    </p>
                                )}

                                <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                                    <div className="text-xs text-slate-400">
                                        {new Date(page.created_at).toLocaleDateString()}
                                    </div>
                                    <div className="flex gap-2">
                                        <a href={`/pages/${page.slug}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-blue-500 transition">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                        </a>
                                        <button onClick={() => router.push(`/dashboard/pages/edit/${page.id}`)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-600 transition hover:text-primary">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        </button>
                                        <button onClick={() => handleDelete(page.id)} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredPages.length === 0 && (
                            <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400">
                                <svg className="w-16 h-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                <p>No pages found</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="lg:hidden space-y-3 animate-fade-in-up">
                            {filteredPages.map((page) => (
                                <div
                                    key={page.id}
                                    className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden"
                                >
                                    <div className="p-4">
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-bold text-slate-800 text-sm">{page.title}</h3>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${page.is_active
                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                        : 'bg-slate-50 text-slate-500 border-slate-200'
                                                        }`}>
                                                        {page.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-400 font-mono mt-0.5">/pages/{page.slug}</p>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">
                                            Updated: {new Date(page.updated_at || page.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex border-t border-slate-100">
                                        <a
                                            href={`/pages/${page.slug}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 py-2.5 text-xs font-medium text-blue-500 hover:bg-blue-50 transition flex items-center justify-center gap-1"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                            View
                                        </a>
                                        <button
                                            onClick={() => router.push(`/dashboard/pages/edit/${page.id}`)}
                                            className="flex-1 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition flex items-center justify-center gap-1 border-l border-slate-100"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(page.id)}
                                            className="flex-1 py-2.5 text-xs font-medium text-red-500 hover:bg-red-50 transition flex items-center justify-center gap-1 border-l border-slate-100"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {filteredPages.length === 0 && (
                                <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                                    <svg className="w-16 h-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    <p>No pages found</p>
                                </div>
                            )}
                        </div>

                        <div className="hidden lg:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-fade-in-up">
                            <div className="overflow-x-auto w-full">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Page</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">URL Slug</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Updated</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredPages.map((page) => (
                                            <tr key={page.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-800">{page.title}</div>
                                                    {page.meta_title && <div className="text-xs text-slate-500 mt-0.5 max-w-xs truncate">{page.meta_title}</div>}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 text-sm">
                                                    {page.slug}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 text-sm">
                                                    {new Date(page.updated_at || page.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border inline-flex ${page.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                                        {page.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <a href={`/pages/${page.slug}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition">
                                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                        </a>
                                                        <button onClick={() => router.push(`/dashboard/pages/edit/${page.id}`)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition hover:text-primary">
                                                            Edit
                                                        </button>
                                                        <button onClick={() => handleDelete(page.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition">
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

            </div>
        </div>
    );
}