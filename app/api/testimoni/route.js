import { NextResponse } from 'next/server';
import { getTestimoniItems } from '@/lib/testimoni';

export async function GET() {
  try {
    const testimoniItems = getTestimoniItems();
    return NextResponse.json(testimoniItems);
  } catch (error) {
    console.error('Error fetching testimoni items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch testimoni items' },
      { status: 500 }
    );
  }
}