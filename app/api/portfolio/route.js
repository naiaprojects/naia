// app/api/portfolio/route.js
import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('portfolio_items')
      .select('*')
      .eq('is_active', true)
      .order('position', { ascending: true });

    if (error) throw error;

    // Transform data to match expected format
    const portfolioData = data.map(item => ({
      image: item.image_url,
      title: item.title,
      link: item.link || '#',
      alt: item.alt || item.title
    }));

    return NextResponse.json(portfolioData);
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return NextResponse.json([], { status: 500 });
  }
}