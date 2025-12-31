export function generateSlug(title) {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function calculateReadingTime(content) {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return minutes;
}

export function extractExcerpt(content, maxLength = 200) {
    const plainText = content.replace(/<[^>]*>/g, '');

    if (plainText.length <= maxLength) {
        return plainText;
    }

    return plainText.substring(0, maxLength).trim() + '...';
}

export function generateTableOfContents(content) {
    const headingRegex = /<h([2-3])[^>]*>(.*?)<\/h\1>/gi;
    const headings = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
        const level = parseInt(match[1]);
        const text = match[2].replace(/<[^>]*>/g, '');
        const id = generateSlug(text);

        headings.push({
            level,
            text,
            id,
        });
    }

    return headings;
}

export function addIdsToHeadings(content) {
    return content.replace(/<h([2-3])([^>]*)>(.*?)<\/h\1>/gi, (match, level, attrs, text) => {
        const plainText = text.replace(/<[^>]*>/g, '');
        const id = generateSlug(plainText);

        if (attrs.includes('id=')) {
            return match;
        }

        return `<h${level}${attrs} id="${id}">${text}</h${level}>`;
    });
}
