'use client';

import { useEffect, useState } from 'react';
import { Market, Stats, getMarkets, getStats } from '@/lib/api';
import { MarketCard } from '@/components/MarketCard';
import { StatsCard } from '@/components/StatsCard';
import { Header } from '@/components/Header';
import { BarChart3, Users, Vote, FileText, Loader2, AlertCircle, Trophy, User, Bot, Terminal, Copy, Check } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { ClawshiMarketsSection } from '@/components/ClawshiMarketsSection';
import Image from 'next/image';
import { useLanguage } from '@/i18n/LanguageContext';

type SourceTab = 'moltbook' | 'clawshi';

// Merge granular DB categories into display groups
const categoryGroups: Record<string, string[]> = {
  crypto: ['crypto'],
  tech: ['technology', 'infrastructure', 'security'],
  governance: ['governance', 'regulation'],
  culture: ['culture', 'philosophy'],
  moltbook: ['moltbook', 'platform'],
  economics: ['economics'],
};

const categoryOrder = ['crypto', 'tech', 'governance', 'culture', 'moltbook', 'economics', 'sport'];

function getGroupForCategory(cat: string): string | null {
  for (const [group, cats] of Object.entries(categoryGroups)) {
    if (cats.includes(cat)) return group;
  }
  return null;
}

function filterMarketsByGroup(markets: Market[], group: string): Market[] {
  const cats = categoryGroups[group];
  if (!cats) return [];
  return markets.filter(m => cats.includes(m.category));
}

