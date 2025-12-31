import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { postToTelegram, postArticleWithImage } from '@/lib/telegram';

export async function GET(request, { params }) {
    const supabase = createClient();
    const { id } = params;

    try {
        const { data, error } = await supabase
            .from('articles')
            .select(`
                *,
                category:categories(id, name, slug)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;

        if (!data) {
            return NextResponse.json(
                { error: 'Article not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching article:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

export async function PUT(request, { params }) {
    const supabase = createClient();
    const { id } = params;

    try {
        const body = await request.json();
        const wasPublished = body._wasPublished;
        delete body._wasPublished;

        const { data, error } = await supabase
            .from('articles')
            .update(body)
            .eq('id', id)
            .select(`
                *,
                category:categories(name)
            `)
            .single();

        if (error) throw error;

        if (body.status === 'published' && !wasPublished) {
            const categoryName = data.category?.name;
            const articleWithCategory = {
                ...data,
                category_name: categoryName,
            };

            if (data.featured_image_url) {
                await postArticleWithImage(articleWithCategory, data.featured_image_url);
            } else {
                await postToTelegram(articleWithCategory);
            }
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Error updating article:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(request, { params }) {
    const supabase = createClient();
    const { id } = params;

    try {
        const { error } = await supabase
            .from('articles')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting article:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
