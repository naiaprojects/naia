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

    // Discount State
    const [appliedDiscount, setAppliedDiscount] = useState(null);
    const [discountCode, setDiscountCode] = useState('');
    const [discountError, setDiscountError] = useState('');
    const [discountLoading, setDiscountLoading] = useState(false);

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

                // Fetch auto-discounts for store
                try {
                    const discountRes = await fetch(`/api/discounts?type=auto&applies_to_store=true`);
                    const autoDiscounts = await discountRes.json();

                    // Apply the first valid auto discount if available
                    if (Array.isArray(autoDiscounts) && autoDiscounts.length > 0) {
                        const autoDiscount = autoDiscounts[0];
                        // Calculate discount amount
                        let discountAmount = 0;
                        const price = itemData.price;

                        // Check if discount applies to store
                        if (autoDiscount.applies_to === 'store' || autoDiscount.applies_to === 'all') {
                            if (autoDiscount.discount_value_type === 'percentage') {
                                discountAmount = (price * autoDiscount.discount_value) / 100;
                                if (autoDiscount.max_discount_amount && discountAmount > autoDiscount.max_discount_amount) {
                                    discountAmount = autoDiscount.max_discount_amount;
                                }
                            } else {
                                discountAmount = autoDiscount.discount_value;
                            }

                            if (discountAmount > price) discountAmount = price;

                            setAppliedDiscount({
                                ...autoDiscount,
                                discount_amount: discountAmount,
                                original_amount: price,
                                final_amount: price - discountAmount
                            });
                            setDiscountCode(autoDiscount.code);
                        }
                    }
                } catch (discountError) {
                    console.error('Error fetching auto discounts:', discountError);
                }

            } catch (error) {
                console.error('Error:', error);
                router.push('/store');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [params.slug, router]);

    // Apply discount code
    const applyDiscountCode = async () => {
        if (!discountCode.trim()) {
            setDiscountError('Masukkan kode diskon');
            return;
        }

        setDiscountLoading(true);
        setDiscountError('');

        try {
            const response = await fetch('/api/discounts/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: discountCode.trim(),
                    order_amount: item?.price,
                    order_type: 'store'
                })
            });

            const data = await response.json();

            if (data.valid) {
                setAppliedDiscount(data.discount);
                setDiscountError('');
            } else {
                setDiscountError(data.error || 'Kode diskon tidak valid');
            }
        } catch (error) {
            setDiscountError('Gagal memvalidasi kode diskon');
        } finally {
            setDiscountLoading(false);
        }
    };

    // Remove applied discount
    const removeDiscount = () => {
        setAppliedDiscount(null);
        setDiscountCode('');
        setDiscountError('');
    };

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

        // Calculate final amount
        const finalAmount = appliedDiscount ? appliedDiscount.final_amount : item.price;

        try {
            const response = await fetch('/api/store/purchases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    item_id: item.id,
                    customer_name: formData.name,
                    customer_email: formData.email,
                    customer_phone: formData.phone,
                    amount: finalAmount,
                    discount: appliedDiscount ? {
                        id: appliedDiscount.id,
                        code: appliedDiscount.code,
                        discount_amount: appliedDiscount.discount_amount,
                        original_amount: appliedDiscount.original_amount
                    } : null
                })
            });

            if (!response.ok) throw new Error('Failed to create order');

            const purchase = await response.json();

            // Store in localStorage for confirmation page
            localStorage.setItem('storePurchase', JSON.stringify({
                ...purchase,
                item: item,
                discount: appliedDiscount
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
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 mb-6">
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
                                        {appliedDiscount ? (
                                            <>
                                                <p className="text-xs text-gray-500 mb-1">Harga Asli</p>
                                                <div className="text-lg text-gray-400 line-through">
                                                    {formatPrice(item.price)}
                                                </div>
                                                <p className="text-xs text-green-600 font-medium">Diskon {appliedDiscount.discount_value_type === 'percentage' ? `${appliedDiscount.discount_value}%` : formatPrice(appliedDiscount.discount_amount)}</p>
                                                <div className="text-2xl font-bold text-primary">
                                                    {formatPrice(appliedDiscount.final_amount)}
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-xs text-gray-500 mb-1">Total</p>
                                                <div className="text-2xl font-bold text-primary">{formatPrice(item.price)}</div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Discount Code Section */}
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-8">
                                <p className="text-sm font-medium text-gray-700 mb-3">
                                    <svg className="w-4 h-4 inline mr-1 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                    Kode Diskon
                                </p>

                                {appliedDiscount ? (
                                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="font-bold text-green-800">{appliedDiscount.code}</p>
                                                <p className="text-xs text-green-600">{appliedDiscount.name} - Hemat {formatPrice(appliedDiscount.discount_amount)}</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={removeDiscount}
                                            className="text-red-500 hover:text-red-700 text-sm font-medium p-2 hover:bg-red-50 rounded-lg transition"
                                        >
                                            Hapus
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={discountCode}
                                            onChange={(e) => { setDiscountCode(e.target.value.toUpperCase()); setDiscountError(''); }}
                                            placeholder="Masukkan kode diskon"
                                            className="flex-1 h-11 px-4 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition text-sm uppercase"
                                        />
                                        <button
                                            type="button"
                                            onClick={applyDiscountCode}
                                            disabled={discountLoading}
                                            className="px-5 h-11 bg-primary text-white rounded-lg hover:bg-orange-600 transition font-medium text-sm disabled:opacity-50"
                                        >
                                            {discountLoading ? '...' : 'Apply'}
                                        </button>
                                    </div>
                                )}

                                {discountError && (
                                    <p className="text-red-500 text-xs mt-2">{discountError}</p>
                                )}
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
