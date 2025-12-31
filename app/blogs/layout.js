import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function BlogLayout({ children }) {
    return (
        <>
            <Navbar />
            <main className="min-h-screen">
                {children}
            </main>
            <Footer />
        </>
    );
}
