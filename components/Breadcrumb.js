// components/Breadcrumb.js
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Breadcrumb() {
  const pathname = usePathname();

  // Mapping path ke label yang user-friendly
  const pathLabels = {
    '/dashboard': 'Dashboard',
    '/dashboard/invoices': 'Pesanan',
    '/dashboard/portfolio': 'Portfolio',
    '/dashboard/packages': 'Pricelist',
    '/dashboard/testimoni': 'Testimoni',
    '/dashboard/faq': 'FAQ',
    '/dashboard/settings': 'Website',
    '/dashboard/navigation': 'Navigation',
    '/dashboard/hero': 'Hero',
    '/dashboard/footer': 'Footer',
    '/dashboard/bank-accounts': 'Bank',
  };

  // Generate breadcrumb items dari pathname
  const generateBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs = [
      { label: 'Home', href: '/', active: false }
    ];

    let currentPath = '';
    paths.forEach((path, index) => {
      currentPath += `/${path}`;
      const isLast = index === paths.length - 1;
      
      breadcrumbs.push({
        label: pathLabels[currentPath] || path.charAt(0).toUpperCase() + path.slice(1),
        href: currentPath,
        active: isLast
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <nav className="flex mb-2" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.href} className={index === 0 ? 'inline-flex items-center' : ''}>
            {index === 0 ? (
              <Link 
                href={crumb.href} 
                className="text-slate-700 inline-flex items-center text-sm font-medium hover:text-primary transition-colors"
              >
                <svg 
                  className="w-4 h-4 me-1.5" 
                  aria-hidden="true" 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    stroke="currentColor" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="m4 12 8-8 8 8M6 10.5V19a1 1 0 0 0 1 1h3v-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3h3a1 1 0 0 0 1-1v-8.5"
                  />
                </svg>
                {crumb.label}
              </Link>
            ) : crumb.active ? (
              <div className="flex items-center space-x-1.5">
                <svg 
                  className="w-3.5 h-3.5 rtl:rotate-180 text-slate-400" 
                  aria-hidden="true" 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    stroke="currentColor" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="m9 5 7 7-7 7"
                  />
                </svg>
                <span className="text-slate-400 inline-flex items-center text-sm font-medium">
                  {crumb.label}
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5">
                <svg 
                  className="w-3.5 h-3.5 rtl:rotate-180 text-slate-400" 
                  aria-hidden="true" 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    stroke="currentColor" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="m9 5 7 7-7 7"
                  />
                </svg>
                <Link 
                  href={crumb.href} 
                  className="text-slate-700 inline-flex items-center text-sm font-medium hover:text-primary transition-colors"
                >
                  {crumb.label}
                </Link>
              </div>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}