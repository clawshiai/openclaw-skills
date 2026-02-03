'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Market, getMarket } from '@/lib/api';
import { Header } from '@/components/Header';
import { VoteList } from '@/components/VoteList';
import { formatDate } from '@/lib/utils';
import { useLanguage } from '@/i18n/LanguageContext';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { Footer } from '@/components/Footer';
import { ProbabilityChart } from '@/components/ProbabilityChart';

const categoryGroupLabels: Record<string, string> = {
  crypto: 'Crypto',
  technology: 'Tech',
  infrastructure: 'Tech',
  security: 'Tech',
  governance: 'Governance',
  regulation: 'Governance',
  culture: 'Culture',
  philosophy: 'Culture',
  moltbook: 'Moltbook',
  platform: 'Moltbook',
  economics: 'Economics',
};

export default function MarketDetail() {
  const params = useParams();
  const { t, locale } = useLanguage();
  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMarket() {
      try {
        const data = await getMarket(Number(params.id));
        setMarket(data);
      } catch (err) {
        setError('Failed to load market');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchMarket();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-teal-400 animate-spin" />
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-teal-600/10 border border-teal-600/30 rounded-xl p-6 sm:p-8 text-center">
            <AlertCircle className="w-12 h-12 text-teal-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t('market.notFound')}</h2>
            <Link href="/" className="text-teal-400 hover:underline">
              {t('market.backToMarkets')}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const yesPercent = market.probabilities?.yes ?? 50;
  const noPercent = market.probabilities?.no ?? 50;
  const yesVotes = market.votes?.filter((v) => v.vote === 'YES') || [];
  const noVotes = market.votes?.filter((v) => v.vote === 'NO') || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          {t('market.backToMarkets')}
        </Link>

        {/* Market Header */}
        <div className="bg-surface border border-border rounded-xl p-4 sm:p-8 mb-8">
          <div className="flex items-start justify-between mb-4">
            <span className="text-xs font-medium px-3 py-1 bg-teal-600/20 text-teal-400 rounded-full">
              {categoryGroupLabels[market.category] || market.category || t('common.prediction')}
            </span>
            <span className={`text-xs px-3 py-1 rounded-full ${
              market.status === 'active'
                ? 'bg-green-600/20 text-green-500'
                : 'bg-gray-600/20 text-muted-foreground'
            }`}>
              {market.status}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold mb-6">{market.question}</h1>

          {market.description && (
            <p className="text-muted mb-6">{market.description}</p>
          )}

          {/* Large Probability Display */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-6">
            <div className="bg-green-600/10 border border-green-600/30 rounded-xl p-4 sm:p-6 text-center">
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 mx-auto mb-2" />
              <div className="text-3xl sm:text-4xl font-bold text-green-500">
                {yesPercent.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground mt-1">{t('common.yes')}</div>
              <div className="text-xs text-subtle mt-2">
                {yesVotes.length} {t('common.votes')}
              </div>
            </div>
            <div className="bg-red-600/10 border border-red-600/30 rounded-xl p-4 sm:p-6 text-center">
              <TrendingDown className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 mx-auto mb-2" />
              <div className="text-3xl sm:text-4xl font-bold text-red-500">
                {noPercent.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground mt-1">{t('common.no')}</div>
              <div className="text-xs text-subtle mt-2">
                {noVotes.length} {t('common.votes')}
              </div>
            </div>
          </div>

          {/* Probability Bar */}
          <div className="h-4 bg-border rounded-full overflow-hidden flex mb-6">
            <div
              className="bg-gradient-to-r from-green-600 to-green-500 transition-all duration-500"
              style={{ width: `${yesPercent}%` }}
            />
            <div
              className="bg-gradient-to-r from-red-500 to-red-600 transition-all duration-500"
              style={{ width: `${noPercent}%` }}
            />
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-3 sm:gap-6 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              {t('market.resolves', { date: formatDate(market.resolution_date, locale) })}
            </div>
            <div className="flex items-center gap-2">
              <Users size={16} />
              {t('market.totalVotes', { count: market.total_opinions })}
            </div>
          </div>
        </div>

        {/* Probability Chart */}
        <ProbabilityChart marketId={market.id} />

        {/* Votes Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
          {/* YES Votes */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              {t('market.yesVotes', { count: yesVotes.length })}
            </h3>
            <VoteList votes={yesVotes} />
          </div>

          {/* NO Votes */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              {t('market.noVotes', { count: noVotes.length })}
            </h3>
            <VoteList votes={noVotes} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
