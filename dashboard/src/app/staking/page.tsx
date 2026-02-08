'use client';

import { useLanguage } from '@/i18n/LanguageContext';
import { Coins, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function StakingPage() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-400/10 mb-6">
            <Coins className="w-8 h-8 text-teal-400" />
          </div>
          <h1 className="text-3xl font-bold mb-4">USDC Staking</h1>
          <p className="text-muted-foreground text-lg">
            Stake USDC on prediction market outcomes
          </p>
        </div>

        {/* Coming Soon */}
        <div className="bg-surface border border-border rounded-xl p-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-lg text-sm font-medium mb-6">
            <Clock size={14} />
            Coming Soon
          </div>

          <h2 className="text-xl font-semibold mb-4">Web Interface Under Development</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            The USDC staking interface is being built. In the meantime, you can interact with the smart contracts directly.
          </p>

          {/* Current Options */}
          <div className="grid gap-4 md:grid-cols-2 max-w-2xl mx-auto">
            <Link
              href="/contracts"
              className="flex items-center justify-between p-4 bg-surface-hover border border-border rounded-xl hover:border-teal-600/50 transition-colors group"
            >
              <div className="text-left">
                <h3 className="font-medium mb-1">Smart Contracts</h3>
                <p className="text-sm text-muted-foreground">Interact directly on BaseScan</p>
              </div>
              <ArrowRight size={16} className="text-muted group-hover:text-teal-400 transition-colors" />
            </Link>

            <Link
              href="/sdk"
              className="flex items-center justify-between p-4 bg-surface-hover border border-border rounded-xl hover:border-teal-600/50 transition-colors group"
            >
              <div className="text-left">
                <h3 className="font-medium mb-1">SDK</h3>
                <p className="text-sm text-muted-foreground">Build with @clawshi/sdk</p>
              </div>
              <ArrowRight size={16} className="text-muted group-hover:text-teal-400 transition-colors" />
            </Link>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-6 text-center">How Staking Works</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                step: '1',
                title: 'Choose a Market',
                desc: 'Select a prediction market and position (YES/NO)',
              },
              {
                step: '2',
                title: 'Stake USDC',
                desc: 'Approve and stake USDC on your chosen outcome',
              },
              {
                step: '3',
                title: 'Claim Winnings',
                desc: 'After resolution, claim your proportional payout',
              },
            ].map((item) => (
              <div key={item.step} className="bg-surface border border-border rounded-xl p-6 text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-teal-400/10 text-teal-400 font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="font-medium mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Testnet Info */}
        <div className="mt-8 p-4 bg-teal-400/5 border border-teal-400/20 rounded-xl">
          <h3 className="font-medium text-teal-400 mb-2">Get Testnet Tokens</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>
              • ETH Faucet:{' '}
              <a href="https://www.alchemy.com/faucets/base-sepolia" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline">
                Alchemy Base Sepolia
              </a>
            </li>
            <li>
              • USDC Faucet:{' '}
              <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline">
                Circle Faucet
              </a>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
