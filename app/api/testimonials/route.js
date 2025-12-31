import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured');

    try {
        let query = supabase
            .from('testimonials')
            .select('*')
            .not('submitted_at', 'is', null)
            .order('submitted_at', { ascending: false });

        if (featured === 'true') {
            query = query.eq('is_featured', true);
        }

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json(data || []);
    } catch (error) {
        console.error('Error fetching testimonials:', error);
        return NextResponse.json([], { status: 500 });
    }
}

export async function POST(request) {
    const supabase = createClient();

    try {
        const body = await request.json();
        const { invoice_number, ratings, review_text } = body;

        if (!invoice_number || !ratings || !review_text) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields' },
                { status: 400 }
            );
        }

        const wordCount = review_text.trim().split(/\s+/).filter(w => w.length > 0).length;
        if (wordCount < 10 || wordCount > 30) {
            return NextResponse.json(
                { success: false, message: 'Review harus antara 10-30 kata' },
                { status: 400 }
            );
        }

        let orderData = null;
        let orderType = null;

        const { data: serviceOrder } = await supabase
            .from('orders')
            .select('id, customer_name, customer_email, package_name')
            .eq('invoice_number', invoice_number)
            .single();

        if (serviceOrder) {
            orderData = serviceOrder;
            orderType = 'service';
        } else {
            const { data: storeOrder } = await supabase
                .from('store_purchases')
                .select('id, customer_name, customer_email, item:store_items(name)')
                .eq('invoice_number', invoice_number)
                .single();

            if (storeOrder) {
                orderData = storeOrder;
                orderType = 'store';
            }
        }

        if (!orderData) {
            return NextResponse.json(
                { success: false, message: 'Invoice tidak ditemukan' },
                { status: 404 }
            );
        }

        const { data: existingTestimonial } = await supabase
            .from('testimonials')
            .select('id, review_link_expires_at')
            .eq(orderType === 'service' ? 'order_id' : 'store_order_id', orderData.id)
            .single();

        if (existingTestimonial) {
            if (existingTestimonial.review_link_expires_at) {
                const expiresAt = new Date(existingTestimonial.review_link_expires_at);
                const now = new Date();
                if (now > expiresAt) {
                    return NextResponse.json(
                        { success: false, message: 'Link testimoni sudah kadaluarsa' },
                        { status: 400 }
                    );
                }
            }

            const { error: updateError } = await supabase
                .from('testimonials')
                .update({
                    rating_service: ratings.rating_service,
                    rating_design: ratings.rating_design,
                    rating_communication: ratings.rating_communication,
                    review_text: review_text.trim(),
                    submitted_at: new Date().toISOString(),
                })
                .eq('id', existingTestimonial.id);

            if (updateError) throw updateError;
        } else {
            const testimonialData = {
                [orderType === 'service' ? 'order_id' : 'store_order_id']: orderData.id,
                customer_name: orderData.customer_name,
                customer_email: orderData.customer_email,
                rating_service: ratings.rating_service,
                rating_design: ratings.rating_design,
                rating_communication: ratings.rating_communication,
                review_text: review_text.trim(),
                submitted_at: new Date().toISOString(),
            };

            if (orderType === 'service') {
                testimonialData.service_name = orderData.package_name;
            } else {
                testimonialData.product_name = orderData.item?.name;
            }

            const { error: insertError } = await supabase
                .from('testimonials')
                .insert(testimonialData);

            if (insertError) throw insertError;
        }

        let discountData = null;
        if (wordCount >= 20) {
            const generateRandomCode = (invoice) => {
                const alphanumeric = invoice.replace(/[^a-zA-Z0-9]/g, '');
                let result = '';
                for (let i = 0; i < 5; i++) {
                    const randomIndex = Math.floor(Math.random() * alphanumeric.length);
                    result += alphanumeric[randomIndex].toUpperCase();
                }
                return result;
            };

            const discountCode = `DIS${generateRandomCode(invoice_number)}`;

            const { data: newDiscount, error: discountError } = await supabase
                .from('discounts')
                .insert({
                    code: discountCode,
                    description: `Diskon 30% dari testimoni invoice ${invoice_number}`,
                    discount_type: 'percentage',
                    discount_value: 30,
                    max_usage: 1,
                    usage_count: 0,
                    is_active: true,
                    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                })
                .select()
                .single();

            if (!discountError && newDiscount) {
                discountData = {
                    code: discountCode,
                    value: 30,
                };
            }
        }

        return NextResponse.json({
            success: true,
            discount: discountData,
        });
    } catch (error) {
        console.error('Error submitting testimonial:', error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}
