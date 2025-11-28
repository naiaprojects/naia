import fs from 'fs';
import path from 'path';

export function getPortfolioItems() {
  const portfolioDirectory = path.join(process.cwd(), 'public/portfolio');
  
  try {
    const fileNames = fs.readdirSync(portfolioDirectory);
    
    const portfolioItems = fileNames
      .filter(fileName => /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName))
      .map(fileName => {
        // Remove file extension to get title/link
        const title = fileName.replace(/\.[^/.]+$/, "");
        
        return {
          image: `/portfolio/${fileName}`,
          alt: title,
          title: title,
          link: title.startsWith('www.') ? `https://${title}` : `https://www.${title}`
        };
      });
    
    return portfolioItems;
  } catch (error) {
    console.error('Error reading portfolio directory:', error);
    return [];
  }
}