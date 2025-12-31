'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import LogoPathAnimation from '@/components/LogoPathAnimation';

const ratingCategories = [
    {
        key: 'rating_service',
        label: 'Layanan',
        description: 'Kecepatan dan kualitas layanan',
    },
    {
        key: 'rating_design',
        label: 'Hasil Desain',
        description: 'Kualitas desain yang dihasilkan',
    },
    {
        key: 'rating_communication',
        label: 'Komunikasi',
        description: 'Responsif dan keramahan tim',
    },
];

const StarRating = ({ value, onChange }) => {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                >
                    <svg
                        className={`w-8 h-8 ${star <= value ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'} transition-colors`}
                        viewBox="0 0 24 24"
                    >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                </button>
            ))}
        </div>
    );
};

export default function ReviewPage() {
    const params = useParams();
    const supabase = createClient();
    const invoice_number = params?.invoice_number;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState(null);
    const [orderInfo, setOrderInfo] = useState(null);
    const [generatedDiscount, setGeneratedDiscount] = useState(null);
    const [wordCount, setWordCount] = useState(0);

    const [ratings, setRatings] = useState({
        rating_service: 5,
        rating_design: 5,
        rating_communication: 5,
    });
    const [reviewText, setReviewText] = useState('');

    const countWords = (text) => {
        return text.trim().split(/\s+/).filter((word) => word.length > 0).length;
    };

    const handleReviewChange = (text) => {
        setReviewText(text);
        setWordCount(countWords(text));
    };

    useEffect(() => {
        if (!invoice_number) {
            setError('Invoice tidak ditemukan.');
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);

                let orderData = null;
                let orderType = null;

                const { data: serviceOrder } = await supabase
                    .from('orders')
                    .select('id, invoice_number, customer_name, customer_email, package_name')
                    .eq('invoice_number', invoice_number)
                    .single();

                if (serviceOrder) {
                    orderData = serviceOrder;
                    orderType = 'service';
                } else {
                    const { data: storeOrder } = await supabase
                        .from('store_purchases')
                        .select('id, invoice_number, customer_name, customer_email, item:store_items(name)')
                        .eq('invoice_number', invoice_number)
                        .single();

                    if (storeOrder) {
                        orderData = storeOrder;
                        orderType = 'store';
                    }
                }

                if (!orderData) {
                    setError('Invoice tidak ditemukan.');
                    setLoading(false);
                    return;
                }

                setOrderInfo({ ...orderData, type: orderType });

                const { data: testimonial } = await supabase
                    .from('testimonials')
                    .select('*')
                    .eq(orderType === 'service' ? 'order_id' : 'store_order_id', orderData.id)
                    .single();

                if (testimonial) {
                    if (testimonial.review_link_expires_at) {
                        const expiresAt = new Date(testimonial.review_link_expires_at);
                        const now = new Date();

                        if (now > expiresAt) {
                            setError('Link testimoni Anda sudah kadaluarsa. Mohon hubungi admin untuk mendapatkan link baru.');
                            setLoading(false);
                            return;
                        }
                    }

                    if (testimonial.submitted_at) {
                        setSubmitted(true);
                        setRatings({
                            rating_service: testimonial.rating_service || 5,
                            rating_design: testimonial.rating_design || 5,
                            rating_communication: testimonial.rating_communication || 5,
                        });
                        setReviewText(testimonial.review_text || '');
                    }
                }

                setLoading(false);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Terjadi kesalahan saat memuat data.');
                setLoading(false);
            }
        };

        fetchData();
    }, [invoice_number]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!reviewText.trim()) {
            alert('Mohon isi ulasan Anda.');
            return;
        }

        const currentWordCount = countWords(reviewText);

        if (currentWordCount < 10) {
            alert('Ulasan harus minimal 10 kata. Saat ini: ' + currentWordCount + ' kata.');
            return;
        }

        if (currentWordCount > 30) {
            alert('Ulasan maksimal 30 kata. Saat ini: ' + currentWordCount + ' kata.');
            return;
        }

        setSubmitting(true);

        try {
            const response = await fetch('/api/testimonials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invoice_number,
                    ratings,
                    review_text: reviewText,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Gagal mengirim testimoni');
            }

            if (data.discount) {
                setGeneratedDiscount(data.discount);
            }

            setSubmitted(true);
        } catch (err) {
            console.error('Error submitting testimonial:', err);
            alert('Gagal mengirim testimoni. Silakan coba lagi.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
                <LogoPathAnimation />
            </div>
        );
    }

    if (error) {
        return (
            <section className="min-h-screen py-16 bg-slate-100 flex items-center justify-center">
                <div className="container mx-auto max-w-md px-4 text-center">
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <span className="text-3xl">❌</span>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800 mb-2">Link Tidak Valid</h1>
                        <p className="text-slate-600">{error}</p>
                    </div>
                </div>
            </section>
        );
    }

    if (submitted) {
        return (
            <section className="min-h-screen py-16 bg-slate-100 flex items-center justify-center">
                <div className="container mx-auto max-w-2xl px-4">
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                        <div className="bg-primary px-6 py-8 text-white text-center">
                            <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold mb-2">Terima Kasih!</h1>
                            <p className="text-white/80">Testimoni Anda telah berhasil dikirim</p>
                        </div>

                        <div className="px-6 py-4 bg-slate-50 border-b">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 mb-0.5">{invoice_number}</p>
                                    <p className="font-semibold text-slate-800">
                                        {orderInfo?.type === 'service' ? orderInfo.package_name : orderInfo?.item?.name}
                                    </p>
                                    {orderInfo?.customer_name && (
                                        <p className="text-sm text-slate-500">Pelanggan: {orderInfo.customer_name}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {generatedDiscount && (
                                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-300 rounded-xl p-6">
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0">
                                            <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-amber-900 mb-2">🎉 Selamat! Anda Mendapatkan Diskon!</h3>
                                            <p className="text-amber-800 text-sm mb-4">
                                                Terima kasih telah memberikan testimoni lengkap. Anda berhak mendapatkan diskon <span className="font-bold">30%</span> untuk pembelian berikutnya!
                                            </p>
                                            <div className="bg-white rounded-lg p-4 space-y-3">
                                                <div>
                                                    <p className="text-xs text-amber-700 uppercase font-semibold mb-1">Kode Diskon</p>
                                                    <div className="flex items-center gap-2">
                                                        <code className="bg-amber-100 text-amber-900 font-bold text-lg px-4 py-2 rounded flex-1 text-center">
                                                            {generatedDiscount.code}
                                                        </code>
                                                        <button
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(generatedDiscount.code);
                                                                alert('Kode diskon berhasil disalin!');
                                                            }}
                                                            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded font-medium transition-colors text-sm"
                                                        >
                                                            Salin
                                                        </button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-amber-700 uppercase font-semibold mb-1">Potongan Harga</p>
                                                    <p className="text-2xl font-bold text-amber-900">30%</p>
                                                </div>
                                                <div className="pt-3 border-t border-amber-200">
                                                    <p className="text-xs text-amber-700">
                                                        ✓ Berlaku 30 hari dari sekarang<br />
                                                        ✓ Dapat digunakan 1 kali<br />
                                                        ✓ Untuk semua layanan
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-slate-800">Penilaian Anda</h2>
                                {ratingCategories.map((category) => (
                                    <div key={category.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 p-4 bg-slate-50 rounded-xl">
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-800">{category.label}</p>
                                            <p className="text-sm text-slate-500">{category.description}</p>
                                        </div>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <svg
                                                    key={star}
                                                    className={`w-8 h-8 ${star <= ratings[category.key] ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`}
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                </svg>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div>
                                <h2 className="text-lg font-semibold text-slate-800 mb-3">Ulasan Anda</h2>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{reviewText}</p>
                                </div>
                            </div>

                            <p className="text-center text-slate-600 text-sm">Kami sangat menghargai feedback Anda!</p>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="min-h-screen py-16 bg-slate-100">
            <div className="container mx-auto max-w-2xl px-4">
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="bg-primary px-6 py-8 text-white text-center">
                        <h1 className="text-2xl font-bold mb-2">Berikan Testimoni Anda</h1>
                        <p className="text-white/80">Pendapat Anda sangat berarti bagi kami</p>
                    </div>

                    <div className="px-6 py-4 bg-slate-50 border-b">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 mb-0.5">{invoice_number}</p>
                                <p className="font-semibold text-slate-800">
                                    {orderInfo?.type === 'service' ? orderInfo.package_name : orderInfo?.item?.name}
                                </p>
                                {orderInfo?.customer_name && (
                                    <p className="text-sm text-slate-500">Pelanggan: {orderInfo.customer_name}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="space-y-6">
                            <label className="block text-sm font-medium text-slate-700 mb-4">Berikan Penilaian Anda</label>
                            {ratingCategories.map((category) => (
                                <div key={category.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 p-4 bg-slate-50 rounded-xl">
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-800">{category.label}</p>
                                        <p className="text-sm text-slate-500">{category.description}</p>
                                    </div>
                                    <StarRating
                                        value={ratings[category.key]}
                                        onChange={(val) => setRatings((prev) => ({ ...prev, [category.key]: val }))}
                                    />
                                </div>
                            ))}
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label htmlFor="reviewText" className="block text-sm font-medium text-slate-700">
                                    Ceritakan Pengalaman Anda
                                </label>
                                <span className={`text-xs font-semibold ${wordCount < 10 ? 'text-red-600' : wordCount <= 30 ? 'text-green-600' : 'text-red-600'}`}>
                                    {wordCount}/30 kata
                                </span>
                            </div>
                            <textarea
                                id="reviewText"
                                rows={5}
                                className={`w-full rounded-xl border shadow-sm p-4 focus:ring-1 focus:outline-none resize-none transition-colors ${wordCount < 10 || wordCount > 30
                                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                        : 'border-slate-300 focus:border-primary focus:ring-primary'
                                    }`}
                                value={reviewText}
                                onChange={(e) => handleReviewChange(e.target.value)}
                                placeholder="Bagikan pengalaman Anda menggunakan layanan kami..."
                                maxLength={500}
                                required
                            />
                            {wordCount < 10 && wordCount > 0 && (
                                <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Minimal {10 - wordCount} kata lagi
                                </div>
                            )}
                            {wordCount > 30 && (
                                <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Kurangi {wordCount - 30} kata
                                </div>
                            )}
                            {wordCount >= 10 && wordCount <= 30 && (
                                <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Siap dikirim
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={submitting || wordCount < 10 || wordCount > 30}
                            className="w-full bg-primary text-white py-4 px-6 rounded-xl font-semibold hover:bg-primary/90 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors shadow-lg shadow-primary/20"
                        >
                            {submitting ? 'Mengirim...' : 'Kirim Testimoni'}
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
}
