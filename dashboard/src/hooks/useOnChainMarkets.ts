'use client';

import { useState, useEffect } from 'react';
import { useConfig } from 'wagmi';
import { readContract } from 'wagmi/actions';
import { MARKET_FACTORY_ADDRESS, marketFactoryAbi } from '@/lib/contracts';

export interface OnChainMarket {
  contractIndex: number;
  question: string;
  deadline: number;
  yesPool: bigint;
  noPool: bigint;
  resolved: boolean;
  outcome: boolean;
  totalPool: bigint;
  status: 'active' | 'resolved';
  yesProbability: number;
  noProbability: number;
}

export function useOnChainMarkets() {
  const config = useConfig();
  const [markets, setMarkets] = useState<OnChainMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMarkets() {
      try {
        setLoading(true);
        setError(null);

        // 1. Get market count
        const count = await readContract(config, {
          address: MARKET_FACTORY_ADDRESS,
          abi: marketFactoryAbi,
          functionName: 'getMarketCount',
        });

        const marketCount = Number(count);

        if (marketCount === 0) {
          setMarkets([]);
          setLoading(false);
          return;
        }

        // 2. Batch fetch all markets
        const marketPromises = [];
        for (let i = 0; i < marketCount; i++) {
          marketPromises.push(
            readContract(config, {
              address: MARKET_FACTORY_ADDRESS,
              abi: marketFactoryAbi,
              functionName: 'getMarket',
              args: [BigInt(i)],
            })
          );
        }

        const rawMarkets = await Promise.all(marketPromises);

        // 3. Transform to OnChainMarket interface
        const transformed: OnChainMarket[] = rawMarkets.map((m: any, i) => {
          const yesPool = BigInt(m.yesPool || m[6] || 0);
          const noPool = BigInt(m.noPool || m[7] || 0);
          const totalPool = yesPool + noPool;
          const resolved = m.resolved ?? m[9] ?? false;

          // Calculate probabilities
          let yesProbability = 50;
          let noProbability = 50;
          if (totalPool > 0n) {
            yesProbability = Number((yesPool * 100n) / totalPool);
            noProbability = 100 - yesProbability;
          }

          return {
            contractIndex: i,
            question: m.question || m[1] || '',
            deadline: Number(m.deadline || m[5] || 0),
            yesPool,
            noPool,
            resolved,
            outcome: m.outcome ?? m[10] ?? false,
            totalPool,
            status: resolved ? 'resolved' : 'active',
            yesProbability,
            noProbability,
          };
        });

        setMarkets(transformed);
      } catch (err) {
        console.error('Failed to fetch on-chain markets:', err);
        setError('Failed to fetch on-chain markets');
      } finally {
        setLoading(false);
      }
    }

    fetchMarkets();
  }, [config]);

  const refetch = () => {
    setLoading(true);
    // Re-trigger effect by updating a dependency
  };

  return { markets, loading, error, refetch };
}

export function useOnChainMarket(contractIndex: number) {
  const config = useConfig();
  const [market, setMarket] = useState<OnChainMarket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMarket() {
      try {
        setLoading(true);
        setError(null);

        const m: any = await readContract(config, {
          address: MARKET_FACTORY_ADDRESS,
          abi: marketFactoryAbi,
          functionName: 'getMarket',
          args: [BigInt(contractIndex)],
        });

        const yesPool = BigInt(m.yesPool || m[6] || 0);
        const noPool = BigInt(m.noPool || m[7] || 0);
        const totalPool = yesPool + noPool;
        const resolved = m.resolved ?? m[9] ?? false;

        let yesProbability = 50;
        let noProbability = 50;
        if (totalPool > 0n) {
          yesProbability = Number((yesPool * 100n) / totalPool);
          noProbability = 100 - yesProbability;
        }

        setMarket({
          contractIndex,
          question: m.question || m[1] || '',
          deadline: Number(m.deadline || m[5] || 0),
          yesPool,
          noPool,
          resolved,
          outcome: m.outcome ?? m[10] ?? false,
          totalPool,
          status: resolved ? 'resolved' : 'active',
          yesProbability,
          noProbability,
        });
      } catch (err) {
        console.error('Failed to fetch on-chain market:', err);
        setError('Failed to fetch market');
      } finally {
        setLoading(false);
      }
    }

    fetchMarket();
  }, [config, contractIndex]);

  return { market, loading, error };
}
