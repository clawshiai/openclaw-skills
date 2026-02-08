'use client';

import Link from 'next/link';
import { ExternalLink, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { formatUSDC } from '@/lib/contracts';
import type { UserHistoryEntry } from '@/lib/api';

interface TransactionHistoryProps {
  history: UserHistoryEntry[];
}

export function TransactionHistory({ history }: TransactionHistoryProps) {
  const { t } = useLanguage();

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t('portfolio.noTransactions')}
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left text-sm text-muted-foreground">
              <th className="px-4 py-3 font-medium">{t('portfolio.date')}</th>
              <th className="px-4 py-3 font-medium">{t('portfolio.market')}</th>
              <th className="px-4 py-3 font-medium">{t('portfolio.position')}</th>
              <th className="px-4 py-3 font-medium text-right">{t('portfolio.amount')}</th>
              <th className="px-4 py-3 font-medium">{t('portfolio.status')}</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {history.map((entry) => (
              <tr
                key={entry.id}
                className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors"
              >
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {new Date(entry.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/market/${entry.market_id}`}
                    className="text-sm hover:text-teal-400 transition-colors line-clamp-1"
                  >
                    {entry.question}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded ${
                      entry.position === 'YES'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {entry.position === 'YES' ? (
                      <ArrowUpRight size={12} />
                    ) : (
                      <ArrowDownRight size={12} />
                    )}
                    {entry.position}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-right font-medium">
                  ${formatUSDC(BigInt(entry.amount))}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      entry.status === 'active'
                        ? 'bg-blue-500/20 text-blue-400'
                        : entry.claimed
                        ? 'bg-gray-500/20 text-muted-foreground'
                        : 'bg-green-500/20 text-green-400'
                    }`}
                  >
                    {entry.claimed ? t('portfolio.claimedLabel') : entry.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {entry.tx_hash && (
                    <a
                      href={`https://basescan.org/tx/${entry.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-teal-400"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
