import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get('article_id');
    const status = searchParams.get('status');

    try {
        let query = supabase
            .from('comments')
            .select('*')
            .order('created_at', { ascending: false });

        if (articleId) {
            query = query.eq('article_id', articleId);
        }

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json(data || []);
    } catch (error) {
        console.error('Error fetching comments:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    const supabase = createClient();

    try {
        const body = await request.json();

        const { data, error } = await supabase
            .from('comments')
            .insert({
                article_id: body.article_id,
                author_name: body.author_name,
                author_email: body.author_email,
                content: body.content,
                status: 'pending',
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Error creating comment:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

export async function PUT(request) {
    const supabase = createClient();

    try {
        const body = await request.json();
        const { id, status } = body;

        if (!id || !status) {
            return NextResponse.json(
                { error: 'Missing id or status' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('comments')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Error updating comment:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
