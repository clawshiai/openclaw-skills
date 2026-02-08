'use client';

import { useState } from 'react';
import { Wallet, Loader2, RefreshCw, Briefcase } from 'lucide-react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PortfolioSummary } from '@/components/PortfolioSummary';
import { PositionCard } from '@/components/PositionCard';
import { TransactionHistory } from '@/components/TransactionHistory';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useLanguage } from '@/i18n/LanguageContext';

type Tab = 'active' | 'resolved' | 'history';

export default function PortfolioPage() {
  const { t } = useLanguage();
  const { openConnectModal } = useConnectModal();
  const [activeTab, setActiveTab] = useState<Tab>('active');
  const {
    positions,
    history,
    summary,
    loading,
    error,
    refetch,
    isConnected,
    address,
  } = usePortfolio();

  const activePositions = positions.filter((p) => p.market_status === 'active');
  const resolvedPositions = positions.filter((p) => p.market_status === 'resolved');

  // Not connected state
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
          <div className="text-center py-16">
            <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">{t('portfolio.title')}</h1>
            <p className="text-muted-foreground mb-6">{t('portfolio.connectToView')}</p>
            <button
              onClick={openConnectModal}
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-500 text-black rounded-xl font-medium transition-colors"
            >
              <Wallet size={20} />
              {t('wallet.connect')}
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-12 h-12 text-teal-400 animate-spin" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Briefcase size={28} className="text-teal-400" />
              {t('portfolio.title')}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
          </div>
          <button
            onClick={refetch}
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-foreground bg-surface-hover border border-border-hover hover:border-teal-600/50 rounded-lg transition-colors"
          >
            <RefreshCw size={14} />
            {t('common.refresh')}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="mb-8">
          <PortfolioSummary
            totalStaked={summary.totalStaked}
            activePositions={summary.activePositions}
            resolvedPositions={summary.resolvedPositions}
            claimable={summary.claimable}
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'active'
                ? 'text-teal-400 border-teal-400'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            {t('portfolio.active')} ({activePositions.length})
          </button>
          <button
            onClick={() => setActiveTab('resolved')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'resolved'
                ? 'text-teal-400 border-teal-400'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            {t('portfolio.resolved')} ({resolvedPositions.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'history'
                ? 'text-teal-400 border-teal-400'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            {t('portfolio.history')}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'active' && (
          <div>
            {activePositions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {t('portfolio.noActivePositions')}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activePositions.map((position) => (
                  <PositionCard
                    key={position.id}
                    position={position}
                    onClaimed={refetch}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'resolved' && (
          <div>
            {resolvedPositions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {t('portfolio.noResolvedPositions')}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resolvedPositions.map((position) => (
                  <PositionCard
                    key={position.id}
                    position={position}
                    onClaimed={refetch}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && <TransactionHistory history={history} />}
      </main>
      <Footer />
    </div>
  );
}
