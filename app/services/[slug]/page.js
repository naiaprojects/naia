import { createClient } from '@/lib/supabase-server';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CTA from '@/components/CTA';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function getService(slug) {
    const supabase = createClient();
    const { data: service, error } = await supabase
        .from('services')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error || !service) {
        return null;
    }
    return service;
}

async function getHeroContent() {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('hero_content')
        .select('background_image')
        .single();

    if (error) return null;
    return data;
}

const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(price).replace('IDR', 'IDR ');
};

export default async function ServicePage({ params }) {
    const service = await getService(params.slug);
    const heroContent = await getHeroContent();

    if (!service) {
        notFound();
    }

    // Parse packages from JSON (default to empty array if null)
    const packages = service.packages || [];
    const regularPackages = packages.filter(pkg => !pkg.is_special);
    const specialPackage = packages.find(pkg => pkg.is_special);

    // Determine if we need to show empty state
    const hasPackages = packages.length > 0;

    return (
        <main>
            <Navbar />

            {/* Service Hero Section */}
            <section
                id="hero-section"
                className="mx-4 rounded-b-3xl bg-primary pt-32 pb-20 relative overflow-hidden bg-center bg-cover shadow-2xl mb-12"
                style={heroContent?.background_image ? { backgroundImage: `url('${heroContent.background_image}')` } : {}}
            >
                {/* Overlay for better text readability */}
                <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>

                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight leading-tight text-white">
                        {service.title}
                    </h1>
                    <p className="text-lg md:text-xl text-orange-100 max-w-3xl mx-auto leading-relaxed">
                        {service.description}
                    </p>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="py-12 sm:py-20" id="price">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                    {/* Regular Packages */}
                    <div className="flex flex-col md:flex-row gap-8 justify-center flex-wrap">
                        {hasPackages ? (
                            regularPackages.map((pkg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex-1 min-w-[320px] max-w-[400px] flex flex-col border ${pkg.is_popular ? 'border-2 border-primary bg-white shadow-xl scale-105 z-10' : 'border-slate-100 bg-white shadow-lg'} rounded-3xl p-8 hover:shadow-2xl transition-all duration-300 relative group`}
                                >
                                    {pkg.is_popular && (
                                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-primary to-orange-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                                            MOST POPULAR
                                        </div>
                                    )}

                                    <div className="mb-6">
                                        <h3 className={`text-2xl font-bold mb-2 ${pkg.is_popular ? 'text-primary' : 'text-slate-800'}`}>
                                            {pkg.name}
                                        </h3>
                                        <p className="text-slate-500 text-sm h-10 line-clamp-2">
                                            {pkg.description}
                                        </p>
                                    </div>

                                    <div className="mb-8 p-6 bg-slate-50 rounded-2xl text-center">
                                        <span className="text-4xl font-bold text-slate-800 tracking-tight">
                                            {formatPrice(pkg.price)}
                                        </span>
                                    </div>

                                    <ul className="space-y-4 mb-8 flex-1">
                                        {(pkg.features || []).map((feature, fIdx) => (
                                            <li key={fIdx} className="flex items-start gap-3">
                                                <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                                                    <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                                <span className="text-sm font-medium text-slate-600 leading-relaxed">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <Link
                                        href={`/briefing?service=${service.slug}&package=${encodeURIComponent(pkg.name)}`}
                                        className={`w-full block text-center py-4 rounded-xl font-bold transition-all duration-300 transform active:scale-95 ${pkg.is_popular
                                            ? 'bg-primary text-white hover:bg-orange-600 shadow-lg hover:shadow-orange-500/30'
                                            : 'bg-slate-800 text-white hover:bg-slate-900 shadow-md'
                                            }`}
                                    >
                                        Order {pkg.name} Now!
                                    </Link>
                                </div>
                            ))
                        ) : (
                            !specialPackage && (
                                <div className="text-center py-20 px-6 bg-slate-50 rounded-3xl border border-dashed border-slate-300 w-full max-w-2xl mx-auto">
                                    <p className="text-slate-500 font-medium">Belum ada paket yang tersedia untuk layanan ini. Hubungi kami untuk penawaran khusus.</p>
                                    <Link href="/contact" className="mt-4 inline-block px-6 py-3 bg-white text-slate-800 rounded-xl font-bold shadow-sm hover:shadow-md transition">Hubungi Kami</Link>
                                </div>
                            )
                        )}
                    </div>

                    {/* Special Package */}
                    {specialPackage && (
                        <div className="mt-16">
                            <div className="relative flex flex-col lg:flex-row rounded-3xl overflow-hidden bg-white shadow-2xl border border-slate-100">

                                {/* Left Side: Info */}
                                <div className="lg:w-2/5 p-10 bg-slate-900 text-white flex flex-col justify-center relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                                    <div className="relative z-10">
                                        <span className="inline-block px-4 py-1.5 rounded-full bg-white/20 text-xs font-bold mb-6 backdrop-blur-sm border border-white/10">PREMIUM CHOICE</span>
                                        <h3 className="text-3xl font-bold mb-4">{specialPackage.name}</h3>
                                        <p className="text-slate-300 mb-8 leading-relaxed text-sm">{specialPackage.description}</p>
                                        <div className="text-5xl font-bold text-primary mb-8">{formatPrice(specialPackage.price)}</div>
                                        <Link
                                            href={`/briefing?service=${service.slug}&package=${encodeURIComponent(specialPackage.name)}`}
                                            className="w-full block text-center py-4 bg-primary text-slate-800 rounded-xl font-bold hover:bg-primary/80 transition shadow-lg shadow-orange-500/30"
                                        >
                                            Order Special Package Now!
                                        </Link>
                                    </div>
                                </div>

                                {/* Right Side: Features */}
                                <div className="lg:w-3/5 p-10 bg-white">
                                    <h4 className="font-bold text-xl text-slate-800 mb-8 flex items-center gap-3">
                                        <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                                        </span>
                                        What do you get?
                                    </h4>
                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                                        {(specialPackage.features || []).map((feature, fIdx) => (
                                            <li key={fIdx} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition border border-transparent hover:border-slate-100">
                                                <div className="min-w-6 min-h-6 rounded-full bg-green-100 flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                                <span className="font-medium text-slate-700 text-sm">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            <CTA />
            <Footer />
        </main>
    );
}
