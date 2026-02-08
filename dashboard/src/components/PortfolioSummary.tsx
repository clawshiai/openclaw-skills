'use client';

import { Coins, Activity, Gift, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { formatUSDC } from '@/lib/contracts';

interface PortfolioSummaryProps {
  totalStaked: string;
  activePositions: number;
  resolvedPositions: number;
  claimable: string;
}

export function PortfolioSummary({
  totalStaked,
  activePositions,
  resolvedPositions,
  claimable,
}: PortfolioSummaryProps) {
  const { t } = useLanguage();

  const stats = [
    {
      label: t('portfolio.totalStaked'),
      value: `$${formatUSDC(BigInt(totalStaked))}`,
      icon: <Coins size={20} className="text-teal-400" />,
      color: 'text-teal-400',
    },
    {
      label: t('portfolio.active'),
      value: activePositions.toString(),
      icon: <Activity size={20} className="text-blue-400" />,
      color: 'text-blue-400',
    },
    {
      label: t('portfolio.claimable'),
      value: `$${formatUSDC(BigInt(claimable))}`,
      icon: <Gift size={20} className="text-green-400" />,
      color: 'text-green-400',
    },
    {
      label: t('portfolio.resolved'),
      value: resolvedPositions.toString(),
      icon: <TrendingUp size={20} className="text-purple-400" />,
      color: 'text-purple-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-surface border border-border rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            {stat.icon}
            <span className="text-sm text-muted-foreground">{stat.label}</span>
          </div>
          <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
        </div>
      ))}
    </div>
  );
}
