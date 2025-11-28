import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Portfolio from '@/components/Portfolio';
import PriceList from '../components/PriceList';
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
      <PriceList />
      <Testimoni />
      <FAQ />
      <CTA />
      <Footer />
    </>
  );
}