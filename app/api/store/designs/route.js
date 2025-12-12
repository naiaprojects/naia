// app/api/store/designs/route.js
import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all'); // Include inactive for admin

    try {
        let query = supabase
            .from('store_designs')
            .select('*')
            .order('name', { ascending: true });

        if (all !== 'true') {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;

        if (error) throw error;
        return NextResponse.json(data || []);
    } catch (error) {
        console.error('Error fetching designs:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    const supabase = createClient();

    try {
        const body = await request.json();

        const { data, error } = await supabase
            .from('store_designs')
            .insert([body])
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error creating design:', error);
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
            .from('store_designs')
            .update({ ...body, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error updating design:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const ids = searchParams.get('ids');

    try {
        let query = supabase.from('store_designs').delete();

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
        console.error('Error deleting design:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
