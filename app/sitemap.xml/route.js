import { createClient } from '@/lib/supabase-server';

export async function GET() {
    const supabase = createClient();
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://naia.web.id';

    try {
        const { data: articles, error } = await supabase
            .from('articles')
            .select('slug, updated_at, published_at')
            .eq('status', 'published')
            .order('published_at', { ascending: false });

        if (error) throw error;

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${baseUrl}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>${baseUrl}/blogs</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
    </url>
    ${articles
                .map(
                    (article) => `
    <url>
        <loc>${baseUrl}/blogs/${article.slug}</loc>
        <lastmod>${new Date(article.updated_at || article.published_at).toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>`
                )
                .join('')}
</urlset>`;

        return new Response(sitemap, {
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'public, max-age=3600, s-maxage=3600',
            },
        });
    } catch (error) {
        console.error('Error generating sitemap:', error);
        return new Response('Error generating sitemap', { status: 500 });
    }
}
