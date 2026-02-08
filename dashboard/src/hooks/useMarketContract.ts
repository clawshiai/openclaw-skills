'use client';

import { useReadContract } from 'wagmi';
import { CONTRACTS, clawshiMarketAbi } from '@/lib/contracts';

// Get market data from contract
export function useMarketData(marketIndex: number) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.CLAWSHI_MARKET,
    abi: clawshiMarketAbi,
    functionName: 'getMarket',
    args: [BigInt(marketIndex)],
  });

  if (!data) {
    return {
      market: null,
      isLoading,
      error,
      refetch,
    };
  }

  const [clawshiId, question, deadline, yesPool, noPool, resolved, outcome] = data as [
    bigint,
    string,
    bigint,
    bigint,
    bigint,
    boolean,
    boolean
  ];

  return {
    market: {
      clawshiId: Number(clawshiId),
      question,
      deadline: Number(deadline),
      yesPool,
      noPool,
      resolved,
      outcome,
    },
    isLoading,
    error,
    refetch,
  };
}

// Get user's stake on a market
export function useUserStake(marketIndex: number, userAddress: `0x${string}` | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.CLAWSHI_MARKET,
    abi: clawshiMarketAbi,
    functionName: 'getStake',
    args: userAddress ? [BigInt(marketIndex), userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  if (!data || !userAddress) {
    return {
      stake: null,
      isLoading,
      error,
      refetch,
    };
  }

  const [yesAmount, noAmount] = data as [bigint, bigint];

  return {
    stake: {
      yesAmount,
      noAmount,
      hasStake: yesAmount > 0n || noAmount > 0n,
    },
    isLoading,
    error,
    refetch,
  };
}

// Check if user has claimed for a market
export function useHasClaimed(marketIndex: number, userAddress: `0x${string}` | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.CLAWSHI_MARKET,
    abi: clawshiMarketAbi,
    functionName: 'claimed',
    args: userAddress ? [BigInt(marketIndex), userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  return {
    hasClaimed: data as boolean | undefined,
    isLoading,
    error,
    refetch,
  };
}

// Get total market count
export function useMarketCount() {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.CLAWSHI_MARKET,
    abi: clawshiMarketAbi,
    functionName: 'marketCount',
  });

  return {
    count: data ? Number(data) : 0,
    isLoading,
    error,
    refetch,
  };
}
