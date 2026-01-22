'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import LogoPathAnimation from '@/components/LogoPathAnimation';
import PageEditor from '@/components/PageEditor';

export default function EditPagePage() {
    const supabase = createClient();
    const params = useParams();
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(null);

    useEffect(() => {
        fetchPage();
    }, [params.id]);

    const fetchPage = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('pages')
                .select('*')
                .eq('id', params.id)
                .single();

            if (error) throw error;
            setPage(data);
        } catch (error) {
            console.error('Error fetching page:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex justify-center items-center bg-white">
                <LogoPathAnimation />
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <Link
                        href="/dashboard/pages"
                        className="inline-flex items-center gap-2 text-primary hover:underline mb-4"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Kembali ke Pages
                    </Link>
                    <h1 className="text-3xl font-bold text-slate-900">
                        Edit Halaman
                    </h1>
                    <p className="text-slate-600 mt-1">
                        Perbarui halaman Anda
                    </p>
                </div>

                <PageEditor page={page} />
            </div>
        </div>
    );
}
