// components/Portfolio.js
'use client';
import { useState } from 'react';

export default function Portfolio({ data = [] }) {
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({ image: '', title: '', link: '' });
  const [showAll, setShowAll] = useState(false);

  // Tampilkan 3 pertama atau semua
  const displayedPortfolio = showAll ? data : data.slice(0, 3);

  const openModal = (item) => {
    setModalData(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <section className="py-8 sm:py-32" id="porto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="pb-6 sm:pb-16">
          <h1 className="max-w-2xl mx-auto text-center font-bold text-4xl text-slate-700 mb-5 md:text-6xl leading-[50px]">
            Our Portofolio
          </h1>
          <p className="sm:max-w-3xl sm:mx-auto text-center text-base font-normal leading-7 text-slate-700 mb-9">
            Take a look at our portfolio of websites that combine beautiful design with powerful functionality.
          </p>
        </div>

        <div className="flex flex-col md:grid md:grid-cols-3 gap-6">
          {displayedPortfolio.map((item, index) => (
            <div
              key={index}
              className="relative group rounded-2xl overflow-hidden hover:shadow-xl hover:scale-105 transition duration-300"
            >
              <img
                src={item.image}
                alt={item.alt}
                className="w-full transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
              />

              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
                {/* Top Right Eye Icon */}
                <button
                  onClick={() => openModal(item)}
                  className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-primary z-10 transition-colors"
                  title="Preview Image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                </button>

                {/* Center Link Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-primary hover:bg-orange-600 text-white px-8 py-3 rounded-full font-medium transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-lg z-10"
                  >
                    Visit Website
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {data.length > 3 && (
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
        )}

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