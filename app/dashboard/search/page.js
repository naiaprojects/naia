'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useSearchParams, useRouter } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';
import LogoPathAnimation from '@/components/LogoPathAnimation';
import Link from 'next/link';

export default function SearchPage() {
    const supabase = createClient();
    const searchParams = useSearchParams();
    const router = useRouter();
    const query = searchParams.get('q') || '';

    const [searchQuery, setSearchQuery] = useState(query);
    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState({
        orders: [],
        portfolio: [],
        services: [],
        testimonials: [],
        pages: [],
        faq: []
    });

    useEffect(() => {
        if (query) {
            performSearch(query);
        } else {
            setLoading(false);
        }
    }, [query]);

    const performSearch = async (searchTerm) => {
        if (!searchTerm.trim()) {
            setResults({ orders: [], portfolio: [], services: [], testimonials: [], pages: [], faq: [] });
            setLoading(false);
            return;
        }

        setLoading(true);
        const term = `%${searchTerm.toLowerCase()}%`;

        try {
            const [ordersRes, portfolioRes, servicesRes, testimonialRes, pagesRes, faqRes] = await Promise.all([
                supabase.from('orders').select('id, invoice_number, customer_name, customer_email, payment_status').ilike('customer_name', term).limit(5),
                supabase.from('portfolio_items').select('id, title, description').or(`title.ilike.${term},description.ilike.${term}`).limit(5),
                supabase.from('services').select('id, title, slug').ilike('title', term).limit(5),
                supabase.from('testimoni_items').select('id, alt').ilike('alt', term).limit(5),
                supabase.from('pages').select('id, title, slug').or(`title.ilike.${term},slug.ilike.${term}`).limit(5),
                supabase.from('faq_items').select('id, question, answer').or(`question.ilike.${term},answer.ilike.${term}`).limit(5),
            ]);

            setResults({
                orders: ordersRes.data || [],
                portfolio: portfolioRes.data || [],
                services: servicesRes.data || [],
                testimonials: testimonialRes.data || [],
                pages: pagesRes.data || [],
                faq: faqRes.data || [],
            });
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const totalResults = useMemo(() => {
        return Object.values(results).reduce((acc, arr) => acc + arr.length, 0);
    }, [results]);

    const ResultSection = ({ title, items, href, renderItem }) => {
        if (items.length === 0) return null;
        return (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-700">{title}</h3>
                    <span className="text-xs font-medium text-slate-400">{items.length} found</span>
                </div>
                <div className="divide-y divide-slate-100">
                    {items.map((item) => renderItem(item))}
                </div>
            </div>
        );
    };

    if (loading && query) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <LogoPathAnimation />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <Breadcrumb />
                <h1 className="text-2xl font-bold text-slate-800 mt-2">Search</h1>
                <p className="text-slate-500 text-sm mt-1">Search across all admin data</p>
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearch} className="relative max-w-2xl">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search orders, portfolio, services, pages, FAQ..."
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 shadow-sm"
                    autoFocus
                />
            </form>

            {/* Results */}
            {query && (
                <div className="space-y-4">
                    <p className="text-sm text-slate-500">
                        {totalResults > 0
                            ? `Found ${totalResults} results for "${query}"`
                            : `No results found for "${query}"`
                        }
                    </p>

                    <div className="grid gap-4">
                        <ResultSection
                            title="Orders"
                            items={results.orders}
                            renderItem={(item) => (
                                <Link
                                    key={item.id}
                                    href={`/dashboard/invoices`}
                                    className="block p-4 hover:bg-slate-50 transition-colors"
                                >
                                    <p className="font-medium text-slate-800">{item.invoice_number}</p>
                                    <p className="text-sm text-slate-500">{item.customer_name} • {item.customer_email}</p>
                                </Link>
                            )}
                        />

                        <ResultSection
                            title="Portfolio"
                            items={results.portfolio}
                            renderItem={(item) => (
                                <Link
                                    key={item.id}
                                    href={`/dashboard/portfolio`}
                                    className="block p-4 hover:bg-slate-50 transition-colors"
                                >
                                    <p className="font-medium text-slate-800">{item.title}</p>
                                    <p className="text-sm text-slate-500 line-clamp-1">{item.description}</p>
                                </Link>
                            )}
                        />

                        <ResultSection
                            title="Services"
                            items={results.services}
                            renderItem={(item) => (
                                <Link
                                    key={item.id}
                                    href={`/dashboard/services`}
                                    className="block p-4 hover:bg-slate-50 transition-colors"
                                >
                                    <p className="font-medium text-slate-800">{item.title}</p>
                                    <p className="text-sm text-slate-500 font-mono">/{item.slug}</p>
                                </Link>
                            )}
                        />

                        <ResultSection
                            title="Pages"
                            items={results.pages}
                            renderItem={(item) => (
                                <Link
                                    key={item.id}
                                    href={`/dashboard/pages`}
                                    className="block p-4 hover:bg-slate-50 transition-colors"
                                >
                                    <p className="font-medium text-slate-800">{item.title}</p>
                                    <p className="text-sm text-slate-500 font-mono">/pages/{item.slug}</p>
                                </Link>
                            )}
                        />

                        <ResultSection
                            title="FAQ"
                            items={results.faq}
                            renderItem={(item) => (
                                <Link
                                    key={item.id}
                                    href={`/dashboard/faq`}
                                    className="block p-4 hover:bg-slate-50 transition-colors"
                                >
                                    <p className="font-medium text-slate-800">{item.question}</p>
                                    <p className="text-sm text-slate-500 line-clamp-1">{item.answer}</p>
                                </Link>
                            )}
                        />

                        <ResultSection
                            title="Testimonials"
                            items={results.testimonials}
                            renderItem={(item) => (
                                <Link
                                    key={item.id}
                                    href={`/dashboard/testimoni`}
                                    className="block p-4 hover:bg-slate-50 transition-colors"
                                >
                                    <p className="font-medium text-slate-800">Testimonial</p>
                                    <p className="text-sm text-slate-500">{item.alt}</p>
                                </Link>
                            )}
                        />
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!query && (
                <div className="py-16 text-center">
                    <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <h3 className="text-lg font-medium text-slate-600 mb-1">Start searching</h3>
                    <p className="text-slate-400">Type in the search box above to find orders, portfolio items, services, and more.</p>
                </div>
            )}
        </div>
    );
}
