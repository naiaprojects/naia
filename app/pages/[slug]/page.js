// app/pages/[slug]/page.js
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ShareButtons from '@/components/ShareButtons';
import PageContent from '@/components/PageContent';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

// Generate metadata for SEO
export async function generateMetadata({ params }) {
    try {
        const supabase = createClient();

        const { data: page, error } = await supabase
            .from('pages')
            .select('title, meta_title, meta_description')
            .eq('slug', params.slug)
            .eq('is_active', true)
            .maybeSingle();

        if (error) {
            console.error('Metadata error:', error);
        }

        if (!page) {
            return {
                title: 'Page Not Found',
            };
        }

        return {
            title: page.meta_title || page.title,
            description: page.meta_description || `Read ${page.title} on our website`,
        };
    } catch (error) {
        console.error('Error generating metadata:', error);
        return {
            title: 'Page',
        };
    }
}

export default async function DynamicPage({ params }) {
    let page = null;
    let error = null;

    try {
        const supabase = createClient();

        // Fetch all columns - robust to missing bilingual columns
        const { data: pageData, error: fetchError } = await supabase
            .from('pages')
            .select('*')
            .eq('slug', params.slug)
            .eq('is_active', true)
            .maybeSingle();

        if (fetchError) {
            error = fetchError;
            console.error('Fetch error:', fetchError);
        } else {
            page = pageData;
        }
    } catch (err) {
        error = err;
        console.error('Error fetching page:', err);
    }

    if (error || !page) {
        notFound();
    }

    return (
        <>
            <Navbar />
            <PageContent page={page} />
            <Footer />
        </>
    );
}