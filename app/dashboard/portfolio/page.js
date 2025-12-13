'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';
import LogoPathAnimation from '@/components/LogoPathAnimation';



export default function PortfolioManagementPage() {
    const supabase = createClient();
    const router = useRouter();

    // Data State
    const [portfolioItems, setPortfolioItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // UI State
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('active'); // 'active' | 'inactive' | 'all'
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9;

    // Bulk Actions State
    const [selectedItems, setSelectedItems] = useState([]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Form State
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
        fetchData();
    }, []);

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
            showMessage('Error: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    // Bulk Handlers
    const toggleItem = (id) => {
        setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleAll = () => {
        if (selectedItems.length === paginatedItems.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(paginatedItems.map(i => i.id));
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedItems.length} items?`)) return;
        setLoading(true);
        try {
            // First we might need to delete images, but for bulk delete on supabase, triggers or just ignoring images for now is safer/faster.
            // Ideally we should delete images too.
            // Let's just delete the records for now, or if we can, get the image URLs first.
            const itemsToDelete = portfolioItems.filter(i => selectedItems.includes(i.id));

            for (const item of itemsToDelete) {
                if (item.image_url && item.image_url.includes('supabase')) {
                    const path = item.image_url.split('/portfolio/')[1];
                    if (path) {
                        await supabase.storage.from('portfolio').remove([path]);
                    }
                }
            }

            const { error } = await supabase.from('portfolio_items').delete().in('id', selectedItems);
            if (error) throw error;
            showMessage(`${selectedItems.length} items deleted successfully.`);
            setSelectedItems([]);
            fetchData();
        } catch (e) {
            showMessage('Error: ' + e.message, 'error');
            setLoading(false);
        }
    };

    const handleBulkStatus = async (isActive) => {
        if (!confirm(`Set ${selectedItems.length} items to ${isActive ? 'Active' : 'Inactive'}?`)) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('portfolio_items').update({ is_active: isActive }).in('id', selectedItems);
            if (error) throw error;
            showMessage(`${selectedItems.length} items updated.`);
            setSelectedItems([]);
            fetchData();
        } catch (e) {
            showMessage('Error: ' + e.message, 'error');
            setLoading(false);
        }
    };


    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                showMessage('Error: File must be an image', 'error');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                showMessage('Error: Max file size is 5MB', 'error');
                return;
            }
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
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
        setUploading(true);

        try {
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
                showMessage('Item updated successfully');
            } else {
                const { error } = await supabase
                    .from('portfolio_items')
                    .insert([dataToSave]);
                if (error) throw error;
                showMessage('Item added successfully');
            }

            closeModal();
            fetchData();
            router.refresh();
        } catch (error) {
            console.error('Error saving item:', error);
            showMessage('Error: ' + error.message, 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id, imageUrl) => {
        if (!confirm('Are you sure you want to delete this item?')) return;

        try {
            const { error } = await supabase
                .from('portfolio_items')
                .delete()
                .eq('id', id);

            if (error) throw error;

            if (imageUrl && imageUrl.includes('supabase')) {
                const path = imageUrl.split('/portfolio/')[1];
                if (path) {
                    await supabase.storage.from('portfolio').remove([path]);
                }
            }

            showMessage('Item deleted successfully');
            fetchData();
            router.refresh();
        } catch (error) {
            console.error('Error deleting item:', error);
            showMessage('Error: ' + error.message, 'error');
        }
    };

    const openCreateModal = () => {
        setEditItem(null);
        setFormData({
            title: '',
            link: '',
            image_url: '',
            alt: '',
            position: portfolioItems.length + 1,
            is_active: true
        });
        setImageFile(null);
        setImagePreview('');
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
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
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditItem(null);
        setImageFile(null);
        setImagePreview('');
    };

    // Filtering and Pagination Logic
    const filteredItems = useMemo(() => {
        return portfolioItems.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesTab = activeTab === 'all'
                ? true
                : activeTab === 'active' ? item.is_active : !item.is_active;

            return matchesSearch && matchesTab;
        });
    }, [portfolioItems, searchQuery, activeTab]);

    const paginatedItems = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredItems.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredItems, currentPage]);

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <LogoPathAnimation />
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-8 pb-24 relative min-h-screen">
            <div className="mx-auto space-y-6">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <Breadcrumb />
                        <h1 className="text-3xl font-bold text-slate-800 tracking-tight mt-2">Portfolio Management</h1>
                        <p className="text-slate-500 mt-1">Showcase your best work to the world</p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-slate-200 active:scale-95"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add New Project
                    </button>
                </div>

                {/* Controls Section */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">

                    {/* Tabs */}
                    <div className="flex p-1 bg-slate-100 rounded-xl w-full md:w-auto overflow-x-auto">
                        {['active', 'inactive', 'all'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-lg transition-all capitalize ${activeTab === tab
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Search & View Toggle */}
                    <div className="flex w-full md:w-auto gap-3">
                        <div className="relative flex-1 md:w-64">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search projects..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                            />
                        </div>
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Message Toast */}
                {message.text && (
                    <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-xl shadow-2xl z-50 text-white font-medium animate-fade-in-up ${message.type === 'error' ? 'bg-red-500' : 'bg-slate-900'
                        }`}>
                        {message.text}
                    </div>
                )}

                {/* Content Grid/List */}
                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedItems.map((item) => {
                            const isSelected = selectedItems.includes(item.id);
                            return (
                                <div key={item.id} className={`group bg-white rounded-2xl border shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col ${isSelected ? 'border-slate-900 ring-2 ring-slate-900/10' : 'border-slate-100'}`}>
                                    <div className="relative aspect-video overflow-hidden bg-slate-100">
                                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />

                                        <div className="absolute top-3 left-3 z-10">
                                            <input type="checkbox" checked={isSelected} onChange={() => toggleItem(item.id)} className="w-5 h-5 text-slate-900 rounded border-slate-300 focus:ring-slate-900 cursor-pointer shadow-lg" />
                                        </div>

                                        <div className="absolute top-3 right-3">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${item.is_active
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                : 'bg-slate-50 text-slate-500 border-slate-200'
                                                }`}>
                                                {item.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                                            <button onClick={() => openEditModal(item)} className="p-2 bg-white rounded-full text-slate-900 hover:scale-110 transition">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                            </button>
                                            <button onClick={() => handleDelete(item.id, item.image_url)} className="p-2 bg-white rounded-full text-red-500 hover:scale-110 transition">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col">
                                        <div className="mb-4 flex-1">
                                            <h3 className="font-bold text-lg text-slate-800 line-clamp-1 mb-1">{item.title}</h3>
                                            {item.link && (
                                                <a href={item.link} target="_blank" className="text-sm text-blue-500 hover:underline line-clamp-1 block">
                                                    {item.link}
                                                </a>
                                            )}
                                        </div>
                                        <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400 font-medium uppercase tracking-wider">
                                            <span>Position: {item.position}</span>
                                            <span>ID: #{item.id.toString().slice(0, 4)}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <>
                        {/* Mobile Card View */}
                        <div className="lg:hidden space-y-3 animate-fade-in-up">
                            {paginatedItems.map((item) => {
                                const isSelected = selectedItems.includes(item.id);
                                return (
                                    <div
                                        key={item.id}
                                        className={`bg-white rounded-xl border shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all ${isSelected ? 'border-slate-900 ring-2 ring-slate-900/10' : 'border-slate-100'}`}
                                    >
                                        <div className="flex gap-4 p-4">
                                            <img
                                                src={item.image_url}
                                                alt={item.title}
                                                className="w-16 h-16 rounded-lg object-cover bg-slate-100 flex-shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-bold text-slate-800 text-sm truncate">{item.title}</h3>
                                                        {item.link && (
                                                            <p className="text-xs text-slate-400 truncate mt-0.5">{item.link}</p>
                                                        )}
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleItem(item.id)}
                                                        className="w-5 h-5 text-slate-900 rounded border-slate-300 focus:ring-slate-900 cursor-pointer flex-shrink-0"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${item.is_active
                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                        : 'bg-slate-50 text-slate-500 border-slate-200'
                                                        }`}>
                                                        {item.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-medium">Pos: {item.position}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex border-t border-slate-100">
                                            <button
                                                onClick={() => openEditModal(item)}
                                                className="flex-1 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition flex items-center justify-center gap-1"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id, item.image_url)}
                                                className="flex-1 py-2.5 text-xs font-medium text-red-500 hover:bg-red-50 transition flex items-center justify-center gap-1 border-l border-slate-100"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden lg:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-fade-in-up">
                            <div className="overflow-x-auto w-full">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="px-6 py-4 w-12">
                                                <input type="checkbox" checked={selectedItems.length === paginatedItems.length && paginatedItems.length > 0} onChange={toggleAll} className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-900 cursor-pointer" />
                                            </th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Image</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Details</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {paginatedItems.map((item) => {
                                            const isSelected = selectedItems.includes(item.id);
                                            return (
                                                <tr key={item.id} className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-slate-50' : ''}`}>
                                                    <td className="px-6 py-4">
                                                        <input type="checkbox" checked={isSelected} onChange={() => toggleItem(item.id)} className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-900 cursor-pointer" />
                                                    </td>
                                                    <td className="px-6 py-4 w-24">
                                                        <img src={item.image_url} alt={item.title} className="w-12 h-12 rounded-lg object-cover bg-slate-100" />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-semibold text-slate-800">{item.title}</div>
                                                        {item.link && <div className="text-sm text-slate-500 truncate max-w-xs">{item.link}</div>}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${item.is_active
                                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                            : 'bg-slate-50 text-slate-500 border-slate-200'
                                                            }`}>
                                                            {item.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button onClick={() => openEditModal(item)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition">
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                            </button>
                                                            <button onClick={() => handleDelete(item.id, item.image_url)} className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition">
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center pt-8">
                        <div className="flex bg-white rounded-xl border border-slate-200 p-1 gap-1 shadow-sm">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-50 text-slate-600 disabled:opacity-50"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${currentPage === i + 1
                                        ? 'bg-slate-900 text-white shadow-md'
                                        : 'hover:bg-slate-50 text-slate-600'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-50 text-slate-600 disabled:opacity-50"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Bulk Action Bar - Responsive Fix */}
            {selectedItems.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl shadow-2xl flex flex-col md:flex-row items-center gap-4 md:gap-6 animate-fade-in-up w-[90%] md:w-auto max-w-2xl">
                    <div className="font-bold flex items-center justify-between w-full md:w-auto gap-2">
                        <div className="flex items-center gap-2">
                            <span className="bg-white text-slate-900 w-6 h-6 rounded-full flex items-center justify-center text-xs">{selectedItems.length}</span>
                            <span>Selected</span>
                        </div>
                        <button onClick={() => setSelectedItems([])} className="md:hidden text-slate-400 hover:text-white text-sm">Cancel</button>
                    </div>
                    <div className="hidden md:block h-6 w-px bg-slate-700"></div>
                    <div className="flex flex-wrap justify-center md:items-center gap-2 w-full md:w-auto">
                        <button onClick={() => handleBulkStatus(true)} className="flex-1 md:flex-none px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-bold transition whitespace-nowrap">Set Active</button>
                        <button onClick={() => handleBulkStatus(false)} className="flex-1 md:flex-none px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-bold transition whitespace-nowrap">Set Inactive</button>
                        <button onClick={handleBulkDelete} className="flex-1 md:flex-none px-3 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 whitespace-nowrap">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            Delete
                        </button>
                        <button onClick={() => setSelectedItems([])} className="hidden md:block ml-2 text-slate-400 hover:text-white text-sm">Cancel</button>
                    </div>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-all duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[110vh] overflow-y-auto animate-fade-in-up">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 sticky top-0 backdrop-blur-md z-10">
                            <h3 className="text-xl font-bold text-slate-800">
                                {editItem ? 'Edit Project' : 'Add New Project'}
                            </h3>
                            <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6 flex flex-col md:flex-row gap-6">

                            {/* Image Upload */}
                            <div className="w-full md:w-1/3 bg-slate-50 p-6 rounded-xl border border-dashed border-slate-300 text-center relative group">
                                {imagePreview ? (
                                    <div className="relative">
                                        <img src={imagePreview} alt="Preview" className="h-64 h-auto mx-auto rounded-lg shadow-sm" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                            <p className="text-white font-medium">Click to change image</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-8">
                                        <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        <p className="text-sm text-slate-500 font-medium">Click to upload project thumbnail</p>
                                        <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 5MB</p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                            <div className="w-full md:w-2/3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Project Title</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all font-medium"
                                            placeholder="e.g. Corporate Branding"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Sort Position</label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.position}
                                            onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) })}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all font-medium"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">External Link</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                        </span>
                                        <input
                                            type="url"
                                            value={formData.link}
                                            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all font-medium"
                                            placeholder="https://client-site.com"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                                        <input
                                            type="checkbox"
                                            id="status-toggle"
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                            className="opacity-0 w-0 h-0 peer"
                                        />
                                        <label
                                            htmlFor="status-toggle"
                                            className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors duration-300 ${formData.is_active ? 'bg-slate-900' : 'bg-slate-300'
                                                } before:content-[''] before:absolute before:left-1 before:bottom-1 before:bg-white before:w-4 before:h-4 before:rounded-full before:transition-transform before:duration-300 ${formData.is_active ? 'before:translate-x-6' : 'before:translate-x-0'
                                                }`}
                                        ></label>
                                    </div>
                                    <label htmlFor="status-toggle" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
                                        Set as Active Project
                                    </label>
                                </div>

                                <div className="flex gap-3 pt-6 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="flex-1 px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={uploading}
                                        className="flex-1 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {uploading && <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                                        {editItem ? 'Update Project' : 'Create Project'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}