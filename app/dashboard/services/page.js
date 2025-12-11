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
            <div className={`relative w-full ${maxWidth} bg-white rounded-2xl shadow-2xl transform transition-all animate-fade-in-up`}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
                    <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors bg-white rounded-full p-1 hover:bg-gray-100">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                {/* Body */}
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default function ServicesPage() {
    const supabase = createClient();

    // -- State --
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('active'); // 'active' | 'inactive' | 'all'
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    // Bulk Actions State
    const [selectedItems, setSelectedItems] = useState([]);

    // Service Form State
    const [isServiceModalOpen, setServiceModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentService, setCurrentService] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        description: '',
        icon_url: '',
        is_active: true,
        packages: []
    });

    // Package Modal State
    const [isPackageModalOpen, setPackageModalOpen] = useState(false);
    const [editingPackageIndex, setEditingPackageIndex] = useState(-1);
    const [packageForm, setPackageForm] = useState({
        name: '', price: 0, description: '', features: [''], is_popular: false, is_special: false
    });

    // -- Fetch Data --
    const fetchServices = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setServices(data || []);
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to load services');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    // -- Computed Data --
    const filteredServices = useMemo(() => {
        return services.filter(service => {
            const matchesSearch = service.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesTab =
                activeTab === 'all' ? true :
                    activeTab === 'active' ? service.is_active :
                        !service.is_active;
            return matchesSearch && matchesTab;
        });
    }, [services, searchQuery, activeTab]);

    const paginatedServices = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredServices.slice(start, start + itemsPerPage);
    }, [filteredServices, currentPage]);

    const totalPages = Math.ceil(filteredServices.length / itemsPerPage);

    // -- Bulk Handlers --
    const toggleItem = (id) => {
        setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleAll = () => {
        if (selectedItems.length === paginatedServices.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(paginatedServices.map(i => i.id));
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selectedItems.length} selected services? This action cannot be undone.`)) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('services').delete().in('id', selectedItems);
            if (error) throw error;
            setSelectedItems([]);
            fetchServices();
        } catch (e) {
            alert('Error: ' + e.message);
            setLoading(false);
        }
    };

    const handleBulkStatus = async (isActive) => {
        if (!confirm(`Set status of ${selectedItems.length} services to ${isActive ? 'Active' : 'Inactive'}?`)) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('services').update({ is_active: isActive }).in('id', selectedItems);
            if (error) throw error;
            setSelectedItems([]);
            fetchServices();
        } catch (e) {
            alert('Error: ' + e.message);
            setLoading(false);
        }
    };


    // -- Handlers: Service --
    const openCreateModal = () => {
        setIsEditing(false);
        setFormData({ title: '', slug: '', description: '', icon_url: '', is_active: true, packages: [] });
        setServiceModalOpen(true);
    };

    const openEditModal = (service) => {
        setIsEditing(true);
        setCurrentService(service);
        setFormData({
            title: service.title,
            slug: service.slug,
            description: service.description || '',
            icon_url: service.icon_url || '',
            is_active: service.is_active,
            packages: service.packages || []
        });
        setServiceModalOpen(true);
    };

    const handleServiceSubmit = async (e) => {
        e.preventDefault();

        // Calculate price range
        let priceRange = '';
        if (formData.packages && formData.packages.length > 0) {
            const prices = formData.packages.map(p => parseFloat(p.price));
            const min = Math.min(...prices);
            const max = Math.max(...prices);
            const format = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
            priceRange = prices.length > 1 ? `${format(min)} - ${format(max)}` : format(min);
        }

        const dataToSave = { ...formData, price_range: priceRange };

        try {
            if (isEditing) {
                const { error } = await supabase.from('services').update(dataToSave).eq('id', currentService.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('services').insert([dataToSave]);
                if (error) throw error;
            }
            fetchServices();
            setServiceModalOpen(false);
        } catch (error) {
            alert(error.message);
        }
    };

    const handleDeleteService = async (id) => {
        if (!confirm('Delete this service and its packages?')) return;
        try {
            const { error } = await supabase.from('services').delete().eq('id', id);
            if (error) throw error;
            fetchServices();
        } catch (error) {
            alert(error.message);
        }
    };

    // -- Handlers: Package (Nested) --


    // NOTE: In the previous code, openPackageList was empty/placeholder.
    // The UX is: In Service Modal -> Click "Add Package" -> Opens Package Modal.

    const savePackage = () => {
        const newPackages = [...formData.packages];
        if (editingPackageIndex >= 0) {
            newPackages[editingPackageIndex] = packageForm;
        } else {
            newPackages.push(packageForm);
        }
        setFormData({ ...formData, packages: newPackages });
        setPackageModalOpen(false);
    };

    const deletePackage = (index) => {
        const newPackages = formData.packages.filter((_, i) => i !== index);
        setFormData({ ...formData, packages: newPackages });
    };

    const openCreatePackage = () => {
        setEditingPackageIndex(-1);
        setPackageForm({ name: '', price: 0, description: '', features: [''], is_popular: false, is_special: false });
        setPackageModalOpen(true);
    };

    const openEditPackage = (pkg, index) => {
        setEditingPackageIndex(index);
        // Deep copy features to avoid ref issues
        setPackageForm({ ...pkg, features: [...(pkg.features || [])] });
        setPackageModalOpen(true);
    };

    // Feature Handlers inside Package Modal
    const handleFeatureChange = (idx, val) => {
        const newFeatures = [...packageForm.features];
        newFeatures[idx] = val;
        setPackageForm({ ...packageForm, features: newFeatures });
    };
    const addFeature = () => setPackageForm({ ...packageForm, features: [...packageForm.features, ''] });
    const removeFeature = (idx) => setPackageForm({ ...packageForm, features: packageForm.features.filter((_, i) => i !== idx) });


    return (
        <div className="p-4 lg:p-8 pb-24 relative min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Services', href: '/dashboard/services' }]} />
                    <h1 className="text-3xl font-bold text-gray-800 tracking-tight mt-2">Services & Packages</h1>
                    <p className="text-gray-500 mt-1">Manage your services and package prices</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-orange-500/20 active:scale-95"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add Service
                </button>
            </div>

            {/* Controls Bar */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col md:flex-row gap-4 justify-between items-center shadow-sm mb-6">

                {/* Tabs */}
                <div className="flex p-1 bg-gray-100 rounded-xl w-full md:w-auto">
                    {['active', 'inactive', 'all'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-lg capitalize transition-all ${activeTab === tab ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {tab === 'all' ? 'All' : tab === 'active' ? 'Active' : 'Inactive'}
                        </button>
                    ))}
                </div>

                {/* Search & View Toggle */}
                <div className="flex w-full md:w-auto gap-3">
                    <div className="relative flex-1 md:w-64">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search services..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-gray-200 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none"
                        />
                    </div>

                    <div className="flex bg-gray-100 rounded-xl p-1 shrink-0">
                        <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                        </button>
                        <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <LogoPathAnimation />
                </div>
            ) : filteredServices.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-gray-300">
                    <div className="bg-gray-50 p-4 rounded-full mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No services found</h3>
                    <p className="text-gray-500">Start by adding a new service.</p>
                </div>
            ) : (
                <>
                    {/* View Mode: Grid */}
                    {viewMode === 'grid' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {paginatedServices.map(service => {
                                const isSelected = selectedItems.includes(service.id);
                                return (
                                    <div key={service.id} className={`group bg-white rounded-2xl border p-6 hover:shadow-xl transition-all duration-300 flex flex-col relative overflow-hidden ${isSelected ? 'border-primary ring-2 ring-primary/10' : 'border-gray-200'}`}>
                                        <div className="absolute top-4 left-4 z-10">
                                            <input type="checkbox" checked={isSelected} onChange={() => toggleItem(service.id)} className="w-5 h-5 text-orange-600 rounded border-gray-300 focus:ring-orange-600 cursor-pointer shadow-sm" />
                                        </div>
                                        <div className="mb-4 flex items-start justify-end">

                                            <div className={`p-3 rounded-xl ${service.is_active ? 'bg-orange-50 text-primary' : 'bg-gray-100 text-gray-400'}`}>
                                                {service.icon_url ? <img src={service.icon_url} className="w-8 h-8 object-contain" /> : (
                                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                )}
                                            </div>
                                        </div>

                                        <h3 className="text-lg font-bold text-gray-800 mb-1">{service.title}</h3>
                                        <p className="text-xs text-gray-400 font-mono mb-3">/{service.slug}</p>
                                        <p className="text-gray-600 text-sm line-clamp-2 mb-4 flex-1">{service.description}</p>

                                        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-gray-400">Price Range</p>
                                                <p className="font-semibold text-gray-800 text-sm">{service.price_range || '-'}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => openEditModal(service)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-primary transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                                <button onClick={() => handleDeleteService(service.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-500 transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>

                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* View Mode: List */}
                    {viewMode === 'list' && (
                        <>
                            {/* Mobile Card View */}
                            <div className="lg:hidden space-y-3 animate-fade-in-up">
                                {paginatedServices.map(service => {
                                    const isSelected = selectedItems.includes(service.id);
                                    return (
                                        <div
                                            key={service.id}
                                            className={`bg-white rounded-xl border shadow-sm overflow-hidden ${isSelected ? 'border-primary ring-2 ring-primary/10' : 'border-gray-200'}`}
                                        >
                                            <div className="p-4">
                                                <div className="flex items-start justify-between gap-3 mb-2">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h3 className="font-bold text-gray-800 text-sm">{service.title}</h3>
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${service.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                                {service.is_active ? 'Active' : 'Draft'}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-400 font-mono mt-0.5">/{service.slug}</p>
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleItem(service.id)}
                                                        className="w-5 h-5 text-orange-600 rounded border-gray-300 focus:ring-orange-600 cursor-pointer flex-shrink-0"
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                                    <div>
                                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Price</p>
                                                        <p className="text-xs text-primary font-semibold">{service.price_range || '-'}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Packages</p>
                                                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg font-medium text-xs">{service.packages?.length || 0}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex border-t border-gray-100">
                                                <button
                                                    onClick={() => openEditModal(service)}
                                                    className="flex-1 py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition flex items-center justify-center gap-1"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteService(service.id)}
                                                    className="flex-1 py-2.5 text-xs font-medium text-red-500 hover:bg-red-50 transition flex items-center justify-center gap-1 border-l border-gray-100"
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
                            <div className="hidden lg:block bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                                <div className="overflow-x-auto w-full">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 border-b border-gray-100">
                                            <tr>
                                                <th className="px-6 py-4 w-12">
                                                    <input type="checkbox" checked={selectedItems.length === paginatedServices.length && paginatedServices.length > 0} onChange={toggleAll} className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-600 cursor-pointer" />
                                                </th>
                                                <th className="px-6 py-4 font-semibold text-gray-700">Service</th>
                                                <th className="px-6 py-4 font-semibold text-gray-700">Slug</th>
                                                <th className="px-6 py-4 font-semibold text-gray-700">Price</th>
                                                <th className="px-6 py-4 font-semibold text-gray-700 text-center">Packages</th>
                                                <th className="px-6 py-4 font-semibold text-gray-700 text-center">Status</th>
                                                <th className="px-6 py-4 font-semibold text-gray-700 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {paginatedServices.map(service => {
                                                const isSelected = selectedItems.includes(service.id);
                                                return (
                                                    <tr key={service.id} className={`hover:bg-gray-50/50 transition-colors ${isSelected ? 'bg-orange-50/10' : ''}`}>
                                                        <td className="px-6 py-4">
                                                            <input type="checkbox" checked={isSelected} onChange={() => toggleItem(service.id)} className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-600 cursor-pointer" />
                                                        </td>
                                                        <td className="px-6 py-4 font-medium text-gray-800">{service.title}</td>
                                                        <td className="px-6 py-4 text-gray-500">{service.slug}</td>
                                                        <td className="px-6 py-4 text-gray-600">{service.price_range || '-'}</td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-medium text-xs">{service.packages?.length || 0}</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${service.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                                {service.is_active ? 'Active' : 'Draft'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right space-x-2">
                                                            <button onClick={() => openEditModal(service)} className="text-primary hover:text-orange-700 font-medium">Edit</button>
                                                            <button onClick={() => handleDeleteService(service.id)} className="text-red-500 hover:text-red-700">Delete</button>
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
                        <div className="flex justify-center mt-8 gap-2">
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-medium transition-all ${currentPage === i + 1 ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/20' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )
            }

            {/* Bulk Action Bar */}
            {
                selectedItems.length > 0 && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900 text-white px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl shadow-2xl flex flex-col md:flex-row items-center gap-4 md:gap-6 animate-fade-in-up border border-gray-800 w-[90%] md:w-auto max-w-2xl">
                        <div className="font-bold flex items-center justify-between w-full md:w-auto gap-2">
                            <div className="flex items-center gap-2">
                                <span className="bg-white text-gray-900 w-6 h-6 rounded-full flex items-center justify-center text-xs">{selectedItems.length}</span>
                                <span>Selected</span>
                            </div>
                            <button onClick={() => setSelectedItems([])} className="md:hidden text-gray-400 hover:text-white text-sm">Cancel</button>
                        </div>
                        <div className="hidden md:block h-6 w-px bg-gray-700"></div>
                        <div className="flex flex-wrap justify-center md:items-center gap-2 w-full md:w-auto">
                            <button onClick={() => handleBulkStatus(true)} className="flex-1 md:flex-none px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-bold transition whitespace-nowrap">Set Active</button>
                            <button onClick={() => handleBulkStatus(false)} className="flex-1 md:flex-none px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-bold transition whitespace-nowrap">Set Inactive</button>
                            <button onClick={handleBulkDelete} className="flex-1 md:flex-none px-3 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 whitespace-nowrap">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                Delete
                            </button>
                            <button onClick={() => setSelectedItems([])} className="hidden md:block ml-2 text-gray-400 hover:text-white text-sm">Cancel</button>
                        </div>
                    </div>
                )
            }

            {/* --- Modals --- */}

            {/* Service Modal */}
            <Modal
                isOpen={isServiceModalOpen}
                onClose={() => setServiceModalOpen(false)}
                title={isEditing ? 'Edit Service' : 'New Service'}
                maxWidth="max-w-4xl"
            >
                <form onSubmit={handleServiceSubmit} className="space-y-8">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h4 className="border-b border-gray-200 pb-2 text-sm font-semibold text-gray-800 uppercase tracking-wider">
                            Basic Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Service Name</label>
                                <input required type="text" className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none"
                                    value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Logo Design" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Slug URL</label>
                                <input required type="text" className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none"
                                    value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} placeholder="e.g. logo-design" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                                <textarea rows="3" className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none"
                                    value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Short service description..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Icon URL</label>
                                <input type="text" className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none"
                                    value={formData.icon_url} onChange={e => setFormData({ ...formData, icon_url: e.target.value })} placeholder="https://..." />
                            </div>
                            <div className="flex items-center pt-8">
                                <label className="flex items-center cursor-pointer gap-3">
                                    <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${formData.is_active ? 'bg-green-500' : 'bg-gray-300'}`}>
                                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${formData.is_active ? 'translate-x-6' : ''}`} />
                                    </div>
                                    <input type="checkbox" className="hidden" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} />
                                    <span className="text-sm font-medium text-gray-700">Active Status</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Packages Section */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                            <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">Package List ({formData.packages.length}/4)</h4>
                            {formData.packages.length < 4 && (
                                <button type="button" onClick={openCreatePackage} className="text-sm text-primary hover:text-orange-700 font-medium">+ Add Package</button>
                            )}
                        </div>

                        {formData.packages.length === 0 ? (
                            <p className="text-center text-gray-400 py-6 text-sm italic bg-gray-50 rounded-xl">No packages yet.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {formData.packages.map((pkg, idx) => (
                                    <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-primary/30 transition-colors relative group">
                                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button type="button" onClick={() => openEditPackage(pkg, idx)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                            <button type="button" onClick={() => deletePackage(idx)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                        </div>
                                        <div className="pr-16">
                                            <h5 className="font-bold text-gray-800">{pkg.name}</h5>
                                            <p className="text-primary font-semibold text-sm">
                                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(pkg.price)}
                                            </p>
                                            <div className="flex gap-2 mt-2">
                                                {pkg.is_popular && <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">POPULAR</span>}
                                                {pkg.is_special && <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">SPECIAL</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-6 border-t border-gray-100">
                        <button type="button" onClick={() => setServiceModalOpen(false)} className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors">Cancel</button>
                        <button type="submit" disabled={loading} className="flex-1 py-3 px-4 rounded-xl bg-orange-600 text-white font-medium hover:bg-orange-700 shadow-lg shadow-orange-500/20 transition-all">Save Service</button>
                    </div>
                </form>
            </Modal>

            {/* Package Modal */}
            <Modal
                isOpen={isPackageModalOpen}
                onClose={() => setPackageModalOpen(false)}
                title={editingPackageIndex >= 0 ? 'Edit Package' : 'Add New Package'}
                maxWidth="max-w-md"
            >
                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Package Name</label>
                        <input type="text" className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm outline-none"
                            value={packageForm.name} onChange={e => setPackageForm({ ...packageForm, name: e.target.value })} placeholder="e.g. Basic Package" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (IDR)</label>
                        <input type="number" className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm outline-none"
                            value={packageForm.price} onChange={e => setPackageForm({ ...packageForm, price: e.target.value })} placeholder="0" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Short Description</label>
                        <textarea rows="2" className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm outline-none"
                            value={packageForm.description} onChange={e => setPackageForm({ ...packageForm, description: e.target.value })} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Feature List</label>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                            {packageForm.features.map((feat, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <input type="text" className="flex-1 h-9 px-3 rounded-lg border border-gray-200 bg-gray-50 text-xs outline-none focus:border-primary"
                                        value={feat} onChange={e => handleFeatureChange(idx, e.target.value)} placeholder={`Feature ${idx + 1}`} />
                                    <button onClick={() => removeFeature(idx)} className="text-red-400 hover:text-red-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                </div>
                            ))}
                        </div>
                        <button onClick={addFeature} className="mt-2 text-xs text-primary font-medium hover:underline">+ Add Feature Row</button>
                    </div>

                    <div className="flex gap-4 p-3 bg-gray-50 rounded-xl">
                        <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                            <input type="checkbox" className="rounded text-primary focus:ring-primary" checked={packageForm.is_popular} onChange={e => setPackageForm({ ...packageForm, is_popular: e.target.checked })} />
                            Best Seller / Popular
                        </label>
                        <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                            <input type="checkbox" className="rounded text-primary focus:ring-primary" checked={packageForm.is_special} onChange={e => setPackageForm({ ...packageForm, is_special: e.target.checked })} />
                            Special (Large Column)
                        </label>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button onClick={() => setPackageModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50">Cancel</button>
                        <button onClick={savePackage} className="flex-1 py-2.5 rounded-xl bg-orange-600 text-white text-sm hover:bg-orange-700 shadow-md">Save Package</button>
                    </div>
                </div>
            </Modal>
        </div >
    );
}
