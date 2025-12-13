// app/api/discounts/route.js
import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

// GET - Fetch discounts
// Public: Get active auto-discounts for specific service
// Admin: Get all discounts
export async function GET(request) {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);

    const serviceId = searchParams.get('service_id');
    const packageName = searchParams.get('package_name');
    const type = searchParams.get('type'); // 'auto' or 'code'
    const all = searchParams.get('all'); // 'true' for admin to get all

    try {
        let query = supabase.from('discounts').select('*');

        // If fetching all for admin
        if (all === 'true') {
            query = query.order('created_at', { ascending: false });
        } else {
            // Public query - only active and valid date range
            const now = new Date().toISOString();
            query = query
                .eq('is_active', true)
                .or(`start_date.is.null,start_date.lte.${now}`)
                .or(`end_date.is.null,end_date.gte.${now}`);

            // Filter by type if specified
            if (type) {
                query = query.eq('discount_type', type);
            }

            // For auto discounts on services
            if (type === 'auto' && serviceId) {
                query = query.or(`applies_to.eq.all,applies_to.eq.services`);
            }
        }

        const { data, error } = await query;

        if (error) throw error;

        // Additional filtering for service-specific discounts
        let filteredData = data || [];

        if (serviceId && type === 'auto') {
            filteredData = filteredData.filter(discount => {
                // Check if applies to all or to this specific service
                if (discount.applies_to === 'all') return true;
                if (discount.applies_to === 'services') {
                    // Check if service is in service_ids array
                    if (!discount.service_ids || discount.service_ids.length === 0) return true;
                    return discount.service_ids.includes(serviceId);
                }
                return false;
            });

            // Filter by package name if specified
            if (packageName) {
                filteredData = filteredData.filter(discount => {
                    if (!discount.package_names || discount.package_names.length === 0) return true;
                    return discount.package_names.includes(packageName);
                });
            }

            // Check usage limits
            filteredData = filteredData.filter(discount => {
                if (!discount.usage_limit) return true;
                return discount.usage_count < discount.usage_limit;
            });
        }

        return NextResponse.json(filteredData);
    } catch (error) {
        console.error('Error fetching discounts:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST - Create new discount (Admin only)
export async function POST(request) {
    const supabase = createClient();

    try {
        const body = await request.json();

        const discountData = {
            code: body.code,
            name: body.name,
            description: body.description || null,
            discount_type: body.discount_type || 'code',
            discount_value_type: body.discount_value_type || 'percentage',
            discount_value: parseFloat(body.discount_value) || 0,
            applies_to: body.applies_to || 'all',
            service_ids: body.service_ids || [],
            package_names: body.package_names || [],
            min_order_amount: parseFloat(body.min_order_amount) || 0,
            max_discount_amount: body.max_discount_amount ? parseFloat(body.max_discount_amount) : null,
            usage_limit: body.usage_limit ? parseInt(body.usage_limit) : null,
            start_date: body.start_date || null,
            end_date: body.end_date || null,
            is_active: body.is_active !== false
        };

        const { data, error } = await supabase
            .from('discounts')
            .insert([discountData])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Error creating discount:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// PUT - Update discount (Admin only)
export async function PUT(request) {
    const supabase = createClient();

    try {
        const body = await request.json();
        const { id, ...updateData } = body;

        if (!id) {
            return NextResponse.json({ success: false, error: 'Discount ID required' }, { status: 400 });
        }

        // Parse numeric fields
        if (updateData.discount_value !== undefined) {
            updateData.discount_value = parseFloat(updateData.discount_value);
        }
        if (updateData.min_order_amount !== undefined) {
            updateData.min_order_amount = parseFloat(updateData.min_order_amount);
        }
        if (updateData.max_discount_amount !== undefined) {
            updateData.max_discount_amount = updateData.max_discount_amount ? parseFloat(updateData.max_discount_amount) : null;
        }
        if (updateData.usage_limit !== undefined) {
            updateData.usage_limit = updateData.usage_limit ? parseInt(updateData.usage_limit) : null;
        }

        updateData.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('discounts')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Error updating discount:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// DELETE - Delete discount (Admin only)
export async function DELETE(request) {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ success: false, error: 'Discount ID required' }, { status: 400 });
    }

    try {
        const { error } = await supabase
            .from('discounts')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting discount:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
