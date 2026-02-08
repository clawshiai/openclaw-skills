'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useAccount, useBalance, useChainId, useSwitchChain } from 'wagmi';
import { CONTRACTS, CHAIN_ID, formatUSDC } from '@/lib/contracts';

interface WalletContextValue {
  address: `0x${string}` | undefined;
  isConnected: boolean;
  chainId: number | undefined;
  isCorrectNetwork: boolean;
  usdcBalance: bigint;
  formattedBalance: string;
  switchToBase: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();

  const { data: balanceData } = useBalance({
    address: address,
    token: CONTRACTS.USDC,
    query: {
      enabled: !!address,
    },
  });

  const isCorrectNetwork = chainId === CHAIN_ID;
  const usdcBalance = balanceData?.value ?? 0n;
  const formattedBalance = formatUSDC(usdcBalance);

  const switchToBase = async () => {
    if (switchChainAsync) {
      await switchChainAsync({ chainId: CHAIN_ID });
    }
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected,
        chainId,
        isCorrectNetwork,
        usdcBalance,
        formattedBalance,
        switchToBase,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
