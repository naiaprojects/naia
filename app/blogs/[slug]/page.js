'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import LogoPathAnimation from '@/components/LogoPathAnimation';
import { addIdsToHeadings, generateTableOfContents } from '@/lib/blog-utils';
import AdSense from '@/components/AdSense';

export default function ArticleDetailPage() {
    const supabase = createClient();
    const params = useParams();
    const [article, setArticle] = useState(null);
    const [relatedArticles, setRelatedArticles] = useState([]);
    const [popularArticles, setPopularArticles] = useState([]);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [commentForm, setCommentForm] = useState({
        author_name: '',
        author_email: '',
        content: '',
    });
    const [submittingComment, setSubmittingComment] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [heroBackground, setHeroBackground] = useState('');

    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    const fetchHeroBackground = async () => {
        try {
            const response = await fetch('/api/hero');
            const data = await response.json();
            if (data?.background_image) {
                setHeroBackground(data.background_image);
            }
        } catch (error) {
            console.error('Error fetching hero background:', error);
        }
    };

    useEffect(() => {
        if (params?.slug) {
            fetchArticle();
            fetchHeroBackground();
        }
    }, [params?.slug]);

    const fetchArticle = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('articles')
                .select(`
                    *,
                    category:categories(name, slug)
                `)
                .eq('slug', params.slug)
                .eq('status', 'published')
                .single();

            if (error) throw error;

            if (data) {
                setArticle(data);
                await incrementViewCount(data.id, data.views);
                fetchRelatedArticles(data.category_id, data.id);
                fetchPopularArticles();
                fetchComments(data.id);

                if (typeof document !== 'undefined') {
                    updateMetaTags(data);
                }
            }
        } catch (error) {
            console.error('Error fetching article:', error);
        } finally {
            setLoading(false);
        }
    };

    const incrementViewCount = async (articleId, currentViews = 0) => {
        try {
            await supabase
                .from('articles')
                .update({ views: currentViews + 1 })
                .eq('id', articleId);
        } catch (error) {
            console.error('Error incrementing view count:', error);
        }
    };

    const updateMetaTags = (article) => {
        if (!article) return;

        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://naia.web.id';
        const ogImage = article.featured_image_url || `${baseUrl}/api/og/article/${article.slug}`;
        const url = `${baseUrl}/blogs/${article.slug}`;

        document.title = article.meta_title || article.title;

        const metaTags = [
            { property: 'og:title', content: article.meta_title || article.title },
            { property: 'og:description', content: article.meta_description || article.excerpt },
            { property: 'og:image', content: ogImage },
            { property: 'og:url', content: url },
            { property: 'og:type', content: 'article' },
            { name: 'twitter:card', content: 'summary_large_image' },
            { name: 'twitter:title', content: article.meta_title || article.title },
            { name: 'twitter:description', content: article.meta_description || article.excerpt },
            { name: 'twitter:image', content: ogImage },
            { name: 'description', content: article.meta_description || article.excerpt },
            { name: 'keywords', content: article.meta_keywords || '' },
        ];

        metaTags.forEach(({ property, name, content }) => {
            const selector = property ? `meta[property="${property}"]` : `meta[name="${name}"]`;
            let meta = document.querySelector(selector);

            if (!meta) {
                meta = document.createElement('meta');
                if (property) meta.setAttribute('property', property);
                if (name) meta.setAttribute('name', name);
                document.head.appendChild(meta);
            }

            meta.setAttribute('content', content);
        });
    };

    const fetchRelatedArticles = async (categoryId, currentArticleId) => {
        try {
            const { data, error } = await supabase
                .from('articles')
                .select(`
                    *,
                    category:categories(name, slug)
                `)
                .eq('status', 'published')
                .eq('category_id', categoryId)
                .neq('id', currentArticleId)
                .limit(3);

            if (error) throw error;
            setRelatedArticles(data || []);
        } catch (error) {
            console.error('Error fetching related articles:', error);
        }
    };

    const fetchPopularArticles = async () => {
        try {
            const { data, error } = await supabase
                .from('articles')
                .select('id, title, slug, views, published_at')
                .eq('status', 'published')
                .order('views', { ascending: false })
                .limit(5);

            if (error) throw error;
            setPopularArticles(data || []);
        } catch (error) {
            console.error('Error fetching popular articles:', error);
        }
    };

    const fetchComments = async (articleId) => {
        try {
            const { data, error } = await supabase
                .from('comments')
                .select('*')
                .eq('article_id', articleId)
                .eq('status', 'approved')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setComments(data || []);
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        setSubmittingComment(true);

        try {
            const response = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    article_id: article.id,
                    ...commentForm,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Gagal mengirim komentar');
            }

            showMessage('Komentar berhasil dikirim! Menunggu persetujuan admin.');
            setCommentForm({ author_name: '', author_email: '', content: '' });
        } catch (error) {
            console.error('Error submitting comment:', error);
            showMessage('Gagal mengirim komentar: ' + error.message, 'error');
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleShare = (platform) => {
        const url = window.location.href;
        const text = article.title;

        const shareUrls = {
            whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        };

        if (platform === 'copy') {
            navigator.clipboard.writeText(url);
            showMessage('Link berhasil disalin!');
        } else {
            window.open(shareUrls[platform], '_blank', 'width=600,height=400');
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    // Inject In-Article Ad after 3rd paragraph
    const injectAd = (content) => {
        if (!content) return '';
        const paragraphs = content.split('</p>');
        if (paragraphs.length > 3) {
            paragraphs.splice(3, 0, `
                <div class="my-8">
                     <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9155919467624383" crossorigin="anonymous"></script>
                    <ins class="adsbygoogle"
                        style="display:block; text-align:center;"
                        data-ad-layout="in-article"
                        data-ad-format="fluid"
                        data-ad-client="ca-pub-9155919467624383"
                        data-ad-slot="5086932184"></ins>
                    <script>
                        (adsbygoogle = window.adsbygoogle || []).push({});
                    </script>
                </div>
            `);
        }
        return paragraphs.join('</p>');
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex justify-center items-center bg-white">
                <LogoPathAnimation />
            </div>
        );
    }

    if (!article) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Artikel tidak ditemukan</h1>
                    <Link href="/blogs" className="text-primary hover:underline">
                        Kembali ke Blog
                    </Link>
                </div>
            </div>
        );
    }

    const contentWithIds = addIdsToHeadings(article.content);
    const finalContent = injectAd(contentWithIds);
    const tableOfContents = generateTableOfContents(article.content);

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://naia.web.id';
    const articleUrl = `${baseUrl}/blogs/${article.slug}`;
    const ogImage = article.featured_image_url || `${baseUrl}/api/og/article/${article.slug}`;

    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        description: article.excerpt,
        image: ogImage,
        datePublished: article.published_at,
        dateModified: article.updated_at || article.published_at,
        author: {
            '@type': 'Person',
            name: article.author_name || 'Naia Team',
        },
        publisher: {
            '@type': 'Organization',
            name: 'Naia',
            logo: {
                '@type': 'ImageObject',
                url: `${baseUrl}/logo.png`,
            },
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': articleUrl,
        },
    };

    return (
        <main className="min-h-screen bg-gray-50">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />

            {message.text && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${message.type === 'error' ? 'bg-red-500' : 'bg-green-500'} text-white`}>
                    {message.text}
                </div>
            )}

            {/* Hero Section */}
            <section
                id="hero-section"
                className="mx-4 rounded-b-3xl bg-primary pt-32 pb-20 relative overflow-hidden bg-center bg-cover shadow-2xl mb-12"
                style={heroBackground ? { backgroundImage: `url('${heroBackground}')` } : {}}
            >
                <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>

                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <h1 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight leading-tight text-white capitalize">
                        {article.title}
                    </h1>
                    <div className="flex items-center justify-center gap-4 text-white text-sm md:text-base flex-wrap">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            <span className="font-medium">{article.category?.name || 'Uncategorized'}</span>
                        </div>
                        <span className="hidden sm:inline">•</span>
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{formatDate(article.published_at)}</span>
                        </div>
                    </div>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-6">
                            <div className="p-6">
                                {/* Breadcrumb */}
                                <nav className="mb-0">
                                    <ol className="flex items-center space-x-2 text-sm">
                                        <li>
                                            <Link href="/" className="text-slate-500 hover:text-primary">
                                                Home
                                            </Link>
                                        </li>
                                        <li className="text-slate-400">/</li>
                                        <li>
                                            <Link href="/blogs" className="text-slate-500 hover:text-primary">
                                                Blog
                                            </Link>
                                        </li>
                                        {article.category && (
                                            <>
                                                <li className="text-slate-400">/</li>
                                                <li>
                                                    <Link
                                                        href={`/blogs/category/${article.category.slug}`}
                                                        className="text-slate-500 hover:text-primary"
                                                    >
                                                        {article.category.name}
                                                    </Link>
                                                </li>
                                            </>
                                        )}
                                    </ol>
                                </nav>
                            </div>

                            {article.featured_image_url && (
                                <div className="px-6 pb-6">
                                    <img
                                        src={article.featured_image_url}
                                        alt={article.title}
                                        className="w-full h-auto rounded-lg"
                                    />
                                </div>
                            )}

                            <div className="px-6 pb-6">
                                <div
                                    className="prose prose-slate max-w-none"
                                    dangerouslySetInnerHTML={{ __html: finalContent }}
                                />
                            </div>
                        </div>

                        {/* Share Buttons */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Bagikan Artikel</h3>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={() => handleShare('whatsapp')}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                                >
                                    WhatsApp
                                </button>
                                <button
                                    onClick={() => handleShare('twitter')}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                                >
                                    Twitter
                                </button>
                                <button
                                    onClick={() => handleShare('facebook')}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors text-sm"
                                >
                                    Facebook
                                </button>
                                <button
                                    onClick={() => handleShare('copy')}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm"
                                >
                                    Copy Link
                                </button>
                            </div>
                        </div>

                        {/* Related Articles */}
                        {relatedArticles.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
                                <h3 className="text-xl font-bold text-slate-900 mb-6">Artikel Terkait</h3>
                                <div className="grid md:grid-cols-3 gap-4">
                                    {relatedArticles.map((related) => (
                                        <Link
                                            key={related.id}
                                            href={`/blogs/${related.slug}`}
                                            className="group"
                                        >
                                            {related.featured_image_url && (
                                                <img
                                                    src={related.featured_image_url}
                                                    alt={related.title}
                                                    className="w-full h-32 object-cover rounded-lg mb-3 group-hover:opacity-90 transition"
                                                />
                                            )}
                                            <h4 className="font-semibold text-slate-900 group-hover:text-primary transition line-clamp-2">
                                                {related.title}
                                            </h4>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Comments */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">Komentar ({comments.length})</h2>

                            <form onSubmit={handleCommentSubmit} className="mb-8 space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        value={commentForm.author_name}
                                        onChange={(e) => setCommentForm(prev => ({ ...prev, author_name: e.target.value }))}
                                        className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                        placeholder="Nama *"
                                        required
                                    />
                                    <input
                                        type="email"
                                        value={commentForm.author_email}
                                        onChange={(e) => setCommentForm(prev => ({ ...prev, author_email: e.target.value }))}
                                        className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                        placeholder="Email *"
                                        required
                                    />
                                </div>
                                <textarea
                                    value={commentForm.content}
                                    onChange={(e) => setCommentForm(prev => ({ ...prev, content: e.target.value }))}
                                    rows={4}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                    placeholder="Komentar *"
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={submittingComment}
                                    className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                                >
                                    {submittingComment ? 'Mengirim...' : 'Kirim Komentar'}
                                </button>
                            </form>

                            <div className="space-y-6">
                                {comments.map((comment) => (
                                    <div key={comment.id} className="border-b border-slate-100 pb-6 last:border-0">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                                <span className="text-primary font-bold">
                                                    {comment.author_name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h4 className="font-semibold text-slate-900">{comment.author_name}</h4>
                                                    <span className="text-xs text-slate-500">{formatDate(comment.created_at)}</span>
                                                </div>
                                                <p className="text-slate-700">{comment.content}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {comments.length === 0 && (
                                    <p className="text-center text-slate-500 py-8">
                                        Belum ada komentar. Jadilah yang pertama berkomentar!
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        {/* Display Ad */}
                        <div className="mb-6">
                            <AdSense
                                slot="2490890135"
                                style={{ display: 'block' }}
                                format="auto"
                                responsive="true"
                            />
                        </div>

                        {/* Table of Contents */}
                        {tableOfContents.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6 sticky top-4">
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Daftar Isi</h3>
                                <ul className="space-y-2 text-sm">
                                    {tableOfContents.map((item, index) => (
                                        <li key={index} className={item.level === 3 ? 'ml-4' : ''}>
                                            <a
                                                href={`#${item.id}`}
                                                className="text-slate-600 hover:text-primary transition"
                                            >
                                                {item.text}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Popular Articles */}
                        {popularArticles.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Artikel Populer</h3>
                                <div className="space-y-4">
                                    {popularArticles.map((popular) => (
                                        <Link
                                            key={popular.id}
                                            href={`/blogs/${popular.slug}`}
                                            className="block group"
                                        >
                                            <h4 className="font-medium text-slate-900 group-hover:text-primary transition text-sm line-clamp-2 mb-1">
                                                {popular.title}
                                            </h4>
                                            <p className="text-xs text-slate-500">{popular.views || 0} views</p>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
