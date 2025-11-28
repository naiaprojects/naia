// app/api/settings/route.js
import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = createClient();

    try {
        const { data, error } = await supabase
            .from('site_settings')
            .select('key, value');

        if (error) throw error;

        const settings = {};
        data?.forEach(item => {
            settings[item.key] = item.value;
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({}, { status: 500 });
    }
}