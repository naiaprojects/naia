"use client";
import { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import { useLanguage } from '@/lib/LanguageContext';
import { createClient } from '@/lib/supabase-client';

import 'swiper/css';

const Testimoni = ({ data = [] }) => {
  const { t } = useLanguage();
  const supabase = createClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState(null);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const { data: dbTestimonials, error } = await supabase
          .from('testimonials')
          .select('*')
          .not('submitted_at', 'is', null)
          .eq('is_featured', true)
          .order('submitted_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        if (dbTestimonials && dbTestimonials.length > 0) {
          setTestimonials(dbTestimonials);
        } else if (data.length > 0) {
          setTestimonials(data);
        }
      } catch (error) {
        console.error('Error fetching testimonials:', error);
        if (data.length > 0) {
          setTestimonials(data);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, [data]);

  const openModal = (testimonial) => {
    setSelectedTestimonial(testimonial);
    setModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedTestimonial(null);
    document.body.style.overflow = 'auto';
  };

  const getAverageRating = (testimonial) => {
    if (!testimonial.rating_service) return 0;
    return Math.round(
      ((testimonial.rating_service + testimonial.rating_design + testimonial.rating_communication) / 3) * 10
    ) / 10;
  };

  if (loading) {
    return null;
  }

  if (testimonials.length === 0) {
    return null;
  }

  const isLegacyTestimonial = (item) => item.image && !item.review_text;

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

          <Swiper
            modules={[Autoplay]}
            spaceBetween={16}
            slidesPerView={1}
            loop={testimonials.length >= 3}
            loopAdditionalSlides={3}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
              pauseOnMouseEnter: false,
            }}
            speed={800}
            breakpoints={{
              640: {
                slidesPerView: 2,
                spaceBetween: 16,
              },
              768: {
                slidesPerView: 2,
                spaceBetween: 16,
              },
              1024: {
                slidesPerView: 3,
                spaceBetween: 16,
              },
            }}
            className="testimoni-swiper"
          >
            {testimonials.map((item, index) => (
              <SwiperSlide key={item.id}>
                {isLegacyTestimonial(item) ? (
                  <div
                    className="w-full cursor-pointer group"
                    data-index={index}
                    onClick={() => openModal(item)}
                  >
                    <img
                      src={item.image}
                      alt={item.alt}
                      className="w-full transition-transform duration-300 group-hover:scale-105 rounded-lg"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div
                    className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 cursor-pointer hover:shadow-md transition-shadow h-full"
                    onClick={() => openModal(item)}
                  >
                    <div className="flex items-center gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-5 h-5 ${star <= getAverageRating(item) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`}
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      ))}
                      <span className="ml-2 text-sm font-semibold text-slate-700">{getAverageRating(item)}</span>
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed mb-4 line-clamp-3">{item.review_text}</p>
                    <div className="border-t border-slate-100 pt-4">
                      <p className="font-semibold text-slate-800 text-sm">{item.customer_name}</p>
                      <p className="text-xs text-slate-500">{item.service_name || item.product_name}</p>
                    </div>
                  </div>
                )}
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {modalOpen && selectedTestimonial && (
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
          {isLegacyTestimonial(selectedTestimonial) ? (
            <img
              alt={selectedTestimonial.alt}
              className="max-w-full max-h-screen object-contain p-4"
              id="testimoniModalImage"
              src={selectedTestimonial.image}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div
              className="bg-white rounded-2xl p-8 max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-8 h-8 ${star <= getAverageRating(selectedTestimonial) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`}
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
                <span className="ml-2 text-xl font-semibold text-slate-700">{getAverageRating(selectedTestimonial)}</span>
              </div>
              <p className="text-slate-700 text-lg leading-relaxed mb-6">{selectedTestimonial.review_text}</p>
              <div className="space-y-3 border-t border-slate-200 pt-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Layanan</p>
                    <p className="font-bold text-slate-800">{selectedTestimonial.rating_service}/5</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Desain</p>
                    <p className="font-bold text-slate-800">{selectedTestimonial.rating_design}/5</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Komunikasi</p>
                    <p className="font-bold text-slate-800">{selectedTestimonial.rating_communication}/5</p>
                  </div>
                </div>
                <div className="border-t border-slate-200 pt-4">
                  <p className="font-semibold text-slate-800">{selectedTestimonial.customer_name}</p>
                  <p className="text-sm text-slate-500">{selectedTestimonial.service_name || selectedTestimonial.product_name}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Testimoni;
