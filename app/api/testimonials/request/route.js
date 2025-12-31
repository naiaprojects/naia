import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request) {
    const supabase = createClient();

    try {
        const body = await request.json();
        const { invoice_number, order_type } = body;

        if (!invoice_number || !order_type) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields' },
                { status: 400 }
            );
        }

        let orderData = null;
        let orderId = null;

        if (order_type === 'service') {
            const { data, error } = await supabase
                .from('orders')
                .select('id, customer_name, customer_email, package_name, payment_status')
                .eq('invoice_number', invoice_number)
                .single();

            if (error || !data) {
                return NextResponse.json(
                    { success: false, message: 'Order tidak ditemukan' },
                    { status: 404 }
                );
            }

            orderData = data;
            orderId = data.id;
        } else if (order_type === 'store') {
            const { data, error } = await supabase
                .from('store_purchases')
                .select('id, customer_name, customer_email, payment_status, item:store_items(name)')
                .eq('invoice_number', invoice_number)
                .single();

            if (error || !data) {
                return NextResponse.json(
                    { success: false, message: 'Purchase tidak ditemukan' },
                    { status: 404 }
                );
            }

            orderData = data;
            orderId = data.id;
        } else {
            return NextResponse.json(
                { success: false, message: 'Invalid order type' },
                { status: 400 }
            );
        }

        if (orderData.payment_status !== 'verified') {
            return NextResponse.json(
                { success: false, message: 'Order harus verified untuk request testimonial' },
                { status: 400 }
            );
        }

        const token = crypto.randomBytes(32).toString('hex');
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const { data: existingTestimonial } = await supabase
            .from('testimonials')
            .select('id, submitted_at')
            .eq(order_type === 'service' ? 'order_id' : 'store_order_id', orderId)
            .single();

        if (existingTestimonial) {
            if (existingTestimonial.submitted_at) {
                return NextResponse.json({
                    success: true,
                    link: `${process.env.NEXT_PUBLIC_SITE_URL}/review/${invoice_number}`,
                    already_submitted: true,
                });
            }

            const { error: updateError } = await supabase
                .from('testimonials')
                .update({
                    token,
                    review_link_generated_at: now.toISOString(),
                    review_link_expires_at: expiresAt.toISOString(),
                })
                .eq('id', existingTestimonial.id);

            if (updateError) throw updateError;
        } else {
            const testimonialData = {
                [order_type === 'service' ? 'order_id' : 'store_order_id']: orderId,
                customer_name: orderData.customer_name,
                customer_email: orderData.customer_email,
                token,
                review_link_generated_at: now.toISOString(),
                review_link_expires_at: expiresAt.toISOString(),
            };

            if (order_type === 'service') {
                testimonialData.service_name = orderData.package_name;
            } else {
                testimonialData.product_name = orderData.item?.name;
            }

            const { error: insertError } = await supabase
                .from('testimonials')
                .insert(testimonialData);

            if (insertError) throw insertError;
        }

        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://naia.web.id';
        const reviewLink = `${baseUrl}/review/${invoice_number}`;

        return NextResponse.json({
            success: true,
            link: reviewLink,
            expires_at: expiresAt.toISOString(),
        });
    } catch (error) {
        console.error('Error generating testimonial link:', error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}
