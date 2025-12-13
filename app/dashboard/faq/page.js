'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';
import LogoPathAnimation from '@/components/LogoPathAnimation';



export default function FAQManagementPage() {
    const supabase = createClient();
    const router = useRouter();

    // Data State
    const [faqItems, setFaqItems] = useState([]);
    const [loading, setLoading] = useState(true);

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
    const [saving, setSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        question: '',
        answer: '',
        position: 0,
        is_active: true
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data, error } = await supabase
                .from('faq_items')
                .select('*')
                .order('position', { ascending: true });

            if (error) throw error;
            setFaqItems(data || []);
        } catch (error) {
            console.error('Error fetching FAQ:', error);
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
            const { error } = await supabase.from('faq_items').delete().in('id', selectedItems);
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
            const { error } = await supabase.from('faq_items').update({ is_active: isActive }).in('id', selectedItems);
            if (error) throw error;
            showMessage(`${selectedItems.length} items updated.`);
            setSelectedItems([]);
            fetchData();
        } catch (e) {
            showMessage('Error: ' + e.message, 'error');
            setLoading(false);
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const dataToSave = {
                ...formData,
                updated_at: new Date().toISOString()
            };

            if (editItem) {
                const { error } = await supabase
                    .from('faq_items')
                    .update(dataToSave)
                    .eq('id', editItem.id);
                if (error) throw error;
                showMessage('FAQ updated successfully');
            } else {
                const { error } = await supabase
                    .from('faq_items')
                    .insert([dataToSave]);
                if (error) throw error;
                showMessage('FAQ added successfully');
            }

            closeModal();
            fetchData();
            router.refresh();
        } catch (error) {
            console.error('Error saving FAQ:', error);
            showMessage('Error: ' + error.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this FAQ?')) return;

        try {
            const { error } = await supabase
                .from('faq_items')
                .delete()
                .eq('id', id);

            if (error) throw error;

            showMessage('FAQ deleted successfully');
            fetchData();
            router.refresh();
        } catch (error) {
            console.error('Error deleting FAQ:', error);
            showMessage('Error: ' + error.message, 'error');
        }
    };

    const openCreateModal = () => {
        setEditItem(null);
        setFormData({
            question: '',
            answer: '',
            position: faqItems.length + 1,
            is_active: true
        });
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setEditItem(item);
        setFormData({
            question: item.question,
            answer: item.answer,
            position: item.position,
            is_active: item.is_active
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditItem(null);
    };

    // Filtering and Pagination Logic
    const filteredItems = useMemo(() => {
        return faqItems.filter(item => {
            const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.answer.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesTab = activeTab === 'all'
                ? true
                : activeTab === 'active' ? item.is_active : !item.is_active;

            return matchesSearch && matchesTab;
        });
    }, [faqItems, searchQuery, activeTab]);

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
            <div className="space-y-6">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <Breadcrumb />
                        <h1 className="text-3xl font-bold text-slate-800 tracking-tight mt-2">FAQ Management</h1>
                        <p className="text-slate-500 mt-1">Manage frequently asked questions</p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-slate-200 active:scale-95"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add FAQ
                    </button>
                </div>

                {/* Controls Section */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">

                    {/* Tabs */}
                    <div className="flex p-1 bg-slate-100 rounded-xl w-full md:w-auto">
                        {['active', 'inactive', 'all'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-lg transition-all capitalize ${activeTab === tab
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {tab === 'all' ? 'All' : tab === 'active' ? 'Active' : 'Inactive'}
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
                                placeholder="Search questions..."
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
                                <div key={item.id} className={`group bg-white rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col p-6 relative overflow-hidden ${isSelected ? 'border-slate-900 ring-2 ring-slate-900/10' : 'border-slate-100'}`}>
                                    <div className="absolute top-4 left-4 z-10">
                                        <input type="checkbox" checked={isSelected} onChange={() => toggleItem(item.id)} className="w-5 h-5 text-slate-900 rounded border-slate-300 focus:ring-slate-900 cursor-pointer shadow-lg" />
                                    </div>
                                    <div className="absolute top-0 right-0 p-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${item.is_active
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            : 'bg-slate-50 text-slate-500 border-slate-200'
                                            }`}>
                                            {item.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div className="mb-4 pr-16 mt-6">
                                        <h3 className="font-bold text-slate-800 text-lg leading-tight mb-2">{item.question}</h3>
                                        <div className="w-10 h-1 bg-primary/20 rounded-full"></div>
                                    </div>
                                    <p className="text-slate-600 text-sm flex-1 mb-6 line-clamp-4 leading-relaxed">
                                        {item.answer}
                                    </p>
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pos: {item.position}</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => openEditModal(item)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-600 transition hover:text-primary">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                            </button>
                                            <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
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
                                        className={`bg-white rounded-xl border shadow-sm overflow-hidden ${isSelected ? 'border-slate-900 ring-2 ring-slate-900/10' : 'border-slate-100'}`}
                                    >
                                        <div className="p-4">
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-slate-800 text-sm line-clamp-2">{item.question}</h3>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleItem(item.id)}
                                                    className="w-5 h-5 text-slate-900 rounded border-slate-300 focus:ring-slate-900 cursor-pointer flex-shrink-0"
                                                />
                                            </div>
                                            <p className="text-xs text-slate-500 line-clamp-2 mb-3">{item.answer}</p>
                                            <div className="flex items-center justify-between">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${item.is_active
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    : 'bg-slate-50 text-slate-500 border-slate-200'
                                                    }`}>
                                                    {item.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-medium">Pos: {item.position}</span>
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
                                                onClick={() => handleDelete(item.id)}
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
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Question</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Answer Preview</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Position</th>
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
                                                    <td className="px-6 py-4 font-medium text-slate-800 w-1/4">
                                                        {item.question}
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600 max-w-xs truncate">
                                                        {item.answer}
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600">
                                                        {item.position}
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
                                                            <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition">
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
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto animate-fade-in-up">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 sticky top-0 backdrop-blur-md z-10">
                            <h3 className="text-xl font-bold text-slate-800">
                                {editItem ? 'Edit FAQ' : 'Add New FAQ'}
                            </h3>
                            <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Question</label>
                                <input
                                    type="text"
                                    value={formData.question}
                                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all font-medium"
                                    placeholder="e.g. How do I order?"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Answer</label>
                                <textarea
                                    value={formData.answer}
                                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all font-medium min-h-[120px]"
                                    placeholder="Enter the detailed answer..."
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
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
                                <div className="flex items-center pt-6">
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
                                    <label htmlFor="status-toggle" className="ml-3 text-sm font-semibold text-slate-700 cursor-pointer select-none">
                                        Set Active
                                    </label>
                                </div>
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
                                    disabled={saving}
                                    className="flex-1 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {saving && <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                                    {editItem ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}