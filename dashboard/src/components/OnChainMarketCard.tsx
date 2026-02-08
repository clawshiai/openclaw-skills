'use client';

import Link from 'next/link';
import { Clock, CheckCircle, TrendingUp } from 'lucide-react';
import { formatUSDC } from '@/lib/contracts';
import { useLanguage } from '@/i18n/LanguageContext';
import { OnChainMarket } from '@/hooks/useOnChainMarkets';

interface OnChainMarketCardProps {
  market: OnChainMarket;
}

function formatDeadline(deadline: number): string {
  const date = new Date(deadline * 1000);
  const now = new Date();
  const diff = date.getTime() - now.getTime();

  if (diff < 0) return 'Ended';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h`;

  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${minutes}m`;
}

export function OnChainMarketCard({ market }: OnChainMarketCardProps) {
  const { t } = useLanguage();
  const yesPct = market.yesProbability;
  const noPct = market.noProbability;

  return (
    <Link href={`/market/onchain/${market.contractIndex}`}>
      <div className="group bg-surface border border-border rounded-xl p-4 hover:border-teal-600/50 transition-all hover:shadow-lg hover:shadow-teal-600/5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs px-2 py-1 bg-teal-600/20 text-teal-400 rounded font-medium">
            {t('clawshi.onChain')}
          </span>
          {market.resolved ? (
            <span className="flex items-center gap-1 text-xs text-green-500">
              <CheckCircle size={12} />
              {t('clawshi.resolved')}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock size={12} />
              {formatDeadline(market.deadline)}
            </span>
          )}
        </div>

        {/* Question */}
        <h3 className="font-medium mb-4 line-clamp-2 text-foreground group-hover:text-teal-400 transition-colors">
          {market.question}
        </h3>

        {/* Probability display */}
        <div className="flex justify-between text-sm mb-2">
          <span className="text-green-500 font-medium">YES {yesPct}%</span>
          <span className="text-red-500 font-medium">NO {noPct}%</span>
        </div>

        {/* Probability bar */}
        <div className="h-2 bg-red-500/30 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${yesPct}%` }}
          />
        </div>

        {/* Pool info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <TrendingUp size={12} />
            <span>{t('clawshi.totalPool')}: {formatUSDC(market.totalPool)} USDC</span>
          </div>
          {market.resolved && (
            <span className={market.outcome ? 'text-green-500' : 'text-red-500'}>
              {market.outcome ? 'YES' : 'NO'} {t('clawshi.won')}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
