// components/CTA.js
"use client";

import { useRouter } from 'next/navigation';

const CTA = () => {
  const router = useRouter();

  const handleWhatsAppClick = () => {
    const phoneNumber = '6281320858595';
    const message = 'Halo Naia.web.id! Saya tertarik dengan layanan pembuatan website custom Blogspot Anda. Bisa dibantu?';
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handlePortfolioClick = () => {
    router.push('#porto');
  };

  return (
    <section className="pt-32 pb-12 bg-white relative overflow-hidden bg-[url('https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiQURFZv63UernQRlg8fAFzNp6fn7ugpbKDDhbothv6W-s6p8-CRV3YakUJkwfi07mfDcVJxTwYgf_5O88U5YByKEx1W-tE5z8Kkk8V5ExtcGbWgn0hFU6FTp5Eg1lFstjPp8aX33MgPs6XJd3TcysXZ5UIuLy2VtNq6aPAWakWe2BFcEL7Je0GkGI_744/s3000/19381187_6125995.webp')] bg-no-repeat bg-cover bg-top">
      <svg className="transform absolute top-0 fill-white h-[90px] w-full" preserveAspectRatio="none" viewBox="0 0 1000 37" xmlns="http://www.w3.org/2000/svg">
        <g fill="curentColor">
          <path d="M0 0h1000v1.48H0z"></path>
          <path d="M0 0h1000v29.896S550 37 500 37 0 29.896 0 29.896V0Z" opacity=".2"></path>
          <path d="M0 0h1000v22.792S600 37 500 37 0 22.792 0 22.792V0Z" opacity=".3"></path>
          <path d="M0 0h1000v15.688S650 37 500 37 0 15.688 0 15.688V0Z" opacity=".4"></path>
          <path d="M0 0h1000v8.584S700 37 500 37 0 8.584 0 8.584V0Z" opacity=".5"></path>
          <path d="M0 0v1.48s250 35.52 500 35.52 500-35.52 500-35.52V0H0Z"></path>
        </g>
      </svg>
      <div className="max-w-6xl mx-auto text-center tails-relative">
        <div className="section" id="ctaSection" name="CTA Section">
          <div className="widget Text" data-version="1" id="Text28">
            <div className="widget-content">
              <h2 className="text-white font-bold text-xl md:px-0 px-10 md:text-3xl">
                Saatnya Punya Website yang Berkelas
              </h2>
            </div>
          </div>
          <div className="widget Text" data-version="1" id="Text29">
            <div className="widget-content">
              <p className="mx-4 text-lg font-semibold text-slate-800">
                Meski pakai Blogspot, websitemu bisa tampil profesional, ringan, dan SEO-friendly.
              </p>
            </div>
          </div>
          <div className="widget LinkList" data-version="2" id="LinkList2">
            <button
              onClick={handleWhatsAppClick}
              className="inline-flex mt-8 justify-center md:mt-6 items-center w-full px-8 py-5 md:mb-6 text-xl font-bold text-primary bg-white sm:mb-0 md:w-auto md:rounded-full hover:bg-gray-100 transition-colors duration-300 shadow-lg"
            >
              <span>Hubungi Kami Sekarang!</span>
            </button>
            <button
              onClick={handlePortfolioClick}
              className="inline-flex mt-8 justify-center md:mt-6 items-center w-full px-8 py-5 md:mb-6 text-xl font-bold text-primary bg-white sm:mb-0 md:w-auto md:rounded-full hover:bg-gray-100 transition-colors duration-300 shadow-lg"
            >
              <span>Lihat Portofolio</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;