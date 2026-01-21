'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import LogoPathAnimation from '@/components/LogoPathAnimation';

export default function AuthCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState('processing');
    const [message, setMessage] = useState('Memproses konfirmasi...');

    useEffect(() => {
        const handleCallback = async () => {
            const supabase = createClient();

            const token_hash = searchParams.get('token_hash');
            const type = searchParams.get('type');
            const next = searchParams.get('next') || '/dashboard/profile';

            if (token_hash && type) {
                try {
                    const { error } = await supabase.auth.verifyOtp({
                        token_hash,
                        type: type
                    });

                    if (error) {
                        console.error('Error verifying token:', error);
                        setStatus('error');
                        setMessage('Gagal memverifikasi link konfirmasi. Link mungkin sudah kadaluarsa.');
                        setTimeout(() => {
                            router.push('/dashboard/profile?error=verification_failed');
                        }, 2000);
                        return;
                    }

                    setStatus('success');
                    setMessage('Email berhasil diverifikasi! Mengalihkan...');

                    setTimeout(() => {
                        router.push(`${next}?success=email_verified`);
                        router.refresh();
                    }, 1500);

                } catch (error) {
                    console.error('Callback error:', error);
                    setStatus('error');
                    setMessage('Terjadi kesalahan saat memproses konfirmasi.');
                    setTimeout(() => {
                        router.push('/dashboard/profile?error=callback_error');
                    }, 2000);
                }
            } else {
                setStatus('error');
                setMessage('Link konfirmasi tidak valid.');
                setTimeout(() => {
                    router.push('/dashboard/profile');
                }, 2000);
            }
        };

        handleCallback();
    }, [searchParams, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center">
                <LogoPathAnimation />
                <div className="mt-8">
                    <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-xl ${status === 'success' ? 'bg-green-50 text-green-700' :
                            status === 'error' ? 'bg-red-50 text-red-700' :
                                'bg-slate-100 text-slate-700'
                        }`}>
                        {status === 'processing' && (
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {status === 'success' && (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                        {status === 'error' && (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                        <span className="font-medium">{message}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
