'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function PageViewTracker() {
    const pathname = usePathname();

    useEffect(() => {
        // Track page view
        fetch('/api/track-visit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ page_url: pathname })
        }).catch(err => console.error('Tracking error:', err));
    }, [pathname]);

    return null; // Component tidak render apa-apa
}