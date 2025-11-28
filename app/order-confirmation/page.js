// app/order-confirmation/page.js
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const OrderConfirmation = () => {
  const router = useRouter();
  const [paymentData, setPaymentData] = useState(null);
  const [briefingData, setBriefingData] = useState(null);

  useEffect(() => {
    // Ambil data pembayaran dari localStorage
    const payment = localStorage.getItem('paymentData');
    const briefing = localStorage.getItem('briefingData');
    
    if (payment && briefing) {
      setPaymentData(JSON.parse(payment));
      setBriefingData(JSON.parse(briefing));
    } else {
      // Jika tidak ada data, kembali ke halaman utama
      router.push('/');
    }
  }, [router]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price).replace('IDR', 'IDR ');
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const handleWhatsAppClick = () => {
    if (paymentData && paymentData.customer) {
      const message = `Halo, saya ingin konfirmasi pesanan dengan nomor invoice ${paymentData.invoiceNumber}. Terima kasih.`;
      const phoneNumber = '6281320858595'; // Ganti dengan nomor WhatsApp Anda
      window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  if (!paymentData || !briefingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4">Memuat data pesanan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-green-600 text-white p-6">
            <div className="flex items-center">
              <svg className="h-12 w-12 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div>
                <h1 className="text-2xl font-bold">Pembayaran Berhasil!</h1>
                <p className="mt-2">Terima kasih telah melakukan pemesanan. Pesanan Anda sedang diproses.</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 md:p-8">
            {/* Invoice Details */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Detail Pesanan</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Nomor Invoice:</span>
                  <span className="font-medium">{paymentData.invoiceNumber}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Tanggal Pesanan:</span>
                  <span className="font-medium">{formatDate(paymentData.paymentDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-green-600">Lunas</span>
                </div>
              </div>
            </div>
            
            {/* Package Details */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Detail Jasa</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Paket:</span>
                  <span className="font-medium">{paymentData.package.name}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Deskripsi:</span>
                  <span className="font-medium">{paymentData.package.description}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Website:</span>
                  <span className="font-medium">{briefingData.websiteName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Pembayaran:</span>
                  <span className="font-medium">{formatPrice(paymentData.amount)}</span>
                </div>
              </div>
            </div>
            
            {/* Briefing Details */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Detail Briefing</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="mb-4">
                  <h3 className="font-medium mb-2">Deskripsi Website:</h3>
                  <p className="text-gray-700">{briefingData.websiteDescription}</p>
                </div>
                <div className="mb-4">
                  <h3 className="font-medium mb-2">Tujuan Website:</h3>
                  <p className="text-gray-700">{briefingData.websitePurpose}</p>
                </div>
                {briefingData.colorPreference && (
                  <div className="mb-4">
                    <h3 className="font-medium mb-2">Preferensi Warna:</h3>
                    <p className="text-gray-700">{briefingData.colorPreference}</p>
                  </div>
                )}
                {briefingData.referenceWebsites && (
                  <div className="mb-4">
                    <h3 className="font-medium mb-2">Website Referensi:</h3>
                    <p className="text-gray-700">{briefingData.referenceWebsites}</p>
                  </div>
                )}
                {briefingData.additionalInfo && (
                  <div>
                    <h3 className="font-medium mb-2">Informasi Tambahan:</h3>
                    <p className="text-gray-700">{briefingData.additionalInfo}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Customer Details */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Informasi Pelanggan</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Nama:</span>
                  <span className="font-medium">{paymentData.customer.name}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{paymentData.customer.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Telepon:</span>
                  <span className="font-medium">{paymentData.customer.phone}</span>
                </div>
              </div>
            </div>
            
            {/* Next Steps */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium mb-2">Langkah Selanjutnya:</h3>
              <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                <li>Tim kami akan menghubungi Anda dalam 1x24 jam untuk konfirmasi lebih lanjut</li>
                <li>Proses pembuatan website akan dimulai setelah konfirmasi</li>
                <li>Estimasi pengerjaan tergantung pada kompleksitas website (3-14 hari kerja)</li>
                <li>Anda akan menerima update berkala mengenai progress pengerjaan</li>
              </ol>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition flex items-center justify-center"
                onClick={handleWhatsAppClick}
              >
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.123-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Hubungi via WhatsApp
              </button>
              <button
                type="button"
                className="flex-1 px-6 py-3 bg-primary text-white rounded-md hover:bg-primarys transition"
                onClick={() => router.push('/')}
              >
                Kembali ke Beranda
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;