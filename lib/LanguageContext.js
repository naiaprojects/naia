// lib/LanguageContext.js
'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase-client';
import enBase from '@/locales/en.json';
import idBase from '@/locales/id.json';

// Initial state with base local files
let translations = {
    en: { ...enBase },
    id: { ...idBase }
};

const STORAGE_KEY = 'naia_language';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState('en');
    const [isLoaded, setIsLoaded] = useState(false);
    // Force re-render when translations are updated from DB
    const [dbTranslationsParams, setDbTranslationsParams] = useState(0);

    const supabase = createClient();

    useEffect(() => {
        const init = async () => {
            await fetchDbTranslations();
            await initLanguage();
            setIsLoaded(true);
        };
        init();
    }, []);

    const fetchDbTranslations = async () => {
        try {
            const { data, error } = await supabase
                .from('translations')
                .select('*');

            if (error) {
                // If table doesn't exist yet, just ignore silently (fallback to JSON)
                console.warn('Could not fetch translations:', error.message);
                return;
            }

            if (data && data.length > 0) {
                data.forEach(item => {
                    const keys = item.key.split('.');
                    // Helper to deeply set value
                    const setDeep = (obj, path, value) => {
                        let current = obj;
                        for (let i = 0; i < path.length - 1; i++) {
                            if (!current[path[i]]) current[path[i]] = {};
                            current = current[path[i]];
                        }
                        current[path[path.length - 1]] = value;
                    };

                    if (item.content_en) setDeep(translations.en, keys, item.content_en);
                    if (item.content_id) setDeep(translations.id, keys, item.content_id);
                });
                // Trigger re-render
                setDbTranslationsParams(prev => prev + 1);
            }
        } catch (err) {
            console.error('Error in fetchDbTranslations:', err);
        }
    };

    const initLanguage = async () => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && (stored === 'en' || stored === 'id')) {
            setLanguage(stored);
            return;
        }

        try {
            const response = await fetch('https://ipapi.co/json/', {
                signal: AbortSignal.timeout(3000)
            });
            if (response.ok) {
                const data = await response.json();
                const detectedLang = data.country_code === 'ID' ? 'id' : 'en';
                setLanguage(detectedLang);
                localStorage.setItem(STORAGE_KEY, detectedLang);
            } else {
                setLanguage('en');
            }
        } catch (error) {
            setLanguage('en');
        }
    };

    const changeLanguage = useCallback((lang) => {
        if (lang === 'en' || lang === 'id') {
            setLanguage(lang);
            localStorage.setItem(STORAGE_KEY, lang);
        }
    }, []);

    const t = useCallback((key, params = {}) => {
        const keys = key.split('.');
        let value = translations[language];

        for (const k of keys) {
            if (value && typeof value === 'object') {
                value = value[k];
            } else {
                return key;
            }
        }

        if (typeof value !== 'string') return key;

        return value.replace(/\{\{(\w+)\}\}/g, (_, param) => params[param] || `{{${param}}}`);
    }, [language, dbTranslationsParams]); // Depend on dbTranslationsParams to refresh when DB data loads

    return (
        <LanguageContext.Provider value={{ language, changeLanguage, t, isLoaded }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}

export default LanguageContext;
