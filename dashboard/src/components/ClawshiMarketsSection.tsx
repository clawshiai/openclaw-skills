'use client';

import { useState } from 'react';
import { Loader2, Plus, Coins, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useWallet } from '@/context/WalletContext';
import { useOnChainMarkets, OnChainMarket } from '@/hooks/useOnChainMarkets';
import { OnChainMarketCard } from './OnChainMarketCard';
import Link from 'next/link';

type StatusFilter = 'all' | 'active' | 'resolved';

export function ClawshiMarketsSection() {
  const { t } = useLanguage();
  const { isConnected } = useWallet();
  const { markets, loading, error } = useOnChainMarkets();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Filter markets by status
  const filteredMarkets = markets.filter((market) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return !market.resolved;
    if (statusFilter === 'resolved') return market.resolved;
    return true;
  });

  // Sort: active first, then by deadline
  const sortedMarkets = [...filteredMarkets].sort((a, b) => {
    if (a.resolved !== b.resolved) return a.resolved ? 1 : -1;
    return a.deadline - b.deadline;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-surface-hover border border-border rounded-lg text-sm hover:border-teal-600/50 transition-colors"
        >
          <RefreshCw size={14} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Coins size={24} className="text-teal-400" />
            {t('clawshi.title')}
          </h3>
          <p className="text-muted-foreground text-sm mt-1">
            {t('clawshi.subtitle')}
          </p>
        </div>
        {isConnected ? (
          <Link
            href="/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-black rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            {t('clawshi.createMarket')}
          </Link>
        ) : (
          <span className="text-xs text-muted-foreground">
            {t('clawshi.connectToCreate')}
          </span>
        )}
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            statusFilter === 'all'
              ? 'bg-teal-600 text-white'
              : 'bg-surface-hover border border-border-hover text-muted hover:border-teal-600/50 hover:text-foreground'
          }`}
        >
          {t('clawshi.all')} ({markets.length})
        </button>
        <button
          onClick={() => setStatusFilter('active')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            statusFilter === 'active'
              ? 'bg-teal-600 text-white'
              : 'bg-surface-hover border border-border-hover text-muted hover:border-teal-600/50 hover:text-foreground'
          }`}
        >
          {t('clawshi.active')} ({markets.filter((m) => !m.resolved).length})
        </button>
        <button
          onClick={() => setStatusFilter('resolved')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            statusFilter === 'resolved'
              ? 'bg-teal-600 text-white'
              : 'bg-surface-hover border border-border-hover text-muted hover:border-teal-600/50 hover:text-foreground'
          }`}
        >
          {t('clawshi.resolved')} ({markets.filter((m) => m.resolved).length})
        </button>
      </div>

      {/* Markets grid */}
      {sortedMarkets.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <Coins className="w-16 h-16 text-teal-400/30 mx-auto mb-4" />
          <h4 className="text-xl font-semibold mb-2">{t('clawshi.noMarkets')}</h4>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            {t('clawshi.noMarketsDesc')}
          </p>
          {isConnected && (
            <Link
              href="/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-500 text-black rounded-xl font-medium transition-colors"
            >
              <Plus size={18} />
              {t('clawshi.createMarket')}
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedMarkets.map((market) => (
            <OnChainMarketCard key={market.contractIndex} market={market} />
          ))}
        </div>
      )}
    </div>
  );
}
