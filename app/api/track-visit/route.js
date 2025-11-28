import { createClient } from '@/lib/supabase-server';

export async function POST(request) {
    const supabase = createClient();
    const { page_url } = await request.json();

    // Get visitor IP
    const ip = request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown';

    // Get country from IP (gunakan service seperti ipapi.co)
    let country = { code: 'XX', name: 'Unknown' };
    try {
        const geoResponse = await fetch(`https://ipapi.co/${ip}/json/`);
        const geoData = await geoResponse.json();
        country = { code: geoData.country_code, name: geoData.country_name };
    } catch (error) {
        console.error('Geo lookup failed:', error);
    }

    // Save to database
    await supabase.from('page_views').insert({
        visitor_ip: ip,
        country_code: country.code,
        country_name: country.name,
        page_url,
        user_agent: request.headers.get('user-agent')
    });

    return Response.json({ success: true });
}