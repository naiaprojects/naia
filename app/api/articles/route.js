import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const limit = searchParams.get('limit');
    const search = searchParams.get('search');

    try {
        let query = supabase
            .from('articles')
            .select(`
                *,
                category:categories(id, name, slug)
            `)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        if (category) {
            query = query.eq('category_id', category);
        }

        if (featured === 'true') {
            query = query.eq('is_featured', true);
        }

        if (search) {
            query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
        }

        if (limit) {
            query = query.limit(parseInt(limit));
        }

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json(data || []);
    } catch (error) {
        console.error('Error fetching articles:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    const supabase = createClient();

    try {
        const body = await request.json();

        const { error } = await supabase
            .from('articles')
            .insert(body);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error creating article:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
