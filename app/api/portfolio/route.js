// app/api/portfolio/route.js
import { NextResponse } from 'next/server';
import { getPortfolioItems } from '@/lib/portfolio';

export async function GET() {
  try {
    const portfolioItems = getPortfolioItems();
    return NextResponse.json(portfolioItems);
  } catch (error) {
    console.error('Error fetching portfolio items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio items' },
      { status: 500 }
    );
  }
}