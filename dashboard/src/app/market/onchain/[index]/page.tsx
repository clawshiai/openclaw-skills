'use client';

import { use } from 'react';
import { ArrowLeft, Clock, CheckCircle, TrendingUp, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StakingPanel } from '@/components/StakingPanel';
import { useOnChainMarket } from '@/hooks/useOnChainMarkets';
import { formatUSDC, MARKET_FACTORY_ADDRESS } from '@/lib/contracts';
import { useLanguage } from '@/i18n/LanguageContext';

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OnChainMarketPage({ params }: { params: Promise<{ index: string }> }) {
  const resolvedParams = use(params);
  const contractIndex = parseInt(resolvedParams.index);
  const { t } = useLanguage();
  const { market, loading, error } = useOnChainMarket(contractIndex);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-teal-400 animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold mb-4">Market Not Found</h1>
            <p className="text-muted-foreground mb-6">
              {error || 'This market does not exist on the blockchain.'}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300"
            >
              <ArrowLeft size={16} />
              Back to Markets
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const yesPct = market.yesProbability;
  const noPct = market.noProbability;
  const isExpired = market.deadline * 1000 < Date.now();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          {t('market.backToMarkets')}
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs px-2 py-1 bg-teal-600/20 text-teal-400 rounded font-medium">
              {t('clawshi.onChain')}
            </span>
            <span className="text-xs text-muted-foreground">
              Market #{contractIndex}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-4">{market.question}</h1>

          {/* Status */}
          <div className="flex items-center gap-4 text-sm">
            {market.resolved ? (
              <span className="flex items-center gap-1 text-green-500">
                <CheckCircle size={16} />
                {t('clawshi.resolved')} - {market.outcome ? 'YES' : 'NO'} {t('clawshi.won')}
              </span>
            ) : isExpired ? (
              <span className="flex items-center gap-1 text-yellow-500">
                <Clock size={16} />
                Awaiting Resolution
              </span>
            ) : (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock size={16} />
                {t('clawshi.endsIn')}: {formatDate(market.deadline)}
              </span>
            )}
          </div>
        </div>

        {/* Pool breakdown */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-xl">
            <div className="text-green-500 text-sm font-medium mb-1">YES Pool</div>
            <div className="text-2xl font-bold">{formatUSDC(market.yesPool)} USDC</div>
            <div className="text-sm text-muted-foreground mt-1">{yesPct}%</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-xl">
            <div className="text-red-500 text-sm font-medium mb-1">NO Pool</div>
            <div className="text-2xl font-bold">{formatUSDC(market.noPool)} USDC</div>
            <div className="text-sm text-muted-foreground mt-1">{noPct}%</div>
          </div>
        </div>

        {/* Probability bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-green-500 font-medium">YES {yesPct}%</span>
            <span className="text-red-500 font-medium">NO {noPct}%</span>
          </div>
          <div className="h-4 bg-red-500/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${yesPct}%` }}
            />
          </div>
        </div>

        {/* Total Pool */}
        <div className="flex items-center gap-2 text-muted-foreground mb-8">
          <TrendingUp size={16} />
          <span>{t('clawshi.totalPool')}: {formatUSDC(market.totalPool)} USDC</span>
        </div>

        {/* Staking Panel - only show if not resolved */}
        {!market.resolved && !isExpired && (
          <div className="mb-8">
            <StakingPanel
              marketId={contractIndex}
              odds={{ yes: yesPct, no: noPct }}
            />
          </div>
        )}

        {/* Resolution status for resolved markets */}
        {market.resolved && (
          <div className="mb-8 p-6 bg-surface border border-border rounded-xl">
            <h3 className="text-lg font-semibold mb-2">Resolution</h3>
            <p className="text-muted-foreground">
              This market has been resolved. The outcome was{' '}
              <span className={market.outcome ? 'text-green-500 font-semibold' : 'text-red-500 font-semibold'}>
                {market.outcome ? 'YES' : 'NO'}
              </span>.
            </p>
          </div>
        )}

        {/* Contract info */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Contract Details</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Contract</span>
              <a
                href={`https://basescan.org/address/${MARKET_FACTORY_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-teal-400 hover:text-teal-300"
              >
                {MARKET_FACTORY_ADDRESS.slice(0, 6)}...{MARKET_FACTORY_ADDRESS.slice(-4)}
                <ExternalLink size={12} />
              </a>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Market Index</span>
              <span>{contractIndex}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Network</span>
              <span>Base Mainnet</span>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
