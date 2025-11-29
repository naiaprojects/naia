// next.config.mjs

// 1. Impor fungsi withPWA dari library yang sudah diinstall
import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true, // Konfigurasi Anda yang sudah ada tetap di sini
};

// 2. Bungkus konfigurasi Anda dengan withPWA dan export
export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  // Pro-Tip: Nonaktifkan PWA saat development agar cache tidak mengganggu
  disable: process.env.NODE_ENV === 'development',
})(nextConfig);