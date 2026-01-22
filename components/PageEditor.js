'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import dynamic from 'next/dynamic';

const ReactQuill = dynamic(() => import('react-quill-new'), {
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-100 h-96 rounded-lg"></div>
});

import 'react-quill-new/dist/quill.snow.css';

export default function PageEditor({ page }) {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [editorMode, setEditorMode] = useState('visual');
    const [activeLangTab, setActiveLangTab] = useState('id');
    const [isTranslating, setIsTranslating] = useState(false);
    const [formData, setFormData] = useState({
        slug: '',
        title: '',
        content: '',
        title_en: '',
        content_en: '',
        meta_title: '',
        meta_description: '',
        is_active: true
    });

    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    useEffect(() => {
        if (page) {
            setFormData({
                slug: page.slug,
                title: page.title,
                content: page.content,
                title_en: page.title_en || '',
                content_en: page.content_en || '',
                meta_title: page.meta_title || '',
                meta_description: page.meta_description || '',
                is_active: page.is_active
            });
        }
    }, [page]);

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
            slug: page ? formData.slug : generateSlug(title),
            meta_title: formData.meta_title || title,
        });
    };

    const handleAutoTranslate = async () => {
        if (!formData.title && !formData.content) {
            showMessage('Isi konten Indonesia terlebih dahulu', 'error');
            return;
        }

        if (!confirm('Ini akan menimpa konten English yang ada. Lanjutkan?')) return;

        setIsTranslating(true);
        try {
            let translatedTitle = formData.title_en;
            if (formData.title) {
                const res = await fetch('/api/translate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: formData.title })
                });
                const data = await res.json();
                if (data.text) translatedTitle = data.text;
            }

            let translatedContent = formData.content_en;
            if (formData.content) {
                const res = await fetch('/api/translate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: formData.content })
                });
                const data = await res.json();
                if (data.text) translatedContent = data.text;
            }

            setFormData(prev => ({
                ...prev,
                title_en: translatedTitle,
                content_en: translatedContent
            }));
            showMessage('Auto translation selesai! Silakan review.');
        } catch (error) {
            console.error('Translation error:', error);
            showMessage('Gagal menerjemahkan', 'error');
        } finally {
            setIsTranslating(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title || !formData.content) {
            showMessage('Judul dan konten harus diisi', 'error');
            return;
        }

        setLoading(true);
        try {
            const dataToSave = {
                ...formData,
                updated_at: new Date().toISOString()
            };

            if (page?.id) {
                const { error } = await supabase
                    .from('pages')
                    .update(dataToSave)
                    .eq('id', page.id);

                if (error) throw error;
                showMessage('Halaman berhasil diperbarui!');
            } else {
                const { error } = await supabase
                    .from('pages')
                    .insert([dataToSave]);

                if (error) throw error;
                showMessage('Halaman berhasil dibuat!');
            }

            await fetch('/api/revalidate', { method: 'POST' });
            setTimeout(() => router.push('/dashboard/pages'), 1500);
        } catch (error) {
            console.error('Error saving page:', error);
            showMessage('Gagal menyimpan halaman: ' + error.message, 'error');
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
                            <div className="flex justify-between items-center mb-4">
                                <label className="block text-sm font-medium text-slate-700">
                                    Judul Halaman ({activeLangTab === 'id' ? 'Bahasa Indonesia' : 'English'})
                                </label>
                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => setActiveLangTab('id')}
                                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${activeLangTab === 'id' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                                    >
                                        🇮🇩 Bahasa
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveLangTab('en')}
                                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${activeLangTab === 'en' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                                    >
                                        🇬🇧 English
                                    </button>
                                </div>
                            </div>
                            <input
                                type="text"
                                className="w-full px-4 py-3 text-lg font-semibold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                value={activeLangTab === 'id' ? formData.title : formData.title_en}
                                onChange={(e) => {
                                    if (activeLangTab === 'id') {
                                        handleTitleChange(e);
                                    } else {
                                        setFormData({ ...formData, title_en: e.target.value });
                                    }
                                }}
                                placeholder={activeLangTab === 'id' ? 'Masukkan judul halaman...' : 'Enter page title...'}
                                required={activeLangTab === 'id'}
                            />
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
                            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                                <div className="flex items-center justify-between">
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
                                    {activeLangTab === 'en' && (
                                        <button
                                            type="button"
                                            onClick={handleAutoTranslate}
                                            disabled={isTranslating}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition disabled:opacity-50"
                                        >
                                            {isTranslating ? 'Translating...' : '✨ Auto Translate'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="p-6">
                                {editorMode === 'visual' ? (
                                    <ReactQuill
                                        key={activeLangTab}
                                        theme="snow"
                                        value={activeLangTab === 'id' ? formData.content : formData.content_en}
                                        onChange={(content) => {
                                            if (activeLangTab === 'id') {
                                                setFormData(prev => ({ ...prev, content }));
                                            } else {
                                                setFormData(prev => ({ ...prev, content_en: content }));
                                            }
                                        }}
                                        modules={modules}
                                        formats={formats}
                                        placeholder={activeLangTab === 'id' ? 'Tulis konten halaman di sini...' : 'Write page content here...'}
                                        className="quill-editor"
                                        style={{ minHeight: '400px' }}
                                    />
                                ) : (
                                    <textarea
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-mono text-sm"
                                        rows={20}
                                        value={activeLangTab === 'id' ? formData.content : formData.content_en}
                                        onChange={(e) => {
                                            const newContent = e.target.value;
                                            if (activeLangTab === 'id') {
                                                setFormData({ ...formData, content: newContent });
                                            } else {
                                                setFormData({ ...formData, content_en: newContent });
                                            }
                                        }}
                                        placeholder="<p>Tulis konten halaman dalam format HTML...</p>"
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
                                    onClick={() => router.push('/dashboard/pages')}
                                    className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 font-medium transition-colors"
                                >
                                    {loading ? 'Menyimpan...' : (page ? 'Perbarui Halaman' : 'Publikasikan')}
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
                            <h3 className="text-sm font-semibold text-slate-900 mb-4">Publikasi</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        URL Slug
                                    </label>
                                    <div className="flex items-center">
                                        <span className="bg-slate-100 border border-r-0 border-slate-200 px-3 py-2.5 rounded-l-lg text-slate-500 text-sm font-medium">/pages/</span>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2.5 border border-slate-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                                            value={formData.slug}
                                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                            required
                                            placeholder="contact-us"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary"
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        />
                                        <span className="text-sm text-slate-700">Publish This Page</span>
                                    </label>
                                </div>
                            </div>
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
