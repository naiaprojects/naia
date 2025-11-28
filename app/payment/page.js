// app/payment/page.js
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const PaymentPage = () => {
  const router = useRouter();
  const [briefingData, setBriefingData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('full');
  const [paymentDeadline, setPaymentDeadline] = useState(null);
  const [invoiceNumber, setInvoiceNumber] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [bankAccounts, setBankAccounts] = useState([]);

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

  useEffect(() => {
    fetchBankAccounts();

    // Ambil data briefing dari localStorage
    const data = localStorage.getItem('briefingData');
    if (data) {
      const parsedData = JSON.parse(data);
      setBriefingData(parsedData);

      // Generate nomor invoice
      const now = new Date();
      const invoice = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 1000)}`;
      setInvoiceNumber(invoice);

      // Set deadline pembayaran (3 hari dari sekarang)
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 3);
      setPaymentDeadline(deadline);
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
    }).format(date);
  };

  const handlePayment = async () => {
    setIsProcessing(true);

    const fullPayment = briefingData.package.price;
    const dpPayment = fullPayment / 2;
    const paymentAmount = paymentMethod === 'full' ? fullPayment : dpPayment;

    const paymentData = {
      invoiceNumber,
      package: briefingData.package,
      customer: {
        name: briefingData.name,
        email: briefingData.email,
        phone: briefingData.phone
      },
      amount: paymentAmount,
      paymentMethod,
      paymentDate: new Date(),
      status: 'pending'
    };

    localStorage.setItem('paymentData', JSON.stringify(paymentData));

    try {
      // Simpan order ke database
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...paymentData,
          briefingData
        }),
      });

      if (!orderResponse.ok) {
        throw new Error('Gagal menyimpan order');
      }

      // Kirim notifikasi ke admin (opsional)
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentData,
          briefingData,
          invoiceNumber,
          paymentMethod,
          amount: paymentAmount
        }),
      });

      setPaymentSuccess(true);

      setTimeout(() => {
        router.push(`/invoice/${paymentData.invoiceNumber}`);
      }, 2000);
    } catch (error) {
      console.error('Error saat memproses pembayaran:', error);
      alert('Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi.');
      setIsProcessing(false);
    }
  };

  if (!briefingData || !paymentDeadline) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4">Memuat data pembayaran...</p>
        </div>
      </div>
    );
  }

  const fullPayment = briefingData.package.price;
  const dpPayment = fullPayment / 2;
  const remainingPayment = fullPayment - dpPayment;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-primary text-white p-6">
            <h1 className="text-2xl font-bold">Pembayaran</h1>
            <p className="mt-2">Lakukan pembayaran untuk melanjutkan proses pemesanan</p>
          </div>

          <div className="p-6 md:p-8">
            {/* Invoice Details */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Detail Invoice</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Nomor Invoice:</span>
                  <span className="font-medium">{invoiceNumber}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Tanggal:</span>
                  <span className="font-medium">{formatDate(new Date())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Batas Pembayaran:</span>
                  <span className="font-medium text-red-600">{formatDate(paymentDeadline)}</span>
                </div>
              </div>
            </div>

            {/* Package Details */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Detail Paket</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Paket:</span>
                  <span className="font-medium">{briefingData.package.name}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Harga:</span>
                  <span className="font-medium">{formatPrice(briefingData.package.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Website:</span>
                  <span className="font-medium">{briefingData.websiteName}</span>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Informasi Pelanggan</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Nama:</span>
                  <span className="font-medium">{briefingData.name}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{briefingData.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Telepon:</span>
                  <span className="font-medium">{briefingData.phone}</span>
                </div>
              </div>
            </div>

            {/* Bank Account Details */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Informasi Rekening Bank</h2>
              <div className="space-y-4">
                {bankAccounts.map((bank) => (
                  <div key={bank.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-lg">{bank.bank_name}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(bank.account_number);
                          alert('Nomor rekening berhasil disalin!');
                        }}
                        className="text-sm text-primary hover:text-primarys"
                      >
                        Salin
                      </button>
                    </div>
                    <div className="text-gray-700">
                      <div className="mb-1">
                        <span className="text-gray-600">No. Rekening: </span>
                        <span className="font-medium">{bank.account_number}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Atas Nama: </span>
                        <span className="font-medium">{bank.account_holder}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Metode Pembayaran</h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    id="full"
                    type="radio"
                    name="paymentMethod"
                    value="full"
                    checked={paymentMethod === 'full'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                  />
                  <label htmlFor="full" className="ml-3 block">
                    <div className="font-medium">Pembayaran Penuh</div>
                    <div className="text-sm text-gray-500">{formatPrice(fullPayment)}</div>
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="dp"
                    type="radio"
                    name="paymentMethod"
                    value="dp"
                    checked={paymentMethod === 'dp'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                  />
                  <label htmlFor="dp" className="ml-3 block">
                    <div className="font-medium">DP 50%</div>
                    <div className="text-sm text-gray-500">Bayar {formatPrice(dpPayment)} sekarang, dan {formatPrice(remainingPayment)}/paling lambat 7 hari setelah website selesai</div>
                  </label>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="border-t pt-6">
              <div className="flex justify-between mb-4">
                <span className="text-lg font-medium">Total Pembayaran:</span>
                <span className="text-xl font-bold text-primary">
                  {formatPrice(paymentMethod === 'full' ? fullPayment : dpPayment)}
                </span>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Catatan:</strong> Silakan transfer ke salah satu rekening bank di atas sesuai dengan total pembayaran yang tertera.
                </p>
              </div>

              {paymentSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-green-800">
                    <strong>Pembayaran berhasil!</strong> Notifikasi telah dikirim ke admin. Anda akan diarahkan ke halaman konfirmasi pesanan.
                  </p>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  type="button"
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
                  onClick={() => router.push('/briefing')}
                  disabled={isProcessing}
                >
                  Kembali
                </button>
                <button
                  type="button"
                  className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primarys transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  onClick={handlePayment}
                  disabled={isProcessing || paymentSuccess}
                >
                  {isProcessing ? 'Memproses...' : 'Bayar Sekarang'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;