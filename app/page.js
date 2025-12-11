import { createClient } from '@/lib/supabase-server';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Portfolio from '@/components/Portfolio';
import ServicesList from '@/components/ServicesList';
import Testimoni from '../components/Testimoni';
import FAQ from '../components/FAQ';
import CTA from '../components/CTA';
import Footer from '../components/Footer';

async function getHomeData() {
  const supabase = createClient();

  const [portfolioRes, servicesRes, testimoniRes, faqRes, settingsRes] = await Promise.all([
    supabase.from('portfolio_items').select('*').eq('is_active', true).order('position', { ascending: true }),
    supabase.from('services').select('*').eq('is_active', true).order('created_at', { ascending: true }),
    supabase.from('testimoni_items').select('*').eq('is_active', true).order('position', { ascending: true }),
    supabase.from('faq_items').select('*').eq('is_active', true).order('position', { ascending: true }),
    supabase.from('site_settings').select('key, value')
  ]);

  // Transform portfolio data to match expected format
  const portfolio = (portfolioRes.data || []).map(item => ({
    image: item.image_url,
    title: item.title,
    link: item.link || '#',
    alt: item.alt || item.title
  }));

  // Transform testimoni data to match expected format
  const testimoni = (testimoniRes.data || []).map(item => ({
    id: item.id,
    image: item.image_url,
    alt: item.alt || 'Testimoni'
  }));

  // Convert settings array to object
  const settings = {};
  settingsRes.data?.forEach(item => {
    settings[item.key] = item.value;
  });

  return {
    portfolio,
    services: servicesRes.data || [],
    testimoni,
    faq: faqRes.data || [],
    settings
  };
}

export default async function Home() {
  const { portfolio, services, testimoni, faq, settings } = await getHomeData();

  return (
    <>
      <Navbar />
      <Hero />
      <Portfolio data={portfolio} />
      <ServicesList data={services} />
      <Testimoni data={testimoni} />
      <FAQ data={faq} />
      <CTA data={settings} />
      <Footer />
    </>
  );
}