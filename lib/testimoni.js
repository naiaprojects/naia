import fs from 'fs';
import path from 'path';

export function getTestimoniItems() {
  const testimoniDirectory = path.join(process.cwd(), 'public/testimoni');
  
  try {
    const fileNames = fs.readdirSync(testimoniDirectory);
    
    const testimoniItems = fileNames
      .filter(fileName => /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName))
      .map((fileName, index) => {
        // Remove file extension to get alt text
        const alt = fileName.replace(/\.[^/.]+$/, "");
        
        return {
          id: index + 1,
          image: `/testimoni/${fileName}`,
          alt: alt
        };
      });
    
    return testimoniItems;
  } catch (error) {
    console.error('Error reading testimoni directory:', error);
    return [];
  }
}