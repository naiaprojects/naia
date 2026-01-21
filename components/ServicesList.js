'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';

const ServicesList = ({ data = [] }) => {
    const { t, language } = useLanguage();

    const getNoServicesText = () => {
        return language === 'id' ? 'Belum ada layanan yang tersedia.' : 'No services available yet.';
    };

    return (
        <section className="py-8 sm:py-32" id="price">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="py-6">
                    <div className="flex flex-col mb-10 text-center">
                        <h2 className="font-manrope font-bold text-4xl text-slate-700 md:text-6xl leading-[50px]">{t('services.title')}</h2>
                        <p className="mt-4 text-base font-normal leading-7 text-slate-700 mb-9 max-w-2xl mx-auto">
                            {t('services.subtitle')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {data.map((service) => {
                            const serviceTitle = language === 'id'
                                ? (service.title_id || service.title || service.title_en)
                                : (service.title_en || service.title || service.title_id);
                            const serviceDescription = language === 'id'
                                ? (service.description_id || service.description || service.description_en)
                                : (service.description_en || service.description || service.description_id);

                            return (
                                <Link
                                    key={service.id}
                                    href={`/services/${service.slug}`}
                                    className="group flex flex-col bg-white border border-slate-200 rounded-3xl p-8 hover:shadow-xl hover:scale-105 transition duration-300"
                                >
                                    <div className="mb-6">
                                        {service.icon_url ? (
                                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center p-3 mb-4 group-hover:bg-primary/30 transition-colors duration-300">
                                                <img src={service.icon_url} alt={serviceTitle} className="w-full h-full object-contain" />
                                            </div>
                                        ) : (
                                            <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mb-4 group-hover:bg-primary transition-colors duration-300">
                                                <svg className="w-8 h-8 text-primary group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                            </div>
                                        )}
                                        <h3 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-primary transition-colors">{serviceTitle}</h3>
                                        <p className="text-slate-600 mb-4 line-clamp-3 leading-relaxed">
                                            {serviceDescription}
                                        </p>
                                    </div>

                                    <div className="mt-auto">
                                        <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-slate-500 mb-1">{t('services.startingFrom')}</p>
                                                <p className="text-lg font-bold text-slate-800">{service.price_range || (language === 'id' ? 'Hubungi Kami' : 'Call for Price')}</p>
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>

                    {data.length === 0 && (
                        <div className="text-center py-12 bg-slate-50 rounded-lg">
                            <p className="text-slate-500">{getNoServicesText()}</p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default ServicesList;
