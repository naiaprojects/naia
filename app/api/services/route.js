import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    try {
        let query = supabase.from('services').select('*');

        if (slug) {
            // Fetch single service by slug
            query = query.eq('slug', slug).single();
        } else {
            // Fetch all active services
            query = query.eq('is_active', true).order('created_at', { ascending: true });
        }

        const { data, error } = await query;

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    const supabase = createClient();
    try {
        const body = await request.json();
        const { data, error } = await supabase
            .from('services')
            .insert(body)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
