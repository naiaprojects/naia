// app/api/discounts/validate/route.js
import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

// POST - Validate discount code
export async function POST(request) {
    const supabase = createClient();

    try {
        const body = await request.json();
        const { code, service_id, package_name, order_amount, order_type = 'services' } = body;

        if (!code) {
            return NextResponse.json({
                valid: false,
                error: 'Kode diskon diperlukan'
            });
        }

        // Fetch the discount by code
        const { data: discount, error } = await supabase
            .from('discounts')
            .select('*')
            .eq('code', code.toUpperCase())
            .eq('is_active', true)
            .single();

        if (error || !discount) {
            return NextResponse.json({
                valid: false,
                error: 'Kode diskon tidak ditemukan'
            });
        }

        // Check date validity
        const now = new Date();
        if (discount.start_date && new Date(discount.start_date) > now) {
            return NextResponse.json({
                valid: false,
                error: 'Kode diskon belum berlaku'
            });
        }
        if (discount.end_date && new Date(discount.end_date) < now) {
            return NextResponse.json({
                valid: false,
                error: 'Kode diskon sudah kadaluarsa'
            });
        }

        // Check usage limit
        if (discount.usage_limit && discount.usage_count >= discount.usage_limit) {
            return NextResponse.json({
                valid: false,
                error: 'Kode diskon sudah mencapai batas penggunaan'
            });
        }

        // Check applies_to
        if (discount.applies_to === 'services' && order_type !== 'services') {
            return NextResponse.json({
                valid: false,
                error: 'Kode diskon hanya berlaku untuk layanan'
            });
        }
        if (discount.applies_to === 'store' && order_type !== 'store') {
            return NextResponse.json({
                valid: false,
                error: 'Kode diskon hanya berlaku untuk produk store'
            });
        }

        // Check service_ids if specified
        if (discount.applies_to === 'services' && service_id &&
            discount.service_ids && discount.service_ids.length > 0) {
            if (!discount.service_ids.includes(service_id)) {
                return NextResponse.json({
                    valid: false,
                    error: 'Kode diskon tidak berlaku untuk layanan ini'
                });
            }
        }

        // Check package_names if specified
        if (package_name && discount.package_names && discount.package_names.length > 0) {
            if (!discount.package_names.includes(package_name)) {
                return NextResponse.json({
                    valid: false,
                    error: 'Kode diskon tidak berlaku untuk paket ini'
                });
            }
        }

        // Check minimum order amount
        const amount = parseFloat(order_amount) || 0;
        if (discount.min_order_amount && amount < discount.min_order_amount) {
            const formatPrice = (price) => new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0
            }).format(price);

            return NextResponse.json({
                valid: false,
                error: `Minimal pembelian ${formatPrice(discount.min_order_amount)} untuk menggunakan kode ini`
            });
        }

        // Calculate discount amount
        let discountAmount = 0;
        if (discount.discount_value_type === 'percentage') {
            discountAmount = (amount * discount.discount_value) / 100;
            // Apply max discount if set
            if (discount.max_discount_amount && discountAmount > discount.max_discount_amount) {
                discountAmount = discount.max_discount_amount;
            }
        } else {
            // Fixed amount
            discountAmount = discount.discount_value;
        }

        // Don't allow discount greater than order amount
        if (discountAmount > amount) {
            discountAmount = amount;
        }

        const finalAmount = amount - discountAmount;

        return NextResponse.json({
            valid: true,
            discount: {
                id: discount.id,
                code: discount.code,
                name: discount.name,
                discount_type: discount.discount_type,
                discount_value_type: discount.discount_value_type,
                discount_value: discount.discount_value,
                discount_amount: discountAmount,
                original_amount: amount,
                final_amount: finalAmount
            }
        });
    } catch (error) {
        console.error('Error validating discount:', error);
        return NextResponse.json({
            valid: false,
            error: 'Terjadi kesalahan saat validasi kode'
        }, { status: 500 });
    }
}
