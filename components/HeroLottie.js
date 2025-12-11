'use client';
import { useEffect, useState } from 'react';
import Lottie from 'lottie-react';

export default function HeroLottie({ src, className }) {
    const [animationData, setAnimationData] = useState(null);

    useEffect(() => {
        if (src && src.endsWith('.json')) {
            fetch(src)
                .then((response) => response.json())
                .then((data) => setAnimationData(data))
                .catch((error) => console.error('Error loading Lottie:', error));
        }
    }, [src]);

    if (!animationData) return <div className={className} />;

    return (
        <Lottie
            animationData={animationData}
            className={className}
            loop={true}
        />
    );
}
