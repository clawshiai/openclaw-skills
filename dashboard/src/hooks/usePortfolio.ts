'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/context/WalletContext';
import { getUserPositions, getUserHistory, UserPosition, UserHistoryEntry } from '@/lib/api';

interface PortfolioSummary {
  totalStaked: string;
  activePositions: number;
  resolvedPositions: number;
  claimable: string;
}

export function usePortfolio() {
  const { address, isConnected } = useWallet();
  const [positions, setPositions] = useState<UserPosition[]>([]);
  const [history, setHistory] = useState<UserHistoryEntry[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary>({
    totalStaked: '0',
    activePositions: 0,
    resolvedPositions: 0,
    claimable: '0',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolio = useCallback(async () => {
    if (!address) {
      setPositions([]);
      setHistory([]);
      setSummary({
        totalStaked: '0',
        activePositions: 0,
        resolvedPositions: 0,
        claimable: '0',
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [positionsRes, historyRes] = await Promise.all([
        getUserPositions(address),
        getUserHistory(address),
      ]);

      setPositions(positionsRes.positions);
      setHistory(historyRes.history);
      setSummary({
        totalStaked: positionsRes.summary.total_staked,
        activePositions: positionsRes.summary.active_positions,
        resolvedPositions: positionsRes.summary.resolved_positions,
        claimable: positionsRes.summary.claimable,
      });
    } catch (err) {
      console.error('Failed to fetch portfolio:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch portfolio');
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  return {
    positions,
    history,
    summary,
    loading,
    error,
    refetch: fetchPortfolio,
    isConnected,
    address,
  };
}
