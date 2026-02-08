'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useWallet } from '@/context/WalletContext';
import { useCreateMarket, ResolutionType } from '@/hooks/useCreateMarket';
import { useLanguage } from '@/i18n/LanguageContext';

export default function CreateMarketPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { isConnected } = useWallet();
  const { createMarket, hash, isPending, isConfirming, isSuccess, error, reset } = useCreateMarket();

  // Form state
  const [question, setQuestion] = useState('');
  const [resolutionType, setResolutionType] = useState<ResolutionType>('chainlink');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('');

  // Chainlink params
  const [asset, setAsset] = useState<'BTC' | 'ETH'>('BTC');
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');

  // Validation
  const isValidForm = () => {
    if (!question.trim()) return false;
    if (!deadlineDate || !deadlineTime) return false;

    const deadline = new Date(`${deadlineDate}T${deadlineTime}`);
    if (deadline <= new Date()) return false;

    if (resolutionType === 'chainlink') {
      if (!targetPrice || parseFloat(targetPrice) <= 0) return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidForm()) return;

    const deadline = new Date(`${deadlineDate}T${deadlineTime}`);

    await createMarket({
      question,
      resolutionType,
      deadline,
      asset: resolutionType === 'chainlink' ? asset : undefined,
      targetPrice: resolutionType === 'chainlink' ? parseFloat(targetPrice) : undefined,
      isGreaterThan: condition === 'above',
    });
  };

  // Not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
          <div className="text-center py-16">
            <Plus className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">{t('clawshi.createMarket')}</h1>
            <p className="text-muted-foreground mb-6">{t('clawshi.connectToCreate')}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Success state
  if (isSuccess && hash) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
          <div className="text-center py-16">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Market Created!</h1>
            <p className="text-muted-foreground mb-6">
              Your prediction market has been created on-chain.
            </p>
            <div className="flex flex-col gap-4 items-center">
              <a
                href={`https://basescan.org/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-teal-400 hover:text-teal-300"
              >
                View on BaseScan
                <ExternalLink size={14} />
              </a>
              <button
                onClick={() => {
                  reset();
                  router.push('/');
                }}
                className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-black rounded-xl font-medium transition-colors"
              >
                Back to Markets
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Markets
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">{t('clawshi.createMarket')}</h1>
          <p className="text-muted-foreground">
            Create an on-chain prediction market with USDC staking.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Question
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Will BTC reach $100,000 by March 2026?"
              className="w-full px-4 py-3 bg-surface-hover border border-border-hover rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-teal-600/50"
            />
          </div>

          {/* Resolution Type */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Resolution Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setResolutionType('chainlink')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  resolutionType === 'chainlink'
                    ? 'border-teal-600 bg-teal-600/10'
                    : 'border-border-hover bg-surface-hover hover:border-teal-600/50'
                }`}
              >
                <div className="font-medium mb-1">Chainlink Price Feed</div>
                <div className="text-xs text-muted-foreground">
                  Auto-resolves based on BTC/ETH price
                </div>
              </button>
              <button
                type="button"
                onClick={() => setResolutionType('manual')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  resolutionType === 'manual'
                    ? 'border-teal-600 bg-teal-600/10'
                    : 'border-border-hover bg-surface-hover hover:border-teal-600/50'
                }`}
              >
                <div className="font-medium mb-1">Manual Resolution</div>
                <div className="text-xs text-muted-foreground">
                  Admin resolves the outcome
                </div>
              </button>
            </div>
          </div>

          {/* Chainlink Params */}
          {resolutionType === 'chainlink' && (
            <div className="space-y-4 p-4 bg-surface border border-border rounded-xl">
              <h3 className="font-medium">Price Condition</h3>

              {/* Asset */}
              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Asset
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setAsset('BTC')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      asset === 'BTC'
                        ? 'bg-orange-500 text-white'
                        : 'bg-surface-hover border border-border-hover hover:border-orange-500/50'
                    }`}
                  >
                    BTC
                  </button>
                  <button
                    type="button"
                    onClick={() => setAsset('ETH')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      asset === 'ETH'
                        ? 'bg-blue-500 text-white'
                        : 'bg-surface-hover border border-border-hover hover:border-blue-500/50'
                    }`}
                  >
                    ETH
                  </button>
                </div>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Condition
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCondition('above')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                      condition === 'above'
                        ? 'bg-green-500 text-white'
                        : 'bg-surface-hover border border-border-hover hover:border-green-500/50'
                    }`}
                  >
                    <TrendingUp size={14} />
                    Above
                  </button>
                  <button
                    type="button"
                    onClick={() => setCondition('below')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                      condition === 'below'
                        ? 'bg-red-500 text-white'
                        : 'bg-surface-hover border border-border-hover hover:border-red-500/50'
                    }`}
                  >
                    <TrendingDown size={14} />
                    Below
                  </button>
                </div>
              </div>

              {/* Target Price */}
              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Target Price (USD)
                </label>
                <div className="relative">
                  <DollarSign
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="number"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    placeholder="100000"
                    className="w-full pl-9 pr-4 py-3 bg-surface-hover border border-border-hover rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-teal-600/50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <Calendar size={14} className="inline mr-1" />
              Deadline
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="px-4 py-3 bg-surface-hover border border-border-hover rounded-xl text-foreground focus:outline-none focus:border-teal-600/50"
              />
              <input
                type="time"
                value={deadlineTime}
                onChange={(e) => setDeadlineTime(e.target.value)}
                className="px-4 py-3 bg-surface-hover border border-border-hover rounded-xl text-foreground focus:outline-none focus:border-teal-600/50"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Staking closes at this time. Resolution happens after deadline.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
              <AlertCircle size={16} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!isValidForm() || isPending || isConfirming}
            className="w-full py-4 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-600/50 disabled:cursor-not-allowed text-black rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {isPending || isConfirming ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {isPending ? 'Confirm in Wallet...' : 'Creating Market...'}
              </>
            ) : (
              <>
                <Plus size={18} />
                Create Market
              </>
            )}
          </button>
        </form>

        {/* Info */}
        <div className="mt-8 p-4 bg-surface border border-border rounded-xl">
          <h3 className="font-medium mb-2">How it works</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>1. Create a market with your question and resolution method</li>
            <li>2. Users stake USDC on YES or NO outcomes</li>
            <li>3. After deadline, the market is resolved</li>
            <li>4. Winners claim proportional payouts from the pool</li>
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  );
}
