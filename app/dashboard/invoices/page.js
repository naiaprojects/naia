// app/dashboard/invoices/page.js
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';

export default function InvoicesPage() {
    const supabase = createClient();
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');

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
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
            setMessage('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyPayment = async (orderId, status) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                setMessage('Error: Anda harus login untuk verifikasi pembayaran');
                return;
            }

            const updateData = {
                payment_status: status,
                verified_at: new Date().toISOString(),
                verified_by: session.user.email,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('orders')
                .update(updateData)
                .eq('id', orderId);

            if (error) throw error;

            setMessage(`Pembayaran berhasil ${status === 'verified' ? 'diverifikasi' : 'ditolak'}!`);
            fetchData();
            setShowDetailModal(false);

            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error verifying payment:', error);
            setMessage('Error: ' + error.message);
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
        return new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: 'bg-yellow-100 text-yellow-800',
            verified: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800'
        };
        return badges[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusText = (status) => {
        const texts = {
            pending: 'Menunggu Verifikasi',
            verified: 'Terverifikasi',
            rejected: 'Ditolak'
        };
        return texts[status] || status;
    };

    const filteredOrders = filterStatus === 'all'
        ? orders
        : orders.filter(order => order.payment_status === filterStatus);

    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    return (
        <div className="max-w-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Invoice Management</h1>
                <div className="flex gap-2">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Semua Status</option>
                        <option value="pending">Pending</option>
                        <option value="verified">Verified</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            {message && (
                <div className={`mb-4 p-4 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {message}
                </div>
            )}

            {/* Orders Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Package</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Method</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {order.invoice_number}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{order.customer_name}</div>
                                    <div className="text-sm text-gray-500">{order.customer_email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {order.package_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                    {formatPrice(order.package_price)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {order.payment_method === 'full' ? 'Full Payment' : 'DP 50%'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(order.payment_status)}`}>
                                        {getStatusText(order.payment_status)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatDate(order.created_at)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => {
                                            setSelectedOrder(order);
                                            setShowDetailModal(true);
                                        }}
                                        className="text-blue-600 hover:text-blue-900"
                                    >
                                        Detail
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold">Detail Invoice</h2>
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Invoice Info */}
                                <div>
                                    <h3 className="font-semibold mb-2">Informasi Invoice</h3>
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Invoice Number:</span>
                                            <span className="font-medium">{selectedOrder.invoice_number}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Tanggal:</span>
                                            <span className="font-medium">{formatDate(selectedOrder.created_at)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Status:</span>
                                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(selectedOrder.payment_status)}`}>
                                                {getStatusText(selectedOrder.payment_status)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Customer Info */}
                                <div>
                                    <h3 className="font-semibold mb-2">Informasi Customer</h3>
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Nama:</span>
                                            <span className="font-medium">{selectedOrder.customer_name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Email:</span>
                                            <span className="font-medium">{selectedOrder.customer_email}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Phone:</span>
                                            <span className="font-medium">{selectedOrder.customer_phone}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Package Info */}
                                <div>
                                    <h3 className="font-semibold mb-2">Informasi Paket</h3>
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Paket:</span>
                                            <span className="font-medium">{selectedOrder.package_name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Harga:</span>
                                            <span className="font-medium">{formatPrice(selectedOrder.package_price)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Metode Pembayaran:</span>
                                            <span className="font-medium">
                                                {selectedOrder.payment_method === 'full' ? 'Full Payment' : 'DP 50%'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Briefing Notes */}
                                {selectedOrder.notes && (
                                    <div>
                                        <h3 className="font-semibold mb-2">Detail Briefing</h3>
                                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                            {(() => {
                                                try {
                                                    const briefing = JSON.parse(selectedOrder.notes);
                                                    return (
                                                        <>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <span className="text-gray-600 text-sm">Nama Website:</span>
                                                                    <p className="font-medium">{briefing.websiteName || '-'}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="text-gray-600 text-sm">Nomor Telepon:</span>
                                                                    <p className="font-medium">{briefing.phone || '-'}</p>
                                                                </div>
                                                            </div>

                                                            {briefing.websiteDescription && (
                                                                <div>
                                                                    <span className="text-gray-600 text-sm">Deskripsi Website:</span>
                                                                    <p className="font-medium mt-1">{briefing.websiteDescription}</p>
                                                                </div>
                                                            )}

                                                            {briefing.websitePurpose && (
                                                                <div>
                                                                    <span className="text-gray-600 text-sm">Tujuan Website:</span>
                                                                    <p className="font-medium mt-1">{briefing.websitePurpose}</p>
                                                                </div>
                                                            )}

                                                            {briefing.colorPreference && (
                                                                <div>
                                                                    <span className="text-gray-600 text-sm">Preferensi Warna:</span>
                                                                    <p className="font-medium mt-1">{briefing.colorPreference}</p>
                                                                </div>
                                                            )}

                                                            {briefing.referenceWebsites && (
                                                                <div>
                                                                    <span className="text-gray-600 text-sm">Website Referensi:</span>
                                                                    <p className="font-medium mt-1">{briefing.referenceWebsites}</p>
                                                                </div>
                                                            )}

                                                            {briefing.additionalInfo && (
                                                                <div>
                                                                    <span className="text-gray-600 text-sm">Informasi Tambahan:</span>
                                                                    <p className="font-medium mt-1">{briefing.additionalInfo}</p>
                                                                </div>
                                                            )}
                                                        </>
                                                    );
                                                } catch (e) {
                                                    return <pre className="text-sm whitespace-pre-wrap">{selectedOrder.notes}</pre>;
                                                }
                                            })()}
                                        </div>
                                    </div>
                                )}

                                {/* Verification Info */}
                                {selectedOrder.verified_at && (
                                    <div>
                                        <h3 className="font-semibold mb-2">Informasi Verifikasi</h3>
                                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Diverifikasi oleh:</span>
                                                <span className="font-medium">{selectedOrder.verified_by}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Tanggal Verifikasi:</span>
                                                <span className="font-medium">{formatDate(selectedOrder.verified_at)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                {selectedOrder.payment_status === 'pending' && (
                                    <div className="flex gap-3 pt-4 border-t">
                                        <button
                                            onClick={() => handleVerifyPayment(selectedOrder.id, 'verified')}
                                            className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                                        >
                                            Verifikasi Pembayaran
                                        </button>
                                        <button
                                            onClick={() => handleVerifyPayment(selectedOrder.id, 'rejected')}
                                            className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
                                        >
                                            Tolak Pembayaran
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}