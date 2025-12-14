// components/LanguageSwitcher.js
'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';

export default function LanguageSwitcher({ className = '', isScrolled = false }) {
    const { language, changeLanguage } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const languages = [
        { code: 'en', label: 'EN', flag: '🇬🇧', name: 'English' },
        { code: 'id', label: 'ID', flag: '🇮🇩', name: 'Indonesia' }
    ];

    const currentLang = languages.find(l => l.code === language) || languages[0];

    const handleSelect = (code) => {
        changeLanguage(code);
        setIsOpen(false);
    };

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium text-sm transition-all duration-300 ${isScrolled
                        ? 'text-white hover:bg-white/10 border border-white/20'
                        : 'text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                aria-label="Select language"
            >
                <span className="text-base">{currentLang.flag}</span>
                <span className="hidden sm:inline">{currentLang.label}</span>
                <svg
                    className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 py-1 bg-white rounded-xl shadow-xl border border-slate-100 min-w-[140px] z-50 animate-fade-in-up">
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => handleSelect(lang.code)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors ${lang.code === language ? 'bg-slate-50 font-medium' : ''
                                }`}
                        >
                            <span className="text-lg">{lang.flag}</span>
                            <span className="text-sm text-slate-700">{lang.name}</span>
                            {lang.code === language && (
                                <svg className="w-4 h-4 text-primary ml-auto" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
