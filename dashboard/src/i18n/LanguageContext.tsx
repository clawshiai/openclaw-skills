'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import en from './en.json';
import zh from './zh.json';

type Locale = 'en' | 'zh';
type TranslationDict = Record<string, string>;

const dictionaries: Record<Locale, TranslationDict> = { en, zh };

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const saved = localStorage.getItem('clawshi-lang') as Locale | null;
    if (saved && dictionaries[saved]) {
      setLocaleState(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('clawshi-lang', newLocale);
    document.documentElement.lang = newLocale;
  }, []);

  const t = useCallback((key: string, replacements?: Record<string, string | number>): string => {
    let value = dictionaries[locale]?.[key] || dictionaries['en']?.[key] || key;
    if (replacements) {
      Object.entries(replacements).forEach(([k, v]) => {
        value = value.replace(`{${k}}`, String(v));
      });
    }
    return value;
  }, [locale]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
