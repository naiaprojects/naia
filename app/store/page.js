'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AdSense from '@/components/AdSense';

export default function StorePage() {
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [designs, setDesigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [heroBackground, setHeroBackground] = useState('');

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedDesign, setSelectedDesign] = useState('');
    const [selectedPriceType, setSelectedPriceType] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Grid columns
    const [gridCols, setGridCols] = useState(4);
    const itemsPerPage = 12;

    // Fetch categories, designs and hero content
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const [catRes, desRes, heroRes] = await Promise.all([
                    fetch('/api/store/categories'),
                    fetch('/api/store/designs'),
                    fetch('/api/hero')
                ]);
                const catData = await catRes.json();
                const desData = await desRes.json();
                const heroData = await heroRes.json();
                setCategories(catData || []);
                setDesigns(desData || []);
                if (heroData?.background_image) {
                    setHeroBackground(heroData.background_image);
                }
            } catch (error) {
                console.error('Error fetching filters:', error);
            }
        };
        fetchFilters();
    }, []);

    // Fetch items
    useEffect(() => {
        const fetchItems = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    page: currentPage.toString(),
                    limit: itemsPerPage.toString()
                });

                if (searchQuery) params.append('search', searchQuery);
                if (selectedCategory) params.append('category', selectedCategory);
                if (selectedDesign) params.append('design', selectedDesign);
                if (selectedPriceType) params.append('price_type', selectedPriceType);

                const response = await fetch(`/api/store/items?${params}`);
                const data = await response.json();

                setItems(data.items || []);
                setTotalPages(data.pagination?.totalPages || 1);
                setTotalItems(data.pagination?.total || 0);
            } catch (error) {
                console.error('Error fetching items:', error);
            } finally {
                setLoading(false);
            }
        };

        const debounceTimer = setTimeout(fetchItems, 300);
        return () => clearTimeout(debounceTimer);
    }, [currentPage, searchQuery, selectedCategory, selectedDesign, selectedPriceType]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedCategory, selectedDesign, selectedPriceType]);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price).replace('IDR', 'Rp');
    };

    const gridColsClass = useMemo(() => {
        switch (gridCols) {
            case 3: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
            case 5: return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
            default: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
        }
    }, [gridCols]);

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedCategory('');
        setSelectedDesign('');
        setSelectedPriceType('');
    };

    const hasActiveFilters = searchQuery || selectedCategory || selectedDesign || selectedPriceType;

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-gray-50">
                {/* Hero Section */}
                <section
                    id="hero-section"
                    className="mx-4 rounded-b-3xl bg-primary pt-32 pb-20 relative overflow-hidden bg-center bg-cover shadow-2xl mb-12"
                    style={heroBackground ? { backgroundImage: `url('${heroBackground}')` } : {}}
                >
                    <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>

                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
                        <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight leading-tight text-white">
                            Digital Store
                        </h1>
                        <p className="text-lg md:text-xl text-orange-100 max-w-3xl mx-auto leading-relaxed">
                            Template Blogspot premium, Script, Template Notion, dan berbagai produk digital lainnya
                        </p>
                    </div>
                </section>

                {/* Content */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {/* Filters Bar */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6 shadow-sm mb-8">
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Search */}
                            <div className="relative flex-1">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Cari template, script..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition text-sm outline-none"
                                />
                            </div>

                            {/* Category Filter */}
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition text-sm outline-none min-w-[160px]"
                            >
                                <option value="">Semua Kategori</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>

                            {/* Design Filter */}
                            <select
                                value={selectedDesign}
                                onChange={(e) => setSelectedDesign(e.target.value)}
                                className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition text-sm outline-none min-w-[160px]"
                            >
                                <option value="">Semua Design</option>
                                {designs.map(des => (
                                    <option key={des.id} value={des.id}>{des.name}</option>
                                ))}
                            </select>

                            {/* Price Type Filter */}
                            <select
                                value={selectedPriceType}
                                onChange={(e) => setSelectedPriceType(e.target.value)}
                                className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition text-sm outline-none min-w-[140px]"
                            >
                                <option value="">Semua Harga</option>
                                <option value="freebies">Gratis</option>
                                <option value="premium">Premium</option>
                            </select>
                        </div>

                        {/* Bottom Bar */}
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-4">
                                <p className="text-sm text-gray-500">
                                    Menampilkan <span className="font-medium text-gray-800">{items.length}</span> dari <span className="font-medium text-gray-800">{totalItems}</span> produk
                                </p>

                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="text-sm text-primary hover:text-orange-700 font-medium flex items-center gap-1"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Reset Filter
                                    </button>
                                )}
                            </div>

                            {/* Grid Toggle */}
                            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
                                <span className="text-xs text-gray-500 px-2">Grid:</span>
                                {[3, 4, 5].map(cols => (
                                    <button
                                        key={cols}
                                        onClick={() => setGridCols(cols)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${gridCols === cols
                                            ? 'bg-white text-primary shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        {cols}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Top Multiplex Ad */}
                    <div className="mb-8">
                        <AdSense
                            slot="3086683905"
                            format="autorelaxed"
                            style={{ display: 'block' }}
                        />
                    </div>

                    {/* Products Grid */}
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="text-center">
                                <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary border-r-transparent"></div>
                                <p className="mt-4 text-gray-500">Memuat produk...</p>
                            </div>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Tidak ada produk ditemukan</h3>
                            <p className="text-gray-500 mb-4">Coba ubah filter pencarian Anda</p>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition"
                                >
                                    Reset Filter
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className={`grid ${gridColsClass} gap-6`}>
                            {items.map(item => (
                                <Link
                                    key={item.id}
                                    href={`/store/${item.slug}`}
                                    className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300"
                                >
                                    {/* Thumbnail */}
                                    <div className="bg-gray-100 relative overflow-hidden">
                                        {item.thumbnail_url ? (
                                            <img
                                                src={item.thumbnail_url}
                                                alt={item.name}
                                                className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                                <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        )}

                                        {/* Price Badge */}
                                        <div className="absolute top-3 right-3">
                                            {item.price_type === 'freebies' ? (
                                                <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-lg">
                                                    GRATIS
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 bg-gradient-to-r from-primary to-orange-600 text-white text-xs font-bold rounded-full shadow-lg">
                                                    PREMIUM
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-4">
                                        {/* Category & Design Tags */}
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {item.category && (
                                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-medium rounded-full">
                                                    {item.category.name}
                                                </span>
                                            )}
                                            {item.design && (
                                                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-medium rounded-full">
                                                    {item.design.name}
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="font-bold text-gray-800 group-hover:text-primary transition-colors line-clamp-2 mb-2">
                                            {item.name}
                                        </h3>

                                        <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                                            {item.description}
                                        </p>

                                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                            <div className="font-bold text-lg text-primary">
                                                {item.price_type === 'freebies' ? 'Gratis' : formatPrice(item.price)}
                                            </div>
                                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                                {item.download_count || 0}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Bottom Multiplex Ad */}
                    <div className="mt-12 mb-8">
                        <AdSense
                            slot="3086683905"
                            format="autorelaxed"
                            style={{ display: 'block' }}
                        />
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-12">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(page => {
                                    if (totalPages <= 7) return true;
                                    if (page === 1 || page === totalPages) return true;
                                    if (page >= currentPage - 1 && page <= currentPage + 1) return true;
                                    return false;
                                })
                                .map((page, idx, arr) => (
                                    <span key={page} className="flex items-center">
                                        {idx > 0 && arr[idx - 1] !== page - 1 && (
                                            <span className="px-2 text-gray-400">...</span>
                                        )}
                                        <button
                                            onClick={() => setCurrentPage(page)}
                                            className={`w-10 h-10 rounded-xl font-medium transition ${currentPage === page
                                                ? 'bg-primary text-white shadow-lg'
                                                : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    </span>
                                ))}

                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    )}
                </section>
            </main>
            <Footer />
        </>
    );
}
