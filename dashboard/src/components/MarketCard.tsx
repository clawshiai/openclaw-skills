'use client';

import { Market } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { TrendingUp, TrendingDown, Users, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/i18n/LanguageContext';

interface MarketCardProps {
  market: Market;
}

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

export function MarketCard({ market }: MarketCardProps) {
  const { t, locale } = useLanguage();
  const yesPercent = market.probabilities?.yes ?? 50;
  const noPercent = market.probabilities?.no ?? 50;
  const isHighConfidence = yesPercent >= 70 || yesPercent <= 30;

  return (
    <Link href={`/market/${market.id}`}>
      <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 hover:border-teal-600/50 transition-all duration-300 cursor-pointer group">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <span className="text-xs font-medium px-2 py-1 bg-teal-600/20 text-teal-400 rounded-full">
            {categoryGroupLabels[market.category] || market.category || t('common.prediction')}
          </span>
          <span className="text-xs text-muted-foreground">
            {t('common.id', { id: String(market.id) })}
          </span>
        </div>

        {/* Question */}
        <h3 className="text-base sm:text-lg font-semibold mb-4 group-hover:text-teal-400 transition-colors line-clamp-2">
          {market.question}
        </h3>

        {/* Probability Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-green-500 font-medium flex items-center gap-1">
              <TrendingUp size={14} />
              {t('common.yes')} {yesPercent.toFixed(1)}%
            </span>
            <span className="text-red-500 font-medium flex items-center gap-1">
              {t('common.no')} {noPercent.toFixed(1)}%
              <TrendingDown size={14} />
            </span>
          </div>
          <div className="h-3 bg-border rounded-full overflow-hidden flex">
            <div
              className="bg-gradient-to-r from-green-600 to-green-500 transition-all duration-500"
              style={{ width: `${yesPercent}%` }}
            />
            <div
              className="bg-gradient-to-r from-red-500 to-red-600 transition-all duration-500"
              style={{ width: `${noPercent}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users size={14} />
            <span>{market.total_opinions} {t('common.votes')}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            <span>{formatDate(market.resolution_date, locale)}</span>
          </div>
        </div>

        {/* Confidence indicator */}
        {isHighConfidence && (
          <div className={`mt-3 text-xs font-medium px-2 py-1 rounded-full inline-block ${
            yesPercent >= 70
              ? 'bg-green-600/20 text-green-500'
              : 'bg-red-600/20 text-red-500'
          }`}>
            {yesPercent >= 70 ? t('market.highYes') : t('market.highNo')}
          </div>
        )}
      </div>
    </Link>
  );
}
