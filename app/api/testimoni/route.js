// app/api/testimoni/route.js
import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('testimoni_items')
      .select('*')
      .eq('is_active', true)
      .order('position', { ascending: true });

    if (error) throw error;

    // Transform data to match expected format
    const testimoniData = data.map(item => ({
      id: item.id,
      image: item.image_url,
      alt: item.alt || 'Testimoni'
    }));

    return NextResponse.json(testimoniData);
  } catch (error) {
    console.error('Error fetching testimoni:', error);
    return NextResponse.json([], { status: 500 });
  }
}