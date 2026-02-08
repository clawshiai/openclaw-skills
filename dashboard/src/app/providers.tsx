'use client';

import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { LanguageProvider } from '@/i18n/LanguageContext';
import { WalletProvider } from '@/context/WalletContext';
import { ToastProvider } from '@/context/ToastContext';
import { config } from '@/lib/wagmi';
import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#00D990',
            accentColorForeground: 'black',
            borderRadius: 'medium',
          })}
        >
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
            <LanguageProvider>
              <WalletProvider>
                <ToastProvider>
                  {children}
                </ToastProvider>
              </WalletProvider>
            </LanguageProvider>
          </ThemeProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
