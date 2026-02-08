'use client';

import { useLanguage } from '@/i18n/LanguageContext';
import { FileCode, ExternalLink, Copy, Check } from 'lucide-react';
import { useState } from 'react';

const CONTRACTS = [
  {
    name: 'MarketFactory',
    address: '0xc0DeBCEa2F1BcB268b01777ff9c8E3BB4dA85559',
    description: 'Core contract for creating and managing prediction markets',
  },
  {
    name: 'ChainlinkResolver',
    address: '0xDEbe4E62bEE1DA1657008480e6d91a3f1E3CCaeC',
    description: 'Automated resolution using Chainlink price feeds',
  },
  {
    name: 'ManualResolver',
    address: '0x3602D8989920B9A9451BF9D9562Bb97BA7cEd1bb',
    description: 'Manual resolution by authorized resolvers',
  },
  {
    name: 'USDC',
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    description: 'Circle USDC token on Base',
  },
];

export default function ContractsPage() {
  const { t } = useLanguage();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const copyToClipboard = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-400/10 mb-6">
            <FileCode className="w-8 h-8 text-teal-400" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Smart Contracts</h1>
          <p className="text-muted-foreground text-lg">
            Clawshi prediction market protocol deployed on Base Mainnet
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded-lg text-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Base Mainnet (Chain ID: 8453)
          </div>
        </div>

        {/* Contracts */}
        <div className="space-y-4">
          {CONTRACTS.map((contract) => (
            <div
              key={contract.address}
              className="bg-surface border border-border rounded-xl p-6 hover:border-teal-600/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-teal-400 mb-1">
                    {contract.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {contract.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-background border border-border rounded px-2 py-1 font-mono text-muted-foreground truncate">
                      {contract.address}
                    </code>
                    <button
                      onClick={() => copyToClipboard(contract.address)}
                      className="p-1.5 rounded-md hover:bg-surface-hover transition-colors shrink-0"
                      title="Copy address"
                    >
                      {copiedAddress === contract.address ? (
                        <Check size={14} className="text-green-500" />
                      ) : (
                        <Copy size={14} className="text-muted" />
                      )}
                    </button>
                  </div>
                </div>
                <a
                  href={`https://basescan.org/address/${contract.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-hover border border-border hover:border-teal-600/50 rounded-lg text-sm font-medium transition-colors shrink-0"
                >
                  View
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="mt-8 p-4 bg-teal-400/5 border border-teal-400/20 rounded-xl">
          <h3 className="font-medium text-teal-400 mb-2">Protocol Info</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Minimum stake: 0.1 USDC</li>
            <li>• Protocol fee: 1%</li>
            <li>• Max creator fee: 5%</li>
            <li>• Proportional payout system</li>
          </ul>
        </div>

        {/* Links */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <a
            href="https://github.com/clawshiai/clawshi-protocol"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-surface-hover border border-border hover:border-teal-600/50 rounded-lg font-medium transition-colors"
          >
            View Source Code
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </main>
  );
}
