'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import LogoPathAnimation from '@/components/LogoPathAnimation';
import TiptapEditor from '@/components/TiptapEditor';
import FileUploader from '@/components/FileUploader';
import { generateSlug, calculateReadingTime, extractExcerpt } from '@/lib/blog-utils';

export default function EditArticlePage() {
    const supabase = createClient();
    const router = useRouter();
    const params = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState([]);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        content: '',
        excerpt: '',
        featured_image_url: '',
        category_id: '',
        status: 'draft',
        is_featured: false,
        meta_title: '',
        meta_description: '',
        meta_keywords: '',
        published_at: '',
    });

    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    useEffect(() => {
        fetchCategories();
        fetchArticle();
    }, [params.id]);

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .eq('is_active', true)
                .order('name');

            if (error) throw error;
            setCategories(data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchArticle = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('articles')
                .select('*')
                .eq('id', params.id)
                .single();

            if (error) throw error;

            if (data) {
                setFormData({
                    title: data.title || '',
                    slug: data.slug || '',
                    content: data.content || '',
                    excerpt: data.excerpt || '',
                    featured_image_url: data.featured_image_url || '',
                    category_id: data.category_id || '',
                    status: data.status || 'draft',
                    is_featured: data.is_featured || false,
                    meta_title: data.meta_title || '',
                    meta_description: data.meta_description || '',
                    meta_keywords: data.meta_keywords || '',
                    published_at: data.published_at || '',
                });
            }
        } catch (error) {
            console.error('Error fetching article:', error);
            showMessage('Gagal memuat artikel', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleTitleChange = (e) => {
        const title = e.target.value;
        setFormData({
            ...formData,
            title,
            meta_title: formData.meta_title || title,
        });
    };

    const handleContentChange = (content) => {
        setFormData({
            ...formData,
            content,
            excerpt: extractExcerpt(content),
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title || !formData.content) {
            showMessage('Judul dan konten harus diisi', 'error');
            return;
        }

        setSaving(true);
        try {
            const wasPublished = formData.published_at !== null && formData.published_at !== '';
            const isNowPublished = formData.status === 'published';

            const articleData = {
                ...formData,
                reading_time: calculateReadingTime(formData.content),
                published_at: isNowPublished && !wasPublished ? new Date().toISOString() : formData.published_at,
            };

            const { data: updatedArticle, error } = await supabase
                .from('articles')
                .update(articleData)
                .eq('id', params.id)
                .select('*, category:categories(name)')
                .single();

            if (error) throw error;

            if (isNowPublished && !wasPublished && updatedArticle) {
                try {
                    const response = await fetch('/api/telegram/post', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            article: {
                                ...updatedArticle,
                                category_name: updatedArticle.category?.name,
                            },
                        }),
                    });

                    if (!response.ok) {
                        console.error('Failed to post to Telegram');
                    }
                } catch (telegramError) {
                    console.error('Error posting to Telegram:', telegramError);
                }
            }

            showMessage('Artikel berhasil diperbarui!');
            setTimeout(() => router.push('/dashboard/blogs'), 1500);
        } catch (error) {
            console.error('Error updating article:', error);
            showMessage('Gagal memperbarui artikel: ' + error.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex justify-center items-center bg-white">
                <LogoPathAnimation />
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8">
            {message.text && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${message.type === 'error' ? 'bg-red-500' : 'bg-green-500'} text-white`}>
                    {message.text}
                </div>
            )}

            <div className="px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <Link
                        href="/dashboard/blogs"
                        className="inline-flex items-center gap-2 text-primary hover:underline mb-4"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Kembali ke Artikel
                    </Link>
                    <h1 className="text-3xl font-bold text-slate-900">Edit Artikel</h1>
                    <p className="text-slate-600 mt-1">Perbarui artikel Anda</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* LEFT COLUMN - Editor (70%) */}
                        <div className="lg:col-span-8 space-y-6">
                            {/* Title */}
                            <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Judul Artikel
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 text-lg font-semibold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                    value={formData.title}
                                    onChange={handleTitleChange}
                                    placeholder="Masukkan judul artikel..."
                                    required
                                />
                            </div>

                            {/* Content Editor */}
                            <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
                                <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                                    <h3 className="text-sm font-semibold text-slate-900">Konten Artikel</h3>
                                </div>
                                <div className="p-6">
                                    <TiptapEditor
                                        content={formData.content}
                                        onChange={handleContentChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN - Settings (30%) */}
                        <div className="lg:col-span-4 space-y-6">
                            {/* Action Buttons */}
                            <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
                                <div className="flex justify-between items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => router.push('/dashboard/blogs')}
                                        className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 font-medium transition-colors"
                                    >
                                        {saving ? 'Menyimpan...' : 'Perbarui'}
                                    </button>
                                </div>
                            </div>

                            {/* Publish Settings */}
                            <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
                                <h3 className="text-sm font-semibold text-slate-900 mb-4">Publikasi</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Status
                                        </label>
                                        <select
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        >
                                            <option value="draft">Draft</option>
                                            <option value="published">Published</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            URL Slug
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                                            value={formData.slug}
                                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary"
                                                checked={formData.is_featured}
                                                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                                            />
                                            <span className="text-sm text-slate-700">Artikel Unggulan</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Category */}
                            <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
                                <h3 className="text-sm font-semibold text-slate-900 mb-4">Kategori</h3>
                                <select
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                    value={formData.category_id}
                                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                    required
                                >
                                    <option value="">Pilih Kategori</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Featured Image */}
                            <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
                                <FileUploader
                                    bucket="articles"
                                    folder=""
                                    label="Gambar Unggulan"
                                    value={formData.featured_image_url}
                                    onChange={(url) => setFormData({ ...formData, featured_image_url: url })}
                                    helperText="Upload gambar untuk artikel (PNG, JPG, max 5MB)"
                                />
                            </div>

                            {/* SEO Settings */}
                            <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
                                <h3 className="text-sm font-semibold text-slate-900 mb-4">SEO</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Meta Title
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                                            value={formData.meta_title}
                                            onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                                            placeholder="Auto dari judul"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Meta Description
                                        </label>
                                        <textarea
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                                            rows={3}
                                            value={formData.meta_description}
                                            onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                                            placeholder="Deskripsi untuk mesin pencari"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Meta Keywords
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                                            value={formData.meta_keywords}
                                            onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                                            placeholder="keyword1, keyword2, keyword3"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
