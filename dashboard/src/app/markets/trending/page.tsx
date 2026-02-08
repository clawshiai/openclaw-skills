'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/i18n/LanguageContext';
import { Market, getMarkets } from '@/lib/api';
import { ArrowLeft, TrendingUp, Flame } from 'lucide-react';
import { MarketCard } from '@/components/MarketCard';

export default function TrendingMarketsPage() {
  const { t } = useLanguage();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMarkets()
      .then((data) => {
        // Filter active markets and sort by total opinions (trending)
        const active = data.filter((m) => m.status !== 'resolved');
        const sorted = active.sort((a, b) => (b.total_opinions || 0) - (a.total_opinions || 0));
        setMarkets(sorted.slice(0, 20)); // Top 20 trending
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft size={16} />
            {t('market.backToMarkets')}
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Flame className="text-orange-500" size={28} />
            {t('nav.marketsTrending')}
          </h1>
          <p className="text-muted-foreground mt-2">
            Most active markets by community engagement
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">{t('common.loading')}</p>
          </div>
        )}

        {/* No Results */}
        {!loading && markets.length === 0 && (
          <div className="text-center py-12 bg-surface border border-border rounded-xl">
            <TrendingUp className="w-12 h-12 text-muted mx-auto mb-4" />
            <p className="text-muted-foreground">No trending markets</p>
          </div>
        )}

        {/* Markets Grid */}
        {!loading && markets.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Top {markets.length} trending markets</p>
            <div className="grid gap-4">
              {markets.map((market, index) => (
                <div key={market.id} className="relative">
                  {index < 3 && (
                    <div className="absolute -left-2 -top-2 z-10 w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </div>
                  )}
                  <MarketCard market={market} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
