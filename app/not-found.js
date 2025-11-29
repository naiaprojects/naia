// app/not-found.js
import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-slate-900 mb-4">404 - Halaman Tidak Ditemukan</h1>
                <p className="text-slate-600 mb-8">Halaman yang Anda cari tidak ada atau telah dihapus.</p>
                <Link 
                    href="/" 
                    className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-secondary"
                >
                    Kembali ke Beranda
                </Link>
            </div>
        </div>
    );
}