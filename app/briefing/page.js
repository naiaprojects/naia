// app/briefing/page.js
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function BriefingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceSlug = searchParams.get('service');
  const packageName = searchParams.get('package');

  const [selectedPackage, setSelectedPackage] = useState(null);
  const [serviceName, setServiceName] = useState('');
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    websiteName: ''
  });
  const [errors, setErrors] = useState({});

  // Fetch service and package from database
  useEffect(() => {
    const fetchServicePackage = async () => {
      if (!serviceSlug || !packageName) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/services?slug=${serviceSlug}`);
        if (!response.ok) throw new Error('Service not found');

        const service = await response.json();
        setServiceName(service.title);

        // Find package by name
        const packages = service.packages || [];
        const pkg = packages.find(p => p.name === decodeURIComponent(packageName));

        if (pkg) {
          setSelectedPackage({
            id: `${serviceSlug}-${pkg.name}`,
            name: pkg.name,
            description: pkg.description || service.description,
            price: parseFloat(pkg.price) || 0,
            features: pkg.features || [],
            serviceSlug: serviceSlug,
            serviceName: service.title
          });
        }
      } catch (error) {
        console.error('Error fetching service:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServicePackage();
  }, [serviceSlug, packageName]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Memuat data paket...</p>
        </div>
      </div>
    );
  }

  if (!selectedPackage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Paket tidak ditemukan</h2>
          <p className="text-gray-600 mb-6">Maaf, paket yang Anda cari tidak tersedia atau sudah tidak aktif.</p>
          <button
            className="bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-orange-600 transition shadow-lg"
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
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-orange-600 text-white p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Formulir Briefing</h1>
            <p className="text-orange-100">Lengkapi formulir berikut untuk memulai pemesanan</p>
          </div>

          <div className="p-6 md:p-8">
            {/* Package Info Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">{serviceName}</p>
                  <h3 className="font-bold text-xl text-gray-800">{selectedPackage.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">{selectedPackage.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">Total Harga</p>
                  <div className="text-2xl font-bold text-primary">
                    {formatPrice(selectedPackage.price)}
                  </div>
                </div>
              </div>

              {/* Features */}
              {selectedPackage.features && selectedPackage.features.length > 0 && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Termasuk:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedPackage.features.slice(0, 5).map((feature, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-lg text-xs text-gray-700 border border-blue-100">
                        <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </span>
                    ))}
                    {selectedPackage.features.length > 5 && (
                      <span className="text-xs text-gray-500">+{selectedPackage.features.length - 5} lainnya</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full h-12 px-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition ${errors.name ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
                    placeholder="John Doe"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full h-12 px-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
                    placeholder="john@example.com"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nomor Telepon *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full h-12 px-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition ${errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
                    placeholder="08123456789"
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label htmlFor="websiteName" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nama Website *
                  </label>
                  <input
                    type="text"
                    id="websiteName"
                    name="websiteName"
                    value={formData.websiteName}
                    onChange={handleChange}
                    className={`w-full h-12 px-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition ${errors.websiteName ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
                    placeholder="Nama Website Anda"
                  />
                  {errors.websiteName && <p className="text-red-500 text-sm mt-1">{errors.websiteName}</p>}
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row justify-between gap-4">
                <button
                  type="button"
                  className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition font-medium"
                  onClick={() => router.back()}
                >
                  ← Kembali
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-primary text-white rounded-xl hover:bg-orange-600 transition font-medium shadow-lg shadow-orange-500/20"
                >
                  Lanjut ke Pembayaran →
                </button>
              </div>
            </form>
          </div>
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