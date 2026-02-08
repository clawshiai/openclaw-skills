'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Loader2, Check, Gift } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { formatUSDC } from '@/lib/contracts';
import { useClaim } from '@/hooks/useClaim';
import type { UserPosition } from '@/lib/api';

interface PositionCardProps {
  position: UserPosition;
  onClaimed?: () => void;
}

export function PositionCard({ position, onClaimed }: PositionCardProps) {
  const { t } = useLanguage();
  const { claim, step, isPending, txHash } = useClaim(position.market_id);

  const isActive = position.market_status === 'active';
  const isResolved = position.market_status === 'resolved';
  const isClaimed = position.claimed;

  // Calculate potential payout (simplified)
  const calculatePayout = (): string => {
    const amount = parseFloat(formatUSDC(BigInt(position.amount)));
    const odds = position.position === 'YES' ? position.current_odds.yes : position.current_odds.no;
    if (odds <= 0) return '0.00';
    return ((amount / odds) * 100).toFixed(2);
  };

  const handleClaim = async () => {
    const success = await claim();
    if (success && onClaimed) {
      onClaimed();
    }
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-4 hover:border-border-hover transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <Link
          href={`/market/${position.market_id}`}
          className="text-sm font-medium hover:text-teal-400 transition-colors line-clamp-2 flex-1 mr-2"
        >
          {position.question}
        </Link>
        <span
          className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
            isActive
              ? 'bg-blue-500/20 text-blue-400'
              : isClaimed
              ? 'bg-gray-500/20 text-muted-foreground'
              : 'bg-green-500/20 text-green-400'
          }`}
        >
          {isActive ? t('portfolio.activeLabel') : isClaimed ? t('portfolio.claimedLabel') : t('portfolio.resolvedLabel')}
        </span>
      </div>

      {/* Position details */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold px-2 py-1 rounded ${
              position.position === 'YES'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            {position.position}
          </span>
          <span className="text-sm font-medium">
            ${formatUSDC(BigInt(position.amount))} USDC
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {position.category}
        </span>
      </div>

      {/* Current odds / Potential payout */}
      {isActive && (
        <div className="flex items-center justify-between text-sm mb-3">
          <span className="text-muted-foreground">{t('portfolio.currentOdds')}</span>
          <span>
            <span className="text-green-400">{position.current_odds.yes.toFixed(1)}%</span>
            {' / '}
            <span className="text-red-400">{position.current_odds.no.toFixed(1)}%</span>
          </span>
        </div>
      )}

      {/* Potential payout for active positions */}
      {isActive && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('staking.potentialPayout')}</span>
          <span className={position.position === 'YES' ? 'text-green-400' : 'text-red-400'}>
            ${calculatePayout()}
          </span>
        </div>
      )}

      {/* Claim button for resolved, unclaimed positions */}
      {isResolved && !isClaimed && (
        <div className="mt-3">
          {step === 'success' ? (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-green-400 text-sm">
                <Check size={14} />
                {t('portfolio.claimed')}
              </span>
              {txHash && (
                <a
                  href={`https://basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-teal-400 hover:underline flex items-center gap-1"
                >
                  <ExternalLink size={12} />
                  {t('staking.viewTx')}
                </a>
              )}
            </div>
          ) : (
            <button
              onClick={handleClaim}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  {t('staking.pending')}
                </>
              ) : (
                <>
                  <Gift size={14} />
                  {t('portfolio.claim')}
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Claimed indicator */}
      {isClaimed && (
        <div className="mt-3 text-sm text-muted-foreground flex items-center gap-1">
          <Check size={14} />
          {t('portfolio.claimedAt')} {new Date(position.created_at).toLocaleDateString()}
        </div>
      )}

      {/* Transaction link */}
      {position.tx_hash && (
        <a
          href={`https://basescan.org/tx/${position.tx_hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 text-xs text-muted-foreground hover:text-teal-400 flex items-center gap-1"
        >
          <ExternalLink size={12} />
          {position.tx_hash.slice(0, 10)}...{position.tx_hash.slice(-8)}
        </a>
      )}
    </div>
  );
}
