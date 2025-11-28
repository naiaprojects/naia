// components/Testimoni.js
"use client";

import { useState } from 'react';

const Testimoni = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const testimoniImages = [
    {
      id: 1,
      src: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh2N63JmOoNIC3HpcsOhooNT0nhOG_AZfhs2RtALUyYooQbbd5l9OsnduahcxP8Ln-SyO9NBYCxe7puOAzJSXtFkVlI9ezVZFlmo0SikJfXfFAnhhaocVRYzIDJ_w0G5AmFsxD3LSPd1CI9krX2xwbr0K1lk_gZILJnm3DuISFkz3Xh24q2zvd4YQMvjdWE/s1080/Testimoni1-05.png",
      alt: "FakeTestimoni5"
    },
    {
      id: 2,
      src: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgEhh8ZCM0-QLgb-8F2Up55Q7X2Hi_0xobaPkMhj6PUTii8WdkQZ6wCba6_kt04jCpoFUkNmHZhsRhyphenhyphencXB_wIfWHzO4AQcGJnBdBxU7hsXNPS0jzzA6kZEqwQ3QjC8MVtZPFhpRTang4SSLfjAmzXFzBQcuUGQI_Y_3HiJGKlTs-pmzT0_kmF8YqLo8ZZCj/s1080/Testimoni1-04.png",
      alt: "FakeTestimoni4"
    },
    {
      id: 3,
      src: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhqt0BqrvXClxabHK8D0UTfIDiQ4nNue4mkJu-uzpR1AXL5Z_HzYtsM8wWVIhp0Cdjrcwx6ZaJR5xG7MLEEKDCvNzckCg7l-s9MRdKhWYAbWB01Nmc3QUPKWnOcHNYk7CG0ZowdOcSNOci-hMRzt6xL_YA917lXnjzMkAynfRv4MfnlQXaxnQX0Db45LW39/s1080/Testimoni1-03.png",
      alt: "FakeTestimoni3"
    },
    {
      id: 4,
      src: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh5xYU35TfNbx4u48pEmMb-UbklW_jWkK9KQ7tji7f2ot4s6ivzteeNeTF21M3USBsBrH74As2FhTY65he-TdpvXKHrTOML5za_YuH-4QgPAeCAJORLs05V3mmYzYOE0jQG81lDAnhhSkOAsnISUbT8HZK0U0K0vtYwSbaDA17CHsWtl8o9Fqb6for9CDVY/s1080/Testimoni1-02.png",
      alt: "FakeTestimoni2"
    },
    {
      id: 5,
      src: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhwAFn4sv6Pf6L6Me5KSudjcBXK1HPxwPc1rLZu1gUk3iXhlO-3FJgkaxCdc9X2CU0Z2XvlR7bdNIczgtMcNCgeV2FJkSTIq3HscwhAudlLKYO8CV_iRwqTK3LRaCsYVUROf56WNFjuHtgcGPKNlXNk8d5GYUO8mLnLPmBi-y9giIrxwAs2iHF1YNpP8Lka/s1080/Testimoni1-01.png",
      alt: "FakeTestimoni1"
    }
  ];

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
                  src={image.src} 
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
            src={selectedImage?.src}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image
          />
        </div>
      )}
    </>
  );
};

export default Testimoni;