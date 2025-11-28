import { getPortfolioItems } from '@/lib/portfolio';
import Portfolio from '@/components/Portfolio';

export default function PortfolioPage() {
  const portfolioData = getPortfolioItems();
  
  return <Portfolio portfolioData={portfolioData} />;
}