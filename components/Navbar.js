'use client';
import { useState } from 'react';
import Image from 'next/image';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 transition-transform duration-300 ease-in-out bg-white text-white shadow-lg z-50">
        <div className="max-w-6xl mx-auto py-3 px-4 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <a href="/" className="flex items-center space-x-3">
              <img
                src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhOLN4ocZGMeVkNriUp_4qZHx9l-4cFYbnKm_0iRYDs8y3t1mKauAcwYs52aj3Wpr30d3aOh6RpsK5eLhUM84ESx_U8h7eVr5d7ra3u11TfHCHJ0manoQBdC_Muyds_KFKION1JCF5tTjchNSfULuj5nUp7fkssXBpzCQ_dl8rSIab6Do8u2dKYvIQage0/w300/Logo-05.webp"
                alt="NaiaGrafika"
                className="h-8"
              />
            </a>
          </div>

          {/* Desktop Menu */}
          <nav className="hidden md:block">
            <ul className="flex space-x-8">
              <li>
                <a href="#pricelist" className="text-slate-800 hover:text-primary transition duration-300 font-medium">
                  Daftar Harga
                </a>
              </li>
              <li>
                <a href="#porto" className="text-slate-800 hover:text-primary transition duration-300 font-medium">
                  Portofolio
                </a>
              </li>
              <li>
                <a href="#testi" className="text-slate-800 hover:text-primary transition duration-300 font-medium">
                  Testimoni
                </a>
              </li>
              <li>
                <a href="#feature" className="text-slate-800 hover:text-primary transition duration-300 font-medium">
                  Fitur
                </a>
              </li>
              <li>
                <a href="#project" className="text-slate-800 hover:text-primary transition duration-300 font-medium">
                  Projek
                </a>
              </li>
              <li>
                <a href="#faq" className="text-slate-800 hover:text-primary transition duration-300 font-medium">
                  Pertanyaan
                </a>
              </li>
            </ul>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-2xl focus:outline-none text-slate-800" 
            onClick={toggleMobileMenu}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <>
          <div className="fixed top-0 left-0 h-full w-full bg-white shadow-lg z-50 md:hidden">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  NaiaGrafika
                </h3>
                <button 
                  onClick={closeMobileMenu}
                  className="p-1 rounded-sm text-gray-600 hover:text-gray-800"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <nav className="p-4">
              <ul className="space-y-4">
                <li>
                  <a href="#pricelist" onClick={closeMobileMenu} className="block py-2 text-gray-700 hover:text-orange-500 transition duration-300 font-medium">
                    Daftar Harga
                  </a>
                </li>
                <li>
                  <a href="#porto" onClick={closeMobileMenu} className="block py-2 text-gray-700 hover:text-orange-500 transition duration-300 font-medium">
                    Portofolio
                  </a>
                </li>
                <li>
                  <a href="#testi" onClick={closeMobileMenu} className="block py-2 text-gray-700 hover:text-orange-500 transition duration-300 font-medium">
                    Testimoni
                  </a>
                </li>
                <li>
                  <a href="#feature" onClick={closeMobileMenu} className="block py-2 text-gray-700 hover:text-orange-500 transition duration-300 font-medium">
                    Fitur
                  </a>
                </li>
                <li>
                  <a href="#project" onClick={closeMobileMenu} className="block py-2 text-gray-700 hover:text-orange-500 transition duration-300 font-medium">
                    Projek
                  </a>
                </li>
                <li>
                  <a href="#faq" onClick={closeMobileMenu} className="block py-2 text-gray-700 hover:text-orange-500 transition duration-300 font-medium">
                    Pertanyaan
                  </a>
                </li>
              </ul>
            </nav>
          </div>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={closeMobileMenu}></div>
        </>
      )}
    </>
  );
}