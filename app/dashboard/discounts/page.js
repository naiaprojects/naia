// app/dashboard/discounts/page.js
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
            <div className={`relative w-full ${maxWidth} bg-white rounded-2xl shadow-2xl transform transition-all animate-fade-in-up my-8`}>
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl sticky top-0 z-10">
                    <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors bg-white rounded-full p-1 hover:bg-gray-100">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-6 max-h-[70vh] overflow-y-auto">{children}</div>
            </div>
        </div>
    );
};



export default function DiscountsPage() {
    const supabase = createClient();

    // State
    const [discounts, setDiscounts] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'auto' | 'code' | 'inactive'

    // Modal State
    const [isModalOpen, setModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentDiscount, setCurrentDiscount] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Form State
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        discount_type: 'code',
        discount_value_type: 'percentage',
        discount_value: '',
        applies_to: 'all',
        service_ids: [],
        package_names: [],
        min_order_amount: '',
        max_discount_amount: '',
        usage_limit: '',
        start_date: '',
        end_date: '',
        is_active: true
    });

    useEffect(() => {
        fetchDiscounts();
        fetchServices();
    }, []);

    const fetchDiscounts = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/discounts?all=true');
            const data = await response.json();
            setDiscounts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchServices = async () => {
        try {
            const { data, error } = await supabase
                .from('services')
                .select('id, title, slug, packages')
                .eq('is_active', true);
            if (!error) setServices(data || []);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    const formatPrice = (price) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price).replace('IDR', 'Rp');
    const formatDate = (date) => date ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date)) : '-';

    // Filtered discounts
    const filteredDiscounts = useMemo(() => {
        return discounts.filter(d => {
            const matchesSearch = d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                d.code?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesTab =
                activeTab === 'all' ? d.is_active :
                    activeTab === 'auto' ? (d.discount_type === 'auto' && d.is_active) :
                        activeTab === 'code' ? (d.discount_type === 'code' && d.is_active) :
                            !d.is_active;
            return matchesSearch && matchesTab;
        });
    }, [discounts, searchQuery, activeTab]);

    // Generate random code
    const generateCode = async () => {
        try {
            const response = await fetch('/api/discounts/generate-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prefix: 'NAIA', length: 6 })
            });
            const data = await response.json();
            if (data.success) {
                setFormData({ ...formData, code: data.code });
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    // Open create modal
    const openCreateModal = () => {
        setIsEditing(false);
        setCurrentDiscount(null);
        setFormData({
            code: '',
            name: '',
            description: '',
            discount_type: 'code',
            discount_value_type: 'percentage',
            discount_value: '',
            applies_to: 'all',
            service_ids: [],
            package_names: [],
            min_order_amount: '',
            max_discount_amount: '',
            usage_limit: '',
            start_date: '',
            end_date: '',
            is_active: true
        });
        setModalOpen(true);
    };

    // Open edit modal
    const openEditModal = (discount) => {
        setIsEditing(true);
        setCurrentDiscount(discount);
        setFormData({
            code: discount.code || '',
            name: discount.name || '',
            description: discount.description || '',
            discount_type: discount.discount_type || 'code',
            discount_value_type: discount.discount_value_type || 'percentage',
            discount_value: discount.discount_value || '',
            applies_to: discount.applies_to || 'all',
            service_ids: discount.service_ids || [],
            package_names: discount.package_names || [],
            min_order_amount: discount.min_order_amount || '',
            max_discount_amount: discount.max_discount_amount || '',
            usage_limit: discount.usage_limit || '',
            start_date: discount.start_date ? discount.start_date.slice(0, 16) : '',
            end_date: discount.end_date ? discount.end_date.slice(0, 16) : '',
            is_active: discount.is_active
        });
        setModalOpen(true);
    };

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);

        try {
            const url = '/api/discounts';
            const method = isEditing ? 'PUT' : 'POST';
            const body = isEditing ? { id: currentDiscount.id, ...formData } : formData;

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await response.json();
            if (data.success) {
                showMessage(isEditing ? 'Discount successfully updated!' : 'Discount successfully created!');
                setModalOpen(false);
                fetchDiscounts();
            } else {
                showMessage(data.error || 'An error occurred', 'error');
            }
        } catch (error) {
            showMessage('Error: ' + error.message, 'error');
        } finally {
            setProcessing(false);
        }
    };

    // Handle delete
    const handleDelete = async (id) => {
        if (!confirm('Hapus diskon ini?')) return;
        setProcessing(true);
        try {
            const response = await fetch(`/api/discounts?id=${id}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                showMessage('Discount successfully deleted!');
                fetchDiscounts();
            } else {
                showMessage(data.error || 'Failed to delete', 'error');
            }
        } catch (error) {
            showMessage('Error: ' + error.message, 'error');
        } finally {
            setProcessing(false);
        }
    };

    // Toggle service selection
    const toggleService = (serviceId) => {
        setFormData(prev => ({
            ...prev,
            service_ids: prev.service_ids.includes(serviceId)
                ? prev.service_ids.filter(id => id !== serviceId)
                : [...prev.service_ids, serviceId]
        }));
    };

    const getDiscountBadge = (type) => {
        return type === 'auto'
            ? { bg: 'bg-purple-50 text-purple-700 border-purple-100', label: 'Auto' }
            : { bg: 'bg-blue-50 text-blue-700 border-blue-100', label: 'Code' };
    };

    if (loading) {
        return <div className="flex justify-center items-center h-[60vh]"><LogoPathAnimation /></div>;
    }

    return (
        <div className="p-4 lg:p-8 pb-24 relative min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Discounts', href: '/dashboard/discounts' }]} />
                    <h1 className="text-3xl font-bold text-gray-800 tracking-tight mt-2">Discount Management</h1>
                    <p className="text-gray-500 mt-1">Manage discounts and promo codes</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-orange-500/20 active:scale-95"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add Discount
                </button>
            </div>

            {/* Toast */}
            {message.text && (
                <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-xl shadow-2xl z-50 text-white font-medium animate-fade-in-up ${message.type === 'error' ? 'bg-red-500' : 'bg-slate-900'}`}>
                    {message.text}
                </div>
            )}

            {/* Controls */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col md:flex-row gap-4 justify-between items-center shadow-sm mb-6">
                <div className="flex p-1 bg-gray-100 rounded-xl w-full md:w-auto overflow-x-auto">
                    {[
                        { id: 'all', label: 'Active' },
                        { id: 'auto', label: 'Auto' },
                        { id: 'code', label: 'Code' },
                        { id: 'inactive', label: 'Inactive' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="relative w-full md:w-64">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search discounts..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-gray-200 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none"
                    />
                </div>
            </div>

            {/* Discount Grid - Mobile Cards */}
            <div className="lg:hidden space-y-3">
                {filteredDiscounts.map(discount => {
                    const typeBadge = getDiscountBadge(discount.discount_type);
                    return (
                        <div key={discount.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="p-4">
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{discount.code}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${typeBadge.bg}`}>{typeBadge.label}</span>
                                            {!discount.is_active && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">Inactive</span>}
                                        </div>
                                        <h3 className="font-bold text-gray-800 text-sm">{discount.name}</h3>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                    <div>
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase">Discount</p>
                                        <p className="text-sm text-primary font-bold">
                                            {discount.discount_value_type === 'percentage' ? `${discount.discount_value}%` : formatPrice(discount.discount_value)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase">Usage</p>
                                        <p className="text-xs text-gray-700">{discount.usage_count || 0}{discount.usage_limit ? `/${discount.usage_limit}` : ''}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex border-t border-gray-100">
                                <button onClick={() => openEditModal(discount)} className="flex-1 py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition flex items-center justify-center gap-1">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    Edit
                                </button>
                                <button onClick={() => handleDelete(discount.id)} className="flex-1 py-2.5 text-xs font-medium text-red-500 hover:bg-red-50 transition flex items-center justify-center gap-1 border-l border-gray-100">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    Delete
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-700">Code</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Name</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Type</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Discount</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Usage</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Period</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 text-center">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredDiscounts.map(discount => {
                                const typeBadge = getDiscountBadge(discount.discount_type);
                                return (
                                    <tr key={discount.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs bg-gray-50 rounded">{discount.code}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-800">{discount.name}</div>
                                            {discount.description && <div className="text-xs text-gray-500 truncate max-w-[200px]">{discount.description}</div>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${typeBadge.bg}`}>{typeBadge.label}</span>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-gray-800">
                                            {discount.discount_value_type === 'percentage' ? `${discount.discount_value}%` : formatPrice(discount.discount_value)}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {discount.usage_count || 0}{discount.usage_limit ? ` / ${discount.usage_limit}` : ' / ∞'}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500">
                                            {discount.start_date || discount.end_date ? (
                                                <>{formatDate(discount.start_date)} - {formatDate(discount.end_date)}</>
                                            ) : 'No limit'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${discount.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {discount.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button onClick={() => openEditModal(discount)} className="text-primary hover:text-orange-700 font-medium">Edit</button>
                                            <button onClick={() => handleDelete(discount.id)} className="text-red-500 hover:text-red-700">Delete</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {filteredDiscounts.length === 0 && (
                <div className="py-20 text-center flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-gray-300">
                    <div className="bg-gray-50 p-4 rounded-full mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No discounts found</h3>
                    <p className="text-gray-500">Create your first discount to get started.</p>
                </div>
            )}

            {/* Discount Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                title={isEditing ? 'Edit Discount' : 'Create New Discount'}
                maxWidth="max-w-2xl"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h4 className="border-b border-gray-200 pb-2 text-sm font-semibold text-gray-800 uppercase tracking-wider">Basic Information</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Discount Code</label>
                                <div className="flex gap-2">
                                    <input
                                        required
                                        type="text"
                                        className="flex-1 h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none uppercase"
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        placeholder="NAIA2024"
                                    />
                                    <button
                                        type="button"
                                        onClick={generateCode}
                                        className="px-4 h-11 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition"
                                    >
                                        Generate
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Discount Name</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="New Year Sale"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (Optional)</label>
                            <textarea
                                rows="2"
                                className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Brief description..."
                            />
                        </div>
                    </div>

                    {/* Discount Type & Value */}
                    <div className="space-y-4">
                        <h4 className="border-b border-gray-200 pb-2 text-sm font-semibold text-gray-800 uppercase tracking-wider">Discount Settings</h4>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Discount Type</label>
                                <select
                                    className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none"
                                    value={formData.discount_type}
                                    onChange={e => setFormData({ ...formData, discount_type: e.target.value })}
                                >
                                    <option value="code">Code (Manual Input)</option>
                                    <option value="auto">Auto (Automatic Apply)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Value Type</label>
                                <select
                                    className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none"
                                    value={formData.discount_value_type}
                                    onChange={e => setFormData({ ...formData, discount_value_type: e.target.value })}
                                >
                                    <option value="percentage">Percentage (%)</option>
                                    <option value="fixed">Fixed Amount (Rp)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Discount Value {formData.discount_value_type === 'percentage' ? '(%)' : '(Rp)'}
                                </label>
                                <input
                                    required
                                    type="number"
                                    step={formData.discount_value_type === 'percentage' ? '1' : '1000'}
                                    className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none"
                                    value={formData.discount_value}
                                    onChange={e => setFormData({ ...formData, discount_value: e.target.value })}
                                    placeholder={formData.discount_value_type === 'percentage' ? '10' : '50000'}
                                />
                            </div>
                        </div>

                        {formData.discount_value_type === 'percentage' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Discount Amount (Optional)</label>
                                <input
                                    type="number"
                                    step="1000"
                                    className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none"
                                    value={formData.max_discount_amount}
                                    onChange={e => setFormData({ ...formData, max_discount_amount: e.target.value })}
                                    placeholder="100000"
                                />
                            </div>
                        )}
                    </div>

                    {/* Applies To */}
                    <div className="space-y-4">
                        <h4 className="border-b border-gray-200 pb-2 text-sm font-semibold text-gray-800 uppercase tracking-wider">Applies To</h4>

                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { value: 'all', label: 'All Services' },
                                { value: 'services', label: 'Specific Services' },
                                { value: 'store', label: 'Store Products' }
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, applies_to: opt.value, service_ids: [] })}
                                    className={`py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${formData.applies_to === opt.value ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {formData.applies_to === 'services' && services.length > 0 && (
                            <div className="mt-4 space-y-2 max-h-40 overflow-y-auto p-3 bg-gray-50 rounded-xl">
                                {services.map(service => (
                                    <label key={service.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white cursor-pointer transition">
                                        <input
                                            type="checkbox"
                                            checked={formData.service_ids.includes(service.id)}
                                            onChange={() => toggleService(service.id)}
                                            className="w-4 h-4 text-primary rounded focus:ring-primary"
                                        />
                                        <span className="text-sm font-medium text-gray-700">{service.title}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Limits */}
                    <div className="space-y-4">
                        <h4 className="border-b border-gray-200 pb-2 text-sm font-semibold text-gray-800 uppercase tracking-wider">Limits & Duration</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Min Order Amount</label>
                                <input
                                    type="number"
                                    step="1000"
                                    className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none"
                                    value={formData.min_order_amount}
                                    onChange={e => setFormData({ ...formData, min_order_amount: e.target.value })}
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Usage Limit (Empty = Unlimited)</label>
                                <input
                                    type="number"
                                    className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none"
                                    value={formData.usage_limit}
                                    onChange={e => setFormData({ ...formData, usage_limit: e.target.value })}
                                    placeholder="100"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
                                <input
                                    type="datetime-local"
                                    className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none"
                                    value={formData.start_date}
                                    onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
                                <input
                                    type="datetime-local"
                                    className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none"
                                    value={formData.end_date}
                                    onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                        <label className="flex items-center cursor-pointer gap-3">
                            <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${formData.is_active ? 'bg-green-500' : 'bg-gray-300'}`}>
                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${formData.is_active ? 'translate-x-6' : ''}`} />
                            </div>
                            <input type="checkbox" className="hidden" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} />
                            <span className="text-sm font-medium text-gray-700">Active Status</span>
                        </label>
                    </div>

                    {/* Submit */}
                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors">Cancel</button>
                        <button type="submit" disabled={processing} className="flex-1 py-3 px-4 rounded-xl bg-orange-600 text-white font-medium hover:bg-orange-700 shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50">
                            {processing ? 'Saving...' : (isEditing ? 'Update Discount' : 'Create Discount')}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
