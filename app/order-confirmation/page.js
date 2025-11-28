// app/order-confirmation/page.js
"use client";

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const OrderConfirmation = () => {
  const router = useRouter();
  const [paymentData, setPaymentData] = useState(null);
  const [briefingData, setBriefingData] = useState(null);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [orderStatus, setOrderStatus] = useState('pending'); // Status dari database

  useEffect(() => {
    // Ambil data pembayaran dari localStorage
    const payment = localStorage.getItem('paymentData');
    const briefing = localStorage.getItem('briefingData');

    if (payment && briefing) {
      const parsedPayment = JSON.parse(payment);
      setPaymentData(parsedPayment);
      setBriefingData(JSON.parse(briefing));

      // Fetch order status dari database
      fetchOrderStatus(parsedPayment.invoiceNumber);
    } else {
      router.push('/');
    }

    // Fetch bank accounts
    fetchBankAccounts();
  }, [router]);

  const fetchOrderStatus = async (invoiceNumber) => {
    try {
      const response = await fetch(`/api/orders?invoice=${invoiceNumber}`);
      if (response.ok) {
        const orders = await response.json();
        if (orders.length > 0) {
          setOrderStatus(orders[0].payment_status);
        }
      }
    } catch (error) {
      console.error('Error fetching order status:', error);
    }
  };

  // Countdown timer - hanya jalan jika status pending
  useEffect(() => {
    if (!paymentData || orderStatus !== 'pending') return;

    const calculateTimeRemaining = () => {
      const deadline = new Date(paymentData.paymentDate);
      deadline.setDate(deadline.getDate() + 3);

      const now = new Date();
      const diff = deadline - now;

      if (diff <= 0) {
        setTimeRemaining({ expired: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds, expired: false });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [paymentData, orderStatus]);

  const fetchBankAccounts = async () => {
    try {
      const response = await fetch('/api/bank-accounts');
      if (response.ok) {
        const data = await response.json();
        setBankAccounts(data);
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    }
  };

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

  const handleWhatsAppClick = async () => {
    if (paymentData && paymentData.customer) {
      setIsSendingWhatsApp(true);

      const message = `Halo Naia.web.id! Saya ingin konfirmasi pesanan dengan nomor invoice ${paymentData.invoiceNumber}. Terima kasih.`;
      const phoneNumber = '6281320858595';

      window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');

      setTimeout(() => {
        setIsSendingWhatsApp(false);
      }, 2000);
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const handleDownloadInvoice = () => {
    // Buat URL untuk halaman ini
    const invoiceUrl = window.location.href;

    // Salin URL ke clipboard
    navigator.clipboard.writeText(invoiceUrl);
    alert('Link invoice berhasil disalin! Anda bisa menyimpan link ini untuk mengakses invoice kapan saja.');
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Menunggu Pembayaran' },
      verified: { bg: 'bg-green-100', text: 'text-green-800', label: 'Terverifikasi' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Ditolak' }
    };
    return badges[status] || badges.pending;
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

  const statusBadge = getStatusBadge(orderStatus);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md overflow-hidden print:shadow-none">
            <div className={`${orderStatus === 'verified' ? 'bg-green-600' : 'bg-blue-600'} text-white p-6 print:bg-white print:text-black print:border-b-2`}>
              <div className="flex items-center">
                <svg className="h-12 w-12 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div>
                  <h1 className="text-2xl font-bold">
                    {orderStatus === 'verified' ? 'Pembayaran Terverifikasi!' : 'Pesanan Berhasil Dibuat!'}
                  </h1>
                  <p className="mt-2">
                    {orderStatus === 'verified'
                      ? 'Terima kasih! Pembayaran Anda telah dikonfirmasi. Tim kami akan segera memproses pesanan Anda.'
                      : 'Terima kasih telah melakukan pemesanan. Silakan lakukan pembayaran sesuai instruksi.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8">
              {/* Countdown Timer - Hanya tampil jika pending */}
              {orderStatus === 'pending' && timeRemaining && !timeRemaining.expired && (
                <div className="mb-8 bg-red-50 border-2 border-red-200 rounded-lg p-6 print:hidden">
                  <h3 className="text-lg font-semibold text-red-800 mb-3 text-center">Batas Waktu Pembayaran</h3>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-3xl font-bold text-red-600">{timeRemaining.days}</div>
                      <div className="text-sm text-gray-600">Hari</div>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-3xl font-bold text-red-600">{timeRemaining.hours}</div>
                      <div className="text-sm text-gray-600">Jam</div>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-3xl font-bold text-red-600">{timeRemaining.minutes}</div>
                      <div className="text-sm text-gray-600">Menit</div>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-3xl font-bold text-red-600">{timeRemaining.seconds}</div>
                      <div className="text-sm text-gray-600">Detik</div>
                    </div>
                  </div>
                  <p className="text-center text-sm text-red-700 mt-3">
                    Pesanan akan dibatalkan otomatis jika pembayaran tidak dikonfirmasi sebelum batas waktu
                  </p>
                </div>
              )}

              {orderStatus === 'pending' && timeRemaining && timeRemaining.expired && (
                <div className="mb-8 bg-red-100 border-2 border-red-300 rounded-lg p-6 text-center print:hidden">
                  <h3 className="text-lg font-semibold text-red-800">Batas Waktu Pembayaran Telah Habis</h3>
                  <p className="text-red-700 mt-2">Silakan hubungi admin untuk memperpanjang waktu pembayaran</p>
                </div>
              )}

              {/* Success Message - Tampil jika verified */}
              {orderStatus === 'verified' && (
                <div className="mb-8 bg-green-50 border-2 border-green-200 rounded-lg p-6 print:hidden">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">✅ Pembayaran Berhasil Diverifikasi</h3>
                  <p className="text-green-700">
                    Pesanan Anda sedang dalam proses pengerjaan. Tim kami akan menghubungi Anda untuk informasi lebih lanjut.
                  </p>
                </div>
              )}

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
                    <span className="text-gray-600">Status Pembayaran:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                      {statusBadge.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Package Details */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Detail Paket</h2>
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
                    <span className="text-gray-600">Nama Website:</span>
                    <span className="font-medium">{briefingData.websiteName}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Metode Pembayaran:</span>
                    <span className="font-medium">{paymentData.paymentMethod === 'full' ? 'Pembayaran Penuh' : 'DP 50%'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Pembayaran:</span>
                    <span className="font-bold text-lg text-primary">{formatPrice(paymentData.amount)}</span>
                  </div>
                </div>
              </div>

              {/* Bank Account Details - Hanya tampil jika pending */}
              {orderStatus === 'pending' && (
                <>
                  <div className="mb-8 print:hidden">
                    <h2 className="text-xl font-semibold mb-4">Informasi Rekening Bank</h2>
                    <p className="text-sm text-gray-600 mb-4">Silakan transfer ke salah satu rekening berikut:</p>
                    <div className="space-y-4">
                      {bankAccounts.map((bank) => (
                        <div key={bank.id} className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-5 border-2 border-blue-200">
                          <div className="flex justify-between items-center mb-3">
                            <span className="font-bold text-xl text-blue-900">{bank.bank_name}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(bank.account_number);
                                alert('Nomor rekening berhasil disalin!');
                              }}
                              className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                            >
                              📋 Salin Nomor
                            </button>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <span className="text-gray-700 text-sm w-32">No. Rekening:</span>
                              <span className="font-bold text-lg text-blue-900">{bank.account_number}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-gray-700 text-sm w-32">Atas Nama:</span>
                              <span className="font-semibold text-blue-900">{bank.account_holder}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment Instructions - Hanya tampil jika pending */}
                  <div className="mb-8 print:hidden">
                    <h2 className="text-xl font-semibold mb-4">Cara Pembayaran</h2>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                      <ol className="list-decimal list-inside space-y-3 text-gray-800">
                        <li className="leading-relaxed">
                          <strong>Transfer</strong> sejumlah <span className="font-bold text-primary">{formatPrice(paymentData.amount)}</span> ke salah satu rekening bank di atas
                        </li>
                        <li className="leading-relaxed">
                          <strong>Pastikan</strong> nominal transfer sesuai <strong>persis</strong> dengan total pembayaran
                        </li>
                        <li className="leading-relaxed">
                          <strong>Simpan</strong> bukti transfer Anda
                        </li>
                        <li className="leading-relaxed">
                          <strong>Klik tombol</strong> "Konfirmasi via WhatsApp" di bawah untuk mengirim bukti transfer
                        </li>
                        <li className="leading-relaxed">
                          <strong>Tim kami</strong> akan memverifikasi pembayaran dalam 1x24 jam
                        </li>
                      </ol>
                    </div>
                  </div>
                </>
              )}

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

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 print:hidden">
                {orderStatus === 'verified' ? (
                  <>
                    <button
                      type="button"
                      className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center justify-center"
                      onClick={handlePrintInvoice}
                    >
                      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Print Invoice
                    </button>
                    <button
                      type="button"
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition flex items-center justify-center"
                      onClick={handleDownloadInvoice}
                    >
                      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Salin Link Invoice
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                    onClick={handleWhatsAppClick}
                    disabled={isSendingWhatsApp}
                  >
                    {isSendingWhatsApp ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Mengirim...
                      </>
                    ) : (
                      <>
                        <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.123-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                        </svg>
                        Konfirmasi via WhatsApp
                      </>
                    )}
                  </button>
                )}
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
      <Footer />
    </>
  );
};

export default OrderConfirmation;