// app/store/order/[slug]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function StoreOrderPage() {
    const router = useRouter();
    const params = useParams();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bankAccounts, setBankAccounts] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: ''
    });
    const [errors, setErrors] = useState({});

    // Fetch item and bank accounts
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [itemRes, bankRes] = await Promise.all([
                    fetch(`/api/store/items?slug=${params.slug}`),
                    fetch('/api/bank-accounts')
                ]);

                const itemData = await itemRes.json();
                const bankData = await bankRes.json();

                if (!itemData || itemData.error || itemData.price_type === 'freebies') {
                    router.push('/store');
                    return;
                }

                setItem(itemData);
                setBankAccounts(bankData || []);
            } catch (error) {
                console.error('Error:', error);
                router.push('/store');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [params.slug, router]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Nama harus diisi';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email harus diisi';
        } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
            newErrors.email = 'Format email tidak valid';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Nomor telepon harus diisi';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsProcessing(true);

        try {
            const response = await fetch('/api/store/purchases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    item_id: item.id,
                    customer_name: formData.name,
                    customer_email: formData.email,
                    customer_phone: formData.phone,
                    amount: item.price
                })
            });

            if (!response.ok) throw new Error('Failed to create order');

            const purchase = await response.json();

            // Store in localStorage for confirmation page
            localStorage.setItem('storePurchase', JSON.stringify({
                ...purchase,
                item: item
            }));

            // Redirect to confirmation
            router.push(`/store/invoice/${purchase.invoice_number}`);
        } catch (error) {
            console.error('Error:', error);
            alert('Gagal membuat pesanan. Silakan coba lagi.');
            setIsProcessing(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price).replace('IDR', 'Rp');
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary border-r-transparent"></div>
                        <p className="mt-4 text-gray-500">Memuat data...</p>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    if (!item) return null;

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-2 text-sm mb-6">
                        <Link href="/store" className="text-gray-500 hover:text-primary transition">Store</Link>
                        <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <Link href={`/store/${item.slug}`} className="text-gray-500 hover:text-primary transition truncate max-w-[150px]">{item.name}</Link>
                        <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-gray-800 font-medium">Order</span>
                    </nav>

                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-primary to-orange-600 text-white p-6 md:p-8">
                            <h1 className="text-2xl md:text-3xl font-bold mb-2">Checkout</h1>
                            <p className="text-orange-100">Lengkapi data berikut untuk melanjutkan pembelian</p>
                        </div>

                        <div className="p-6 md:p-8">
                            {/* Product Summary */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 mb-8">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="w-full md:w-32 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                        {item.thumbnail_url ? (
                                            <img src={item.thumbnail_url} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {item.category && (
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                                    {item.category.name}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-lg text-gray-800 mb-1">{item.name}</h3>
                                        <p className="text-gray-500 text-sm line-clamp-2">{item.description}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 mb-1">Total</p>
                                        <div className="text-2xl font-bold text-primary">{formatPrice(item.price)}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit}>
                                <h2 className="text-lg font-semibold text-gray-800 mb-4">Informasi Pembeli</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className={`w-full h-12 px-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition ${errors.name ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
                                            placeholder="John Doe"
                                        />
                                        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className={`w-full h-12 px-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
                                            placeholder="john@example.com"
                                        />
                                        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomor Telepon *</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className={`w-full h-12 px-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition ${errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
                                            placeholder="08123456789"
                                        />
                                        {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                                    </div>
                                </div>

                                {/* Bank Accounts */}
                                <h2 className="text-lg font-semibold text-gray-800 mb-4">Metode Pembayaran</h2>
                                <div className="space-y-3 mb-8">
                                    {bankAccounts.map((bank) => (
                                        <div key={bank.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-semibold text-gray-800">{bank.bank_name}</p>
                                                    <p className="text-sm text-gray-600">{bank.account_number} - {bank.account_holder}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <button
                                        type="button"
                                        onClick={() => router.back()}
                                        className="flex-1 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition"
                                    >
                                        ← Kembali
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isProcessing}
                                        className="flex-1 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-orange-600 transition shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isProcessing ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <div className="w-5 h-5 border-2 border-white border-r-transparent rounded-full animate-spin"></div>
                                                Memproses...
                                            </span>
                                        ) : (
                                            'Buat Pesanan'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
