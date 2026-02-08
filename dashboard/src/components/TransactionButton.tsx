'use client';

import { Loader2, Check, AlertTriangle, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import type { StakeStep } from '@/hooks/useStake';

interface TransactionButtonProps {
  step: StakeStep;
  needsApproval: boolean;
  onApprove: () => void;
  onStake: () => void;
  onReset?: () => void;
  txHash: string | null;
  error: string | null;
  disabled?: boolean;
  position: 'YES' | 'NO' | null;
}

export function TransactionButton({
  step,
  needsApproval,
  onApprove,
  onStake,
  onReset,
  txHash,
  error,
  disabled,
  position,
}: TransactionButtonProps) {
  const { t } = useLanguage();

  // Loading states
  if (step === 'approving') {
    return (
      <button
        disabled
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-600/50 text-foreground rounded-xl font-medium cursor-not-allowed"
      >
        <Loader2 size={18} className="animate-spin" />
        {t('staking.pending')}
      </button>
    );
  }

  if (step === 'staking') {
    return (
      <button
        disabled
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-600/50 text-foreground rounded-xl font-medium cursor-not-allowed"
      >
        <Loader2 size={18} className="animate-spin" />
        {t('staking.pending')}
      </button>
    );
  }

  // Success state
  if (step === 'success') {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500/20 text-green-400 rounded-xl font-medium">
          <Check size={18} />
          {t('staking.success')}
        </div>
        {txHash && (
          <a
            href={`https://basescan.org/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-teal-400 hover:text-teal-300 bg-surface-hover border border-border-hover hover:border-teal-600/50 rounded-xl transition-colors"
          >
            <ExternalLink size={14} />
            {t('staking.viewTx')}
          </a>
        )}
        {onReset && (
          <button
            onClick={onReset}
            className="w-full px-4 py-2 text-sm text-muted hover:text-foreground bg-surface-hover border border-border-hover rounded-xl transition-colors"
          >
            Stake Again
          </button>
        )}
      </div>
    );
  }

  // Error state
  if (step === 'error') {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 text-red-400 rounded-xl font-medium">
          <AlertTriangle size={18} />
          {error || 'Transaction failed'}
        </div>
        {onReset && (
          <button
            onClick={onReset}
            className="w-full px-4 py-2 text-sm text-muted hover:text-foreground bg-surface-hover border border-border-hover rounded-xl transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  // After approval, show stake button
  if (step === 'approved') {
    return (
      <button
        onClick={onStake}
        disabled={disabled || !position}
        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors ${
          position === 'YES'
            ? 'bg-green-600 hover:bg-green-500 text-white'
            : position === 'NO'
            ? 'bg-red-600 hover:bg-red-500 text-white'
            : 'bg-teal-600 hover:bg-teal-500 text-black'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {t('staking.stake')} {position}
      </button>
    );
  }

  // Initial state - show approve or stake
  if (needsApproval) {
    return (
      <button
        onClick={onApprove}
        disabled={disabled || !position}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 hover:bg-teal-500 text-black rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {t('staking.approve')}
      </button>
    );
  }

  return (
    <button
      onClick={onStake}
      disabled={disabled || !position}
      className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors ${
        position === 'YES'
          ? 'bg-green-600 hover:bg-green-500 text-white'
          : position === 'NO'
          ? 'bg-red-600 hover:bg-red-500 text-white'
          : 'bg-teal-600 hover:bg-teal-500 text-black'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {t('staking.stake')} {position}
    </button>
  );
}
