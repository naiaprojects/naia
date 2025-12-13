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

  // Discount State
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountCode, setDiscountCode] = useState('');
  const [discountError, setDiscountError] = useState('');
  const [discountLoading, setDiscountLoading] = useState(false);
  const [serviceId, setServiceId] = useState(null);

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
        setServiceId(service.id);

        // Find package by name
        const packages = service.packages || [];
        const pkg = packages.find(p => p.name === decodeURIComponent(packageName));

        if (pkg) {
          const packageData = {
            id: `${serviceSlug}-${pkg.name}`,
            name: pkg.name,
            description: pkg.description || service.description,
            price: parseFloat(pkg.price) || 0,
            features: pkg.features || [],
            serviceSlug: serviceSlug,
            serviceName: service.title
          };
          setSelectedPackage(packageData);

          // Fetch auto-discounts for this service/package
          try {
            const discountRes = await fetch(`/api/discounts?type=auto&service_id=${service.id}&package_name=${encodeURIComponent(pkg.name)}`);
            const autoDiscounts = await discountRes.json();

            // Apply the first valid auto discount if available
            if (Array.isArray(autoDiscounts) && autoDiscounts.length > 0) {
              const autoDiscount = autoDiscounts[0];
              // Calculate discount amount
              let discountAmount = 0;
              const price = packageData.price;

              if (autoDiscount.discount_value_type === 'percentage') {
                discountAmount = (price * autoDiscount.discount_value) / 100;
                if (autoDiscount.max_discount_amount && discountAmount > autoDiscount.max_discount_amount) {
                  discountAmount = autoDiscount.max_discount_amount;
                }
              } else {
                discountAmount = autoDiscount.discount_value;
              }

              if (discountAmount > price) discountAmount = price;

              setAppliedDiscount({
                ...autoDiscount,
                discount_amount: discountAmount,
                original_amount: price,
                final_amount: price - discountAmount
              });
              setDiscountCode(autoDiscount.code);
            }
          } catch (discountError) {
            console.error('Error fetching auto discounts:', discountError);
          }
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
      newErrors.name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.websiteName.trim()) {
      newErrors.websiteName = 'Website name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Apply discount code
  const applyDiscountCode = async () => {
    if (!discountCode.trim()) {
      setDiscountError('Discount code is required');
      return;
    }

    setDiscountLoading(true);
    setDiscountError('');

    try {
      const response = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: discountCode.trim(),
          service_id: serviceId,
          package_name: selectedPackage?.name,
          order_amount: selectedPackage?.price,
          order_type: 'services'
        })
      });

      const data = await response.json();

      if (data.valid) {
        setAppliedDiscount(data.discount);
        setDiscountError('');
      } else {
        setDiscountError(data.error || 'Discount code is invalid');
      }
    } catch (error) {
      setDiscountError('Failed to validate discount code');
    } finally {
      setDiscountLoading(false);
    }
  };

  // Remove applied discount
  const removeDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode('');
    setDiscountError('');
  };

  // Calculate final price
  const finalPrice = appliedDiscount ? appliedDiscount.final_amount : selectedPackage?.price || 0;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      localStorage.setItem('briefingData', JSON.stringify({
        ...formData,
        package: selectedPackage,
        discount: appliedDiscount ? {
          id: appliedDiscount.id,
          code: appliedDiscount.code,
          name: appliedDiscount.name,
          discount_type: appliedDiscount.discount_type,
          discount_amount: appliedDiscount.discount_amount,
          original_amount: appliedDiscount.original_amount,
          final_amount: appliedDiscount.final_amount
        } : null
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
          <p className="mt-4 text-gray-600">Loading package data...</p>
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
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Package not found</h2>
          <p className="text-gray-600 mb-6">Sorry, the package you are looking for is not available or has been deactivated.</p>
          <button
            className="bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-orange-600 transition shadow-lg"
            onClick={() => router.push('/')}
          >
            Back to Home
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
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Briefing Form</h1>
            <p className="text-orange-100">Fill out the form below to start your order</p>
          </div>

          <div className="p-6 md:p-8">
            {/* Package Info Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">{serviceName}</p>
                  <h3 className="font-bold text-xl text-gray-800">{selectedPackage.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">{selectedPackage.description}</p>
                </div>
                <div className="text-right">
                  {appliedDiscount ? (
                    <>
                      <p className="text-xs text-gray-500 mb-1">Original Price</p>
                      <div className="text-lg text-gray-400 line-through">
                        {formatPrice(selectedPackage.price)}
                      </div>
                      <p className="text-xs text-green-600 font-medium">Discount {appliedDiscount.discount_value_type === 'percentage' ? `${appliedDiscount.discount_value}%` : formatPrice(appliedDiscount.discount_amount)}</p>
                      <div className="text-2xl font-bold text-primary">
                        {formatPrice(finalPrice)}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-gray-500 mb-1">Total Price</p>
                      <div className="text-2xl font-bold text-primary">
                        {formatPrice(selectedPackage.price)}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Features */}
              {selectedPackage.features && selectedPackage.features.length > 0 && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Includes:</p>
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
                      <span className="text-xs text-gray-500">+{selectedPackage.features.length - 5} .etc</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Discount Code Section */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-8">
              <p className="text-sm font-medium text-gray-700 mb-3">
                <svg className="w-4 h-4 inline mr-1 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Discount Code
              </p>

              {appliedDiscount ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-green-800">{appliedDiscount.code}</p>
                      <p className="text-xs text-green-600">{appliedDiscount.name} - Hemat {formatPrice(appliedDiscount.discount_amount)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeDiscount}
                    className="text-red-500 hover:text-red-700 text-sm font-medium p-2 hover:bg-red-50 rounded-lg transition"
                  >
                    Delete
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => { setDiscountCode(e.target.value.toUpperCase()); setDiscountError(''); }}
                    placeholder="Enter discount code"
                    className="flex-1 h-11 px-4 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition text-sm uppercase"
                  />
                  <button
                    type="button"
                    onClick={applyDiscountCode}
                    disabled={discountLoading}
                    className="px-5 h-11 bg-primary text-white rounded-lg hover:bg-orange-600 transition font-medium text-sm disabled:opacity-50"
                  >
                    {discountLoading ? '...' : 'Apply'}
                  </button>
                </div>
              )}

              {discountError && (
                <p className="text-red-500 text-xs mt-2">{discountError}</p>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Full name *
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
                    Phone Number *
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
                    Website Name *
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
                  ← Back
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-primary text-white rounded-xl hover:bg-orange-600 transition font-medium shadow-lg shadow-orange-500/20"
                >
                  Next to Payment →
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
          <p className="mt-4">Loading form...</p>
        </div>
      </div>
    }>
      <BriefingForm />
    </Suspense>
  );
}