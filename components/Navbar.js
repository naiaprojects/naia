// components/Navbar.js
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navItems, setNavItems] = useState([]);
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    fetchNavData();
  }, []);

  const fetchNavData = async () => {
    try {
      // Fetch navigation items
      const { data: navData, error: navError } = await supabase
        .from('navigation_items')
        .select('*')
        .eq('is_active', true)
        .order('position', { ascending: true });

      if (navError) throw navError;
      setNavItems(navData || []);

      // Fetch logo URL
      const { data: settingsData, error: settingsError } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'logo_url')
        .single();

      if (settingsError) throw settingsError;
      setLogoUrl(settingsData?.value || '');
    } catch (error) {
      console.error('Error fetching navbar data:', error);
    }
  };

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
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt="NaiaGrafika"
                  className="h-8"
                />
              )}
            </a>
          </div>

          {/* Desktop Menu */}
          <nav className="hidden md:block">
            <ul className="flex space-x-8">
              {navItems.map((item) => (
                <li key={item.id}>
                  <a 
                    href={item.href} 
                    className="text-slate-800 hover:text-primary transition duration-300 font-medium"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
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
                {navItems.map((item) => (
                  <li key={item.id}>
                    <a 
                      href={item.href} 
                      onClick={closeMobileMenu} 
                      className="block py-2 text-gray-700 hover:text-orange-500 transition duration-300 font-medium"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={closeMobileMenu}></div>
        </>
      )}
    </>
  );
}