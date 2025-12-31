'use client';

import { useEffect, useRef } from 'react';

export default function AdSense({
    style = { display: 'block' },
    format = 'auto',
    layout = '',
    client = 'ca-pub-9155919467624383',
    slot,
    responsive = 'true',
    className = ''
}) {
    const adRef = useRef(null);

    useEffect(() => {
        try {
            if (window.adsbygoogle) {
                // Check if the ad slot is already filled to prevent errors
                if (adRef.current && !adRef.current.innerHTML) {
                    (window.adsbygoogle = window.adsbygoogle || []).push({});
                }
            }
        } catch (err) {
            console.error('AdSense error:', err);
        }
    }, []);

    return (
        <div className={`adsense-container ${className}`}>
            <ins
                ref={adRef}
                className="adsbygoogle"
                style={style}
                data-ad-client={client}
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive={responsive}
                data-ad-layout={layout}
            ></ins>
        </div>
    );
}
