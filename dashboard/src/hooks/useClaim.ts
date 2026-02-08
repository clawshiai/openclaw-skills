'use client';

import { useState, useCallback } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS, clawshiMarketAbi } from '@/lib/contracts';
import { useWallet } from '@/context/WalletContext';
import { recordClaim } from '@/lib/api';

export type ClaimStep = 'idle' | 'claiming' | 'success' | 'error';

export function useClaim(marketIndex: number) {
  const { address } = useWallet();
  const [step, setStep] = useState<ClaimStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  const { writeContractAsync: claimAsync, isPending: isClaiming } = useWriteContract();

  const { isLoading: isWaitingForTx } = useWaitForTransactionReceipt({
    hash: txHash ?? undefined,
  });

  const claim = useCallback(async () => {
    if (!address) {
      setError('Wallet not connected');
      return false;
    }

    try {
      setStep('claiming');
      setError(null);

      const hash = await claimAsync({
        address: CONTRACTS.CLAWSHI_MARKET,
        abi: clawshiMarketAbi,
        functionName: 'claim',
        args: [BigInt(marketIndex)],
      });

      setTxHash(hash);

      // Record claim in backend
      try {
        await recordClaim({
          wallet_address: address,
          market_id: marketIndex,
          tx_hash: hash,
        });
      } catch (e) {
        console.warn('Failed to record claim in backend:', e);
      }

      setStep('success');
      return true;
    } catch (err) {
      console.error('Claim error:', err);
      setError(err instanceof Error ? err.message : 'Claim failed');
      setStep('error');
      return false;
    }
  }, [address, marketIndex, claimAsync]);

  const reset = useCallback(() => {
    setStep('idle');
    setError(null);
    setTxHash(null);
  }, []);

  return {
    step,
    error,
    txHash,
    claim,
    reset,
    isClaiming,
    isWaitingForTx,
    isPending: isClaiming || isWaitingForTx,
  };
}
