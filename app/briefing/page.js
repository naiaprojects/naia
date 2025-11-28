// app/briefing/page.js
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const packages = {
  'blog-portfolio': {
    id: 'blog-portfolio',
    name: 'Blog / Portofolio',
    description: 'Layanan web custom blog pribadi & portofolio.',
    price: 275000,
    features: [
      'Fitur Umum Blogspot',
      'Desain Full Custom',
      'Fitur Umum Blogspot'
    ]
  },
  'landingpage': {
    id: 'landingpage',
    name: 'LandingPage',
    description: 'Website satu halaman kebutuhan promosi.',
    price: 375000,
    features: [
      '1-3 Halaman',
      'Desain Full Custom',
      'Fitur Umum Blogspot'
    ]
  },
  'marketplace': {
    id: 'marketplace',
    name: 'Marketplace',
    description: 'Toko online custom untuk berbagai produk.',
    price: 775000,
    features: [
      'Desain Full Custom',
      'Keranjang Belanja',
      'Fitur Check Out & Pembayaran'
    ]
  },
  'company-profile': {
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
    ]
  }
};

function BriefingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const packageId = searchParams.get('package');
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    websiteName: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (packageId && packages[packageId]) {
      setSelectedPackage(packages[packageId]);
    }
  }, [packageId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nama lengkap harus diisi';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email harus diisi';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Nomor telepon harus diisi';
    }

    if (!formData.websiteName.trim()) {
      newErrors.websiteName = 'Nama website harus diisi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      localStorage.setItem('briefingData', JSON.stringify({
        ...formData,
        package: selectedPackage
      }));

      router.push('/payment');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price).replace('IDR', 'IDR ');
  };

  if (!selectedPackage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Paket tidak ditemukan</h2>
          <button
            className="bg-primary text-white px-6 py-2 rounded-full hover:bg-primarys transition"
            onClick={() => router.push('/')}
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Formulir Briefing</h1>
            <p className="text-gray-600">Lengkapi formulir berikut untuk memulai pemesanan paket {selectedPackage.name}</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{selectedPackage.name}</h3>
                <p className="text-gray-600">{selectedPackage.description}</p>
              </div>
              <div className="text-2xl font-bold text-primary">
                {formatPrice(selectedPackage.price)}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="John Doe"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="john@example.com"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Nomor Telepon *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="08123456789"
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label htmlFor="websiteName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Website *
                </label>
                <input
                  type="text"
                  id="websiteName"
                  name="websiteName"
                  value={formData.websiteName}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${errors.websiteName ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Nama Website Anda"
                />
                {errors.websiteName && <p className="text-red-500 text-sm mt-1">{errors.websiteName}</p>}
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                type="button"
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
                onClick={() => router.push('/')}
              >
                Kembali
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primarys transition"
              >
                Lanjut ke Pembayaran
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function BriefingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4">Memuat formulir...</p>
        </div>
      </div>
    }>
      <BriefingForm />
    </Suspense>
  );
}