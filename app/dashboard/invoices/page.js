'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';
import LogoPathAnimation from '@/components/LogoPathAnimation';



export default function InvoicesPage() {
    const supabase = createClient();
    const router = useRouter();

    // Data State
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // UI State
    const [viewMode, setViewMode] = useState('list'); // 'grid' | 'list' - Default List for Invoices
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9;

    // Bulk Actions State
    const [selectedItems, setSelectedItems] = useState([]);

    // Modal State
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        checkAuthAndFetchData();
    }, []);

    const checkAuthAndFetchData = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            showMessage('Error: Session tidak ditemukan. Silakan login kembali.', 'error');
            setLoading(false);
            return;
        }
        await fetchData();
    };

    const fetchData = async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
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
        if (selectedItems.length === paginatedOrders.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(paginatedOrders.map(o => o.id));
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedItems.length} orders?`)) return;
        setProcessing(true);
        try {
            const { error } = await supabase.from('orders').delete().in('id', selectedItems);
            if (error) throw error;
            showMessage(`${selectedItems.length} orders deleted successfully.`);
            setSelectedItems([]);
            fetchData();
        } catch (e) {
            showMessage('Error: ' + e.message, 'error');
        } finally {
            setProcessing(false);
        }
    };

    const handleBulkStatus = async (status) => {
        if (!confirm(`Update status of ${selectedItems.length} orders to ${status}?`)) return;
        setProcessing(true);
        try {
            // We also need to set verified_by/at if verifying
            const { data: { session } } = await supabase.auth.getSession();
            const updateData = { payment_status: status, updated_at: new Date().toISOString() };
            if (status === 'verified' || status === 'rejected') {
                updateData.verified_at = new Date().toISOString();
                updateData.verified_by = session?.user?.email || 'Admin';
            }

            const { error } = await supabase.from('orders').update(updateData).in('id', selectedItems);
            if (error) throw error;
            showMessage(`${selectedItems.length} orders updated to ${status}.`);
            setSelectedItems([]);
            fetchData();
        } catch (e) {
            showMessage('Error: ' + e.message, 'error');
        } finally {
            setProcessing(false);
        }
    };


    const handleVerifyPayment = async (orderId, status) => {
        setProcessing(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                showMessage('Error: You must be logged in to verify payment', 'error');
                return;
            }

            const updateData = {
                payment_status: status,
                verified_at: new Date().toISOString(),
                verified_by: session.user.displayname || session.user.email,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('orders')
                .update(updateData)
                .eq('id', orderId);

            if (error) throw error;

            showMessage(`Payment successfully ${status === 'verified' ? 'verified' : 'rejected'}!`);
            fetchData();
            setShowDetailModal(false);
        } catch (error) {
            console.error('Error verifying payment:', error);
            showMessage('Error: ' + error.message, 'error');
        } finally {
            setProcessing(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price);
    };

    const formatDate = (date) => {
        return new Intl.DateTimeFormat('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    };

    // Filtering and Pagination Logic
    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch =
                (order.invoice_number?.toLowerCase().includes(searchLower)) ||
                (order.customer_name?.toLowerCase().includes(searchLower)) ||
                (order.customer_email?.toLowerCase().includes(searchLower));

            const matchesStatus = filterStatus === 'all' || order.payment_status === filterStatus;

            return matchesSearch && matchesStatus;
        });
    }, [orders, searchQuery, filterStatus]);

    const paginatedOrders = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredOrders, currentPage]);

    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

    const getStatusConfig = (status) => {
        const configs = {
            pending: { color: 'bg-amber-50 text-amber-600 border-amber-100', label: 'Pending Verification', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
            verified: { color: 'bg-emerald-50 text-emerald-600 border-emerald-100', label: 'Verified', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
            rejected: { color: 'bg-red-50 text-red-600 border-red-100', label: 'Rejected', icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' }
        };
        return configs[status] || { color: 'bg-slate-50 text-slate-600 border-slate-100', label: status, icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' };
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <LogoPathAnimation />
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-8 relative min-h-screen pb-24">
            <div className="space-y-6">

                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <Breadcrumb />
                        <h1 className="text-3xl font-bold text-slate-800 tracking-tight mt-2">Invoice Management</h1>
                        <p className="text-slate-500 mt-1">Manage and verify customer orders</p>
                    </div>
                </div>

                {/* Controls Section */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">

                    {/* Status Filter */}
                    <div className="flex p-1 bg-slate-100 rounded-xl w-full md:w-auto overflow-x-auto">
                        {['all', 'pending', 'verified', 'rejected'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-lg transition-all capitalize whitespace-nowrap ${filterStatus === status
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {status === 'all' ? 'All Status' : status}
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
                                placeholder="Search invoice, name, email..."
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
                        {paginatedOrders.map((order) => {
                            const status = getStatusConfig(order.payment_status);
                            const isSelected = selectedItems.includes(order.id);
                            return (
                                <div key={order.id} className={`group bg-white rounded-2xl border shadow-sm hover:shadow-xl transition-all duration-300 p-6 flex flex-col relative overflow-hidden ${isSelected ? 'border-slate-900 ring-2 ring-slate-900/10' : 'border-slate-100'}`}>
                                    <div className="absolute top-4 right-4 z-10">
                                        <input type="checkbox" checked={isSelected} onChange={() => toggleItem(order.id)} className="w-5 h-5 text-slate-900 rounded border-slate-300 focus:ring-slate-900 cursor-pointer" />
                                    </div>
                                    <div className="flex justify-between items-start mb-4 pr-8">
                                        <div>
                                            <p className="font-bold text-slate-800 text-lg">{order.invoice_number}</p>
                                            <p className="text-xs text-slate-500 mt-1">{formatDate(order.created_at)}</p>
                                        </div>
                                    </div>
                                    <div className="mb-2">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 w-fit ${status.color}`}>
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={status.icon} /></svg>
                                            {status.label}
                                        </span>
                                    </div>

                                    <div className="mb-6 space-y-3">
                                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                                                {order.customer_name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-700">{order.customer_name}</p>
                                                <p className="text-xs text-slate-500 truncate max-w-[150px]">{order.customer_email}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500">Package</span>
                                            <span className="font-medium text-slate-800">{order.package_name}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500">Total</span>
                                            <span className="font-bold text-slate-900">{formatPrice(order.package_price)}</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-50 mt-auto">
                                        <button
                                            onClick={() => {
                                                setSelectedOrder(order);
                                                setShowDetailModal(true);
                                            }}
                                            className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                                        >
                                            View Details
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <>
                        {/* Mobile Card View */}
                        <div className="lg:hidden space-y-3 animate-fade-in-up">
                            {paginatedOrders.map((order) => {
                                const status = getStatusConfig(order.payment_status);
                                const isSelected = selectedItems.includes(order.id);
                                return (
                                    <div
                                        key={order.id}
                                        onClick={() => {
                                            setSelectedOrder(order);
                                            setShowDetailModal(true);
                                        }}
                                        className={`bg-white rounded-xl border shadow-sm p-4 cursor-pointer hover:shadow-md transition-all ${isSelected ? 'border-slate-900 ring-2 ring-slate-900/10' : 'border-slate-100'}`}
                                    >
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-bold text-slate-800 text-sm">{order.invoice_number}</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${status.color}`}>
                                                        {status.label}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-600 mt-1 truncate">{order.customer_name}</p>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    toggleItem(order.id);
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-5 h-5 text-slate-900 rounded border-slate-300 focus:ring-slate-900 cursor-pointer flex-shrink-0"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                            <div>
                                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Tanggal</p>
                                                <p className="text-xs text-indigo-600 font-medium">{formatDate(order.created_at).split(' pukul')[0]}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total</p>
                                                <p className="text-sm font-bold text-primary">{formatPrice(order.package_price)}</p>
                                            </div>
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
                                                <input type="checkbox" checked={selectedItems.length === paginatedOrders.length && paginatedOrders.length > 0} onChange={toggleAll} className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-900 cursor-pointer" />
                                            </th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice Info</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Package</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Method</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {paginatedOrders.map((order) => {
                                            const status = getStatusConfig(order.payment_status);
                                            const isSelected = selectedItems.includes(order.id);
                                            return (
                                                <tr key={order.id} className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-slate-50' : ''}`}>
                                                    <td className="px-6 py-4">
                                                        <input type="checkbox" checked={isSelected} onChange={() => toggleItem(order.id)} className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-900 cursor-pointer" />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-slate-800">{order.invoice_number}</div>
                                                        <div className="text-xs text-slate-500">{formatDate(order.created_at)}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-slate-700">{order.customer_name}</div>
                                                        <div className="text-xs text-slate-500 truncate max-w-[150px]">{order.customer_email}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600 text-sm">
                                                        {order.package_name}
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600 text-sm">
                                                        {order.payment_method === 'full' ? 'Full Payment' : 'DP 50%'}
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-slate-800 text-sm">
                                                        {formatPrice(order.package_price)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1 ${status.color}`}>
                                                            {status.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedOrder(order);
                                                                setShowDetailModal(true);
                                                            }}
                                                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium transition-all"
                                                        >
                                                            Detail
                                                        </button>
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
                        <button onClick={() => handleBulkStatus('verified')} className="flex-1 md:flex-none px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-bold transition whitespace-nowrap">Verify</button>
                        <button onClick={() => handleBulkStatus('rejected')} className="flex-1 md:flex-none px-3 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-bold transition whitespace-nowrap">Reject</button>
                        <button onClick={handleBulkDelete} className="flex-1 md:flex-none px-3 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 whitespace-nowrap">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            Delete
                        </button>
                        <button onClick={() => setSelectedItems([])} className="hidden md:block ml-2 text-slate-400 hover:text-white text-sm">Cancel</button>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-all duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-fade-in-up">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 sticky top-0 backdrop-blur-md z-10">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Invoice Detail</h3>
                                <p className="text-sm text-slate-500 font-mono mt-1">{selectedOrder.invoice_number}</p>
                            </div>
                            <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-6">

                            {/* Status Card */}
                            <div className={`p-4 rounded-xl border flex items-center gap-3 ${getStatusConfig(selectedOrder.payment_status).color}`}>
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getStatusConfig(selectedOrder.payment_status).icon} /></svg>
                                <div>
                                    <p className="font-bold text-sm uppercase tracking-wide">Payment Status</p>
                                    <p className="text-lg font-bold">{getStatusConfig(selectedOrder.payment_status).label}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Customer Info */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Customer Info</h4>
                                    <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                                        <div>
                                            <p className="text-xs text-slate-500">Full Name</p>
                                            <p className="font-medium text-slate-800">{selectedOrder.customer_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Email Address</p>
                                            <p className="font-medium text-slate-800 break-all">{selectedOrder.customer_email}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Phone Number</p>
                                            <p className="font-medium text-slate-800">{selectedOrder.customer_phone}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Info */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Order Info</h4>
                                    <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                                        <div>
                                            <p className="text-xs text-slate-500">Service Package</p>
                                            <p className="font-medium text-slate-800">{selectedOrder.package_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Payment Method</p>
                                            <p className="font-medium text-slate-800">{selectedOrder.payment_method === 'full' ? 'Full Payment' : 'DP 50%'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Total Amount</p>
                                            <p className="font-bold text-slate-900 text-lg">{formatPrice(selectedOrder.package_price)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Briefing Notes */}
                            {selectedOrder.notes && (
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Briefing Details</h4>
                                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                                        {(() => {
                                            try {
                                                const briefing = JSON.parse(selectedOrder.notes);
                                                return (
                                                    <div className="grid grid-cols-1 gap-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div>
                                                                <p className="text-xs text-slate-500 mb-1">Website Name</p>
                                                                <p className="font-medium text-slate-800">{briefing.websiteName || '-'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-slate-500 mb-1">Phone</p>
                                                                <p className="font-medium text-slate-800">{briefing.phone || '-'}</p>
                                                            </div>
                                                        </div>
                                                        {briefing.websiteDescription && (
                                                            <div>
                                                                <p className="text-xs text-slate-500 mb-1">Website Description</p>
                                                                <p className="font-medium text-slate-800 text-sm leading-relaxed">{briefing.websiteDescription}</p>
                                                            </div>
                                                        )}
                                                        {briefing.websitePurpose && (
                                                            <div>
                                                                <p className="text-xs text-slate-500 mb-1">Website Purpose</p>
                                                                <p className="font-medium text-slate-800 text-sm leading-relaxed">{briefing.websitePurpose}</p>
                                                            </div>
                                                        )}
                                                        {briefing.colorPreference && (
                                                            <div>
                                                                <p className="text-xs text-slate-500 mb-1">Color Preference</p>
                                                                <p className="font-medium text-slate-800">{briefing.colorPreference}</p>
                                                            </div>
                                                        )}
                                                        {briefing.referenceWebsites && (
                                                            <div>
                                                                <p className="text-xs text-slate-500 mb-1">Reference Website</p>
                                                                <p className="font-medium text-blue-600 break-all">{briefing.referenceWebsites}</p>
                                                            </div>
                                                        )}
                                                        {briefing.additionalInfo && (
                                                            <div>
                                                                <p className="text-xs text-slate-500 mb-1">Additional Info</p>
                                                                <p className="font-medium text-slate-800 text-sm">{briefing.additionalInfo}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            } catch (e) {
                                                return <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans">{selectedOrder.notes}</pre>;
                                            }
                                        })()}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            {selectedOrder.payment_status === 'pending' && (
                                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-100">
                                    <button
                                        onClick={() => handleVerifyPayment(selectedOrder.id, 'verified')}
                                        disabled={processing}
                                        className="flex-1 bg-emerald-600 text-white py-3 rounded-xl hover:bg-emerald-700 transition-all font-bold shadow-lg shadow-emerald-200 disabled:opacity-70 flex items-center justify-center gap-2"
                                    >
                                        {processing ? <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                                        Verify Payment
                                    </button>
                                    <button
                                        onClick={() => handleVerifyPayment(selectedOrder.id, 'rejected')}
                                        disabled={processing}
                                        className="flex-1 bg-red-600 text-white py-3 rounded-xl hover:bg-red-700 transition-all font-bold shadow-lg shadow-red-200 disabled:opacity-70 flex items-center justify-center gap-2"
                                    >
                                        {processing ? <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
                                        Reject Payment
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}