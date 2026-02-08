'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/i18n/LanguageContext';
import { Market, getMarkets } from '@/lib/api';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { MarketCard } from '@/components/MarketCard';

export default function ResolvedMarketsPage() {
  const { t } = useLanguage();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMarkets()
      .then((data) => {
        // Filter to only show resolved markets
        const resolved = data.filter((m) => m.status === 'resolved');
        setMarkets(resolved);
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
            <CheckCircle className="text-teal-400" size={28} />
            {t('nav.marketsResolved')}
          </h1>
          <p className="text-muted-foreground mt-2">
            Markets that have been resolved with final outcomes
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
            <XCircle className="w-12 h-12 text-muted mx-auto mb-4" />
            <p className="text-muted-foreground">No resolved markets yet</p>
          </div>
        )}

        {/* Markets Grid */}
        {!loading && markets.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{markets.length} resolved markets</p>
            <div className="grid gap-4">
              {markets.map((market) => (
                <MarketCard key={market.id} market={market} />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
