export async function postToTelegram(article) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const channelId = process.env.TELEGRAM_CHANNEL_ID || '@naiawebid';

    if (!botToken) {
        console.error('TELEGRAM_BOT_TOKEN not configured');
        return { success: false, error: 'Bot token not configured' };
    }

    try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://naia.web.id';
        const articleUrl = `${baseUrl}/blogs/${article.slug}`;

        const message = `
📝 *${article.title}*

${article.excerpt || article.content.substring(0, 200) + '...'}

🔗 Baca selengkapnya: ${articleUrl}

#${article.category_name ? article.category_name.replace(/\s+/g, '') : 'Blog'}
        `.trim();

        const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

        const response = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: channelId,
                text: message,
                parse_mode: 'Markdown',
                disable_web_page_preview: false,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Telegram API error:', data);
            return { success: false, error: data.description || 'Failed to post to Telegram' };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Error posting to Telegram:', error);
        return { success: false, error: error.message };
    }
}

export async function postArticleWithImage(article, imageUrl) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const channelId = process.env.TELEGRAM_CHANNEL_ID || '@naiawebid';

    if (!botToken) {
        console.error('TELEGRAM_BOT_TOKEN not configured');
        return { success: false, error: 'Bot token not configured' };
    }

    try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://naia.web.id';
        const articleUrl = `${baseUrl}/blogs/${article.slug}`;

        const caption = `
📝 *${article.title}*

${article.excerpt || article.content.substring(0, 150) + '...'}

🔗 ${articleUrl}

#${article.category_name ? article.category_name.replace(/\s+/g, '') : 'Blog'}
        `.trim();

        const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendPhoto`;

        const response = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: channelId,
                photo: imageUrl,
                caption: caption,
                parse_mode: 'Markdown',
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Telegram API error:', data);
            return { success: false, error: data.description || 'Failed to post to Telegram' };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Error posting to Telegram:', error);
        return { success: false, error: error.message };
    }
}
