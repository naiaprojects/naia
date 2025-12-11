import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Portfolio from '@/components/Portfolio';
import ServicesList from '@/components/ServicesList';
import Testimoni from '../components/Testimoni';
import FAQ from '../components/FAQ';
import CTA from '../components/CTA';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Portfolio />
      <ServicesList />
      <Testimoni />
      <FAQ />
      <CTA />
      <Footer />
    </>
  );
}