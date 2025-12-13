import { createClient } from '@/lib/supabase-server';

export default async function manifest() {
    const supabase = createClient();
    let settings = {};

    try {
        const { data } = await supabase.from('site_settings').select('key, value');
        if (data) {
            data.forEach(item => {
                settings[item.key] = item.value;
            });
        }
    } catch (error) {
        console.error('Error fetching manifest settings:', error);
    }

    return {
        name: settings.site_title || "NAIA Dashboard",
        short_name: "NAIA",
        description: settings.site_description || "Aplikasi Admin Dashboard untuk NAIA",
        start_url: "/dashboard",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: settings.primary_color || "#14dff2",
        orientation: "portrait",
        icons: [
            {
                src: settings.app_icon_url || "/icons/icon-192x192.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "maskable any"
            },
            {
                src: settings.app_icon_url || "/icons/icon-512x512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "maskable any"
            }
        ]
    }
}
