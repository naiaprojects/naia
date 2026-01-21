'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';

const LogoPathAnimation = () => {
  const [logoSvg, setLogoSvg] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchLogoSvg = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'loading_logo_svg')
          .single();

        if (!error && data?.value) {
          setLogoSvg(data.value);
        }
      } catch (err) {
        console.error('Error fetching logo SVG:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogoSvg();
  }, []);

  if (loading) {
    return (
      <div className="w-24 h-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (logoSvg) {
    return (
      <div
        className="w-24 h-24"
        dangerouslySetInnerHTML={{ __html: logoSvg }}
      />
    );
  }

  return (
    <div className="w-24 h-24 flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-slate-900"></div>
    </div>
  );
};

export default LogoPathAnimation;

