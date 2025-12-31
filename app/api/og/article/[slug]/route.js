import { ImageResponse } from 'next/og';
import { createClient } from '@/lib/supabase-server';

export const runtime = 'edge';

export async function GET(request, { params }) {
    const supabase = createClient();
    const { slug } = params;

    try {
        const { data: article } = await supabase
            .from('articles')
            .select('title, excerpt, category:categories(name)')
            .eq('slug', slug)
            .eq('status', 'published')
            .single();

        if (!article) {
            return new ImageResponse(
                (
                    <div
                        style={{
                            display: 'flex',
                            width: '100%',
                            height: '100%',
                            background: '#10b981',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: 60,
                            fontWeight: 'bold',
                        }}
                    >
                        Artikel Tidak Ditemukan
                    </div>
                ),
                {
                    width: 1200,
                    height: 630,
                }
            );
        }

        return new ImageResponse(
            (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%',
                        height: '100%',
                        background: '#10b981',
                        padding: '60px',
                        color: 'white',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: '40px',
                        }}
                    >
                        <div
                            style={{
                                fontSize: 32,
                                fontWeight: 'bold',
                                background: 'rgba(255, 255, 255, 0.2)',
                                padding: '12px 24px',
                                borderRadius: '12px',
                            }}
                        >
                            {article.category?.name || 'Blog'}
                        </div>
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            flex: 1,
                            justifyContent: 'center',
                        }}
                    >
                        <div
                            style={{
                                fontSize: 72,
                                fontWeight: 'bold',
                                lineHeight: 1.2,
                                marginBottom: '30px',
                                textShadow: '0 4px 12px rgba(0,0,0,0.3)',
                            }}
                        >
                            {article.title}
                        </div>

                        {article.excerpt && (
                            <div
                                style={{
                                    fontSize: 32,
                                    opacity: 0.9,
                                    lineHeight: 1.4,
                                    maxHeight: '120px',
                                    overflow: 'hidden',
                                }}
                            >
                                {article.excerpt.substring(0, 150)}...
                            </div>
                        )}
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: '40px',
                        }}
                    >
                        <div
                            style={{
                                fontSize: 36,
                                fontWeight: 'bold',
                            }}
                        >
                            naia.web.id
                        </div>
                        <div
                            style={{
                                fontSize: 28,
                                opacity: 0.8,
                            }}
                        >
                            📝 Blog & Artikel
                        </div>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        );
    } catch (error) {
        console.error('Error generating OG image:', error);
        return new ImageResponse(
            (
                <div
                    style={{
                        display: 'flex',
                        width: '100%',
                        height: '100%',
                        background: '#10b981',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: 60,
                        fontWeight: 'bold',
                    }}
                >
                    naia.web.id
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        );
    }
}
