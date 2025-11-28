'use client';
import { useState } from 'react';

export default function Portfolio() {
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({ image: '', title: '', link: '' });
  const [showAll, setShowAll] = useState(false);

  // Data portfolio lengkap - tambahkan sebanyak yang Anda mau
  const allPortfolio = [
    {
      image: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgouYHCex2psiuMwwKoMjuJD83-bKymTyxoYwspg1fTrB9ad5FEcLcOyAbuJ28yHuvKFbfZN9vOv4QNcl9OovQP5Q9TLMhMfryurclVLLgpyNDrpjSDpohp_jzdyxCx7YseJlTSLIj6lqqnJNSUP-39i0lznMc_VkAURaqfBxtD-jSNjmrZaDvYMfR9Ldo/s1080/2025-04.png',
      alt: 'KangLogo.com',
      title: 'KangLogo.com',
      link: '#'
    },
    {
      image: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgouYHCex2psiuMwwKoMjuJD83-bKymTyxoYwspg1fTrB9ad5FEcLcOyAbuJ28yHuvKFbfZN9vOv4QNcl9OovQP5Q9TLMhMfryurclVLLgpyNDrpjSDpohp_jzdyxCx7YseJlTSLIj6lqqnJNSUP-39i0lznMc_VkAURaqfBxtD-jSNjmrZaDvYMfR9Ldo/s1080/2025-04.png',
      alt: 'Project 2',
      title: 'E-Commerce Website',
      link: '#'
    },
    {
      image: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgouYHCex2psiuMwwKoMjuJD83-bKymTyxoYwspg1fTrB9ad5FEcLcOyAbuJ28yHuvKFbfZN9vOv4QNcl9OovQP5Q9TLMhMfryurclVLLgpyNDrpjSDpohp_jzdyxCx7YseJlTSLIj6lqqnJNSUP-39i0lznMc_VkAURaqfBxtD-jSNjmrZaDvYMfR9Ldo/s1080/2025-04.png',
      alt: 'Project 3',
      title: 'Company Profile',
      link: '#'
    },
    {
      image: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgouYHCex2psiuMwwKoMjuJD83-bKymTyxoYwspg1fTrB9ad5FEcLcOyAbuJ28yHuvKFbfZN9vOv4QNcl9OovQP5Q9TLMhMfryurclVLLgpyNDrpjSDpohp_jzdyxCx7YseJlTSLIj6lqqnJNSUP-39i0lznMc_VkAURaqfBxtD-jSNjmrZaDvYMfR9Ldo/s1080/2025-04.png',
      alt: 'Project 4',
      title: 'Landing Page',
      link: '#'
    },
    {
      image: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgouYHCex2psiuMwwKoMjuJD83-bKymTyxoYwspg1fTrB9ad5FEcLcOyAbuJ28yHuvKFbfZN9vOv4QNcl9OovQP5Q9TLMhMfryurclVLLgpyNDrpjSDpohp_jzdyxCx7YseJlTSLIj6lqqnJNSUP-39i0lznMc_VkAURaqfBxtD-jSNjmrZaDvYMfR9Ldo/s1080/2025-04.png',
      alt: 'Project 5',
      title: 'Blog Design',
      link: '#'
    },
    {
      image: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgouYHCex2psiuMwwKoMjuJD83-bKymTyxoYwspg1fTrB9ad5FEcLcOyAbuJ28yHuvKFbfZN9vOv4QNcl9OovQP5Q9TLMhMfryurclVLLgpyNDrpjSDpohp_jzdyxCx7YseJlTSLIj6lqqnJNSUP-39i0lznMc_VkAURaqfBxtD-jSNjmrZaDvYMfR9Ldo/s1080/2025-04.png',
      alt: 'Project 6',
      title: 'Portfolio Website',
      link: '#'
    },
    {
      image: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgouYHCex2psiuMwwKoMjuJD83-bKymTyxoYwspg1fTrB9ad5FEcLcOyAbuJ28yHuvKFbfZN9vOv4QNcl9OovQP5Q9TLMhMfryurclVLLgpyNDrpjSDpohp_jzdyxCx7YseJlTSLIj6lqqnJNSUP-39i0lznMc_VkAURaqfBxtD-jSNjmrZaDvYMfR9Ldo/s1080/2025-04.png',
      alt: 'Project 7',
      title: 'Online Store',
      link: '#'
    },
    {
      image: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgouYHCex2psiuMwwKoMjuJD83-bKymTyxoYwspg1fTrB9ad5FEcLcOyAbuJ28yHuvKFbfZN9vOv4QNcl9OovQP5Q9TLMhMfryurclVLLgpyNDrpjSDpohp_jzdyxCx7YseJlTSLIj6lqqnJNSUP-39i0lznMc_VkAURaqfBxtD-jSNjmrZaDvYMfR9Ldo/s1080/2025-04.png',
      alt: 'Project 8',
      title: 'Restaurant Website',
      link: '#'
    },
    {
      image: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgouYHCex2psiuMwwKoMjuJD83-bKymTyxoYwspg1fTrB9ad5FEcLcOyAbuJ28yHuvKFbfZN9vOv4QNcl9OovQP5Q9TLMhMfryurclVLLgpyNDrpjSDpohp_jzdyxCx7YseJlTSLIj6lqqnJNSUP-39i0lznMc_VkAURaqfBxtD-jSNjmrZaDvYMfR9Ldo/s1080/2025-04.png',
      alt: 'Project 9',
      title: 'Agency Website',
      link: '#'
    }
  ];

  // Tampilkan 3 pertama atau semua
  const displayedPortfolio = showAll ? allPortfolio : allPortfolio.slice(0, 3);

  const openModal = (item) => {
    setModalData(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <section className="py-8 sm:py-12" id="porto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="pb-6 sm:pb-16">
          <h1 className="max-w-2xl mx-auto text-center font-bold text-4xl text-primary mb-5 md:text-6xl leading-[50px]">
            Portofolio
          </h1>
          <p className="sm:max-w-2xl sm:mx-auto text-center text-base font-normal leading-7 text-gray-500 mb-9">
            Dari UMKM hingga korporasi besar, mereka telah mempercayakan desainnya kepada kami.
          </p>
        </div>

        <div className="flex flex-col md:grid md:grid-cols-3 gap-6">
          {displayedPortfolio.map((item, index) => (
            <div
              key={index}
              className="relative rounded-2xl overflow-hidden hover:shadow-xl hover:scale-105 transition duration-300 cursor-pointer"
              onClick={() => openModal(item)}
            >
              <img
                src={item.image}
                alt={item.alt}
                className="w-full transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
              />
              <p className="cursor-pointer absolute inset-0 flex items-center justify-center text-2xl text-center transition">
                <span className="text-base absolute bottom-8 bg-primary text-white px-8 py-2 rounded-full font-medium">
                  {item.title}
                </span>
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16">
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setShowAll(!showAll)}
              className="inline-block rounded-full px-6 py-3 text-md text-white transition bg-gradient-to-r from-primary to-orange-600 hover:from-orange-700 hover:to-red-700"
            >
              {showAll ? 'Tampilkan Lebih Sedikit' : 'Semua Portofolio'}
            </button>
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center">
            <div className="absolute top-5 right-5 w-10 h-10 cursor-pointer hover:opacity-75 transition-opacity" onClick={closeModal}>
              <div className="absolute top-1/2 left-1/2 w-8 h-0.5 bg-white transform -translate-x-1/2 -translate-y-1/2 rotate-45"></div>
              <div className="absolute top-1/2 left-1/2 w-8 h-0.5 bg-white transform -translate-x-1/2 -translate-y-1/2 -rotate-45"></div>
            </div>
            <div className="max-w-full max-h-screen object-contain p-4 flex flex-col items-center">
              <img alt="Preview" className="max-w-full max-h-screen object-contain" src={modalData.image} />
              <a className="mt-4 text-lg bg-primary text-white px-8 py-3 rounded-full font-medium" href={modalData.link} target="_blank" rel="noopener noreferrer">
                {modalData.title}
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}