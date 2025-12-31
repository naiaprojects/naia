'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import LogoPathAnimation from '@/components/LogoPathAnimation';

export default function CommentModerationPage() {
    const supabase = createClient();
    const [comments, setComments] = useState([]);
    const [filteredComments, setFilteredComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [message, setMessage] = useState({ text: '', type: '' });

    const stats = {
        total: comments.length,
        pending: comments.filter(c => c.status === 'pending').length,
        approved: comments.filter(c => c.status === 'approved').length,
        rejected: comments.filter(c => c.status === 'rejected').length,
    };

    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    useEffect(() => {
        fetchComments();
    }, []);

    useEffect(() => {
        let filtered = comments;

        if (activeTab !== 'all') {
            filtered = filtered.filter(c => c.status === activeTab);
        }

        setFilteredComments(filtered);
    }, [comments, activeTab]);

    const fetchComments = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('comments')
                .select(`
                    *,
                    article:articles(title, slug)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setComments(data || []);
            setFilteredComments(data || []);
        } catch (error) {
            console.error('Error fetching comments:', error);
            showMessage('Gagal memuat komentar', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (commentId, newStatus) => {
        try {
            const response = await fetch('/api/comments', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: commentId, status: newStatus }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Gagal update status');
            }

            showMessage(`Komentar berhasil ${newStatus === 'approved' ? 'disetujui' : 'ditolak'}!`);
            fetchComments();
        } catch (error) {
            console.error('Error updating comment:', error);
            showMessage('Gagal update status: ' + error.message, 'error');
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
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

            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-slate-900">Moderasi Komentar</h1>
                    <p className="text-slate-600 mt-1">Kelola komentar artikel blog</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="flex items-center gap-0.5 rounded-lg bg-slate-100 p-0.5">
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
                            onClick={() => setActiveTab('pending')}
                            className={`text-sm h-10 rounded-md px-3 py-2 font-medium transition-all ${activeTab === 'pending'
                                ? 'shadow-sm text-slate-900 bg-white'
                                : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            Pending ({stats.pending})
                        </button>
                        <button
                            onClick={() => setActiveTab('approved')}
                            className={`text-sm h-10 rounded-md px-3 py-2 font-medium transition-all ${activeTab === 'approved'
                                ? 'shadow-sm text-slate-900 bg-white'
                                : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            Disetujui ({stats.approved})
                        </button>
                        <button
                            onClick={() => setActiveTab('rejected')}
                            className={`text-sm h-10 rounded-md px-3 py-2 font-medium transition-all ${activeTab === 'rejected'
                                ? 'shadow-sm text-slate-900 bg-white'
                                : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            Ditolak ({stats.rejected})
                        </button>
                    </div>
                </div>

                {filteredComments.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                        <svg className="h-12 w-12 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        <h3 className="text-lg font-medium text-slate-900">Tidak ada komentar</h3>
                        <p className="text-slate-500 mt-1">
                            {activeTab === 'all' ? 'Belum ada komentar yang masuk.' : `Tidak ada komentar dengan status "${activeTab}".`}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredComments.map((comment) => (
                            <div key={comment.id} className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-slate-900">{comment.author_name}</h3>
                                                <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${comment.status === 'approved'
                                                    ? 'bg-green-100 text-green-800'
                                                    : comment.status === 'rejected'
                                                        ? 'bg-red-100 text-red-800'
                                                        : 'bg-amber-100 text-amber-800'
                                                    }`}>
                                                    {comment.status === 'approved' ? 'Disetujui' : comment.status === 'rejected' ? 'Ditolak' : 'Pending'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500 mb-1">{comment.author_email}</p>
                                            <p className="text-sm text-slate-500">
                                                Artikel: <span className="font-medium text-slate-700">{comment.article?.title || 'Unknown'}</span>
                                            </p>
                                        </div>
                                        <span className="text-xs text-slate-400">{formatDate(comment.created_at)}</span>
                                    </div>

                                    <p className="text-slate-700 leading-relaxed mb-4 p-4 bg-slate-50 rounded-lg">
                                        {comment.content}
                                    </p>

                                    {comment.status === 'pending' && (
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleUpdateStatus(comment.id, 'approved')}
                                                className="flex-1 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                                            >
                                                ✓ Setujui
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(comment.id, 'rejected')}
                                                className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                                            >
                                                ✕ Tolak
                                            </button>
                                        </div>
                                    )}

                                    {comment.status !== 'pending' && (
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleUpdateStatus(comment.id, 'pending')}
                                                className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors text-sm"
                                            >
                                                Kembalikan ke Pending
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
