'use client';

import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { encodeAbiParameters } from 'viem';
import {
  MARKET_FACTORY_ADDRESS,
  CHAINLINK_RESOLVER_ADDRESS,
  MANUAL_RESOLVER_ADDRESS,
  marketFactoryAbi,
} from '@/lib/contracts';

export type ResolutionType = 'chainlink' | 'manual';

export interface CreateMarketParams {
  question: string;
  resolutionType: ResolutionType;
  deadline: Date;
  // For Chainlink resolver
  asset?: 'BTC' | 'ETH';
  targetPrice?: number;
  isGreaterThan?: boolean;
}

// Chainlink resolver params structure
const chainlinkParamsType = {
  type: 'tuple' as const,
  components: [
    { name: 'asset', type: 'string' as const },
    { name: 'targetPrice', type: 'uint256' as const },
    { name: 'isGreaterThan', type: 'bool' as const },
    { name: 'deadline', type: 'uint256' as const },
  ],
};

export function useCreateMarket() {
  const [error, setError] = useState<string | null>(null);

  const { writeContract, data: hash, isPending, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createMarket = async (params: CreateMarketParams) => {
    setError(null);

    try {
      const deadlineTimestamp = BigInt(Math.floor(params.deadline.getTime() / 1000));

      let resolverAddress: `0x${string}`;
      let resolverData: `0x${string}`;

      if (params.resolutionType === 'chainlink') {
        if (!params.asset || !params.targetPrice) {
          throw new Error('Asset and target price required for Chainlink resolution');
        }

        resolverAddress = CHAINLINK_RESOLVER_ADDRESS;

        // Encode Chainlink resolver params
        // Target price in 8 decimals (Chainlink standard)
        const targetPriceWithDecimals = BigInt(Math.floor(params.targetPrice * 1e8));

        resolverData = encodeAbiParameters(
          [chainlinkParamsType],
          [{
            asset: params.asset,
            targetPrice: targetPriceWithDecimals,
            isGreaterThan: params.isGreaterThan ?? true,
            deadline: deadlineTimestamp,
          }]
        );
      } else {
        // Manual resolution
        resolverAddress = MANUAL_RESOLVER_ADDRESS;
        resolverData = '0x' as `0x${string}`;
      }

      await writeContract({
        address: MARKET_FACTORY_ADDRESS,
        abi: marketFactoryAbi,
        functionName: 'createMarket',
        args: [
          params.question,
          resolverAddress,
          resolverData,
          deadlineTimestamp,
          0n, // No creator fee
        ],
      });
    } catch (err: any) {
      console.error('Create market error:', err);
      setError(err.message || 'Failed to create market');
    }
  };

  return {
    createMarket,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}
