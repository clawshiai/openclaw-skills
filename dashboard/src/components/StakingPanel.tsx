'use client';

import { useState, useEffect } from 'react';
import { Wallet, Coins, TrendingUp } from 'lucide-react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useWallet } from '@/context/WalletContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useStake } from '@/hooks/useStake';
import { useUserStake } from '@/hooks/useMarketContract';
import { PositionSelector } from './PositionSelector';
import { AmountInput } from './AmountInput';
import { TransactionButton } from './TransactionButton';
import { formatUSDC, MIN_STAKE } from '@/lib/contracts';

interface StakingPanelProps {
  marketId: number;
  odds: {
    yes: number;
    no: number;
  };
}

export function StakingPanel({ marketId, odds }: StakingPanelProps) {
  const { t } = useLanguage();
  const { address, isConnected, isCorrectNetwork, usdcBalance, switchToBase } = useWallet();
  const { openConnectModal } = useConnectModal();
  const [position, setPosition] = useState<'YES' | 'NO' | null>(null);
  const [amount, setAmount] = useState('');

  const {
    step,
    error,
    txHash,
    needsApproval,
    approve,
    stake,
    reset,
    isPending,
  } = useStake(marketId);

  const { stake: userStake, refetch: refetchStake } = useUserStake(marketId, address);

  // Calculate potential payout
  const calculatePayout = (): string => {
    const amountNum = parseFloat(amount);
    if (!amountNum || !position) return '0.00';

    // Simplified payout calculation: amount / current_odds * 100
    const currentOdds = position === 'YES' ? odds.yes : odds.no;
    if (currentOdds <= 0) return '0.00';

    const payout = (amountNum / currentOdds) * 100;
    return payout.toFixed(2);
  };

  // Validate stake amount
  const isValidAmount = (): boolean => {
    const amountNum = parseFloat(amount);
    if (!amountNum || isNaN(amountNum)) return false;
    if (amountNum < 0.1) return false;
    if (amountNum > parseFloat(formatUSDC(usdcBalance))) return false;
    return true;
  };

  // Reset form after success
  useEffect(() => {
    if (step === 'success') {
      refetchStake();
    }
  }, [step, refetchStake]);

  const handleApprove = async () => {
    if (!position || !isValidAmount()) return;
    await approve(amount);
  };

  const handleStake = async () => {
    if (!position || !isValidAmount()) return;
    await stake(position, amount);
  };

  const handleReset = () => {
    reset();
    setAmount('');
  };

  // Not connected state
  if (!isConnected) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6 mt-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Coins size={20} className="text-teal-400" />
          {t('staking.title')}
        </h3>

        <div className="text-center py-6">
          <p className="text-muted-foreground mb-4">{t('staking.connectWallet')}</p>
          <button
            onClick={openConnectModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-black rounded-xl font-medium transition-colors"
          >
            <Wallet size={18} />
            {t('wallet.connect')}
          </button>
        </div>
      </div>
    );
  }

  // Wrong network state
  if (!isCorrectNetwork) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6 mt-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Coins size={20} className="text-teal-400" />
          {t('staking.title')}
        </h3>

        <div className="text-center py-6">
          <p className="text-muted-foreground mb-4">{t('wallet.wrongNetwork')}</p>
          <button
            onClick={switchToBase}
            className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 hover:bg-yellow-500/30 rounded-xl font-medium transition-colors"
          >
            {t('wallet.switchToBase')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-6 mt-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Coins size={20} className="text-teal-400" />
        {t('staking.title')}
      </h3>

      {/* User's existing stake */}
      {userStake?.hasStake && (
        <div className="mb-4 p-3 bg-surface-hover border border-border-hover rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Your Position</div>
          <div className="flex items-center gap-4">
            {userStake.yesAmount > 0n && (
              <div className="flex items-center gap-1 text-green-400">
                <span className="font-medium">YES:</span>
                <span>{formatUSDC(userStake.yesAmount)} USDC</span>
              </div>
            )}
            {userStake.noAmount > 0n && (
              <div className="flex items-center gap-1 text-red-400">
                <span className="font-medium">NO:</span>
                <span>{formatUSDC(userStake.noAmount)} USDC</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Position Selector */}
        <div>
          <label className="block text-sm text-muted-foreground mb-2">
            {t('staking.selectPosition')}
          </label>
          <PositionSelector
            selected={position}
            onSelect={setPosition}
            odds={odds}
            disabled={isPending}
          />
        </div>

        {/* Amount Input */}
        <AmountInput
          value={amount}
          onChange={setAmount}
          balance={usdcBalance}
          min={0.1}
          disabled={isPending}
        />

        {/* Potential Payout */}
        {position && amount && isValidAmount() && (
          <div className="flex items-center justify-between p-3 bg-surface-hover border border-border-hover rounded-lg">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <TrendingUp size={14} />
              {t('staking.potentialPayout')}
            </span>
            <span className={`font-semibold ${position === 'YES' ? 'text-green-400' : 'text-red-400'}`}>
              ${calculatePayout()} USDC
            </span>
          </div>
        )}

        {/* Transaction Button */}
        <TransactionButton
          step={step}
          needsApproval={needsApproval(amount)}
          onApprove={handleApprove}
          onStake={handleStake}
          onReset={handleReset}
          txHash={txHash}
          error={error}
          disabled={!position || !isValidAmount()}
          position={position}
        />
      </div>
    </div>
  );
}
