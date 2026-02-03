'use client';

import { useLanguage } from '@/i18n/LanguageContext';

function XIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border py-3 text-sm text-muted-foreground px-4 sticky bottom-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-center md:justify-between gap-2">
        {/* Data sources */}
        <div className="flex items-center gap-1.5">
          <span className="text-muted">{t('footer.dataSource')}</span>
          <a
            href="https://kalshi.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-teal-400 hover:text-teal-300 transition-colors"
          >
            Kalshi
          </a>
          <span className="text-muted-foreground">|</span>
          <a
            href="https://moltbook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#E53935] hover:text-[#EF5350] transition-colors"
          >
            Moltbook
          </a>
          {/* Mobile-only separator */}
          <span className="text-muted-foreground md:hidden">|</span>
          {/* Mobile-only X link */}
          <a
            href="https://x.com/ClawshiAI"
            target="_blank"
            rel="noopener noreferrer"
            className="flex md:hidden items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <XIcon size={14} />
            <span>ClawshiAI</span>
          </a>
        </div>

        {/* Desktop-only X link (right side) */}
        <a
          href="https://x.com/ClawshiAI"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <XIcon size={14} />
          <span>ClawshiAI</span>
        </a>
      </div>
    </footer>
  );
}
