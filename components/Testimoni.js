"use client";
import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import { useLanguage } from '@/lib/LanguageContext';

// Import Swiper styles
import 'swiper/css';

const Testimoni = ({ data = [] }) => {
  const { t } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const openModal = (image) => {
    setSelectedImage(image);
    setModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedImage(null);
    document.body.style.overflow = 'auto';
  };

  return (
    <>
      <section className="py-6 sm:py-12" id="testimoni">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="pb-4">
            <div className="testimoniSection mr-4 section" id="testimoniSection" name="Testimoni Section">
              <div className="widget Text" data-version="1" id="Text24">
                <div className="widget-content">
                  <h1 className="max-w-2xl mx-auto text-center font-manrope font-bold text-4xl text-slate-700 mb-5 md:text-6xl leading-[50px]">
                    {t('testimonials.title')}
                  </h1>
                </div>
              </div>
              <div className="widget Text" data-version="1" id="Text25">
                <div className="widget-content">
                  <p className="sm:max-w-2xl sm:mx-auto text-center text-base font-normal leading-7 text-slate-700 mb-9">
                    {t('testimonials.subtitle')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Swiper Slider */}
          {data.length > 0 && (
            <Swiper
              modules={[Autoplay]}
              spaceBetween={16}
              slidesPerView={2}
              loop={data.length >= 5}
              loopAdditionalSlides={3}
              autoplay={{
                delay: 3000,
                disableOnInteraction: false,
                pauseOnMouseEnter: false,
              }}
              speed={800}
              breakpoints={{
                640: {
                  slidesPerView: 3,
                  spaceBetween: 16,
                },
                768: {
                  slidesPerView: 4,
                  spaceBetween: 16,
                },
                1024: {
                  slidesPerView: 5,
                  spaceBetween: 16,
                },
              }}
              className="testimoni-swiper"
            >
              {data.map((image, index) => (
                <SwiperSlide key={image.id}>
                  <div
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
                </SwiperSlide>
              ))}
            </Swiper>
          )}
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
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

export default Testimoni;