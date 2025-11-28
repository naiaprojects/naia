// app/api/notify/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const data = await request.json();
    console.log("API /api/notify dipanggil dengan Fonnte");
    
    const { 
      paymentData, 
      briefingData, 
      invoiceNumber,
      paymentMethod,
      amount
    } = data;

    // Format pesan WhatsApp untuk Fonnte
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
      `*Total:* Rp ${amount.toLocaleString('id-ID')}\n` +
      `*Metode:* ${paymentMethod === 'full' ? 'Pembayaran Penuh' : 'DP 50%'}`;

    // Kirim WhatsApp menggunakan Fonnte API
    let whatsappSent = false;
    let whatsappError = null;
    
    try {
      console.log("Mencoba mengirim WhatsApp via Fonnte...");
      
      if (!process.env.FONNTE_API_TOKEN) {
        throw new Error("FONNTE_API_TOKEN tidak ditemukan di environment variables");
      }

      const fonnteResponse = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          'Authorization': process.env.FONNTE_API_TOKEN, // Token di header
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target: '6281320858595', // Nomor WhatsApp tujuan (admin)
          message: whatsappMessage,
          // country_code: '62', // Opsional, jika perlu
        }),
      });

      const responseBody = await fonnteResponse.text();
      console.log("Fonnte API Response Status:", fonnteResponse.status);
      console.log("Fonnte API Response Body:", responseBody);

      if (fonnteResponse.ok) {
        whatsappSent = true;
        console.log("WhatsApp berhasil dikirim via Fonnte");
      } else {
        whatsappError = `Status: ${fonnteResponse.status}, Body: ${responseBody}`;
        console.error("Gagal mengirim WhatsApp via Fonnte:", whatsappError);
      }
    } catch (error) {
      whatsappError = error.message;
      console.error("Error mengirim WhatsApp via Fonnte:", error);
    }

    // Kirim email (tetap gunakan Resend)
    let emailSent = false;
    let emailError = null;
    
    try {
      console.log("Mencoba mengirim email...");
      
      if (!process.env.RESEND_API_KEY) {
        throw new Error("RESEND_API_KEY tidak ditemukan di environment variables");
      }

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
        <p><strong>Total Pembayaran:</strong> Rp ${amount.toLocaleString('id-ID')}</p>
        <p><strong>Metode Pembayaran:</strong> ${paymentMethod === 'full' ? 'Pembayaran Penuh' : 'DP 50%'}</p>
        
        <h3>Detail Briefing</h3>
        <p><strong>Deskripsi Website:</strong> ${briefingData.websiteDescription}</p>
        <p><strong>Tujujuan Website:</strong> ${briefingData.websitePurpose}</p>
        ${briefingData.colorPreference ? `<p><strong>Preferensi Warna:</strong> ${briefingData.colorPreference}</p>` : ''}
        ${briefingData.referenceWebsites ? `<p><strong>Website Referensi:</strong> ${briefingData.referenceWebsites}</p>` : ''}
        ${briefingData.additionalInfo ? `<p><strong>Informasi Tambahan:</strong> ${briefingData.additionalInfo}</p>` : ''}
      `;

      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'onboarding@resend.dev',
          to: ['naiaprojects9@gmail.com'],
          subject: emailSubject,
          html: emailBody,
        }),
      });
      
      const emailResponseBody = await emailResponse.text();
      console.log("Email API Response Status:", emailResponse.status);
      console.log("Email API Response Body:", emailResponseBody);

      if (emailResponse.ok) {
        emailSent = true;
        console.log("Email berhasil dikirim");
      } else {
        emailError = `Status: ${emailResponse.status}, Body: ${emailResponseBody}`;
        console.error("Gagal mengirim email:", emailError);
      }
    } catch (error) {
      emailError = error.message;
      console.error("Error mengirim email:", error);
    }
    
    return NextResponse.json({ 
      success: whatsappSent || emailSent, 
      emailSent,
      whatsappSent,
      emailError,
      whatsappError,
      message: 'Notifikasi berhasil diproses' 
    });

  } catch (error) {
    console.error("Error keseluruhan dalam API notify:", error);
    return NextResponse.json(
      { success: false, message: `Terjadi kesalahan: ${error.message}` },
      { status: 500 }
    );
  }
}