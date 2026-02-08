'use client';

import { useState, useCallback } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { CONTRACTS, clawshiMarketAbi, erc20Abi, parseUSDC } from '@/lib/contracts';
import { useWallet } from '@/context/WalletContext';
import { recordStake } from '@/lib/api';

export type StakeStep = 'idle' | 'approving' | 'approved' | 'staking' | 'success' | 'error';

export function useStake(marketIndex: number) {
  const { address } = useWallet();
  const [step, setStep] = useState<StakeStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  // Check current allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACTS.USDC,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.CLAWSHI_MARKET] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Write contracts
  const { writeContractAsync: approveAsync, isPending: isApproving } = useWriteContract();
  const { writeContractAsync: stakeAsync, isPending: isStaking } = useWriteContract();

  // Wait for transaction
  const { isLoading: isWaitingForTx } = useWaitForTransactionReceipt({
    hash: txHash ?? undefined,
  });

  // Check if approval is needed for amount
  const needsApproval = useCallback(
    (amount: string): boolean => {
      if (!allowance) return true;
      const amountBigInt = parseUSDC(amount);
      return amountBigInt > (allowance as bigint);
    },
    [allowance]
  );

  // Approve USDC spending
  const approve = useCallback(
    async (amount: string) => {
      if (!address) {
        setError('Wallet not connected');
        return false;
      }

      try {
        setStep('approving');
        setError(null);

        const amountBigInt = parseUSDC(amount);

        const hash = await approveAsync({
          address: CONTRACTS.USDC,
          abi: erc20Abi,
          functionName: 'approve',
          args: [CONTRACTS.CLAWSHI_MARKET, amountBigInt],
        });

        setTxHash(hash);
        await refetchAllowance();
        setStep('approved');
        return true;
      } catch (err) {
        console.error('Approve error:', err);
        setError(err instanceof Error ? err.message : 'Approval failed');
        setStep('error');
        return false;
      }
    },
    [address, approveAsync, refetchAllowance]
  );

  // Stake on market
  const stake = useCallback(
    async (position: 'YES' | 'NO', amount: string) => {
      if (!address) {
        setError('Wallet not connected');
        return false;
      }

      try {
        setStep('staking');
        setError(null);

        const amountBigInt = parseUSDC(amount);
        const isYes = position === 'YES';

        const hash = await stakeAsync({
          address: CONTRACTS.CLAWSHI_MARKET,
          abi: clawshiMarketAbi,
          functionName: 'stake',
          args: [BigInt(marketIndex), isYes, amountBigInt],
        });

        setTxHash(hash);

        // Record stake in backend
        try {
          await recordStake({
            wallet_address: address,
            market_id: marketIndex,
            position,
            amount: amountBigInt.toString(),
            tx_hash: hash,
          });
        } catch (e) {
          // Backend recording is optional, don't fail the stake
          console.warn('Failed to record stake in backend:', e);
        }

        setStep('success');
        return true;
      } catch (err) {
        console.error('Stake error:', err);
        setError(err instanceof Error ? err.message : 'Stake failed');
        setStep('error');
        return false;
      }
    },
    [address, marketIndex, stakeAsync]
  );

  // Full stake flow (approve if needed, then stake)
  const executeStake = useCallback(
    async (position: 'YES' | 'NO', amount: string) => {
      if (needsApproval(amount)) {
        const approved = await approve(amount);
        if (!approved) return false;
      }
      return stake(position, amount);
    },
    [needsApproval, approve, stake]
  );

  // Reset state
  const reset = useCallback(() => {
    setStep('idle');
    setError(null);
    setTxHash(null);
  }, []);

  return {
    step,
    error,
    txHash,
    allowance: allowance as bigint | undefined,
    needsApproval,
    approve,
    stake,
    executeStake,
    reset,
    isApproving,
    isStaking,
    isWaitingForTx,
    isPending: isApproving || isStaking || isWaitingForTx,
  };
}
