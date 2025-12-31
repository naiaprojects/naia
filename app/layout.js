// app/layout.js
import { createClient } from '@/lib/supabase-server';
import SupabaseProvider from '@/components/supabase-provider';
import { LanguageProvider } from '@/lib/LanguageContext';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
import { Inter } from "next/font/google";
import "./globals.css";
import PageViewTracker from '@/components/PageViewTracker';

import Script from 'next/script';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

// Disable caching untuk layout ini
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getSiteSettings() {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value');

    if (error) throw error;

    const settings = {};
    data?.forEach(item => {
      settings[item.key] = item.value;
    });

    return settings;
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return {
      site_title: 'Jasa Custom Blogspot #1 Indonesia - NaiaGrafika.web.id',
      site_description: 'Jasa desain & pembuatan web Blogspot custom. Percayakan website Anda kepada ahlinya, Naia.web.id',
      logo_url: '',
      site_url: 'https://www.naia.web.id',
      meta_keywords: 'jasa pembuatan web,blogspot custom',
      google_verification: '',
      company_phone: '',
      primary_color: '#14dff2',
      secondary_color: '#3ebded',
      favicon_url: '',
      app_icon_url: ''
    };
  }
}

export async function generateMetadata() {
  const settings = await getSiteSettings();

  return {
    title: {
      default: settings.site_title || "Jasa Custom Blogspot #1 Indonesia - NaiaGrafika.web.id",
      template: `%s - ${settings.site_title || "Jasa Custom Blogspot #1 Indonesia - NaiaGrafika.web.id"}`
    },
    description: settings.site_description || "Jasa desain & pembuatan web Blogspot custom.",
    verification: {
      google: settings.google_verification || '',
      other: {
        'ahrefs-site-verification': settings.meta_ahrefs_verification || '',
        'yandex-verification': settings.meta_yandex_verification || '',
        'msvalidate.01': settings.meta_bing_verification || '',
      }
    },
    robots: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1
    },
    referrer: 'no-referrer-when-downgrade',
    keywords: settings.meta_keywords?.split(',') || [],

    // --- PWA Configuration ---
    manifest: '/manifest.webmanifest',
    themeColor: settings.primary_color || '#14dff2',
    icons: {
      icon: settings.favicon_url || '/icons/icon-192x192.png',
      apple: settings.app_icon_url || '/icons/icon-192x192.png',
      other: [
        {
          rel: 'icon',
          url: settings.favicon_url || '/icons/icon-192x192.png',
        },
      ],
    },

    openGraph: {
      description: settings.site_description || '',
      locale: 'id_ID',
      type: 'website',
      url: settings.site_url || '',
      siteName: settings.site_title || '',
    },
    twitter: {
      description: settings.site_description || '',
    },
  };
}

export default async function RootLayout({ children }) {
  const settings = await getSiteSettings();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Naia Grafika",
    "url": settings.site_url || "https://www.naia.web.id",
    "logo": settings.logo_url || "",
    "description": settings.site_description || "",
    "sameAs": ["https://www.facebook.com/naia.web.id"],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": settings.company_phone || "",
      "contactType": "Customer Service",
      "areaServed": "ID",
      "availableLanguage": ["Indonesian", "English"]
    }
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData)
          }}
        />
      </head>
      <body className={`${inter.variable} antialiased bg-slate-100`}>
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              --color-primary: ${settings.primary_color || '#14dff2'};
              --color-secondary: ${settings.secondary_color || '#3ebded'};
            }
          `
        }} />
        <SupabaseProvider>
          <LanguageProvider>
            <PageViewTracker />
            <Script
              async
              src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9155919467624383"
              crossOrigin="anonymous"
              strategy="afterInteractive"
            />
            {children}
            <FloatingWhatsApp />
          </LanguageProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}