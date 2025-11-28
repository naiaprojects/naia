// components/FAQ.js
"use client";

import { useState } from 'react';

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const faqData = [
    {
      question: "Apa itu Naia.web.id dan layanan utamanya?",
      answer: "Naia.web.id adalah jasa profesional yang berfokus pada pembuatan website custom menggunakan platform Blogspot (Blogger). Kami tidak menggunakan template siap pakai, melainkan mendesain tampilan dan fitur website dari nol sesuai dengan kebutuhan, identitas merek, dan tujuan bisnis Anda."
    },
    {
      question: "Apa bedanya website custom dari Naia.web.id dengan template gratisan?",
      answer: "Website custom kami memiliki keunggulan signifikan dibandingkan template gratisan. Pertama, desain yang kami buat bersifat unik dan eksklusif untuk Anda, sehingga tidak akan sama dengan website lain. Selain itu, website Anda bebas dari kredit link atau atribut wajib dari pembuat template. Kami juga bisa menambahkan fitur khusus sesuai keinginan Anda yang mungkin tidak ada di template umum, seperti formulir pemesanan atau tombol WhatsApp terintegrasi. Terakhir, kode kami dibuat lebih rapi dan ringan, sehingga website memiliki performa lebih cepat dan lebih baik untuk SEO."
    },
    {
      question: "Berapa lama proses pengerjaan website hingga selesai?",
      answer: "Untuk sebuah website custom Blogspot standar, waktu pengerjaan biasanya memakan waktu 7-14 hari kerja, tergantung pada antrian dan kecepatan respon Anda saat proses revisi. Proyek dengan fitur yang sangat kompleks mungkin memerlukan waktu lebih lama."
    },
    {
      question: "Mengapa harus menggunakan platform Blogspot, bukan WordPress?",
      answer: "Blogspot adalah pilihan ideal untuk Anda yang menginginkan website dengan biaya minimalis namun profesional. Platform ini tidak memerlukan biaya hosting bulanan atau tahunan karena sudah disediakan gratis oleh Google. Selain itu, Blogspot sangat mudah dikelola dan user-friendly, cocok untuk pemula, serta terintegrasi sempurna dengan ekosistem Google seperti Analytics, AdSense, dan Search Console. Keamanannya juga sangat terjamin karena dikelola langsung oleh Google."
    },
    {
      question: "Apakah biaya sudah termasuk domain dan hosting?",
      answer: "Tentu saja! Anda akan mendapatkan akses admin penuh ke dashboard Blogspot Anda. Kami juga akan memberikan tutorial singkat cara mengganti teks, menambah postingan, atau mengunggah gambar, sehingga Anda bisa mengelola konten website dengan mudah tanpa perlu keahlian coding."
    }
  ];

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section className="text-slate-600 py-12 max-w-7xl mx-auto">
      <div className="container flex flex-col justify-center p-4 mx-auto md:p-8">
        <div className="faqSection section" id="faqSection" name="Faq Section">
          <div className="widget Text" data-version="1" id="Text26">
            <div className="widget-content">
              <h1 className="max-w-2xl mx-auto text-center font-manrope font-bold text-4xl text-primarys mb-5 md:text-6xl leading-[50px]">
                Pertanyaan Umum
              </h1>
            </div>
          </div>
          <div className="widget Text" data-version="1" id="Text27">
            <div className="widget-content">
              <p className="sm:max-w-2xl sm:mx-auto text-center text-base font-normal leading-7 text-gray-500 mb-9">
                Punya pertanyaan? Cek di sini dulu! Mungkin jawabannya sudah ada!
              </p>
            </div>
          </div>
        </div>
        <div className="sm:mt-12 flex flex-col divide-y px-6 divide-slate-100 font-bold">
          {faqData.map((item, index) => (
            <div key={index} className="faq-item">
              <button
                className="py-4 outline-none cursor-pointer focus:text-primary w-full text-left flex justify-between items-center"
                onClick={() => toggleAccordion(index)}
              >
                <span>{item.question}</span>
                <svg
                  className={`w-5 h-5 transition-transform duration-300 ${activeIndex === index ? 'transform rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${activeIndex === index ? 'max-h-96' : 'max-h-0'}`}
              >
                <div className="px-4 pb-4 font-medium">
                  <p>{item.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;