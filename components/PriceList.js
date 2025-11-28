// components/PriceList.js
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PriceList = () => {
  const router = useRouter();
  const [selectedPackage, setSelectedPackage] = useState(null);

  const packages = [
    {
      id: 'blog-portfolio',
      name: 'Blog / Portofolio',
      description: 'Layanan web custom blog pribadi & portofolio.',
      price: 275000,
      features: [
        'Fitur Umum Blogspot',
        'Desain Full Custom',
        'Fitur Umum Blogspot'
      ],
      popular: false
    },
    {
      id: 'landingpage',
      name: 'LandingPage',
      description: 'Website satu halaman kebutuhan promosi.',
      price: 375000,
      features: [
        '1-3 Halaman',
        'Desain Full Custom',
        'Fitur Umum Blogspot'
      ],
      popular: true
    },
    {
      id: 'marketplace',
      name: 'Marketplace',
      description: 'Toko online custom untuk berbagai produk.',
      price: 775000,
      features: [
        'Desain Full Custom',
        'Keranjang Belanja',
        'Fitur Check Out & Pembayaran'
      ],
      popular: false
    },
    {
      id: 'company-profile',
      name: 'Company Profile',
      description: 'Landingpage + Fitur Blog',
      price: 1475000,
      features: [
        'Desain Full Custom',
        'Fitur Umum Blogspot',
        'Editable via Layout',
        'Hybrid Landingpage',
        'Hybrid Marketplace'
      ],
      popular: false,
      special: true
    }
  ];

  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
    // Arahkan ke halaman formulir briefing
    router.push(`/briefing?package=${pkg.id}`);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price).replace('IDR', 'IDR ');
  };

  return (
    <section className="py-8 sm:py-12" id="price">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          <div className="flex flex-col mb-10 section" id="priceSection" name="Price Section">
            <div className="widget Text" data-version="1" id="Text4">
              <h2 className="font-manrope font-bold text-4xl text-primarys md:text-6xl leading-[50px]">Paket Harga</h2>
            </div>
            <div className="widget Text" data-version="1" id="Text5">
              <p className="mt-4 text-base font-normal leading-7 text-gray-500 mb-9">
                Tentukan paket pembuatan website Blogspot custom pilihan Anda
              </p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6" id="pricelist">
            {packages.slice(0, 3).map((pkg, index) => (
              <div 
                key={pkg.id}
                className={`flex-1 flex flex-col border ${pkg.popular ? 'border-2 border-primary bg-orange-100' : 'border'} rounded-2xl p-6 ${pkg.popular ? 'shadow-lg' : 'shadow-md'} hover:scale-105 duration-600 transition section`}
                id={`price${index + 1}Section`}
                name={`Paket ${index + 1}`}
              >
                <div className="widget Text" data-version="1" id={`Text${6 + index * 4}`}>
                  <h3 className={`text-xl font-semibold mb-2 ${pkg.popular ? 'text-primary' : ''}`}>
                    {pkg.name}
                  </h3>
                </div>
                <div className="widget Text" data-version="1" id={`Text${7 + index * 4}`}>
                  <p className={`${pkg.popular ? 'text-slate-500' : 'text-gray-500'} mb-4`}>
                    {pkg.description}
                  </p>
                </div>
                <div className="widget Text" data-version="1" id={`Text${8 + index * 4}`}>
                  <div className="text-4xl font-bold mb-6">
                    {formatPrice(pkg.price)}
                  </div>
                </div>
                <div className="widget TextList" data-version="2" id={`TextList${index + 1}`}>
                  <ul className="space-y-2 mb-4">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center">
                        <div className="mr-2">
                          <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                            <path clipRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.49 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" fillRule="evenodd"></path>
                          </svg>
                        </div>
                        <p className="font-medium text-gray-800">
                          {feature}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="widget Text" data-version="1" id={`Text${9 + index * 4}`}>
                  <button 
                    className="mt-auto bg-primary text-white py-2 rounded-full hover:bg-primarys transition w-full block text-center"
                    onClick={() => handleSelectPackage(pkg)}
                  >
                    Pilih Paket
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Special Package */}
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:items-stretch border-2 border-primary rounded-2xl p-4 shadow-lg bg-orange-100 hover:scale-105 duration-600 transition mt-6">
            <div className="sm:w-1/4 p-3 flex sm:items-center sm:justify-center">
              <div className="sm:text-center section" id="price4Section" name="Paket 4">
                <div className="widget Text" data-version="1" id="Text18">
                  <h3 className="text-2xl font-semibold text-gray-900 mt-2">Company Profile</h3>
                </div>
                <div className="widget Text" data-version="1" id="Text19">
                  <p className="mt-2 text-gray-600">Landingpage + Fitur Blog</p>
                </div>
                <div className="widget Text" data-version="1" id="Text20">
                  <div className="mt-4 absolute z-10 px-3 py-2 text-xs font-bold transform bg-white border rounded-full shadow-md text-slate-800 border-primary-500 -top-3 -right-3 rotate-12 md:static md:transform-none md:top-auto md:right-auto md:rotate-0 md:mb-2">Lebih Lengkap</div>
                </div>
                <div className="widget Text" data-version="1" id="Text21">
                  <span className="hidden sm:flex items-center gap-1 px-4 py-2 text-sm font-medium text-white rounded-full bg-primary justify-center">Fitur Canggih</span>
                </div>
              </div>
            </div>
            <div className="sm:w-1/2 p-3 sm:border-t sm:border-t-0 sm:border-l border-orange-200 section" id="price5Section" name="Paket 4">
              <div className="widget TextList" data-version="2" id="TextList4">
                <ul className="sm:ml-6 mt-2 space-y-3 font-medium text-slate-800">
                  {packages[3].features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                        <path clipRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" fillRule="evenodd"></path>
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="md:w-1/4 p-3 sm:border-t sm:border-t-0 sm:border-l border-orange-200 flex flex-col sm:items-center sm:justify-center section" id="paket4harga" name="Paket 4">
              <div className="widget Text" data-version="1" id="Text22">
                <div className="mb-4"><span className="text-4xl font-bold">{formatPrice(packages[3].price)}</span></div>
              </div>
              <div className="widget Text" data-version="1" id="Text23">
                <button 
                  className="block w-full px-6 py-3 font-medium text-center text-white transition-colors rounded-full bg-gradient hover:from-orange-700 hover:to-red-700"
                  onClick={() => handleSelectPackage(packages[3])}
                >
                  Pilih Paket <svg aria-hidden="true" className="h-4 w-4 inline-block ml-2" data-slot="icon" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PriceList;