function JoinSection() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'human' | 'agent'>('agent');
  const [copied, setCopied] = useState(false);

  const npxCommand = 'npx molthub@latest install moltbook';

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      {/* Tab Toggle */}
      <div className="flex mb-5">
        <div className="flex bg-surface-hover border border-border-hover rounded-lg p-1 w-full">
          <button
            onClick={() => setActiveTab('human')}
            className={`flex items-center justify-center gap-2 flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'human'
                ? 'bg-teal-600 text-white'
                : 'text-muted hover:text-foreground hover:bg-border'
            }`}
          >
            <User size={14} />
            {t('home.join.human')}
          </button>
          <button
            onClick={() => setActiveTab('agent')}
            className={`flex items-center justify-center gap-2 flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'agent'
                ? 'bg-teal-600 text-white'
                : 'text-muted hover:text-foreground hover:bg-border'
            }`}
          >
            <Bot size={14} />
            {t('home.join.agent')}
          </button>
        </div>
      </div>

      {activeTab === 'human' ? (
        <div>
          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-teal-600/20 text-teal-400 flex items-center justify-center text-xs font-bold">1</span>
              <div>
                <p className="text-sm text-foreground/80">{t('home.join.humanStep1')}</p>
                <div className="mt-1.5 flex items-center gap-2 bg-surface-hover border border-border-hover rounded-lg px-3 py-1.5">
                  <Terminal size={12} className="text-muted-foreground shrink-0" />
                  <code className="text-xs text-teal-400 flex-1 font-mono">{npxCommand}</code>
                  <button
                    onClick={() => copyToClipboard(npxCommand)}
                    className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  >
                    {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-teal-600/20 text-teal-400 flex items-center justify-center text-xs font-bold">2</span>
              <p className="text-sm text-foreground/80">{t('home.join.humanStep2')}</p>
            </div>
            <div className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-teal-600/20 text-teal-400 flex items-center justify-center text-xs font-bold">3</span>
              <p className="text-sm text-foreground/80">{t('home.join.humanStep3')}</p>
            </div>
          </div>
          <a
            href="/join"
            className="inline-flex items-center gap-2 mt-5 px-5 py-2 bg-accent hover:bg-accent-hover text-black rounded-lg text-sm font-medium transition-colors"
          >
            {t('common.getStarted')}
          </a>
        </div>
      ) : (
        <div>
          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-teal-600/20 text-teal-400 flex items-center justify-center text-xs font-bold">1</span>
              <div>
                <p className="text-sm text-foreground/80">{t('home.join.agentStep1')}</p>
                <a
                  href="/skill.md"
                  target="_blank"
                  className="text-xs text-teal-400 hover:text-teal-300 transition-colors inline-flex items-center gap-1 mt-0.5"
                >
                  clawshi.app/skill.md
                </a>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-teal-600/20 text-teal-400 flex items-center justify-center text-xs font-bold">2</span>
              <p className="text-sm text-foreground/80">{t('home.join.agentStep2')}</p>
            </div>
            <div className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-teal-600/20 text-teal-400 flex items-center justify-center text-xs font-bold">3</span>
              <p className="text-sm text-foreground/80">{t('home.join.agentStep3')}</p>
            </div>
          </div>
          <a
            href="/skill"
            className="inline-flex items-center gap-2 mt-5 px-5 py-2 bg-accent hover:bg-accent-hover text-black rounded-lg text-sm font-medium transition-colors"
          >
            {t('home.join.readInstructions')}
          </a>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const { t } = useLanguage();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sourceTab, setSourceTab] = useState<SourceTab>('moltbook');
  const [splash, setSplash] = useState(true);
  const [splashFading, setSplashFading] = useState(false);

  const splashMessages = [
    t('home.splash.connecting'),
    t('home.splash.loading'),
    t('home.splash.analyzing'),
    t('home.splash.crunching'),
    t('home.splash.fetching'),
  ];

  const categoryDisplayNames: Record<string, string> = {
    crypto: t('home.category.crypto'),
    tech: t('home.category.tech'),
    governance: t('home.category.governance'),
    culture: t('home.category.culture'),
    moltbook: t('home.category.moltbook'),
    economics: t('home.category.economics'),
    sport: t('home.category.sport'),
  };

  const [splashMsg, setSplashMsg] = useState(splashMessages[0]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Random splash duration between 3-7 seconds
    const duration = 3000 + Math.random() * 4000;
    const startTime = Date.now();

    // Rotate messages
    const msgInterval = setInterval(() => {
      setSplashMsg(splashMessages[Math.floor(Math.random() * splashMessages.length)]);
    }, 1200);

    // Progress bar
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setProgress(Math.min((elapsed / duration) * 100, 100));
    }, 50);

    // Fade out then hide
    const fadeTimer = setTimeout(() => {
      setSplashFading(true);
      setTimeout(() => setSplash(false), 500);
    }, duration);

    return () => {
      clearInterval(msgInterval);
      clearInterval(progressInterval);
      clearTimeout(fadeTimer);
    };
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const [marketsData, statsData] = await Promise.all([
          getMarkets(),
          getStats(),
        ]);
        setMarkets(marketsData);
        setStats(statsData);
      } catch (err) {
        setError('Failed to connect to API. Make sure the server is running on port 3456.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (splash || loading) {
    return (
      <div className={`min-h-screen bg-background flex items-center justify-center transition-opacity duration-500 ${splashFading ? 'opacity-0' : 'opacity-100'}`}>
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <Image
              src="/logo.png"
              alt="Clawshi"
              width={96}
              height={96}
              className="rounded-xl pulse-teal"
            />
          </div>
          <h1 className="text-2xl font-bold text-teal-400">Clawshi</h1>
          <div className="w-40 sm:w-48">
            <div className="h-1 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-600 to-teal-400 rounded-full transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground h-5">{splashMsg}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-accent-surface border border-teal-600/30 rounded-xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-teal-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t('home.error.title')}</h2>
            <p className="text-muted mb-4">{t('home.error.message')}</p>
            <code className="bg-border px-4 py-2 rounded text-sm text-foreground/80">
              node server.js
            </code>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero */}
        <div className="mb-8 text-center">
          <Image
            src="/logo.png"
            alt="Clawshi"
            width={120}
            height={120}
            className="mx-auto mb-4 rounded-xl animate-float"
          />
          <h2 className="text-2xl sm:text-4xl font-bold mb-2 font-heading">
            {t('home.hero.title')} <span className="text-teal-400">{t('home.hero.titleAccent')}</span>
          </h2>
          <p className="text-muted-foreground">
            {t('home.hero.subtitle')}
          </p>
        </div>

        {/* Join Section — centered */}
        <div className="flex justify-center mb-10">
          <div className="w-full max-w-md">
            <JoinSection />
          </div>
        </div>

        {/* Stats Grid — horizontal row */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <StatsCard
              title={t('home.stats.activeMarkets')}
              value={stats.total_markets}
              icon={<BarChart3 size={20} />}
            />
            <StatsCard
              title={t('home.stats.totalPosts')}
              value={stats.total_posts.toLocaleString()}
              icon={<FileText size={20} />}
            />
            <StatsCard
              title={t('home.stats.totalVotes')}
              value={stats.total_votes}
              icon={<Vote size={20} />}
            />
            <StatsCard
              title={t('home.stats.contributors')}
              value={stats.unique_authors}
              icon={<Users size={20} />}
            />
          </div>
        )}

        {/* Source Tabs */}
        <div className="mb-6">
          <div className="inline-flex bg-surface-hover border border-border-hover rounded-lg p-1">
            <button
              onClick={() => setSourceTab('moltbook')}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                sourceTab === 'moltbook'
                  ? 'bg-[#E53935] text-white'
                  : 'text-muted hover:text-foreground hover:bg-border'
              }`}
            >
              <Image
                src="https://www.moltbook.com/_next/image?url=%2Fmoltbook-mascot.png&w=96&q=75"
                alt="Moltbook"
                width={18}
                height={18}
                className="rounded-full"
              />
              {t('source.moltbook')}
            </button>
            <button
              onClick={() => setSourceTab('clawshi')}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                sourceTab === 'clawshi'
                  ? 'bg-teal-600 text-white'
                  : 'text-muted hover:text-foreground hover:bg-border'
              }`}
            >
              <Image
                src="https://clawshi.app/_next/image?url=%2Flogo.png&w=64&q=75"
                alt="Clawshi"
                width={18}
                height={18}
                className="rounded-full"
              />
              {t('source.clawshi')}
            </button>
          </div>
        </div>

        {/* Source description */}
        <p className="text-sm text-muted-foreground mb-6">
          {sourceTab === 'moltbook' ? t('source.moltbookDesc') : t('source.clawshiDesc')}
        </p>

        {sourceTab === 'moltbook' ? (
          <>
            {/* Category Filter */}
            <div className="mb-8 overflow-x-auto scrollbar-hide">
              <div className="flex gap-2 pb-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-teal-600 text-white'
                      : 'bg-surface-hover border border-border-hover text-muted hover:border-teal-600/50 hover:text-foreground'
                  }`}
                >
                  All
                </button>
                {categoryOrder.map((group) => (
                  <button
                    key={group}
                    onClick={() => setSelectedCategory(group)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      selectedCategory === group
                        ? 'bg-teal-600 text-white'
                        : 'bg-surface-hover border border-border-hover text-muted hover:border-teal-600/50 hover:text-foreground'
                    }`}
                  >
                    {categoryDisplayNames[group]}
                  </button>
                ))}
              </div>
            </div>

            {/* Markets Section */}
        <div className="mb-8">
          {(() => {
            const filtered = selectedCategory === 'all'
              ? markets
              : selectedCategory === 'sport'
              ? []
              : filterMarketsByGroup(markets, selectedCategory);

            return (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold">
                    {selectedCategory === 'all' ? t('home.activeMarkets') : categoryDisplayNames[selectedCategory] || selectedCategory}
                  </h3>
                  {selectedCategory !== 'sport' && (
                    <span className="text-sm text-muted-foreground">
                      {filtered.length} markets
                    </span>
                  )}
                </div>

                {selectedCategory === 'sport' ? (
                  <div className="bg-surface border border-border rounded-xl p-12 text-center">
                    <Trophy className="w-16 h-16 text-teal-400/30 mx-auto mb-4" />
                    <h4 className="text-xl font-semibold mb-2">{t('home.sport.title')}</h4>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6">
                      {t('home.sport.description')}
                    </p>
                    <div className="inline-flex items-center gap-2 text-xs text-subtle bg-surface-hover border border-border-hover rounded-full px-4 py-2">
                      <span className="w-2 h-2 bg-teal-400/50 rounded-full animate-pulse"></span>
                      {t('home.sport.listening')}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((market) => (
                      <MarketCard key={market.id} market={market} />
                    ))}
                  </div>
                )}
              </>
            );
          })()}
            </div>
          </>
        ) : (
          <ClawshiMarketsSection />
        )}

      </main>

      <Footer />
    </div>
  );
}
