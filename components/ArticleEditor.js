'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import dynamic from 'next/dynamic';
import Image from 'next/image';

const ReactQuill = dynamic(() => import('react-quill-new'), {
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-100 h-96 rounded-lg"></div>
});

import 'react-quill-new/dist/quill.snow.css';

export default function ArticleEditor({ article }) {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [editorMode, setEditorMode] = useState('visual');
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
        author_name: 'Agus Triana',
    });

    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    useEffect(() => {
        fetchCategories();
        if (article) {
            setFormData({
                title: article.title,
                slug: article.slug,
                content: article.content,
                excerpt: article.excerpt || '',
                featured_image_url: article.featured_image_url || '',
                category_id: article.category_id || '',
                status: article.status,
                is_featured: article.is_featured || false,
                meta_title: article.meta_title || '',
                meta_description: article.meta_description || '',
                meta_keywords: article.meta_keywords || '',
                author_name: article.author_name || 'Agus Triana',
            });
        }
    }, [article]);

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

    const generateSlug = (title) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    };

    const handleTitleChange = (e) => {
        const title = e.target.value;
        setFormData({
            ...formData,
            title,
            slug: article ? formData.slug : generateSlug(title),
            meta_title: title,
        });
    };

    const handleContentChange = (content) => {
        setFormData({
            ...formData,
            content,
            excerpt: content.replace(/<[^>]*>/g, '').substring(0, 200) + '...',
        });
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const fileExt = file.name.split('.').pop();
        const fileName = `article-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        setLoading(true);
        try {
            const { error: uploadError } = await supabase.storage
                .from('articles')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('articles')
                .getPublicUrl(filePath);

            setFormData({
                ...formData,
                featured_image_url: data.publicUrl,
            });
            showMessage('Gambar berhasil diupload', 'success');
        } catch (error) {
            console.error('Error uploading image:', error);
            showMessage('Gagal mengupload gambar', 'error');
        } finally {
            setLoading(false);
        }
    };

    const calculateReadingTime = (content) => {
        const text = content.replace(/<[^>]*>/g, '');
        const words = text.trim().split(/\s+/).length;
        const minutes = Math.ceil(words / 200);
        return minutes;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title || !formData.content) {
            showMessage('Judul dan konten harus diisi', 'error');
            return;
        }

        setLoading(true);
        try {
            const articleData = {
                ...formData,
                reading_time: calculateReadingTime(formData.content),
                published_at: formData.status === 'published' && !article ? new Date().toISOString() : article?.published_at,
            };

            if (article?.id) {
                const { error } = await supabase
                    .from('articles')
                    .update(articleData)
                    .eq('id', article.id);

                if (error) throw error;
                showMessage('Artikel berhasil diperbarui!');
            } else {
                const { data: newArticle, error } = await supabase
                    .from('articles')
                    .insert([articleData])
                    .select('*, category:categories(name)')
                    .single();

                if (error) throw error;

                if (formData.status === 'published' && newArticle) {
                    try {
                        await fetch('/api/telegram/post', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                article: {
                                    ...newArticle,
                                    category_name: newArticle.category?.name,
                                },
                            }),
                        });
                    } catch (telegramError) {
                        console.error('Error posting to Telegram:', telegramError);
                    }
                }

                showMessage('Artikel berhasil dibuat!');
            }

            setTimeout(() => router.push('/dashboard/blogs'), 1500);
        } catch (error) {
            console.error('Error saving article:', error);
            showMessage('Gagal menyimpan artikel: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'align': [] }],
            [{ 'color': [] }, { 'background': [] }],
            ['link', 'image'],
            ['clean']
        ],
        clipboard: {
            matchVisual: false
        }
    };

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike',
        'list',
        'align',
        'color', 'background',
        'link', 'image'
    ];

    return (
        <>
            {message.text && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${message.type === 'error' ? 'bg-red-500' : 'bg-green-500'} text-white`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8 space-y-6">
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

                        <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
                            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditorMode('visual')}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${editorMode === 'visual'
                                            ? 'bg-white text-primary shadow-sm border border-slate-200'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                            }`}
                                    >
                                        Visual
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditorMode('html')}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${editorMode === 'html'
                                            ? 'bg-white text-primary shadow-sm border border-slate-200'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                            }`}
                                    >
                                        HTML
                                    </button>
                                </div>
                            </div>

                            <div className="p-6">
                                {editorMode === 'visual' ? (
                                    <ReactQuill
                                        theme="snow"
                                        value={formData.content}
                                        onChange={handleContentChange}
                                        modules={modules}
                                        formats={formats}
                                        placeholder="Tulis konten artikel di sini..."
                                        className="quill-editor"
                                        style={{ minHeight: '400px' }}
                                    />
                                ) : (
                                    <textarea
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-mono text-sm"
                                        rows={20}
                                        value={formData.content}
                                        onChange={(e) => {
                                            const newContent = e.target.value;
                                            setFormData({
                                                ...formData,
                                                content: newContent,
                                                excerpt: newContent.replace(/<[^>]*>/g, '').substring(0, 200) + '...'
                                            });
                                        }}
                                        placeholder="<p>Tulis konten artikel dalam format HTML...</p>"
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-4 space-y-6">
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
                                    disabled={loading}
                                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 font-medium transition-colors"
                                >
                                    {loading ? 'Menyimpan...' : (article ? 'Perbarui Artikel' : 'Publikasikan')}
                                </button>
                            </div>
                        </div>

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
                                        Penulis
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                        value={formData.author_name}
                                        onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                                        placeholder="Nama penulis"
                                    />
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

                        <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
                            <h3 className="text-sm font-semibold text-slate-900 mb-4">Gambar Unggulan</h3>

                            {formData.featured_image_url && (
                                <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
                                    <Image
                                        src={formData.featured_image_url}
                                        alt="Featured"
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                </div>
                            )}

                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer"
                            />
                            <p className="mt-2 text-xs text-slate-500">
                                Ukuran maksimal 5MB. Format: JPG, PNG, WebP
                            </p>
                        </div>

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

            <style jsx global>{`
        .quill-editor .ql-container {
          min-height: 400px;
          font-size: 16px;
        }
        .quill-editor .ql-editor {
          min-height: 400px;
        }
      `}</style>
        </>
    );
}
