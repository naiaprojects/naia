// app/dashboard/orders/page.js
'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase-client';
import Breadcrumb from '@/components/Breadcrumb';
import LogoPathAnimation from '@/components/LogoPathAnimation';
import Link from 'next/link';

export default function OrdersPage() {
    const supabase = createClient();

    // Tab State
    const [activeTab, setActiveTab] = useState('service');

    // Service Orders State
    const [serviceOrders, setServiceOrders] = useState([]);
    const [serviceLoading, setServiceLoading] = useState(true);
    const [serviceSearch, setServiceSearch] = useState('');
    const [serviceStatus, setServiceStatus] = useState('all');
    const [servicePage, setServicePage] = useState(1);
    const [serviceSelected, setServiceSelected] = useState([]);

    // Store Orders State
    const [storeOrders, setStoreOrders] = useState([]);
    const [storeLoading, setStoreLoading] = useState(true);
    const [storeSearch, setStoreSearch] = useState('');
    const [storeStatus, setStoreStatus] = useState('all');
    const [storePage, setStorePage] = useState(1);
    const [storeSelected, setStoreSelected] = useState([]);

    // Modal & Message State
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [processing, setProcessing] = useState(false);

    const itemsPerPage = 10;

    useEffect(() => {
        fetchServiceOrders();
        fetchStoreOrders();
    }, []);

    const fetchServiceOrders = async () => {
        setServiceLoading(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setServiceOrders(data || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setServiceLoading(false);
        }
    };

    const fetchStoreOrders = async () => {
        setStoreLoading(true);
        try {
            const { data, error } = await supabase
                .from('store_purchases')
                .select(`*, item:store_items(id, name, slug, thumbnail_url, price, price_type)`)
                .order('created_at', { ascending: false });
            if (error) throw error;
            setStoreOrders(data || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setStoreLoading(false);
        }
    };

    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    const formatPrice = (price) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price).replace('IDR', 'Rp');
    const formatDate = (date) => new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date));

    const getStatusBadge = (status) => {
        const badges = {
            pending: { bg: 'bg-amber-50 text-amber-700 border-amber-100', label: 'Pending' },
            verified: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-100', label: 'Verified' },
            rejected: { bg: 'bg-red-50 text-red-700 border-red-100', label: 'Rejected' }
        };
        return badges[status] || badges.pending;
    };

    // Service Orders Functions
    const filteredServiceOrders = useMemo(() => {
        let data = serviceOrders;
        if (serviceStatus !== 'all') data = data.filter(o => o.payment_status === serviceStatus);
        if (serviceSearch) {
            const q = serviceSearch.toLowerCase();
            data = data.filter(o => o.invoice_number?.toLowerCase().includes(q) || o.customer_name?.toLowerCase().includes(q) || o.customer_email?.toLowerCase().includes(q));
        }
        return data;
    }, [serviceOrders, serviceStatus, serviceSearch]);

    const paginatedServiceOrders = useMemo(() => {
        const start = (servicePage - 1) * itemsPerPage;
        return filteredServiceOrders.slice(start, start + itemsPerPage);
    }, [filteredServiceOrders, servicePage]);

    const serviceTotalPages = Math.ceil(filteredServiceOrders.length / itemsPerPage);

    const toggleServiceItem = (id) => setServiceSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    const toggleAllService = () => setServiceSelected(serviceSelected.length === paginatedServiceOrders.length ? [] : paginatedServiceOrders.map(o => o.id));

    const handleServiceBulkStatus = async (status) => {
        if (!confirm(`Update status of ${serviceSelected.length} orders to ${status}?`)) return;
        setProcessing(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const updateData = { payment_status: status, updated_at: new Date().toISOString() };
            if (status === 'verified' || status === 'rejected') {
                updateData.verified_at = new Date().toISOString();
                updateData.verified_by = session?.user?.email || 'Admin';
            }
            const { error } = await supabase.from('orders').update(updateData).in('id', serviceSelected);
            if (error) throw error;
            showMessage(`${serviceSelected.length} orders updated.`);
            setServiceSelected([]);
            fetchServiceOrders();
        } catch (e) {
            showMessage('Error: ' + e.message, 'error');
        } finally {
            setProcessing(false);
        }
    };

    const handleServiceBulkDelete = async () => {
        if (!confirm(`Delete ${serviceSelected.length} orders?`)) return;
        setProcessing(true);
        try {
            const { error } = await supabase.from('orders').delete().in('id', serviceSelected);
            if (error) throw error;
            showMessage(`${serviceSelected.length} orders deleted.`);
            setServiceSelected([]);
            fetchServiceOrders();
        } catch (e) {
            showMessage('Error: ' + e.message, 'error');
        } finally {
            setProcessing(false);
        }
    };

    // Store Orders Functions
    const filteredStoreOrders = useMemo(() => {
        let data = storeOrders;
        if (storeStatus !== 'all') data = data.filter(o => o.payment_status === storeStatus);
        if (storeSearch) {
            const q = storeSearch.toLowerCase();
            data = data.filter(o => o.invoice_number?.toLowerCase().includes(q) || o.customer_name?.toLowerCase().includes(q) || o.customer_email?.toLowerCase().includes(q));
        }
        return data;
    }, [storeOrders, storeStatus, storeSearch]);

    const paginatedStoreOrders = useMemo(() => {
        const start = (storePage - 1) * itemsPerPage;
        return filteredStoreOrders.slice(start, start + itemsPerPage);
    }, [filteredStoreOrders, storePage]);

    const storeTotalPages = Math.ceil(filteredStoreOrders.length / itemsPerPage);

    const toggleStoreItem = (id) => setStoreSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    const toggleAllStore = () => setStoreSelected(storeSelected.length === paginatedStoreOrders.length ? [] : paginatedStoreOrders.map(o => o.id));

    const handleStoreBulkStatus = async (status) => {
        if (!confirm(`Update status of ${storeSelected.length} purchases to ${status}?`)) return;
        setProcessing(true);
        try {
            const { error } = await supabase.from('store_purchases').update({ payment_status: status, updated_at: new Date().toISOString() }).in('id', storeSelected);
            if (error) throw error;
            showMessage(`${storeSelected.length} purchases updated.`);
            setStoreSelected([]);
            fetchStoreOrders();
        } catch (e) {
            showMessage('Error: ' + e.message, 'error');
        } finally {
            setProcessing(false);
        }
    };

    const handleStoreBulkDelete = async () => {
        if (!confirm(`Delete ${storeSelected.length} purchases?`)) return;
        setProcessing(true);
        try {
            const { error } = await supabase.from('store_purchases').delete().in('id', storeSelected);
            if (error) throw error;
            showMessage(`${storeSelected.length} purchases deleted.`);
            setStoreSelected([]);
            fetchStoreOrders();
        } catch (e) {
            showMessage('Error: ' + e.message, 'error');
        } finally {
            setProcessing(false);
        }
    };

    const handleStatusChange = async (table, id, status) => {
        setProcessing(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const updateData = { payment_status: status, updated_at: new Date().toISOString() };
            if (table === 'orders' && (status === 'verified' || status === 'rejected')) {
                updateData.verified_at = new Date().toISOString();
                updateData.verified_by = session?.user?.email || 'Admin';
            }
            const { error } = await supabase.from(table).update(updateData).eq('id', id);
            if (error) throw error;
            showMessage(`Status updated to ${status}.`);
            setShowDetailModal(false);
            if (table === 'orders') fetchServiceOrders();
            else fetchStoreOrders();
        } catch (e) {
            showMessage('Error: ' + e.message, 'error');
        } finally {
            setProcessing(false);
        }
    };

    const tabs = [
        { id: 'service', label: 'Service Orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', count: serviceOrders.length },
        { id: 'store', label: 'Store Purchases', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z', count: storeOrders.length }
    ];

    const loading = activeTab === 'service' ? serviceLoading : storeLoading;

    if (loading) {
        return <div className="flex justify-center items-center h-[60vh]"><LogoPathAnimation /></div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <Breadcrumb />
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 mt-2">Order Management</h1>
                <p className="text-slate-500 text-sm mt-1">Manage service orders and store purchases in one place</p>
            </div>

            {/* Toast */}
            {message.text && (
                <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-xl shadow-2xl z-50 text-white font-medium animate-fade-in-up ${message.type === 'error' ? 'bg-red-500' : 'bg-slate-900'}`}>
                    {message.text}
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar Tabs */}
                <div className="w-full lg:w-56 flex-shrink-0">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-2 space-y-1 sticky top-20">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} /></svg>
                                <span className="flex-1 text-left">{tab.label}</span>
                                <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>{tab.count}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 min-h-[500px]">
                    {/* Service Orders Tab */}
                    {activeTab === 'service' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                                <h2 className="text-xl font-bold text-slate-800">Service Orders</h2>
                            </div>

                            {/* Filters */}
                            <div className="flex flex-col md:flex-row gap-4 justify-between">
                                <div className="flex p-1 bg-slate-100 rounded-xl w-full md:w-auto">
                                    {['all', 'pending', 'verified', 'rejected'].map(s => (
                                        <button key={s} onClick={() => { setServiceStatus(s); setServicePage(1); }} className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-lg capitalize transition-all ${serviceStatus === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                            {s === 'all' ? 'All' : s}
                                        </button>
                                    ))}
                                </div>
                                <div className="relative w-full md:w-64">
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    <input type="text" placeholder="Search invoice, name, email..." value={serviceSearch} onChange={e => setServiceSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900" />
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="px-4 py-3 w-10"><input type="checkbox" checked={serviceSelected.length === paginatedServiceOrders.length && paginatedServiceOrders.length > 0} onChange={toggleAllService} className="w-4 h-4 text-slate-900 rounded" /></th>
                                            <th className="px-4 py-3 font-semibold text-slate-600">Invoice</th>
                                            <th className="px-4 py-3 font-semibold text-slate-600">Customer</th>
                                            <th className="px-4 py-3 font-semibold text-slate-600">Package</th>
                                            <th className="px-4 py-3 font-semibold text-slate-600">Amount</th>
                                            <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                                            <th className="px-4 py-3 font-semibold text-slate-600">Date</th>
                                            <th className="px-4 py-3 font-semibold text-slate-600 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {paginatedServiceOrders.map(order => {
                                            const isSelected = serviceSelected.includes(order.id);
                                            const status = getStatusBadge(order.payment_status);
                                            return (
                                                <tr key={order.id} className={`hover:bg-slate-50/50 transition-colors ${isSelected ? 'bg-slate-50' : ''}`}>
                                                    <td className="px-4 py-3"><input type="checkbox" checked={isSelected} onChange={() => toggleServiceItem(order.id)} className="w-4 h-4 text-slate-900 rounded" /></td>
                                                    <td className="px-4 py-3 font-mono text-xs text-primary">{order.invoice_number}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium text-slate-800">{order.customer_name}</div>
                                                        <div className="text-xs text-slate-500 truncate max-w-[120px]">{order.customer_email}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600">{order.package_name}</td>
                                                    <td className="px-4 py-3 font-semibold text-slate-800">{formatPrice(order.package_price)}</td>
                                                    <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${status.bg}`}>{status.label}</span></td>
                                                    <td className="px-4 py-3 text-xs text-slate-500">{formatDate(order.created_at)}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <button onClick={() => { setSelectedOrder({ ...order, type: 'service' }); setShowDetailModal(true); }} className="text-primary hover:text-orange-700 font-medium text-xs">Detail</button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {serviceTotalPages > 1 && (
                                <div className="flex justify-center gap-2 pt-4">
                                    {Array.from({ length: serviceTotalPages }).map((_, i) => (
                                        <button key={i} onClick={() => setServicePage(i + 1)} className={`w-8 h-8 rounded-lg text-sm font-medium transition ${servicePage === i + 1 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{i + 1}</button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Store Orders Tab */}
                    {activeTab === 'store' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                                <h2 className="text-xl font-bold text-slate-800">Store Purchases</h2>
                            </div>

                            {/* Filters */}
                            <div className="flex flex-col md:flex-row gap-4 justify-between">
                                <div className="flex p-1 bg-slate-100 rounded-xl w-full md:w-auto">
                                    {['all', 'pending', 'verified', 'rejected'].map(s => (
                                        <button key={s} onClick={() => { setStoreStatus(s); setStorePage(1); }} className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-lg capitalize transition-all ${storeStatus === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                            {s === 'all' ? 'All' : s}
                                        </button>
                                    ))}
                                </div>
                                <div className="relative w-full md:w-64">
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    <input type="text" placeholder="Search invoice, name, email..." value={storeSearch} onChange={e => setStoreSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900" />
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="px-4 py-3 w-10"><input type="checkbox" checked={storeSelected.length === paginatedStoreOrders.length && paginatedStoreOrders.length > 0} onChange={toggleAllStore} className="w-4 h-4 text-slate-900 rounded" /></th>
                                            <th className="px-4 py-3 font-semibold text-slate-600">Invoice</th>
                                            <th className="px-4 py-3 font-semibold text-slate-600">Product</th>
                                            <th className="px-4 py-3 font-semibold text-slate-600">Customer</th>
                                            <th className="px-4 py-3 font-semibold text-slate-600">Amount</th>
                                            <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                                            <th className="px-4 py-3 font-semibold text-slate-600">Date</th>
                                            <th className="px-4 py-3 font-semibold text-slate-600 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {paginatedStoreOrders.map(order => {
                                            const isSelected = storeSelected.includes(order.id);
                                            const status = getStatusBadge(order.payment_status);
                                            return (
                                                <tr key={order.id} className={`hover:bg-slate-50/50 transition-colors ${isSelected ? 'bg-slate-50' : ''}`}>
                                                    <td className="px-4 py-3"><input type="checkbox" checked={isSelected} onChange={() => toggleStoreItem(order.id)} className="w-4 h-4 text-slate-900 rounded" /></td>
                                                    <td className="px-4 py-3 font-mono text-xs text-primary">{order.invoice_number}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            {order.item?.thumbnail_url && (
                                                                <div className="w-10 h-8 bg-slate-100 rounded overflow-hidden flex-shrink-0"><img src={order.item.thumbnail_url} alt="" className="w-full h-full object-cover" /></div>
                                                            )}
                                                            <span className="font-medium text-slate-800 line-clamp-1">{order.item?.name || 'Deleted Product'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium text-slate-800">{order.customer_name}</div>
                                                        <div className="text-xs text-slate-500 truncate max-w-[120px]">{order.customer_email}</div>
                                                    </td>
                                                    <td className="px-4 py-3 font-semibold text-slate-800">{formatPrice(order.amount)}</td>
                                                    <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${status.bg}`}>{status.label}</span></td>
                                                    <td className="px-4 py-3 text-xs text-slate-500">{formatDate(order.created_at)}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <button onClick={() => { setSelectedOrder({ ...order, type: 'store' }); setShowDetailModal(true); }} className="text-primary hover:text-orange-700 font-medium text-xs">Detail</button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {storeTotalPages > 1 && (
                                <div className="flex justify-center gap-2 pt-4">
                                    {Array.from({ length: storeTotalPages }).map((_, i) => (
                                        <button key={i} onClick={() => setStorePage(i + 1)} className={`w-8 h-8 rounded-lg text-sm font-medium transition ${storePage === i + 1 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{i + 1}</button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Bulk Action Bar */}
            {(serviceSelected.length > 0 || storeSelected.length > 0) && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl shadow-2xl flex flex-col md:flex-row items-center gap-4 md:gap-6 animate-fade-in-up w-[90%] md:w-auto max-w-2xl">
                    <div className="font-bold flex items-center gap-2">
                        <span className="bg-white text-slate-900 w-6 h-6 rounded-full flex items-center justify-center text-xs">{activeTab === 'service' ? serviceSelected.length : storeSelected.length}</span>
                        <span>Selected</span>
                    </div>
                    <div className="hidden md:block h-6 w-px bg-slate-700"></div>
                    <div className="flex flex-wrap justify-center md:items-center gap-2 w-full md:w-auto">
                        <button onClick={() => activeTab === 'service' ? handleServiceBulkStatus('verified') : handleStoreBulkStatus('verified')} className="flex-1 md:flex-none px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-bold transition whitespace-nowrap">Verify</button>
                        <button onClick={() => activeTab === 'service' ? handleServiceBulkStatus('rejected') : handleStoreBulkStatus('rejected')} className="flex-1 md:flex-none px-3 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-bold transition whitespace-nowrap">Reject</button>
                        <button onClick={() => activeTab === 'service' ? handleServiceBulkDelete() : handleStoreBulkDelete()} className="flex-1 md:flex-none px-3 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-bold transition whitespace-nowrap">Delete</button>
                        <button onClick={() => { setServiceSelected([]); setStoreSelected([]); }} className="hidden md:block ml-2 text-slate-400 hover:text-white text-sm">Cancel</button>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in-up">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 sticky top-0 z-10">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">{selectedOrder.type === 'service' ? 'Order Detail' : 'Purchase Detail'}</h3>
                                <p className="text-sm text-slate-500 font-mono mt-1">{selectedOrder.invoice_number}</p>
                            </div>
                            <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* Status */}
                            <div className={`p-4 rounded-xl border flex items-center gap-3 ${getStatusBadge(selectedOrder.payment_status).bg}`}>
                                <p className="font-bold text-sm uppercase">{getStatusBadge(selectedOrder.payment_status).label}</p>
                            </div>

                            {/* Info */}
                            <div className="space-y-3">
                                <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-500">Customer</span><span className="font-medium">{selectedOrder.customer_name}</span></div>
                                <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-500">Email</span><span className="font-medium">{selectedOrder.customer_email}</span></div>
                                <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-500">Phone</span><span className="font-medium">{selectedOrder.customer_phone || '-'}</span></div>
                                <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-500">{selectedOrder.type === 'service' ? 'Package' : 'Product'}</span><span className="font-medium">{selectedOrder.type === 'service' ? selectedOrder.package_name : selectedOrder.item?.name}</span></div>
                                <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-500">Amount</span><span className="font-bold text-primary">{formatPrice(selectedOrder.type === 'service' ? selectedOrder.package_price : selectedOrder.amount)}</span></div>
                                <div className="flex justify-between py-2"><span className="text-slate-500">Date</span><span className="font-medium text-sm">{formatDate(selectedOrder.created_at)}</span></div>
                            </div>

                            {/* Actions */}
                            {selectedOrder.payment_status === 'pending' && (
                                <div className="flex gap-3 pt-4 border-t border-slate-100">
                                    <button onClick={() => handleStatusChange(selectedOrder.type === 'service' ? 'orders' : 'store_purchases', selectedOrder.id, 'verified')} disabled={processing} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl hover:bg-emerald-700 font-bold disabled:opacity-70">✓ Verify</button>
                                    <button onClick={() => handleStatusChange(selectedOrder.type === 'service' ? 'orders' : 'store_purchases', selectedOrder.id, 'rejected')} disabled={processing} className="flex-1 bg-red-600 text-white py-3 rounded-xl hover:bg-red-700 font-bold disabled:opacity-70">✕ Reject</button>
                                </div>
                            )}

                            {/* Invoice Link */}
                            <div className="text-center pt-2">
                                <Link href={selectedOrder.type === 'service' ? `/invoice/${selectedOrder.invoice_number}` : `/store/invoice/${selectedOrder.invoice_number}`} target="_blank" className="text-primary hover:underline text-sm">View Invoice →</Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
