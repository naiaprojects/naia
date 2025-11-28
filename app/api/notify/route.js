// app/api/notify/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Data yang diterima dari form
    const { 
      paymentData, 
      briefingData, 
      invoiceNumber,
      paymentMethod,
      amount
    } = data;
    
    // Format email untuk admin
    const emailSubject = `Pesanan Baru - ${paymentData.customer.name} - Invoice ${invoiceNumber}`;
    const emailBody = `
      <h2>Detail Pesanan Baru</h2>
      <p><strong>Invoice:</strong> ${invoiceNumber}</p>
      <p><strong>Tanggal:</strong> ${new Date().toLocaleString('id-ID')}</p>
      <p><strong>Status:</strong> Pembayaran Berhasil</p>
      
      <h3>Informasi Pelanggan</h3>
      <p><strong>Nama:</strong> ${paymentData.customer.name}</p>
      <p><strong>Email:</strong> ${paymentData.customer.email}</p>
      <p><strong>Telepon:</strong> ${paymentData.customer.phone}</p>
      
      <h3>Detail Paket</h3>
      <p><strong>Paket:</strong> ${paymentData.package.name}</p>
      <p><strong>Deskripsi:</strong> ${paymentData.package.description}</p>
      <p><strong>Website:</strong> ${briefingData.websiteName}</p>
      <p><strong>Total Pembayaran:</strong> ${new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(amount).replace('IDR', 'IDR ')}</p>
      <p><strong>Metode Pembayaran:</strong> ${paymentMethod === 'full' ? 'Pembayaran Penuh' : 'DP 50%'}</p>
      
      <h3>Detail Briefing</h3>
      <p><strong>Deskripsi Website:</strong> ${briefingData.websiteDescription}</p>
      <p><strong>Tujujuan Website:</strong> ${briefingData.websitePurpose}</p>
      ${briefingData.colorPreference ? `<p><strong>Preferensi Warna:</strong> ${briefingData.colorPreference}</p>` : ''}
      ${briefingData.referenceWebsites ? `<p><strong>Website Referensi:</strong> ${briefingData.referenceWebsites}</p>` : ''}
      ${briefingData.additionalInfo ? `<p><strong>Informasi Tambahan:</strong> ${briefingData.additionalInfo}</p>` : ''}
    `;
    
    // Format pesan WhatsApp
    const whatsappMessage = `*PESANAN BARU - NAIA.WEB.ID*\n\n` +
      `*Invoice:* ${invoiceNumber}\n` +
      `*Tanggal:* ${new Date().toLocaleString('id-ID')}\n` +
      `*Status:* Pembayaran Berhasil\n\n` +
      `*Informasi Pelanggan:*\n` +
      `*Nama:* ${paymentData.customer.name}\n` +
      `*Email:* ${paymentData.customer.email}\n` +
      `*Telepon:* ${paymentData.customer.phone}\n\n` +
      `*Detail Paket:*\n` +
      `*Paket:* ${paymentData.package.name}\n` +
      `*Website:* ${briefingData.websiteName}\n` +
      `*Total:* ${new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(amount).replace('IDR', 'IDR ')}\n` +
      `*Metode:* ${paymentMethod === 'full' ? 'Pembayaran Penuh' : 'DP 50%'}`;
    
    // Kirim email menggunakan Resend (atau layanan email lainnya)
    let emailSent = false;
    try {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'no-reply@naia.web.id',
          to: ['naiaprojects9@gmail.com'],
          subject: emailSubject,
          html: emailBody,
        }),
      });
      
      if (emailResponse.ok) {
        emailSent = true;
        console.log('Email berhasil dikirim');
      } else {
        console.error('Gagal mengirim email:', await emailResponse.text());
      }
    } catch (error) {
      console.error('Error mengirim email:', error);
    }
    
    // Kirim notifikasi WhatsApp menggunakan watsap.id API
    let whatsappSent = false;
    try {
      const whatsappResponse = await fetch('https://api.watsap.id/v1/send-message', {
        method: 'POST',
        headers: {
          'Authorization': `${process.env.WATSAP_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: process.env.WATSAP_API_KEY,
          sender_type: 'individual',
          number: '6281320858595', // Nomor WhatsApp admin
          message: whatsappMessage,
        }),
      });
      
      if (whatsappResponse.ok) {
        whatsappSent = true;
        console.log('WhatsApp berhasil dikirim');
      } else {
        console.error('Gagal mengirim WhatsApp:', await whatsappResponse.text());
      }
    } catch (error) {
      console.error('Error mengirim WhatsApp:', error);
    }
    
    return NextResponse.json({ 
      success: true, 
      emailSent,
      whatsappSent,
      message: 'Notifikasi berhasil dikirim' 
    });
  } catch (error) {
    console.error('Error dalam API notify:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat mengirim notifikasi' },
      { status: 500 }
    );
  }
}