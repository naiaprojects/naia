// app/api/bank-accounts/route.js
import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = createClient();

    try {
        const { data, error } = await supabase
            .from('bank_accounts')
            .select('*')
            .eq('is_active', true)
            .order('position', { ascending: true });

        if (error) throw error;

        return NextResponse.json(data || []);
    } catch (error) {
        console.error('Error fetching bank accounts:', error);
        return NextResponse.json([], { status: 500 });
    }
}