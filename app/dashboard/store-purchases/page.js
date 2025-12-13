// app/dashboard/store-purchases/page.js
'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase-client';
import Breadcrumb from '@/components/Breadcrumb';
import LogoPathAnimation from '@/components/LogoPathAnimation';
import Link from 'next/link';

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



export default function StorePurchasesPage() {
    const supabase = createClient();

    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedItems, setSelectedItems] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    // Detail Modal
    const [isModalOpen, setModalOpen] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState(null);

    const fetchPurchases = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('store_purchases')
                .select(`
                    *,
                    item:store_items(id, name, slug, thumbnail_url, price, price_type)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPurchases(data || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPurchases();
    }, []);

    const filteredPurchases = useMemo(() => {
        let data = purchases;

        if (statusFilter !== 'all') {
            data = data.filter(p => p.payment_status === statusFilter);
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            data = data.filter(p =>
                p.invoice_number.toLowerCase().includes(query) ||
                p.customer_name.toLowerCase().includes(query) ||
                p.customer_email.toLowerCase().includes(query)
            );
        }

        return data;
    }, [purchases, statusFilter, searchQuery]);

    const paginatedPurchases = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredPurchases.slice(start, start + itemsPerPage);
    }, [filteredPurchases, currentPage]);

    const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage);

    // Stats
    const stats = useMemo(() => {
        return {
            total: purchases.length,
            pending: purchases.filter(p => p.payment_status === 'pending').length,
            verified: purchases.filter(p => p.payment_status === 'verified').length,
            rejected: purchases.filter(p => p.payment_status === 'rejected').length
        };
    }, [purchases]);

    const toggleItem = (id) => {
        setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleAll = () => {
        if (selectedItems.length === paginatedPurchases.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(paginatedPurchases.map(p => p.id));
        }
    };

    const handleStatusChange = async (id, status) => {
        try {
            const { error } = await supabase
                .from('store_purchases')
                .update({ payment_status: status, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
            fetchPurchases();
            setModalOpen(false);
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const handleBulkStatus = async (status) => {
        if (!confirm(`Ubah status ${selectedItems.length} pembelian menjadi "${status}"?`)) return;

        try {
            const { error } = await supabase
                .from('store_purchases')
                .update({ payment_status: status, updated_at: new Date().toISOString() })
                .in('id', selectedItems);

            if (error) throw error;
            setSelectedItems([]);
            fetchPurchases();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Hapus ${selectedItems.length} pembelian? Aksi ini tidak dapat dibatalkan.`)) return;

        try {
            const { error } = await supabase
                .from('store_purchases')
                .delete()
                .in('id', selectedItems);

            if (error) throw error;
            setSelectedItems([]);
            fetchPurchases();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price).replace('IDR', 'Rp');
    };

    const formatDate = (date) => {
        return new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
            verified: { bg: 'bg-green-100', text: 'text-green-800', label: 'Verified' },
            rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' }
        };
        return badges[status] || badges.pending;
    };

    const openDetailModal = (purchase) => {
        setSelectedPurchase(purchase);
        setModalOpen(true);
    };

    return (
        <div className="p-4 lg:p-8 pb-24 relative min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Store Purchases', href: '/dashboard/store-purchases' }]} />
                    <h1 className="text-3xl font-bold text-gray-800 tracking-tight mt-2">Pembelian Store</h1>
                    <p className="text-gray-500 mt-1">Kelola dan verifikasi pembelian produk digital</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total', value: stats.total, color: 'bg-blue-50 text-blue-700' },
                    { label: 'Pending', value: stats.pending, color: 'bg-yellow-50 text-yellow-700' },
                    { label: 'Verified', value: stats.verified, color: 'bg-green-50 text-green-700' },
                    { label: 'Rejected', value: stats.rejected, color: 'bg-red-50 text-red-700' }
                ].map((stat, idx) => (
                    <div key={idx} className={`rounded-xl p-4 ${stat.color}`}>
                        <p className="text-sm font-medium opacity-70">{stat.label}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm mb-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    {/* Status Tabs */}
                    <div className="flex p-1 bg-gray-100 rounded-xl w-full md:w-auto">
                        {['all', 'pending', 'verified', 'rejected'].map(status => (
                            <button
                                key={status}
                                onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
                                className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-lg capitalize transition-all ${statusFilter === status ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {status === 'all' ? 'Semua' : status}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative w-full md:w-72">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Cari invoice, nama, email..."
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
            ) : filteredPurchases.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-gray-300">
                    <div className="bg-gray-50 p-4 rounded-full mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Belum ada pembelian</h3>
                    <p className="text-gray-500">Pembelian dari store akan muncul di sini.</p>
                </div>
            ) : (
                <>
                    {/* Table */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-4 py-4 w-12">
                                            <input type="checkbox" checked={selectedItems.length === paginatedPurchases.length && paginatedPurchases.length > 0} onChange={toggleAll} className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-600 cursor-pointer" />
                                        </th>
                                        <th className="px-4 py-4 font-semibold text-gray-700">Invoice</th>
                                        <th className="px-4 py-4 font-semibold text-gray-700">Produk</th>
                                        <th className="px-4 py-4 font-semibold text-gray-700">Customer</th>
                                        <th className="px-4 py-4 font-semibold text-gray-700">Total</th>
                                        <th className="px-4 py-4 font-semibold text-gray-700 text-center">Status</th>
                                        <th className="px-4 py-4 font-semibold text-gray-700">Tanggal</th>
                                        <th className="px-4 py-4 font-semibold text-gray-700 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedPurchases.map(purchase => {
                                        const isSelected = selectedItems.includes(purchase.id);
                                        const status = getStatusBadge(purchase.payment_status);
                                        return (
                                            <tr key={purchase.id} className={`hover:bg-gray-50/50 transition-colors ${isSelected ? 'bg-orange-50/10' : ''}`}>
                                                <td className="px-4 py-4">
                                                    <input type="checkbox" checked={isSelected} onChange={() => toggleItem(purchase.id)} className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-600 cursor-pointer" />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <button onClick={() => openDetailModal(purchase)} className="font-mono text-xs text-primary hover:underline">
                                                        {purchase.invoice_number}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {purchase.item?.thumbnail_url && (
                                                            <div className="w-10 h-8 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                                                <img src={purchase.item.thumbnail_url} alt="" className="w-full h-full object-cover" />
                                                            </div>
                                                        )}
                                                        <span className="font-medium text-gray-800 line-clamp-1">{purchase.item?.name || 'Produk dihapus'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="font-medium text-gray-800">{purchase.customer_name}</p>
                                                    <p className="text-xs text-gray-500">{purchase.customer_email}</p>
                                                </td>
                                                <td className="px-4 py-4 font-semibold text-gray-800">{formatPrice(purchase.amount)}</td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-gray-500 text-xs">{formatDate(purchase.created_at)}</td>
                                                <td className="px-4 py-4 text-right">
                                                    <button onClick={() => openDetailModal(purchase)} className="text-primary hover:text-orange-700 font-medium text-xs">
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
            )}

            {/* Bulk Action Bar */}
            {selectedItems.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900 text-white px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl shadow-2xl flex flex-col md:flex-row items-center gap-4 md:gap-6 animate-fade-in-up border border-gray-800 w-[90%] md:w-auto max-w-2xl">
                    <div className="font-bold flex items-center justify-between w-full md:w-auto gap-2">
                        <div className="flex items-center gap-2">
                            <span className="bg-white text-gray-900 w-6 h-6 rounded-full flex items-center justify-center text-xs">{selectedItems.length}</span>
                            <span>Dipilih</span>
                        </div>
                        <button onClick={() => setSelectedItems([])} className="md:hidden text-gray-400 hover:text-white text-sm">Batal</button>
                    </div>
                    <div className="hidden md:block h-6 w-px bg-gray-700"></div>
                    <div className="flex flex-wrap justify-center md:items-center gap-2 w-full md:w-auto">
                        <button onClick={() => handleBulkStatus('verified')} className="flex-1 md:flex-none px-3 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-bold transition whitespace-nowrap">Verify</button>
                        <button onClick={() => handleBulkStatus('rejected')} className="flex-1 md:flex-none px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-bold transition whitespace-nowrap">Reject</button>
                        <button onClick={handleBulkDelete} className="flex-1 md:flex-none px-3 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 whitespace-nowrap">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            Hapus
                        </button>
                        <button onClick={() => setSelectedItems([])} className="hidden md:block ml-2 text-gray-400 hover:text-white text-sm">Batal</button>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Detail Pembelian" maxWidth="max-w-lg">
                {selectedPurchase && (
                    <div className="space-y-5">
                        {/* Product */}
                        <div className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                            {selectedPurchase.item?.thumbnail_url && (
                                <div className="w-16 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                    <img src={selectedPurchase.item.thumbnail_url} alt="" className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="flex-1">
                                <p className="font-bold text-gray-800">{selectedPurchase.item?.name || 'Produk dihapus'}</p>
                                <p className="text-sm text-gray-500">Digital Product</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-primary">{formatPrice(selectedPurchase.amount)}</p>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="space-y-3">
                            <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="text-gray-500">Invoice</span>
                                <span className="font-mono text-sm">{selectedPurchase.invoice_number}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="text-gray-500">Status</span>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedPurchase.payment_status).bg} ${getStatusBadge(selectedPurchase.payment_status).text}`}>
                                    {getStatusBadge(selectedPurchase.payment_status).label}
                                </span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="text-gray-500">Nama</span>
                                <span className="font-medium">{selectedPurchase.customer_name}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="text-gray-500">Email</span>
                                <span className="font-medium">{selectedPurchase.customer_email}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="text-gray-500">Telepon</span>
                                <span className="font-medium">{selectedPurchase.customer_phone || '-'}</span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="text-gray-500">Tanggal Order</span>
                                <span className="font-medium text-sm">{formatDate(selectedPurchase.created_at)}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4 border-t border-gray-100">
                            {selectedPurchase.payment_status === 'pending' && (
                                <>
                                    <button
                                        onClick={() => handleStatusChange(selectedPurchase.id, 'verified')}
                                        className="flex-1 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition"
                                    >
                                        ✓ Verify
                                    </button>
                                    <button
                                        onClick={() => handleStatusChange(selectedPurchase.id, 'rejected')}
                                        className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition"
                                    >
                                        ✕ Reject
                                    </button>
                                </>
                            )}
                            {selectedPurchase.payment_status !== 'pending' && (
                                <button
                                    onClick={() => handleStatusChange(selectedPurchase.id, 'pending')}
                                    className="flex-1 py-3 bg-yellow-500 text-white rounded-xl font-medium hover:bg-yellow-600 transition"
                                >
                                    Reset to Pending
                                </button>
                            )}
                        </div>

                        {/* Invoice Link */}
                        <div className="text-center pt-2">
                            <Link
                                href={`/store/invoice/${selectedPurchase.invoice_number}`}
                                target="_blank"
                                className="text-primary hover:underline text-sm"
                            >
                                Lihat Invoice →
                            </Link>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
