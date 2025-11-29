// app/dashboard/invoices/page.js
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';
import LogoPathAnimation from '@/components/LogoPathAnimation';

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
                verified_by: session.user.displayname,
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
        return badges[status] || 'bg-slate-100 text-slate-800';
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
                        <h1 className="text-2xl lg:text-3xl font-bold text-slate-700">Invoice Management</h1>
                        <p className="text-sm text-slate-700 mt-1">Kelola dan verifikasi pesanan pelanggan</p>
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full sm:w-auto px-3 lg:px-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                        <option value="all">Semua Status</option>
                        <option value="pending">Pending</option>
                        <option value="verified">Verified</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            {/* Alert Message */}
            {message && (
                <div className={`mb-4 p-3 lg:p-4 rounded-lg text-sm ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {message}
                </div>
            )}

            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Invoice</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Customer</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Package</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Amount</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Payment</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Date</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 uppercase">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-700">
                                        {order.invoice_number}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="text-sm font-medium text-slate-700">{order.customer_name}</div>
                                        <div className="text-sm text-slate-700">{order.customer_email}</div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                                        {order.package_name}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-slate-700">
                                        {formatPrice(order.package_price)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                                        {order.payment_method === 'full' ? 'Full Payment' : 'DP 50%'}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(order.payment_status)}`}>
                                            {getStatusText(order.payment_status)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                                        {formatDate(order.created_at)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => {
                                                setSelectedOrder(order);
                                                setShowDetailModal(true);
                                            }}
                                            className="bg-primary py-1 px-2 text-white font-medium rounded-lg"
                                        >
                                            Detail
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
                {filteredOrders.map((order) => (
                    <div key={order.id} className="bg-white rounded-lg shadow p-4">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <p className="font-semibold text-slate-700">{order.invoice_number}</p>
                                <p className="text-sm text-slate-700">{order.customer_name}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${getStatusBadge(order.payment_status)}`}>
                                {getStatusText(order.payment_status)}
                            </span>
                        </div>
                        
                        <div className="space-y-2 mb-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-700">Paket:</span>
                                <span className="font-medium text-slate-700">{order.package_name}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-700">Harga:</span>
                                <span className="font-bold text-slate-700">{formatPrice(order.package_price)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-700">Pembayaran:</span>
                                <span className="font-medium text-slate-700">
                                    {order.payment_method === 'full' ? 'Full Payment' : 'DP 50%'}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-700">Tanggal:</span>
                                <span className="text-slate-700">{formatDate(order.created_at)}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setSelectedOrder(order);
                                setShowDetailModal(true);
                            }}
                            className="w-full py-2 bg-primary text-white rounded-lg hover:bg-secondary transition-colors text-sm font-medium"
                        >
                            Lihat Detail
                        </button>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredOrders.length === 0 && (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <svg className="w-16 h-16 mx-auto text-slate-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-slate-700">Tidak ada invoice dengan status tersebut</p>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden">
                        <div className="p-4 lg:p-6">
                            {/* Modal Header */}
                            <div className="flex justify-between items-center mb-4 lg:mb-6 pb-4 border-b">
                                <h2 className="text-xl lg:text-2xl font-bold text-slate-700">Detail Invoice</h2>
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="text-slate-700 hover:text-slate-700 p-1"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-4 lg:space-y-6">
                                {/* Invoice Info */}
                                <div>
                                    <h3 className="font-semibold mb-2 text-sm lg:text-base">Informasi Invoice</h3>
                                    <div className="bg-slate-50 rounded-lg p-3 lg:p-4 space-y-2">
                                        <div className="flex justify-between text-sm lg:text-base">
                                            <span className="text-slate-700">Invoice Number:</span>
                                            <span className="font-medium">{selectedOrder.invoice_number}</span>
                                        </div>
                                        <div className="flex justify-between text-sm lg:text-base">
                                            <span className="text-slate-700">Tanggal:</span>
                                            <span className="font-medium">{formatDate(selectedOrder.created_at)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm lg:text-base">
                                            <span className="text-slate-700">Status:</span>
                                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(selectedOrder.payment_status)}`}>
                                                {getStatusText(selectedOrder.payment_status)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Customer Info */}
                                <div>
                                    <h3 className="font-semibold mb-2 text-sm lg:text-base">Informasi Customer</h3>
                                    <div className="bg-slate-50 rounded-lg p-3 lg:p-4 space-y-2">
                                        <div className="flex justify-between text-sm lg:text-base">
                                            <span className="text-slate-700">Nama:</span>
                                            <span className="font-medium text-right">{selectedOrder.customer_name}</span>
                                        </div>
                                        <div className="flex justify-between text-sm lg:text-base">
                                            <span className="text-slate-700">Email:</span>
                                            <span className="font-medium text-right break-all">{selectedOrder.customer_email}</span>
                                        </div>
                                        <div className="flex justify-between text-sm lg:text-base">
                                            <span className="text-slate-700">Phone:</span>
                                            <span className="font-medium">{selectedOrder.customer_phone}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Package Info */}
                                <div>
                                    <h3 className="font-semibold mb-2 text-sm lg:text-base">Informasi Paket</h3>
                                    <div className="bg-slate-50 rounded-lg p-3 lg:p-4 space-y-2">
                                        <div className="flex justify-between text-sm lg:text-base">
                                            <span className="text-slate-700">Paket:</span>
                                            <span className="font-medium text-right">{selectedOrder.package_name}</span>
                                        </div>
                                        <div className="flex justify-between text-sm lg:text-base">
                                            <span className="text-slate-700">Harga:</span>
                                            <span className="font-medium">{formatPrice(selectedOrder.package_price)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm lg:text-base">
                                            <span className="text-slate-700">Metode Pembayaran:</span>
                                            <span className="font-medium">
                                                {selectedOrder.payment_method === 'full' ? 'Full Payment' : 'DP 50%'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Briefing Notes */}
                                {selectedOrder.notes && (
                                    <div>
                                        <h3 className="font-semibold mb-2 text-sm lg:text-base">Detail Briefing</h3>
                                        <div className="bg-slate-50 rounded-lg p-3 lg:p-4 space-y-3">
                                            {(() => {
                                                try {
                                                    const briefing = JSON.parse(selectedOrder.notes);
                                                    return (
                                                        <>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                                                                <div>
                                                                    <span className="text-slate-700 text-xs lg:text-sm block mb-1">Nama Website:</span>
                                                                    <p className="font-medium text-sm lg:text-base">{briefing.websiteName || '-'}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="text-slate-700 text-xs lg:text-sm block mb-1">Nomor Telepon:</span>
                                                                    <p className="font-medium text-sm lg:text-base">{briefing.phone || '-'}</p>
                                                                </div>
                                                            </div>

                                                            {briefing.websiteDescription && (
                                                                <div>
                                                                    <span className="text-slate-700 text-xs lg:text-sm block mb-1">Deskripsi Website:</span>
                                                                    <p className="font-medium text-sm lg:text-base">{briefing.websiteDescription}</p>
                                                                </div>
                                                            )}

                                                            {briefing.websitePurpose && (
                                                                <div>
                                                                    <span className="text-slate-700 text-xs lg:text-sm block mb-1">Tujuan Website:</span>
                                                                    <p className="font-medium text-sm lg:text-base">{briefing.websitePurpose}</p>
                                                                </div>
                                                            )}

                                                            {briefing.colorPreference && (
                                                                <div>
                                                                    <span className="text-slate-700 text-xs lg:text-sm block mb-1">Preferensi Warna:</span>
                                                                    <p className="font-medium text-sm lg:text-base">{briefing.colorPreference}</p>
                                                                </div>
                                                            )}

                                                            {briefing.referenceWebsites && (
                                                                <div>
                                                                    <span className="text-slate-700 text-xs lg:text-sm block mb-1">Website Referensi:</span>
                                                                    <p className="font-medium text-sm lg:text-base break-all">{briefing.referenceWebsites}</p>
                                                                </div>
                                                            )}

                                                            {briefing.additionalInfo && (
                                                                <div>
                                                                    <span className="text-slate-700 text-xs lg:text-sm block mb-1">Informasi Tambahan:</span>
                                                                    <p className="font-medium text-sm lg:text-base">{briefing.additionalInfo}</p>
                                                                </div>
                                                            )}
                                                        </>
                                                    );
                                                } catch (e) {
                                                    return <pre className="text-xs lg:text-sm whitespace-pre-wrap break-words">{selectedOrder.notes}</pre>;
                                                }
                                            })()}
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                {selectedOrder.payment_status === 'pending' && (
                                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                                        <button
                                            onClick={() => handleVerifyPayment(selectedOrder.id, 'verified')}
                                            className="flex-1 bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                        >
                                            Verifikasi Pembayaran
                                        </button>
                                        <button
                                            onClick={() => handleVerifyPayment(selectedOrder.id, 'rejected')}
                                            className="flex-1 bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
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