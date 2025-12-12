// app/api/store/items/route.js
import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);

    const slug = searchParams.get('slug');
    const category = searchParams.get('category');
    const design = searchParams.get('design');
    const priceType = searchParams.get('price_type');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const featured = searchParams.get('featured');

    try {
        let query = supabase
            .from('store_items')
            .select(`
                *,
                category:store_categories(id, name, slug),
                design:store_designs(id, name, slug)
            `, { count: 'exact' });

        // Single item by slug
        if (slug) {
            query = query.eq('slug', slug).single();
            const { data, error } = await query;
            if (error) throw error;
            return NextResponse.json(data);
        }

        // Filters
        query = query.eq('is_active', true);

        if (category) {
            query = query.eq('category_id', category);
        }

        if (design) {
            query = query.eq('design_id', design);
        }

        if (priceType) {
            query = query.eq('price_type', priceType);
        }

        if (featured === 'true') {
            query = query.eq('featured', true);
        }

        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
        }

        // Pagination
        const offset = (page - 1) * limit;
        query = query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) throw error;

        return NextResponse.json({
            items: data || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching store items:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    const supabase = createClient();

    try {
        const body = await request.json();

        const { data, error } = await supabase
            .from('store_items')
            .insert([body])
            .select(`
                *,
                category:store_categories(id, name, slug),
                design:store_designs(id, name, slug)
            `)
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error creating store item:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    try {
        const body = await request.json();

        const { data, error } = await supabase
            .from('store_items')
            .update({ ...body, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select(`
                *,
                category:store_categories(id, name, slug),
                design:store_designs(id, name, slug)
            `)
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error updating store item:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const ids = searchParams.get('ids'); // For bulk delete

    try {
        let query = supabase.from('store_items').delete();

        if (ids) {
            const idArray = ids.split(',');
            query = query.in('id', idArray);
        } else if (id) {
            query = query.eq('id', id);
        }

        const { error } = await query;
        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting store item:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
