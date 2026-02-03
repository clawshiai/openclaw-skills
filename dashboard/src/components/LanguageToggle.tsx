'use client';

import { useLanguage } from '@/i18n/LanguageContext';

export function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  return (
    <button
      onClick={() => setLocale(locale === 'en' ? 'zh' : 'en')}
      className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface border border-border text-muted hover:text-foreground transition-colors text-xs font-bold"
      aria-label={locale === 'en' ? 'Switch to Chinese' : 'Switch to English'}
    >
      {locale === 'en' ? '中' : 'EN'}
    </button>
  );
}
