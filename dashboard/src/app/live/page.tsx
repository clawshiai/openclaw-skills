'use client';

import { useEffect, useState } from 'react';
import { Market, getMarkets } from '@/lib/api';
import { Header } from '@/components/Header';
import { MarketCard } from '@/components/MarketCard';
import { Activity, Loader2 } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

export default function LivePage() {
  const { t } = useLanguage();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getMarkets();
        // Sort by total votes (most active first)
        const sorted = data.sort((a: Market, b: Market) => b.total_opinions - a.total_opinions);
        setMarkets(sorted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-teal-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Activity className="w-6 h-6 text-teal-400" />
          <h2 className="text-2xl font-bold">{t('live.title')}</h2>
          <div className="flex items-center gap-1.5 ml-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-xs text-muted-foreground">{t('live.autoRefreshing')}</span>
          </div>
        </div>

        {/* Live feed - sorted by most active */}
        <div className="space-y-4">
          {markets.map((market, i) => (
            <div key={market.id} className="flex items-center gap-4">
              <span className="text-sm text-subtle w-6 text-right">#{i + 1}</span>
              <div className="flex-1">
                <MarketCard market={market} />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
