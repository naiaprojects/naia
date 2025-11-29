// app/dashboard/portfolio/page.js
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';
import LogoPathAnimation from '@/components/LogoPathAnimation';

export default function PortfolioManagementPage() {
    const supabase = createClient();
    const router = useRouter();
    const [portfolioItems, setPortfolioItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [message, setMessage] = useState('');
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        link: '',
        image_url: '',
        alt: '',
        position: 0,
        is_active: true
    });

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');

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
                .from('portfolio_items')
                .select('*')
                .order('position', { ascending: true });

            if (error) throw error;
            setPortfolioItems(data || []);
        } catch (error) {
            console.error('Error fetching portfolio:', error);
            setMessage('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setMessage('Error: File harus berupa gambar');
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setMessage('Error: Ukuran file maksimal 5MB');
                return;
            }

            setImageFile(file);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadImage = async () => {
        if (!imageFile) return formData.image_url;

        setUploading(true);
        try {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('portfolio')
                .upload(filePath, imageFile);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('portfolio')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                setMessage('Error: Anda harus login untuk menyimpan perubahan');
                return;
            }

            // Upload image if new file selected
            let imageUrl = formData.image_url;
            if (imageFile) {
                imageUrl = await uploadImage();
            }

            const dataToSave = {
                ...formData,
                image_url: imageUrl,
                alt: formData.alt || formData.title,
                updated_at: new Date().toISOString()
            };

            if (editItem) {
                const { error } = await supabase
                    .from('portfolio_items')
                    .update(dataToSave)
                    .eq('id', editItem.id);

                if (error) throw error;
                setMessage('Portfolio item berhasil diupdate!');
            } else {
                const { error } = await supabase
                    .from('portfolio_items')
                    .insert([dataToSave]);

                if (error) throw error;
                setMessage('Portfolio item berhasil ditambahkan!');
            }

            resetForm();
            fetchData();

            // Revalidate cache
            await fetch('/api/revalidate', { method: 'POST' });
            router.refresh();

            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error saving portfolio:', error);
            setMessage('Error: ' + error.message);
        }
    };

    const handleEdit = (item) => {
        setEditItem(item);
        setFormData({
            title: item.title,
            link: item.link || '',
            image_url: item.image_url,
            alt: item.alt || '',
            position: item.position,
            is_active: item.is_active
        });
        setImagePreview(item.image_url);
        setShowForm(true);
    };

    const handleDelete = async (id, imageUrl) => {
        if (!confirm('Yakin ingin menghapus item ini?')) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                setMessage('Error: Anda harus login untuk menghapus item');
                return;
            }

            // Delete from database
            const { error } = await supabase
                .from('portfolio_items')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Try to delete image from storage (optional, might fail if external URL)
            if (imageUrl && imageUrl.includes('supabase')) {
                const path = imageUrl.split('/portfolio/')[1];
                if (path) {
                    await supabase.storage.from('portfolio').remove([path]);
                }
            }

            setMessage('Portfolio item berhasil dihapus!');
            fetchData();

            await fetch('/api/revalidate', { method: 'POST' });
            router.refresh();

            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error deleting portfolio:', error);
            setMessage('Error: ' + error.message);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            link: '',
            image_url: '',
            alt: '',
            position: 0,
            is_active: true
        });
        setEditItem(null);
        setShowForm(false);
        setImageFile(null);
        setImagePreview('');
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
                        <h1 className="text-2xl lg:text-3xl font-bold text-slate-700">Portfolio Management</h1>
                        <p className="text-sm text-slate-700 mt-1">Kelola portofolio proyek</p>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="w-full sm:w-auto bg-primary text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-secondary text-sm sm:text-base"
                    >
                        {showForm ? 'Batal' : 'Tambah Portfolio'}
                    </button>
                </div>
            </div>

            {/* Alert Message */}
            {message && (
                <div className={`mb-4 p-3 lg:p-4 rounded-lg text-sm ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {message}
                </div>
            )}

            {/* Form */}
            {showForm && (
                <div className="bg-white rounded-lg shadow p-4 lg:p-6 mb-6">
                    <h2 className="text-xl lg:text-2xl font-semibold mb-4 text-slate-700">
                        {editItem ? 'Edit Portfolio Item' : 'Tambah Portfolio Item'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    className="w-full px-3 lg:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Position</label>
                                <input
                                    type="number"
                                    value={formData.position}
                                    onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) })}
                                    required
                                    className="w-full px-3 lg:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Link (URL)</label>
                            <input
                                type="url"
                                value={formData.link}
                                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                placeholder="https://example.com"
                                className="w-full px-3 lg:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Upload Gambar</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="w-full px-3 lg:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                            <p className="text-xs text-slate-700 mt-1">Maksimal 5MB. Format: JPG, PNG, WebP</p>

                            {imagePreview && (
                                <div className="mt-4">
                                    <img src={imagePreview} alt="Preview" className="h-32 sm:h-48 rounded-lg object-cover w-full sm:w-auto" />
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Atau Image URL (jika tidak upload)
                            </label>
                            <input
                                type="text"
                                value={formData.image_url}
                                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                placeholder="https://example.com/image.jpg"
                                className="w-full px-3 lg:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Alt Text (Optional)</label>
                            <input
                                type="text"
                                value={formData.alt}
                                onChange={(e) => setFormData({ ...formData, alt: e.target.value })}
                                placeholder="Deskripsi gambar untuk SEO"
                                className="w-full px-3 lg:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
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
                                disabled={uploading}
                                className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-secondary disabled:bg-slate-400"
                            >
                                {uploading ? 'Uploading...' : editItem ? 'Update' : 'Simpan'}
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
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Image</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Title</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Link</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Position</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 uppercase">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {portfolioItems.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <img src={item.image_url} alt={item.alt} className="h-16 w-16 object-cover rounded" />
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-700">{item.title}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                            {item.link ? 'View' : '-'}
                                        </a>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">{item.position}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs rounded-full ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {item.is_active ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleEdit(item)} className="bg-blue-600 mr-2 py-1 px-2 text-white font-medium rounded-lg">Edit</button>
                                        <button onClick={() => handleDelete(item.id, item.image_url)} className="bg-red-600 py-1 px-2 text-white font-medium rounded-lg">Hapus</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
                {portfolioItems.map((item) => (
                    <div key={item.id} className="bg-white rounded-lg shadow p-4">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                                <p className="font-semibold text-slate-700 mb-1">{item.title}</p>
                                <p className="text-xs text-slate-500">Posisi: {item.position}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {item.is_active ? 'Aktif' : 'Nonaktif'}
                            </span>
                        </div>
                        
                        <div className="mb-3">
                            <img src={item.image_url} alt={item.alt} className="h-40 w-full object-cover rounded-lg mb-2" />
                            {item.link && (
                                <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                                    View Project
                                </a>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleEdit(item)} 
                                className="flex-1 bg-blue-600 py-2 text-white font-medium rounded-lg text-sm"
                            >
                                Edit
                            </button>
                            <button 
                                onClick={() => handleDelete(item.id, item.image_url)} 
                                className="flex-1 bg-red-600 py-2 text-white font-medium rounded-lg text-sm"
                            >
                                Hapus
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {portfolioItems.length === 0 && (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <svg className="w-16 h-16 mx-auto text-slate-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-slate-700">Tidak ada portfolio item yang tersedia</p>
                </div>
            )}
        </div>
    );
}