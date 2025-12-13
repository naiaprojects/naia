// components/dashboard-nav.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardNav({ isCollapsed, isMobileMenuOpen, onCloseMobileMenu }) {
  const pathname = usePathname();
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    fetchLogo();
  }, []);

  const fetchLogo = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setLogoUrl(data.logo_url || '');
      }
    } catch (error) {
      console.error('Error fetching logo:', error);
    }
  };

  // Main Menu Items
  const mainMenuItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      name: 'Orders',
      href: '/dashboard/orders',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      name: 'Services',
      href: '/dashboard/services',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    },
    {
      name: 'Store',
      href: '/dashboard/store',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" strokeWidth={2} d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
        </svg>

      )
    },

    {
      name: 'Discounts',
      href: '/dashboard/discounts',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" strokeWidth={2} d="m9 14.25 6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185ZM9.75 9h.008v.008H9.75V9Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm4.125 4.5h.008v.008h-.008V13.5Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
        </svg>
      )
    },

    {
      name: 'Portfolio',
      href: '/dashboard/portfolio',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      name: 'Testimonials',
      href: '/dashboard/testimoni',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      )
    },
    {
      name: 'Pages',
      href: '/dashboard/pages',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      name: 'FAQ',
      href: '/dashboard/faq',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
  ];

  return (
    <>
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onCloseMobileMenu}
        />
      )}

      {/* Sidebar - Fixed, full height, high z-index to overlap header */}
      <aside className={`
        fixed top-0 left-0 h-screen
        ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} w-64
        bg-white shadow-lg border-r border-slate-200
        flex flex-col z-50
        transform transition-all duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo Section */}
        <div className={`p-4 border-b border-slate-100 ${isCollapsed ? 'lg:flex lg:justify-center lg:px-2' : ''}`}>
          <Link href="/dashboard" className="flex items-center gap-3">
            {/* Collapsed: Show icon */}
            {isCollapsed ? (
              <div className="hidden lg:block">
                <img
                  src="/icons/icon-192x192.png"
                  alt="Logo"
                  className="w-10 h-10 rounded-xl object-contain"
                />
              </div>
            ) : (
              /* Expanded: Show full logo from settings */
              <div className="hidden lg:block">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="h-10 object-contain max-w-[180px]"
                  />
                ) : (
                  <div className="flex items-center gap-3">
                    <img
                      src="/icons/icon-192x192.png"
                      alt="Logo"
                      className="w-10 h-10 rounded-xl object-contain"
                    />
                    <div>
                      <h2 className="text-lg font-bold text-slate-800">Naia Grafika</h2>
                      <p className="text-xs text-slate-500">Admin Panel</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile: Always show full logo or fallback */}
            <div className="lg:hidden">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-10 object-contain max-w-[180px]"
                />
              ) : (
                <div className="flex items-center gap-3">
                  <img
                    src="/icons/icon-192x192.png"
                    alt="Logo"
                    className="w-10 h-10 rounded-xl object-contain"
                  />
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Naia Grafika</h2>
                    <p className="text-xs text-slate-500">Admin Panel</p>
                  </div>
                </div>
              )}
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {/* Main Menu Section */}
          <div>
            {!isCollapsed && (
              <div className="px-4 py-2">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Main Menu</h3>
              </div>
            )}
            {mainMenuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobileMenu}
                  title={isCollapsed ? item.name : undefined}
                  className={`
                    flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl
                    text-slate-600 hover:bg-slate-50 hover:text-slate-900
                    transition-all duration-200 group
                    ${isActive ? 'bg-primary/10 text-primary font-medium' : ''}
                    ${isCollapsed ? 'lg:justify-center lg:px-2' : ''}
                  `}
                >
                  <span className={`flex-shrink-0 ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'}`}>
                    {item.icon}
                  </span>
                  {!isCollapsed && <span className="hidden lg:block">{item.name}</span>}
                  <span className="lg:hidden">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </aside>
    </>
  );
}