// app/api/orders/route.js
import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST(request) {
    const supabase = createClient();

    try {
        const body = await request.json();

        const orderData = {
            invoice_number: body.invoiceNumber,
            customer_name: body.customer.name,
            customer_email: body.customer.email,
            customer_phone: body.customer.phone,
            package_name: body.package.name,
            package_price: body.amount,
            payment_method: body.paymentMethod,
            payment_status: 'pending',
            notes: JSON.stringify(body.briefingData)
        };

        const { data, error } = await supabase
            .from('orders')
            .insert([orderData])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Error creating order:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function GET(request) {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const invoice = searchParams.get('invoice');

    try {
        let query = supabase.from('orders').select('*');

        if (invoice) {
            query = query.eq('invoice_number', invoice);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json(data || []);
    } catch (error) {
        console.error('Error fetching orders:', error);
        return NextResponse.json([], { status: 500 });
    }
}