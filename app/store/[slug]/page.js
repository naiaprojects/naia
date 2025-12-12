// app/store/[slug]/page.js
import { createClient } from '@/lib/supabase-server';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function getStoreItem(slug) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('store_items')
        .select(`
            *,
            category:store_categories(id, name, slug),
            design:store_designs(id, name, slug)
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

    if (error || !data) return null;
    return data;
}

async function getRelatedItems(item) {
    const supabase = createClient();
    const { data } = await supabase
        .from('store_items')
        .select(`
            id, name, slug, thumbnail_url, price, price_type,
            category:store_categories(name)
        `)
        .eq('is_active', true)
        .neq('id', item.id)
        .eq('category_id', item.category_id)
        .limit(4);

    return data || [];
}

const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(price).replace('IDR', 'Rp');
};

export default async function StoreDetailPage({ params }) {
    const item = await getStoreItem(params.slug);

    if (!item) {
        notFound();
    }

    const relatedItems = await getRelatedItems(item);

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-gray-50">
                {/* Breadcrumb */}
                <div className="bg-white border-b border-gray-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <nav className="flex items-center gap-2 text-sm">
                            <Link href="/" className="text-gray-500 hover:text-primary transition">Home</Link>
                            <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <Link href="/store" className="text-gray-500 hover:text-primary transition">Store</Link>
                            <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <span className="text-gray-800 font-medium truncate max-w-[200px]">{item.name}</span>
                        </nav>
                    </div>
                </div>

                {/* Product Detail */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                            {/* Image */}
                            <div className="aspect-video lg:aspect-square bg-gray-100 relative">
                                {item.thumbnail_url ? (
                                    <img
                                        src={item.thumbnail_url}
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                        <svg className="w-24 h-24 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                )}

                                {/* Price Badge */}
                                <div className="absolute top-4 left-4">
                                    {item.price_type === 'freebies' ? (
                                        <span className="px-4 py-2 bg-green-500 text-white font-bold rounded-full shadow-lg">
                                            GRATIS
                                        </span>
                                    ) : (
                                        <span className="px-4 py-2 bg-gradient-to-r from-primary to-orange-600 text-white font-bold rounded-full shadow-lg">
                                            PREMIUM
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 md:p-10 flex flex-col">
                                {/* Tags */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {item.category && (
                                        <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full">
                                            {item.category.name}
                                        </span>
                                    )}
                                    {item.design && (
                                        <span className="px-3 py-1 bg-purple-50 text-purple-700 text-sm font-medium rounded-full">
                                            {item.design.name}
                                        </span>
                                    )}
                                </div>

                                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
                                    {item.name}
                                </h1>

                                <p className="text-gray-600 leading-relaxed mb-6 flex-1">
                                    {item.description}
                                </p>

                                {/* Stats */}
                                <div className="flex items-center gap-6 py-4 border-y border-gray-100 mb-6">
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        <span className="text-sm"><strong>{item.download_count || 0}</strong> downloads</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span className="text-sm">{new Date(item.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                    </div>
                                </div>

                                {/* Price */}
                                <div className="mb-6">
                                    <p className="text-sm text-gray-500 mb-1">Harga</p>
                                    <div className="text-3xl md:text-4xl font-bold text-primary">
                                        {item.price_type === 'freebies' ? 'Gratis' : formatPrice(item.price)}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col sm:flex-row gap-3">
                                    {item.demo_url && (
                                        <a
                                            href={item.demo_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gray-100 text-gray-800 rounded-xl font-medium hover:bg-gray-200 transition"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            Live Demo
                                        </a>
                                    )}

                                    {item.price_type === 'freebies' ? (
                                        <a
                                            href={item.download_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition shadow-lg shadow-green-500/20"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            Download Gratis
                                        </a>
                                    ) : (
                                        <Link
                                            href={`/store/order/${item.slug}`}
                                            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white rounded-xl font-bold hover:bg-orange-600 transition shadow-lg shadow-orange-500/20"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                            Beli Sekarang
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Related Products */}
                {relatedItems.length > 0 && (
                    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Produk Terkait</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {relatedItems.map(related => (
                                <Link
                                    key={related.id}
                                    href={`/store/${related.slug}`}
                                    className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all"
                                >
                                    <div className="aspect-video bg-gray-100 relative overflow-hidden">
                                        {related.thumbnail_url ? (
                                            <img
                                                src={related.thumbnail_url}
                                                alt={related.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        )}
                                        <div className="absolute top-2 right-2">
                                            <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${related.price_type === 'freebies' ? 'bg-green-500 text-white' : 'bg-primary text-white'}`}>
                                                {related.price_type === 'freebies' ? 'GRATIS' : 'PREMIUM'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold text-gray-800 group-hover:text-primary transition line-clamp-1 mb-2">
                                            {related.name}
                                        </h3>
                                        <div className="font-bold text-primary">
                                            {related.price_type === 'freebies' ? 'Gratis' : formatPrice(related.price)}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </main>
            <Footer />
        </>
    );
}
