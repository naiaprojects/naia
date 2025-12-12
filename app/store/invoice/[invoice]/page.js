// app/store/invoice/[invoice]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function StoreInvoicePage() {
    const router = useRouter();
    const params = useParams();
    const [purchase, setPurchase] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bankAccounts, setBankAccounts] = useState([]);
    const [timeRemaining, setTimeRemaining] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [purchaseRes, bankRes] = await Promise.all([
                    fetch(`/api/store/purchases?invoice=${params.invoice}`),
                    fetch('/api/bank-accounts')
                ]);

                const purchaseData = await purchaseRes.json();
                const bankData = await bankRes.json();

                if (!purchaseData || purchaseData.error) {
                    router.push('/store');
                    return;
                }

                setPurchase(purchaseData);
                setBankAccounts(bankData || []);
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [params.invoice, router]);

    // Countdown timer
    useEffect(() => {
        if (!purchase || purchase.payment_status !== 'pending') return;

        const calculateTimeRemaining = () => {
            const deadline = new Date(purchase.created_at);
            deadline.setDate(deadline.getDate() + 3);

            const now = new Date();
            const diff = deadline - now;

            if (diff <= 0) {
                setTimeRemaining({ expired: true });
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeRemaining({ days, hours, minutes, seconds, expired: false });
        };

        calculateTimeRemaining();
        const interval = setInterval(calculateTimeRemaining, 1000);
        return () => clearInterval(interval);
    }, [purchase]);

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
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    };

    const handleWhatsAppClick = () => {
        const message = `Halo! Saya ingin konfirmasi pembayaran:\n\nInvoice: ${purchase.invoice_number}\nProduk: ${purchase.item?.name}\nTotal: ${formatPrice(purchase.amount)}\n\nTerima kasih.`;
        const phoneNumber = '6281320858595';
        window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const copyInvoiceLink = () => {
        navigator.clipboard.writeText(window.location.href);
        alert('Link invoice berhasil disalin!');
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Menunggu Pembayaran' },
            verified: { bg: 'bg-green-100', text: 'text-green-800', label: 'Terverifikasi' },
            rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Ditolak' }
        };
        return badges[status] || badges.pending;
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary border-r-transparent"></div>
                        <p className="mt-4 text-gray-500">Memuat invoice...</p>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    if (!purchase) return null;

    const statusBadge = getStatusBadge(purchase.payment_status);

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                        {/* Header */}
                        <div className={`p-6 md:p-8 text-white ${purchase.payment_status === 'verified' ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`}>
                            <div className="flex items-center gap-4">
                                <div className="bg-white/20 rounded-full p-3">
                                    {purchase.payment_status === 'verified' ? (
                                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    )}
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold">
                                        {purchase.payment_status === 'verified' ? 'Pembayaran Berhasil!' : 'Invoice Pembelian'}
                                    </h1>
                                    <p className="text-white/80 text-sm">{purchase.invoice_number}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 md:p-8">
                            {/* Countdown Timer - Only for pending */}
                            {purchase.payment_status === 'pending' && timeRemaining && !timeRemaining.expired && (
                                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5 mb-6">
                                    <h3 className="text-center font-semibold text-red-800 mb-3">Batas Waktu Pembayaran</h3>
                                    <div className="grid grid-cols-4 gap-3 text-center">
                                        {[
                                            { value: timeRemaining.days, label: 'Hari' },
                                            { value: timeRemaining.hours, label: 'Jam' },
                                            { value: timeRemaining.minutes, label: 'Menit' },
                                            { value: timeRemaining.seconds, label: 'Detik' }
                                        ].map((item, idx) => (
                                            <div key={idx} className="bg-white rounded-lg p-3 shadow-sm">
                                                <div className="text-2xl font-bold text-red-600">{item.value}</div>
                                                <div className="text-xs text-gray-500">{item.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Verified Success */}
                            {purchase.payment_status === 'verified' && (
                                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5 mb-6 text-center">
                                    <h3 className="font-semibold text-green-800 mb-2">✅ Pembayaran Terverifikasi</h3>
                                    <p className="text-green-700 text-sm">Link download sudah dikirim ke email Anda.</p>
                                </div>
                            )}

                            {/* Product Info */}
                            <div className="bg-gray-50 rounded-xl p-5 mb-6">
                                <h3 className="font-semibold text-gray-800 mb-3">Detail Produk</h3>
                                <div className="flex gap-4">
                                    {purchase.item?.thumbnail_url && (
                                        <div className="w-20 h-14 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                            <img src={purchase.item.thumbnail_url} alt="" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-800">{purchase.item?.name || 'Produk'}</p>
                                        <p className="text-sm text-gray-500">Digital Product</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-primary">{formatPrice(purchase.amount)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Order Info */}
                            <div className="bg-gray-50 rounded-xl p-5 mb-6">
                                <h3 className="font-semibold text-gray-800 mb-3">Informasi Pesanan</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Tanggal</span>
                                        <span className="font-medium">{formatDate(purchase.created_at)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Status</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                                            {statusBadge.label}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div className="bg-gray-50 rounded-xl p-5 mb-6">
                                <h3 className="font-semibold text-gray-800 mb-3">Informasi Pembeli</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Nama</span>
                                        <span className="font-medium">{purchase.customer_name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Email</span>
                                        <span className="font-medium">{purchase.customer_email}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Telepon</span>
                                        <span className="font-medium">{purchase.customer_phone}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Bank Accounts - Only for pending */}
                            {purchase.payment_status === 'pending' && (
                                <div className="mb-6">
                                    <h3 className="font-semibold text-gray-800 mb-3">Transfer ke Rekening</h3>
                                    <div className="space-y-3">
                                        {bankAccounts.map((bank) => (
                                            <div key={bank.id} className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-bold text-blue-900">{bank.bank_name}</span>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(bank.account_number);
                                                            alert('Nomor rekening disalin!');
                                                        }}
                                                        className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700"
                                                    >
                                                        Salin
                                                    </button>
                                                </div>
                                                <p className="text-blue-800">{bank.account_number} - {bank.account_holder}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                {purchase.payment_status === 'pending' && (
                                    <button
                                        onClick={handleWhatsAppClick}
                                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.123-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                        </svg>
                                        Konfirmasi via WhatsApp
                                    </button>
                                )}
                                <button
                                    onClick={copyInvoiceLink}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-800 rounded-xl font-medium hover:bg-gray-200 transition"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Salin Link Invoice
                                </button>
                                <Link
                                    href="/store"
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-orange-600 transition"
                                >
                                    Kembali ke Store
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
