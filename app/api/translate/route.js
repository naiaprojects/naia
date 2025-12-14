import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { text, sourceLang = 'id', targetLang = 'en' } = await request.json();

        if (!text) return NextResponse.json({ text: '' });

        // Helper function to translate a single chunk using POST to avoid URL limits
        const translateChunk = async (chunk) => {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(chunk)}`;

            // Note: The free GTX endpoint is weird. It often prefers GET for simple implementation. 
            // But for long text, we must be careful. 
            // A common workaround for "free" unlimited length is splitting.
            // But "official" free usage often uses POST with body. 
            // Let's stick to GET but with smaller chunks to be safe, or try POST with standard form data.
            // Let's try standard fetch with GET but ensure chunks are small (1000 chars).
            // (Reverting to previous strategy but refining it, as GTX POST is flaky without keys)

            const response = await fetch(url);
            if (!response.ok) throw new Error('Google API Error');
            const data = await response.json();

            // data[0] is array of [translated, original, null, null]
            // We need to join all translated parts
            return data[0].map(item => item[0]).join('');
        };

        const maxLength = 1000;
        let translatedText = '';

        if (text.length > maxLength) {
            const chunks = text.match(new RegExp(`[\\s\\S]{1,${maxLength}}`, 'g')) || [];
            for (const chunk of chunks) {
                translatedText += await translateChunk(chunk);
            }
        } else {
            translatedText = await translateChunk(text);
        }

        return NextResponse.json({ text: translatedText });

    } catch (error) {
        console.error('Translation error:', error);
        return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
    }
}
