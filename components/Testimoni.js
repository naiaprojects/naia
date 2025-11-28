"use client";
import { useState, useEffect } from 'react';

const Testimoni = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [testimoniImages, setTestimoniImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Gunakan useEffect untuk mengambil data saat komponen dimuat
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/testimoni');
        if (!response.ok) {
          throw new Error('Failed to fetch testimoni data');
        }
        const data = await response.json();
        setTestimoniImages(data);
      } catch (error) {
        console.error(error);
        // Opsional: Set data kosong jika terjadi error
        setTestimoniImages([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []); // Array kosong berarti efek ini hanya berjalan sekali saat mount

  const openModal = (image) => {
    setSelectedImage(image);
    setModalOpen(true);
    document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedImage(null);
    document.body.style.overflow = 'auto'; // Enable scrolling when modal is closed
  };

  // Tampilkan loading jika data belum siap
  if (isLoading) {
    return (
      <section className="py-6 sm:py-12" id="testimoni">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <p>Memuat testimoni...</p>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="py-6 sm:py-12" id="testimoni">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="pb-4">
            <div className="testimoniSection mr-4 section" id="testimoniSection" name="Testimoni Section">
              <div className="widget Text" data-version="1" id="Text24">
                <div className="widget-content">
                  <h1 className="max-w-2xl mx-auto text-center font-manrope font-bold text-4xl text-primarys mb-5 md:text-6xl leading-[50px]">
                    Testimoni
                  </h1>
                </div>
              </div>
              <div className="widget Text" data-version="1" id="Text25">
                <div className="widget-content">
                  <p className="sm:max-w-2xl sm:mx-auto text-center text-base font-normal leading-7 text-gray-500 mb-9">
                    Kepuasan pelanggan adalah prioritas kami, lihat apa kata mereka!
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4" id="testimoni-gallery">
            {testimoniImages.map((image, index) => (
              <div 
                key={image.id} 
                className="w-full cursor-pointer group" 
                data-index={index}
                onClick={() => openModal(image)}
              >
                <img 
                  src={image.image} 
                  alt={image.alt} 
                  className="w-full transition-transform duration-300 group-hover:scale-105 rounded-lg" 
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modal */}
      {modalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center" 
          id="testimoniModal"
          onClick={closeModal}
        >
          <div 
            className="absolute top-5 right-5 w-10 h-10 cursor-pointer hover:opacity-75 transition-opacity" 
            onClick={closeModal}
          >
            <div className="absolute top-1/2 left-1/2 w-8 h-0.5 bg-white transform -translate-x-1/2 -translate-y-1/2 rotate-45"></div>
            <div className="absolute top-1/2 left-1/2 w-8 h-0.5 bg-white transform -translate-x-1/2 -translate-y-1/2 -rotate-45"></div>
          </div>
          <img 
            alt={selectedImage?.alt} 
            className="max-w-full max-h-screen object-contain p-4" 
            id="testimoniModalImage" 
            src={selectedImage?.image}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image
          />
        </div>
      )}
    </>
  );
};

export default Testimoni;