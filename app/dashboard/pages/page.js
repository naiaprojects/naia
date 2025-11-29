// app/dashboard/pages/page.js
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';
import LogoPathAnimation from '@/components/LogoPathAnimation';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

// Import React Quill secara dynamic untuk menghindari SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export default function PagesManagementPage() {
    const supabase = createClient();
    const router = useRouter();
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editPage, setEditPage] = useState(null);
    const [message, setMessage] = useState('');
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        slug: '',
        title: '',
        content: '',
        meta_title: '',
        meta_description: '',
        is_active: true
    });

    // Konfigurasi toolbar editor
    const editorModules = {
        toolbar: [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            [{ 'font': [] }],
            [{ 'size': ['small', false, 'large', 'huge'] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'script': 'sub'}, { 'script': 'super' }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            [{ 'align': [] }],
            ['blockquote', 'code-block'],
            ['link', 'image', 'video'],
            ['clean']
        ]
    };

    const editorFormats = [
        'header', 'font', 'size',
        'bold', 'italic', 'underline', 'strike',
        'color', 'background',
        'script',
        'list', 'bullet', 'indent',
        'align',
        'blockquote', 'code-block',
        'link', 'image', 'video'
    ];

    useEffect(() => {
        checkAuthAndFetchData();
    }, []);

    const checkAuthAndFetchData = async () => {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            setMessage('Error: Session tidak ditemukan. Silakan login kembali.');
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
            setMessage('Error: ' + error.message);
        } finally {
            setLoading(false);
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

    const handleTitleChange = (value) => {
        const slug = editPage ? formData.slug : generateSlug(value);
        setFormData({
            ...formData,
            title: value,
            slug: slug
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                setMessage('Error: Anda harus login untuk menyimpan perubahan');
                setSaving(false);
                return;
            }

            const dataToSave = {
                ...formData,
                updated_at: new Date().toISOString()
            };

            if (editPage) {
                const { error } = await supabase
                    .from('pages')
                    .update(dataToSave)
                    .eq('id', editPage.id);

                if (error) throw error;
                setMessage('Halaman berhasil diupdate!');
            } else {
                const { error } = await supabase
                    .from('pages')
                    .insert([dataToSave]);

                if (error) throw error;
                setMessage('Halaman berhasil ditambahkan!');
            }

            resetForm();
            fetchData();

            await fetch('/api/revalidate', { method: 'POST' });
            router.refresh();

            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error saving page:', error);
            setMessage('Error: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (page) => {
        setEditPage(page);
        setFormData({
            slug: page.slug,
            title: page.title,
            content: page.content,
            meta_title: page.meta_title || '',
            meta_description: page.meta_description || '',
            is_active: page.is_active
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus halaman ini?')) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                setMessage('Error: Anda harus login untuk menghapus item');
                return;
            }

            const { error } = await supabase
                .from('pages')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setMessage('Halaman berhasil dihapus!');
            fetchData();

            await fetch('/api/revalidate', { method: 'POST' });
            router.refresh();

            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error deleting page:', error);
            setMessage('Error: ' + error.message);
        }
    };

    const resetForm = () => {
        setFormData({
            slug: '',
            title: '',
            content: '',
            meta_title: '',
            meta_description: '',
            is_active: true
        });
        setEditPage(null);
        setShowForm(false);
    };

    if (loading) {
        return (
          <div className="flex justify-center items-center h-64">
            <LogoPathAnimation />
          </div>
        );
    }

    return (
        <div className="p-4 lg:p-6 mt-16 lg:mt-0">
            {/* Header */}
            <div className="mb-6">
                <Breadcrumb />
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mt-2">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-slate-700">Pages Management</h1>
                        <p className="text-sm text-slate-700 mt-1">Kelola halaman statis website</p>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="w-full sm:w-auto bg-primary text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-secondary text-sm sm:text-base"
                    >
                        {showForm ? 'Batal' : 'Tambah Halaman'}
                    </button>
                </div>
            </div>

            {/* Alert Message */}
            {message && (
                <div className={`mb-4 p-3 lg:p-4 rounded-lg text-sm ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {message}
                </div>
            )}

            {/* Form dengan Rich Text Editor */}
            {showForm && (
                <div className="bg-white rounded-lg shadow p-4 lg:p-6 mb-6">
                    <h2 className="text-xl lg:text-2xl font-semibold mb-4 text-slate-700">
                        {editPage ? 'Edit Halaman' : 'Tambah Halaman Baru'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Judul Halaman</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => handleTitleChange(e.target.value)}
                                    required
                                    placeholder="Tentang Kami"
                                    className="w-full px-3 lg:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">URL Slug</label>
                                <input
                                    type="text"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    required
                                    placeholder="tentang-kami"
                                    className="w-full px-3 lg:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                                <p className="text-xs text-slate-500 mt-1">URL: /pages/{formData.slug}</p>
                            </div>
                        </div>

                        {/* Rich Text Editor */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Konten Halaman</label>
                            <div className="border border-slate-300 rounded-lg overflow-hidden">
                                <ReactQuill
                                    theme="snow"
                                    value={formData.content}
                                    onChange={(value) => setFormData({ ...formData, content: value })}
                                    modules={editorModules}
                                    formats={editorFormats}
                                    placeholder="Tulis konten halaman di sini..."
                                    className="bg-white"
                                    style={{ minHeight: '300px' }}
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Gunakan toolbar untuk memformat teks, menambah gambar, link, dll.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Meta Title (SEO)</label>
                                <input
                                    type="text"
                                    value={formData.meta_title}
                                    onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                                    placeholder="Judul untuk SEO (max 60 karakter)"
                                    maxLength="60"
                                    className="w-full px-3 lg:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Meta Description (SEO)</label>
                                <input
                                    type="text"
                                    value={formData.meta_description}
                                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                                    placeholder="Deskripsi untuk SEO (max 160 karakter)"
                                    maxLength="160"
                                    className="w-full px-3 lg:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className="mr-2 h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded"
                            />
                            <label className="text-sm font-medium text-slate-700">Aktif</label>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-secondary disabled:bg-slate-400"
                            >
                                {saving ? 'Menyimpan...' : editPage ? 'Update' : 'Simpan'}
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 sm:px-6 bg-slate-300 text-slate-700 py-2 rounded-lg hover:bg-slate-400"
                            >
                                Batal
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Judul</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">URL</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Dibuat</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 uppercase">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {pages.map((page) => (
                                <tr key={page.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="text-sm font-medium text-slate-700">{page.title}</div>
                                        {page.meta_title && (
                                            <div className="text-xs text-slate-500">SEO: {page.meta_title}</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                                        <a href={`/pages/${page.slug}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                            /pages/{page.slug}
                                        </a>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs rounded-full ${page.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {page.is_active ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                                        {new Date(page.created_at).toLocaleDateString('id-ID')}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleEdit(page)}
                                            className="bg-blue-600 mr-2 py-1 px-2 text-white font-medium rounded-lg"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(page.id)}
                                            className="bg-red-600 py-1 px-2 text-white font-medium rounded-lg"
                                        >
                                            Hapus
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
                {pages.map((page) => (
                    <div key={page.id} className="bg-white rounded-lg shadow p-4">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                                <p className="font-semibold text-slate-700 mb-1">{page.title}</p>
                                <p className="text-xs text-slate-500">Dibuat: {new Date(page.created_at).toLocaleDateString('id-ID')}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${page.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {page.is_active ? 'Aktif' : 'Nonaktif'}
                            </span>
                        </div>
                        
                        <div className="mb-3">
                            <p className="text-sm text-slate-700 mb-1">URL:</p>
                            <a href={`/pages/${page.slug}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm break-all">
                                /pages/{page.slug}
                            </a>
                        </div>

                        {page.meta_description && (
                            <div className="mb-3">
                                <p className="text-sm text-slate-700 mb-1">SEO Description:</p>
                                <p className="text-xs text-slate-500 line-clamp-2">{page.meta_description}</p>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleEdit(page)} 
                                className="flex-1 bg-blue-600 py-2 text-white font-medium rounded-lg text-sm"
                            >
                                Edit
                            </button>
                            <button 
                                onClick={() => handleDelete(page.id)} 
                                className="flex-1 bg-red-600 py-2 text-white font-medium rounded-lg text-sm"
                            >
                                Hapus
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {pages.length === 0 && (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <svg className="w-16 h-16 mx-auto text-slate-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-slate-700">Belum ada halaman yang dibuat</p>
                    <p className="text-sm text-slate-500 mt-2">Klik "Tambah Halaman" untuk membuat halaman statis pertama Anda</p>
                </div>
            )}
        </div>
    );
}