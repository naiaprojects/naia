import { NextResponse } from 'next/server';
import { postToTelegram, postArticleWithImage } from '@/lib/telegram';

export async function POST(request) {
    try {
        const { article } = await request.json();

        if (!article) {
            return NextResponse.json(
                { error: 'Article data is required' },
                { status: 400 }
            );
        }

        let result;
        if (article.featured_image_url) {
            result = await postArticleWithImage(article, article.featured_image_url);
        } else {
            result = await postToTelegram(article);
        }

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data: result.data });
    } catch (error) {
        console.error('Error in Telegram post API:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
