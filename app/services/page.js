// app/services/page.js
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ServicesPage() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [heroBackground, setHeroBackground] = useState('');

    // Search & Filter
    const [searchQuery, setSearchQuery] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9;

    // Grid columns
    const [gridCols, setGridCols] = useState(3);

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [servicesRes, heroRes] = await Promise.all([
                    fetch('/api/services'),
                    fetch('/api/hero')
                ]);
                const servicesData = await servicesRes.json();
                const heroData = await heroRes.json();

                setServices(servicesData || []);
                if (heroData?.background_image) {
                    setHeroBackground(heroData.background_image);
                }
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Filtered data
    const filteredServices = useMemo(() => {
        let data = services;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            data = data.filter(s =>
                s.title?.toLowerCase().includes(query) ||
                s.description?.toLowerCase().includes(query)
            );
        }
        return data;
    }, [services, searchQuery]);

    // Pagination
    const totalPages = Math.ceil(filteredServices.length / itemsPerPage);
    const paginatedServices = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredServices.slice(start, start + itemsPerPage);
    }, [filteredServices, currentPage]);

    // Reset page on search
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const gridColsClass = useMemo(() => {
        switch (gridCols) {
            case 2: return 'grid-cols-1 md:grid-cols-2';
            case 4: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
            default: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
        }
    }, [gridCols]);

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
                            Our Services
                        </h1>
                        <p className="text-lg md:text-xl text-orange-100 max-w-3xl mx-auto leading-relaxed">
                            Find the best digital solutions for your needs, from unique designs, professional websites, to other creative needs.
                        </p>
                    </div>
                </section>

                {/* Content */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {/* Filters Bar */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6 shadow-sm mb-8">
                        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
                            {/* Search */}
                            <div className="relative flex-1 w-full lg:max-w-md">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search services..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition text-sm outline-none"
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                {/* Count */}
                                <p className="text-sm text-gray-500">
                                    <span className="font-medium text-gray-800">{filteredServices.length}</span> services
                                </p>

                                {/* Grid Toggle */}
                                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
                                    <span className="text-xs text-gray-500 px-2">Grid:</span>
                                    {[2, 3, 4].map(cols => (
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
                    </div>

                    {/* Grid */}
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="text-center">
                                <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary border-r-transparent"></div>
                                <p className="mt-4 text-gray-500">Loading services...</p>
                            </div>
                        </div>
                    ) : paginatedServices.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">No services found</h3>
                            <p className="text-gray-500">Try changing your search keywords</p>
                        </div>
                    ) : (
                        <div className={`grid ${gridColsClass} gap-8`}>
                            {paginatedServices.map((service) => (
                                <Link
                                    key={service.id}
                                    href={`/services/${service.slug}`}
                                    className="group flex flex-col bg-white border border-slate-200 rounded-3xl p-8 hover:shadow-xl hover:scale-105 transition duration-300"
                                >
                                    <div className="mb-6">
                                        {service.icon_url ? (
                                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center p-3 mb-4 group-hover:bg-primary/30 transition-colors duration-300">
                                                <img src={service.icon_url} alt={service.title} className="w-full h-full object-contain" />
                                            </div>
                                        ) : (
                                            <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mb-4 group-hover:bg-primary transition-colors duration-300">
                                                <svg className="w-8 h-8 text-primary group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                            </div>
                                        )}
                                        <h3 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-primary transition-colors">{service.title}</h3>
                                        <p className="text-slate-600 mb-4 line-clamp-3 leading-relaxed">
                                            {service.description}
                                        </p>
                                    </div>

                                    <div className="mt-auto">
                                        <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-slate-500 mb-1">Starting from</p>
                                                <p className="text-lg font-bold text-slate-800">
                                                    {service.price_range || 'Call for Price'}
                                                </p>
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

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

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-10 h-10 rounded-xl font-medium transition ${currentPage === page
                                        ? 'bg-primary text-white shadow-lg'
                                        : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {page}
                                </button>
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
