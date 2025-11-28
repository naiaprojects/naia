// app/api/notify-admin/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Data yang diterima dari form
    const { message, customerName, customerPhone, invoiceNumber } = data;
    
    // Kirim notifikasi WhatsApp ke admin menggunakan watsap.id API
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
          message: message,
        }),
      });
      
      if (whatsappResponse.ok) {
        console.log('Notifikasi admin berhasil dikirim');
        return NextResponse.json({ 
          success: true, 
          message: 'Notifikasi admin berhasil dikirim' 
        });
      } else {
        console.error('Gagal mengirim notifikasi admin:', await whatsappResponse.text());
        return NextResponse.json(
          { success: false, message: 'Gagal mengirim notifikasi admin' },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error('Error mengirim notifikasi admin:', error);
      return NextResponse.json(
        { success: false, message: 'Error mengirim notifikasi admin' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error dalam API notify-admin:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat mengirim notifikasi admin' },
      { status: 500 }
    );
  }
}