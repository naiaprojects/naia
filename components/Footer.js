// components/Footer.js
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [footerData, setFooterData] = useState({
    links: {},
    social: [],
    settings: {}
  });

  useEffect(() => {
    fetchFooterData();
  }, []);

  const fetchFooterData = async () => {
    try {
      // Fetch footer links
      const { data: linksData, error: linksError } = await supabase
        .from('footer_links')
        .select('*')
        .eq('is_active', true)
        .order('category, position');

      // Fetch social links
      const { data: socialData, error: socialError } = await supabase
        .from('social_links')
        .select('*')
        .eq('is_active', true)
        .order('position');

      // Fetch settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('site_settings')
        .select('*')
        .in('key', ['logo_url', 'footer_text', 'site_url']);

      if (linksError) throw linksError;
      if (socialError) throw socialError;
      if (settingsError) throw settingsError;

      // Group links by category
      const groupedLinks = {};
      linksData?.forEach(link => {
        if (!groupedLinks[link.category]) {
          groupedLinks[link.category] = [];
        }
        groupedLinks[link.category].push(link);
      });

      // Convert settings array to object
      const settingsObj = {};
      settingsData?.forEach(setting => {
        settingsObj[setting.key] = setting.value;
      });

      setFooterData({
        links: groupedLinks,
        social: socialData || [],
        settings: settingsObj
      });
    } catch (error) {
      console.error('Error fetching footer data:', error);
    }
  };

  const categoryTitles = {
    naia: 'Naia',
    products: 'Products',
    resources: 'Resources',
    support: 'Support'
  };

  return (
    <footer className="w-full bg-gray-900">
      <div className="mx-auto max-w-7xl px-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 lg:gap-8 gap-12 pt-14 pb-20 max-w-md mx-auto md:max-w-xl lg:max-w-full">
          {/* Footer Links by Category */}
          {Object.entries(footerData.links).map(([category, links]) => (
            <div key={category} className="block">
              <h4 className="text-xl text-white font-medium mb-7">
                {categoryTitles[category] || category}
              </h4>
              <ul className="transition-all duration-500">
                {links.map((link) => (
                  <li key={link.id} className="mb-6">
                    <Link 
                      href={link.href} 
                      className="text-gray-400 hover:text-white transition-colors duration-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="py-7 border-t border-gray-700">
          <div className="flex items-center justify-center flex-col lg:space-y-0 space-y-8 lg:justify-between lg:flex-row">
            {/* Logo */}
            <div className="transition duration-300">
              <Link 
                className="flex items-center space-x-3 rtl:space-x-reverse" 
                href={footerData.settings.site_url || "https://www.naia.web.id/"}
                title={footerData.settings.footer_text}
              >
                {footerData.settings.logo_url && (
                  <img 
                    alt={footerData.settings.footer_text}
                    className="h-8 brightness-0 invert opacity-90" 
                    src={footerData.settings.logo_url}
                    title={footerData.settings.footer_text}
                  />
                )}
              </Link>
            </div>

            {/* Copyright */}
            <span className="text-gray-400 block">
              <Link 
                href={footerData.settings.site_url || "https://www.naia.web.id/"} 
                className="hover:text-white transition-colors duration-300"
              >
                {footerData.settings.footer_text || 'NaiaGrafika'}
              </Link> © {currentYear}, All rights reserved.
            </span>

            {/* Social Links */}
            <div className="flex mt-4 space-x-4 sm:justify-center sm:mt-0">
              {footerData.social.map((social) => (
                <Link
                  key={social.id}
                  href={social.href}
                  className="w-9 h-9 rounded-full border border-gray-700 flex justify-center items-center hover:border-primary transition-colors duration-300"
                  aria-label={social.name}
                  dangerouslySetInnerHTML={{ __html: social.icon_svg }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;