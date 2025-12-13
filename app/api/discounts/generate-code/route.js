// app/api/discounts/generate-code/route.js
import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

// Generate random alphanumeric code
function generateRandomCode(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// POST - Generate unique discount code
export async function POST(request) {
    const supabase = createClient();

    try {
        const body = await request.json();
        const prefix = body.prefix || 'NAIA';
        const length = body.length || 6;

        let code = '';
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 10;

        // Keep generating until we find a unique code
        while (!isUnique && attempts < maxAttempts) {
            code = `${prefix}${generateRandomCode(length)}`;

            // Check if code already exists
            const { data, error } = await supabase
                .from('discounts')
                .select('id')
                .eq('code', code)
                .single();

            if (error && error.code === 'PGRST116') {
                // No rows returned - code is unique
                isUnique = true;
            } else if (!error && data) {
                // Code exists, try again
                attempts++;
            } else if (error) {
                // Some other error
                throw error;
            }
        }

        if (!isUnique) {
            return NextResponse.json({
                success: false,
                error: 'Gagal generate kode unik, coba lagi'
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            code
        });
    } catch (error) {
        console.error('Error generating code:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
