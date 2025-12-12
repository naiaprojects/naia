// app/api/store/purchases/route.js
import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);

    const invoice = searchParams.get('invoice');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    try {
        let query = supabase
            .from('store_purchases')
            .select(`
                *,
                item:store_items(id, name, slug, thumbnail_url, price, price_type)
            `, { count: 'exact' });

        // Single purchase by invoice
        if (invoice) {
            query = query.eq('invoice_number', invoice).single();
            const { data, error } = await query;
            if (error) throw error;
            return NextResponse.json(data);
        }

        // Filter by status
        if (status) {
            query = query.eq('payment_status', status);
        }

        // Pagination
        const offset = (page - 1) * limit;
        query = query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) throw error;

        return NextResponse.json({
            purchases: data || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching purchases:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    const supabase = createClient();

    try {
        const body = await request.json();

        // Generate invoice number
        const now = new Date();
        const invoiceNumber = `STR-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

        const purchaseData = {
            invoice_number: invoiceNumber,
            item_id: body.item_id,
            customer_name: body.customer_name,
            customer_email: body.customer_email,
            customer_phone: body.customer_phone || null,
            amount: body.amount,
            payment_status: 'pending',
            notes: body.notes || null
        };

        const { data, error } = await supabase
            .from('store_purchases')
            .insert([purchaseData])
            .select(`
                *,
                item:store_items(id, name, slug, thumbnail_url, price, price_type)
            `)
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error creating purchase:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const ids = searchParams.get('ids'); // For bulk update

    try {
        const body = await request.json();
        const updateData = { ...body, updated_at: new Date().toISOString() };

        let query = supabase.from('store_purchases').update(updateData);

        if (ids) {
            const idArray = ids.split(',');
            query = query.in('id', idArray);
        } else if (id) {
            query = query.eq('id', id);
        }

        const { data, error } = await query.select(`
            *,
            item:store_items(id, name, slug, thumbnail_url, price, price_type)
        `);

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error updating purchase:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const ids = searchParams.get('ids');

    try {
        let query = supabase.from('store_purchases').delete();

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
        console.error('Error deleting purchase:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
