'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Search, X, Menu } from 'lucide-react';
import { Market, getMarkets } from '@/lib/api';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';
import { useLanguage } from '@/i18n/LanguageContext';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [markets, setMarkets] = useState<Market[]>([]);
  const [results, setResults] = useState<Market[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const navItems = [
    { label: t('nav.markets'), href: '/' },
    { label: t('nav.ideas'), href: '/ideas' },
    { label: t('nav.leaderboard'), href: '/leaderboard' },
    { label: t('nav.api'), href: '/api-docs' },
  ];

  // Fetch markets for search
  useEffect(() => {
    getMarkets().then(setMarkets).catch(() => {});
  }, []);

  // Filter on query change
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const q = query.toLowerCase();
    setResults(
      markets.filter(
        (m) =>
          m.question.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q) ||
          m.description?.toLowerCase().includes(q)
      )
    );
  }, [query, markets]);

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setMenuOpen(false);
        setQuery('');
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Focus mobile search input when menu opens with search
  useEffect(() => {
    if (menuOpen && mobileInputRef.current) {
      setTimeout(() => mobileInputRef.current?.focus(), 100);
    }
  }, [menuOpen]);

  function navigateFromSearch(id: number) {
    router.push(`/market/${id}`);
    setSearchOpen(false);
    setMenuOpen(false);
    setQuery('');
  }

  const searchResults = (
    <>
      {query.trim() && (
        <div className="border border-border-hover rounded-xl bg-surface overflow-hidden">
          {results.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">{t('nav.noResults')}</div>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              {results.map((m) => (
                <button
                  key={m.id}
                  onClick={() => navigateFromSearch(m.id)}
                  className="w-full text-left px-4 py-3 hover:bg-surface-hover transition-colors border-b border-border last:border-0"
                >
                  <div className="text-sm font-medium line-clamp-1">{m.question}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-1.5 py-0.5 bg-teal-600/20 text-teal-400 rounded">
                      {m.category}
                    </span>
                    <span className="text-xs text-green-500">
                      {t('common.yes')} {m.probabilities?.yes?.toFixed(1)}%
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group mr-4 sm:mr-8 shrink-0">
            <Image
              src="/logo.png"
              alt="Clawshi"
              width={32}
              height={32}
              className="rounded-md sm:w-9 sm:h-9"
            />
            <span className="text-lg font-bold text-teal-400 group-hover:text-teal-300 transition-colors">
              Clawshi
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-teal-400/10 text-teal-400 border border-teal-400/20 rounded-md uppercase tracking-wider">
              {t('common.beta')}
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 shrink-0">
            {navItems.map((item) => {
              const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'text-foreground bg-surface-hover'
                      : 'text-muted hover:text-foreground hover:bg-surface-hover'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {/* Desktop Search */}
            <div className="hidden md:block relative">
              {searchOpen ? (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={t('nav.searchPlaceholder')}
                      className="w-80 pl-9 pr-8 py-1.5 bg-surface-hover border border-border-hover rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-teal-600/50"
                    />
                    <button
                      onClick={() => { setSearchOpen(false); setQuery(''); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  {query.trim() && (
                    <div className="absolute top-full right-0 mt-2 w-80 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden z-50">
                      {searchResults}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-surface-hover border border-border-hover rounded-lg text-sm text-muted hover:border-teal-600/50 hover:text-foreground transition-colors"
                >
                  <Search size={14} />
                  {t('nav.search')}
                  <kbd className="text-[10px] text-subtle bg-border px-1.5 py-0.5 rounded">
                    ⌘K
                  </kbd>
                </button>
              )}
            </div>

            {/* Desktop Toggles */}
            <div className="hidden md:flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>

            {/* Desktop Create Agent */}
            <a
              href="/join"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-hover text-black rounded-lg text-sm font-medium transition-colors shrink-0"
            >
              {t('nav.createAgent')}
            </a>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg bg-surface-hover border border-border-hover text-muted hover:text-foreground transition-colors"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-sm">
          <div className="px-4 py-4 space-y-3">
            {/* Mobile Search */}
            <div>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={mobileInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('nav.searchPlaceholder')}
                  className="w-full pl-9 pr-4 py-2.5 bg-surface-hover border border-border-hover rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-teal-600/50"
                />
              </div>
              {searchResults}
            </div>

            {/* Mobile Nav */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-foreground bg-surface-hover'
                        : 'text-muted hover:text-foreground hover:bg-surface-hover'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Toggles */}
            <div className="flex items-center gap-3">
              <LanguageToggle />
              <ThemeToggle />
            </div>

            {/* Mobile Create Agent */}
            <a
              href="/join"
              className="block text-center px-4 py-2.5 bg-accent hover:bg-accent-hover text-black rounded-lg text-sm font-medium transition-colors"
            >
              {t('nav.createAgent')}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
