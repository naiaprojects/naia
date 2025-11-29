// components/CTA.js
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const CTA = () => {
  const router = useRouter();
  const [ctaData, setCtaData] = useState({
    cta_title: 'Saatnya Punya Website yang Berkelas',
    cta_subtitle: 'Meski pakai Blogspot, websitemu bisa tampil profesional, ringan, dan SEO-friendly.',
    cta_background_image: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiQURFZv63UernQRlg8fAFzNp6fn7ugpbKDDhbothv6W-s6p8-CRV3YakUJkwfi07mfDcVJxTwYgf_5O88U5YByKEx1W-tE5z8Kkk8V5ExtcGbWgn0hFU6FTp5Eg1lFstjPp8aX33MgPs6XJd3TcysXZ5UIuLy2VtNq6aPAWakWe2BFcEL7Je0GkGI_744/s3000/19381187_6125995.webp',
    cta_button_text: 'Hubungi Kami Sekarang!',
    cta_button_portfolio_text: 'Lihat Portofolio',
    whatsapp_number: '6281320858595',
    whatsapp_message: 'Halo Naia.web.id! Saya tertarik dengan layanan pembuatan website custom Blogspot Anda. Bisa dibantu?'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCTAData();
  }, []);

  const fetchCTAData = async () => {
    try {
      const response = await fetch('/api/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      setCtaData(prev => ({ ...prev, ...data }));
    } catch (error) {
      console.error('Error fetching CTA data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppClick = () => {
    const message = ctaData.whatsapp_message || 'Halo!';
    window.open(`https://wa.me/${ctaData.whatsapp_number}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handlePortfolioClick = () => {
    router.push('#porto');
  };

  if (loading) {
    return null;
  }

  return (
    <section
      className="pt-32 pb-12 bg-white relative overflow-hidden bg-no-repeat bg-cover bg-top"
      style={{ backgroundImage: `url('${ctaData.cta_background_image}')` }}
    >
      <svg className="transform absolute top-0 fill-white h-[90px] w-full" preserveAspectRatio="none" viewBox="0 0 1000 37" xmlns="http://www.w3.org/2000/svg">
        <g fill="#fff">
          <path d="M0 0h1000v1.48H0z"></path>
          <path d="M0 0h1000v29.896S550 37 500 37 0 29.896 0 29.896V0Z" opacity=".2"></path>
          <path d="M0 0h1000v22.792S600 37 500 37 0 22.792 0 22.792V0Z" opacity=".3"></path>
          <path d="M0 0h1000v15.688S650 37 500 37 0 15.688 0 15.688V0Z" opacity=".4"></path>
          <path d="M0 0h1000v8.584S700 37 500 37 0 8.584 0 8.584V0Z" opacity=".5"></path>
          <path d="M0 0v1.48s250 35.52 500 35.52 500-35.52 500-35.52V0H0Z"></path>
        </g>
      </svg>
      <div className="max-w-6xl mx-auto text-center relative">
        <h2 className="text-white font-bold text-xl md:px-0 px-10 md:text-3xl">
          {ctaData.cta_title}
        </h2>
        <p className="mx-4 text-lg font-semibold text-white mt-4">
          {ctaData.cta_subtitle}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <button
            onClick={handleWhatsAppClick}
            className="inline-flex justify-center items-center px-8 py-5 text-xl font-bold text-slate-700 bg-white md:rounded-full hover:bg-gray-100 transition-colors duration-300 shadow-lg"
          >
            <span>{ctaData.cta_button_text}</span>
          </button>
          <button
            onClick={handlePortfolioClick}
            className="inline-flex justify-center items-center px-8 py-5 text-xl font-bold text-slate-700 bg-white md:rounded-full hover:bg-gray-100 transition-colors duration-300 shadow-lg"
          >
            <span>{ctaData.cta_button_portfolio_text}</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default CTA;