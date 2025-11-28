import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Jasa Custom Blogspot #1 Indonesia - NaiaGrafika.web.id",
  description: "Jasa desain & pembuatan web Blogspot custom. Percayakan website Anda kepada ahlinya, Naia.web.id",
  
  // Verification tags
  verification: {
    ahrefs: '6e00cc3bedc4ad9b17e2b0b942a509e980a44002129503e226f85aaf8d5b4f97',
    google: 'P5L3iI1lMz3S4ybT2S_677P_qtzkEt6OmnO62ce1hdU',
    yandex: '431053d7f22ad0e1',
    other: {
      'msvalidate.01': 'F0A680FAACA94F95586DCD0EA0F53940'
    }
  },
  
  // SEO tags
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
    'max-video-preview': -1
  },
  referrer: 'no-referrer-when-downgrade',
  keywords: [
    'jasa pembuatan web',
    'blogspot custom',
    'jasa blogspot',
    'template blogspot',
    'NaiaGrafika',
    'Naia.web.id',
    'jasa desain blogspot'
  ],
  
  // Open Graph
  openGraph: {
    description: 'Jasa desain & pembuatan web Blogspot custom. Percayakan website Anda kepada ahlinya, Naia.web.id',
    locale: 'id_ID',
    type: 'website',
  },
  
  // Twitter
  twitter: {
    description: 'Jasa desain & pembuatan web Blogspot custom. Percayakan website Anda kepada ahlinya, Naia.web.id',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Naia Grafika",
              "url": "https://www.naia.web.id",
              "logo": "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhOLN4ocZGMeVkNriUp_4qZHx9l-4cFYbnKm_0iRYDs8y3t1mKauAcwYs52aj3Wpr30d3aOh6RpsK5eLhUM84ESx_U8h7eVr5d7ra3u11TfHCHJ0manoQBdC_Muyds_KFKION1JCF5tTjchNSfULuj5nUp7fkssXBpzCQ_dl8rSIab6Do8u2dKYvIQage0/s600/Logo-05.webp",
              "description": "Jasa desain & pembuatan web Blogspot custom. Percayakan website Anda kepada ahlinya, Naia.web.id",
              "sameAs": ["https://www.facebook.com/naia.web.id"],
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+62-813-2085-8595",
                "contactType": "Customer Service",
                "areaServed": "ID",
                "availableLanguage": ["Indonesian", "English"]
              }
            })
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}