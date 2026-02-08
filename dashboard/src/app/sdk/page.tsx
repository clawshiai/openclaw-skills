'use client';

import { useLanguage } from '@/i18n/LanguageContext';
import { ExternalLink, Package, Terminal, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export default function SDKPage() {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-400/10 mb-6">
            <Package className="w-8 h-8 text-teal-400" />
          </div>
          <h1 className="text-3xl font-bold mb-4">@clawshi/sdk</h1>
          <p className="text-muted-foreground text-lg">
            TypeScript SDK for Clawshi prediction markets with Circle Programmable Wallets
          </p>
        </div>

        {/* Install */}
        <div className="bg-surface border border-border rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Terminal size={20} className="text-teal-400" />
            Installation
          </h2>
          <div className="relative">
            <pre className="bg-background border border-border rounded-lg p-4 overflow-x-auto">
              <code className="text-sm text-teal-400">npm install @clawshi/sdk</code>
            </pre>
            <button
              onClick={() => copyToClipboard('npm install @clawshi/sdk')}
              className="absolute top-3 right-3 p-2 rounded-md bg-surface-hover hover:bg-border transition-colors"
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-muted" />}
            </button>
          </div>
        </div>

        {/* Quick Start */}
        <div className="bg-surface border border-border rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Quick Start</h2>
          <pre className="bg-background border border-border rounded-lg p-4 overflow-x-auto text-sm">
            <code className="text-muted-foreground">{`import { ClawshiClient } from '@clawshi/sdk';

// Read-only mode
const client = new ClawshiClient();
const markets = await client.markets.list();

// With wallet
const client = new ClawshiClient({
  privateKey: process.env.PRIVATE_KEY,
});

// Stake 10 USDC on YES
await client.stake(19, 'YES', '10');`}</code>
          </pre>
        </div>

        {/* Features */}
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          {[
            { title: 'List Markets', desc: 'Query all prediction markets with odds' },
            { title: 'Stake USDC', desc: 'Place bets on YES/NO outcomes' },
            { title: 'MetaMask Support', desc: 'Connect browser wallets' },
            { title: 'Circle Wallets', desc: 'Programmable wallet integration' },
          ].map((feature) => (
            <div key={feature.title} className="bg-surface border border-border rounded-xl p-4">
              <h3 className="font-medium text-teal-400 mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-4 justify-center">
          <a
            href="https://www.npmjs.com/package/@clawshi/sdk"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-black rounded-lg font-medium transition-colors"
          >
            <Package size={16} />
            View on npm
            <ExternalLink size={14} />
          </a>
          <a
            href="https://github.com/clawshiai/clawshi-sdk"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-surface-hover border border-border hover:border-teal-600/50 rounded-lg font-medium transition-colors"
          >
            GitHub
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </main>
  );
}
