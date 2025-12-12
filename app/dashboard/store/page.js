// app/dashboard/store/page.js
'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase-client';
import Breadcrumb from '@/components/Breadcrumb';
import LogoPathAnimation from '@/components/LogoPathAnimation';

// Modal Component
const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-xl' }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className={`relative w-full ${maxWidth} bg-white rounded-2xl shadow-2xl transform transition-all animate-fade-in-up max-h-[90vh] overflow-y-auto`}>
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl sticky top-0 z-10">
                    <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors bg-white rounded-full p-1 hover:bg-gray-100">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
};

export default function AdminStorePage() {
    const supabase = createClient();

    // Tabs
    const [activeTab, setActiveTab] = useState('products');

    // Data State
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [designs, setDesigns] = useState([]);
    const [loading, setLoading] = useState(true);

    // Search & Filter
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItems, setSelectedItems] = useState([]);

    // Modal State
    const [isModalOpen, setModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);

    // Form State for Products
    const [productForm, setProductForm] = useState({
        name: '',
        slug: '',
        description: '',
        category_id: '',
        design_id: '',
        demo_url: '',
        download_url: '',
        thumbnail_url: '',
        price_type: 'premium',
        price: 0,
        is_active: true,
        featured: false
    });

    // Form State for Categories/Designs
    const [simpleForm, setSimpleForm] = useState({
        name: '',
        slug: '',
        description: '',
        is_active: true
    });

    // Upload state
    const [uploading, setUploading] = useState(false);

    // Fetch all data
    const fetchData = async () => {
        setLoading(true);
        try {
            const [itemsRes, catsRes, desRes] = await Promise.all([
                supabase.from('store_items').select(`*, category:store_categories(id, name), design:store_designs(id, name)`).order('created_at', { ascending: false }),
                supabase.from('store_categories').select('*').order('name'),
                supabase.from('store_designs').select('*').order('name')
            ]);

            setItems(itemsRes.data || []);
            setCategories(catsRes.data || []);
            setDesigns(desRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Filtered data based on search and active tab
    const filteredData = useMemo(() => {
        let data = [];
        if (activeTab === 'products') data = items;
        else if (activeTab === 'categories') data = categories;
        else if (activeTab === 'designs') data = designs;

        if (searchQuery) {
            data = data.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        return data;
    }, [activeTab, items, categories, designs, searchQuery]);

    // Reset selection when tab changes
    useEffect(() => {
        setSelectedItems([]);
        setSearchQuery('');
    }, [activeTab]);

    // Bulk actions
    const toggleItem = (id) => {
        setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleAll = () => {
        if (selectedItems.length === filteredData.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(filteredData.map(i => i.id));
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Hapus ${selectedItems.length} item yang dipilih?`)) return;

        const table = activeTab === 'products' ? 'store_items' : activeTab === 'categories' ? 'store_categories' : 'store_designs';

        try {
            const { error } = await supabase.from(table).delete().in('id', selectedItems);
            if (error) throw error;
            setSelectedItems([]);
            fetchData();
        } catch (e) {
            alert('Error: ' + e.message);
        }
    };

    // Handle thumbnail upload
    const handleThumbnailUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `thumbnails/${Date.now()}.${fileExt}`;

            const { data, error } = await supabase.storage
                .from('store')
                .upload(fileName, file, { upsert: true });

            if (error) throw error;

            const { data: urlData } = supabase.storage.from('store').getPublicUrl(fileName);
            setProductForm(prev => ({ ...prev, thumbnail_url: urlData.publicUrl }));
        } catch (error) {
            console.error('Upload error:', error);
            alert('Gagal upload gambar: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    // Open modal for create
    const openCreateModal = () => {
        setIsEditing(false);
        setCurrentItem(null);
        if (activeTab === 'products') {
            setProductForm({
                name: '', slug: '', description: '', category_id: '', design_id: '',
                demo_url: '', download_url: '', thumbnail_url: '', price_type: 'premium',
                price: 0, is_active: true, featured: false
            });
        } else {
            setSimpleForm({ name: '', slug: '', description: '', is_active: true });
        }
        setModalOpen(true);
    };

    // Open modal for edit
    const openEditModal = (item) => {
        setIsEditing(true);
        setCurrentItem(item);
        if (activeTab === 'products') {
            setProductForm({
                name: item.name,
                slug: item.slug,
                description: item.description || '',
                category_id: item.category_id || '',
                design_id: item.design_id || '',
                demo_url: item.demo_url || '',
                download_url: item.download_url || '',
                thumbnail_url: item.thumbnail_url || '',
                price_type: item.price_type,
                price: item.price || 0,
                is_active: item.is_active,
                featured: item.featured
            });
        } else {
            setSimpleForm({
                name: item.name,
                slug: item.slug,
                description: item.description || '',
                is_active: item.is_active
            });
        }
        setModalOpen(true);
    };

    // Submit handler
    const handleSubmit = async (e) => {
        e.preventDefault();

        const table = activeTab === 'products' ? 'store_items' : activeTab === 'categories' ? 'store_categories' : 'store_designs';
        const formData = activeTab === 'products' ? productForm : simpleForm;

        try {
            if (isEditing) {
                const { error } = await supabase.from(table).update(formData).eq('id', currentItem.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from(table).insert([formData]);
                if (error) throw error;
            }
            setModalOpen(false);
            fetchData();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    // Delete handler
    const handleDelete = async (id) => {
        if (!confirm('Hapus item ini?')) return;

        const table = activeTab === 'products' ? 'store_items' : activeTab === 'categories' ? 'store_categories' : 'store_designs';

        try {
            const { error } = await supabase.from(table).delete().eq('id', id);
            if (error) throw error;
            fetchData();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    // Auto-generate slug
    const generateSlug = (name) => {
        return name.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price).replace('IDR', 'Rp');
    };

    return (
        <div className="p-4 lg:p-8 pb-24 relative min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Store', href: '/dashboard/store' }]} />
                    <h1 className="text-3xl font-bold text-gray-800 tracking-tight mt-2">Store Management</h1>
                    <p className="text-gray-500 mt-1">Kelola produk, kategori, dan design toko Anda</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-orange-500/20 active:scale-95"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Tambah {activeTab === 'products' ? 'Produk' : activeTab === 'categories' ? 'Kategori' : 'Design'}
                </button>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm mb-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    {/* Tab Buttons */}
                    <div className="flex p-1 bg-gray-100 rounded-xl w-full md:w-auto">
                        {[
                            { id: 'products', label: 'Produk', count: items.length },
                            { id: 'categories', label: 'Kategori', count: categories.length },
                            { id: 'designs', label: 'Design', count: designs.length }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === tab.id ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {tab.label}
                                <span className={`px-1.5 py-0.5 text-xs rounded-full ${activeTab === tab.id ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative w-full md:w-64">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Cari..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-gray-200 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <LogoPathAnimation />
                </div>
            ) : filteredData.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-gray-300">
                    <div className="bg-gray-50 p-4 rounded-full mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Belum ada data</h3>
                    <p className="text-gray-500">Mulai dengan menambahkan {activeTab === 'products' ? 'produk' : activeTab === 'categories' ? 'kategori' : 'design'} baru.</p>
                </div>
            ) : (
                <>
                    {/* Products Tab */}
                    {activeTab === 'products' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {filteredData.map(item => (
                                <div key={item.id} className={`group bg-white rounded-2xl border p-0 overflow-hidden hover:shadow-xl transition-all duration-300 ${selectedItems.includes(item.id) ? 'border-primary ring-2 ring-primary/10' : 'border-gray-200'}`}>
                                    {/* Thumbnail */}
                                    <div className="bg-gray-100 relative">
                                        {item.thumbnail_url ? (
                                            <img src={item.thumbnail_url} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        )}

                                        {/* Badges */}
                                        <div className="absolute top-3 left-3 flex gap-2">
                                            <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${item.price_type === 'freebies' ? 'bg-green-500 text-white' : 'bg-primary text-white'}`}>
                                                {item.price_type === 'freebies' ? 'GRATIS' : 'PREMIUM'}
                                            </span>
                                            {!item.is_active && (
                                                <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-gray-500 text-white">DRAFT</span>
                                            )}
                                        </div>

                                        {/* Checkbox */}
                                        <div className="absolute top-3 right-3">
                                            <input type="checkbox" checked={selectedItems.includes(item.id)} onChange={() => toggleItem(item.id)} className="w-5 h-5 text-orange-600 rounded border-gray-300 focus:ring-orange-600 cursor-pointer shadow-sm" />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-4">
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {item.category && (
                                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-medium rounded-full">{item.category.name}</span>
                                            )}
                                            {item.design && (
                                                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-medium rounded-full">{item.design.name}</span>
                                            )}
                                        </div>

                                        <h3 className="font-bold text-gray-800 line-clamp-1 mb-1">{item.name}</h3>
                                        <p className="text-xs text-gray-400 font-mono mb-2">/{item.slug}</p>

                                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                            <div className="font-bold text-primary">
                                                {item.price_type === 'freebies' ? 'Gratis' : formatPrice(item.price)}
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={() => openEditModal(item)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-primary transition">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                </button>
                                                <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-500 transition">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Categories/Designs Tab */}
                    {(activeTab === 'categories' || activeTab === 'designs') && (
                        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-4 w-12">
                                                <input type="checkbox" checked={selectedItems.length === filteredData.length && filteredData.length > 0} onChange={toggleAll} className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-600 cursor-pointer" />
                                            </th>
                                            <th className="px-6 py-4 font-semibold text-gray-700">Nama</th>
                                            <th className="px-6 py-4 font-semibold text-gray-700">Slug</th>
                                            <th className="px-6 py-4 font-semibold text-gray-700">Deskripsi</th>
                                            <th className="px-6 py-4 font-semibold text-gray-700 text-center">Status</th>
                                            <th className="px-6 py-4 font-semibold text-gray-700 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredData.map(item => (
                                            <tr key={item.id} className={`hover:bg-gray-50/50 transition-colors ${selectedItems.includes(item.id) ? 'bg-orange-50/10' : ''}`}>
                                                <td className="px-6 py-4">
                                                    <input type="checkbox" checked={selectedItems.includes(item.id)} onChange={() => toggleItem(item.id)} className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-600 cursor-pointer" />
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-800">{item.name}</td>
                                                <td className="px-6 py-4 text-gray-500 font-mono text-xs">{item.slug}</td>
                                                <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{item.description || '-'}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                        {item.is_active ? 'Aktif' : 'Draft'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right space-x-2">
                                                    <button onClick={() => openEditModal(item)} className="text-primary hover:text-orange-700 font-medium">Edit</button>
                                                    <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700">Hapus</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Bulk Action Bar */}
            {selectedItems.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 animate-fade-in-up border border-gray-800">
                    <div className="font-bold flex items-center gap-2">
                        <span className="bg-white text-gray-900 w-6 h-6 rounded-full flex items-center justify-center text-xs">{selectedItems.length}</span>
                        <span>Dipilih</span>
                    </div>
                    <div className="h-6 w-px bg-gray-700"></div>
                    <button onClick={handleBulkDelete} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-bold transition flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Hapus
                    </button>
                    <button onClick={() => setSelectedItems([])} className="text-gray-400 hover:text-white text-sm">Batal</button>
                </div>
            )}

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                title={isEditing ? `Edit ${activeTab === 'products' ? 'Produk' : activeTab === 'categories' ? 'Kategori' : 'Design'}` : `Tambah ${activeTab === 'products' ? 'Produk' : activeTab === 'categories' ? 'Kategori' : 'Design'}`}
                maxWidth={activeTab === 'products' ? 'max-w-2xl' : 'max-w-md'}
            >
                <form onSubmit={handleSubmit} className="space-y-5">
                    {activeTab === 'products' ? (
                        <>
                            {/* Thumbnail Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Thumbnail</label>
                                <div className="flex items-start gap-4">
                                    <div className="w-24 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                        {productForm.thumbnail_url ? (
                                            <img src={productForm.thumbnail_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition ${uploading ? 'opacity-50 cursor-wait' : ''}`}>
                                            {uploading ? 'Uploading...' : 'Upload Gambar'}
                                            <input type="file" accept="image/*" onChange={handleThumbnailUpload} className="hidden" disabled={uploading} />
                                        </label>
                                        <p className="text-xs text-gray-400 mt-1">JPG, PNG max 2MB</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Produk *</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm outline-none"
                                        value={productForm.name}
                                        onChange={e => setProductForm({ ...productForm, name: e.target.value, slug: generateSlug(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Slug *</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm outline-none font-mono"
                                        value={productForm.slug}
                                        onChange={e => setProductForm({ ...productForm, slug: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi</label>
                                <textarea
                                    rows={3}
                                    className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm outline-none"
                                    value={productForm.description}
                                    onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Kategori</label>
                                    <select
                                        className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm outline-none"
                                        value={productForm.category_id}
                                        onChange={e => setProductForm({ ...productForm, category_id: e.target.value })}
                                    >
                                        <option value="">Pilih Kategori</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Design</label>
                                    <select
                                        className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm outline-none"
                                        value={productForm.design_id}
                                        onChange={e => setProductForm({ ...productForm, design_id: e.target.value })}
                                    >
                                        <option value="">Pilih Design</option>
                                        {designs.map(des => (
                                            <option key={des.id} value={des.id}>{des.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">URL Demo</label>
                                    <input
                                        type="url"
                                        className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm outline-none"
                                        value={productForm.demo_url}
                                        onChange={e => setProductForm({ ...productForm, demo_url: e.target.value })}
                                        placeholder="https://..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">URL Download</label>
                                    <input
                                        type="url"
                                        className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm outline-none"
                                        value={productForm.download_url}
                                        onChange={e => setProductForm({ ...productForm, download_url: e.target.value })}
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipe Harga</label>
                                    <select
                                        className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm outline-none"
                                        value={productForm.price_type}
                                        onChange={e => setProductForm({ ...productForm, price_type: e.target.value, price: e.target.value === 'freebies' ? 0 : productForm.price })}
                                    >
                                        <option value="premium">Premium</option>
                                        <option value="freebies">Gratis (Freebies)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Harga (IDR)</label>
                                    <input
                                        type="number"
                                        className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm outline-none disabled:opacity-50"
                                        value={productForm.price}
                                        onChange={e => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                                        disabled={productForm.price_type === 'freebies'}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 p-3 bg-gray-50 rounded-xl">
                                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="rounded text-primary focus:ring-primary"
                                        checked={productForm.is_active}
                                        onChange={e => setProductForm({ ...productForm, is_active: e.target.checked })}
                                    />
                                    Aktif
                                </label>
                                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="rounded text-primary focus:ring-primary"
                                        checked={productForm.featured}
                                        onChange={e => setProductForm({ ...productForm, featured: e.target.checked })}
                                    />
                                    Featured
                                </label>
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama *</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm outline-none"
                                    value={simpleForm.name}
                                    onChange={e => setSimpleForm({ ...simpleForm, name: e.target.value, slug: generateSlug(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Slug *</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm outline-none font-mono"
                                    value={simpleForm.slug}
                                    onChange={e => setSimpleForm({ ...simpleForm, slug: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi</label>
                                <textarea
                                    rows={3}
                                    className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm outline-none"
                                    value={simpleForm.description}
                                    onChange={e => setSimpleForm({ ...simpleForm, description: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    className="rounded text-primary focus:ring-primary"
                                    checked={simpleForm.is_active}
                                    onChange={e => setSimpleForm({ ...simpleForm, is_active: e.target.checked })}
                                />
                                <label className="text-sm font-medium text-gray-700">Aktif</label>
                            </div>
                        </>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition">Batal</button>
                        <button type="submit" className="flex-1 py-3 px-4 rounded-xl bg-orange-600 text-white font-medium hover:bg-orange-700 shadow-lg shadow-orange-500/20 transition">Simpan</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
