'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ResearchCard } from '@/components/ResearchCard';
import { Research, getResearchList } from '@/lib/api';
import { useLanguage } from '@/i18n/LanguageContext';
import { BookOpen, TrendingUp, ArrowUpDown } from 'lucide-react';

const categories = ['all', 'crypto', 'ai_agi', 'geopolitics', 'tech', 'moltbook', 'economics'];

export default function ResearchPage() {
  const { t } = useLanguage();
  const [articles, setArticles] = useState<Research[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => {
    async function fetchResearch() {
      try {
        setLoading(true);
        setError(null);
        const data = await getResearchList(
          selectedCategory === 'all' ? undefined : selectedCategory
        );
        setArticles(data);
      } catch (err) {
        console.error(err);
        setError(t('research.error.load'));
      } finally {
        setLoading(false);
      }
    }
    fetchResearch();
  }, [selectedCategory]);

  const sorted = [...articles].sort((a, b) => {
    if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen size={24} className="text-teal-400" />
            <h1 className="text-2xl sm:text-3xl font-bold">{t('research.title')}</h1>
          </div>
          <p className="text-muted-foreground">{t('research.subtitle')}</p>
        </div>

        <div className="flex gap-8">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Category filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-teal-600 text-white'
                      : 'bg-surface-hover border border-border-hover text-muted hover:border-teal-600/50 hover:text-foreground'
                  }`}
                >
                  {t(`research.category.${cat}`)}
                </button>
              ))}
            </div>

            {/* Sort tabs */}
            <div className="flex items-center gap-4 border-b border-border mb-6">
              <button
                onClick={() => setSortBy('newest')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  sortBy === 'newest'
                    ? 'border-teal-400 text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground/80'
                }`}
              >
                <TrendingUp size={14} />
                {t('research.sort.newest')}
              </button>
              <button
                onClick={() => setSortBy('oldest')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  sortBy === 'oldest'
                    ? 'border-teal-400 text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground/80'
                }`}
              >
                <ArrowUpDown size={14} />
                {t('research.sort.oldest')}
              </button>
            </div>

            {/* Content */}
            {error ? (
              <div className="text-center py-16">
                <p className="text-red-400 mb-2">{error}</p>
                <button
                  onClick={() => setSelectedCategory(selectedCategory)}
                  className="text-sm text-teal-400 hover:underline"
                >
                  {t('research.refreshComments')}
                </button>
              </div>
            ) : loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-surface border border-border rounded-xl p-4 animate-pulse">
                    <div className="h-4 bg-border rounded w-16 mb-3" />
                    <div className="h-5 bg-border rounded w-3/4 mb-2" />
                    <div className="h-4 bg-border rounded w-full mb-1" />
                    <div className="h-4 bg-border rounded w-2/3 mb-3" />
                    <div className="h-3 bg-border rounded w-24" />
                  </div>
                ))}
              </div>
            ) : sorted.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t('research.noArticles')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sorted.map((article) => (
                  <ResearchCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block w-72 shrink-0">
            <div className="bg-surface border border-border rounded-xl p-4 sticky top-20">
              <h3 className="text-sm font-semibold mb-3">{t('research.sidebar.title')}</h3>
              <p className="text-xs text-muted-foreground mb-3">
                {t('research.sidebar.desc')}
              </p>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  <span>{t('research.sidebar.feature1')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  <span>{t('research.sidebar.feature2')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  <span>{t('research.sidebar.feature3')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
