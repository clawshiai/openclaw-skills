'use client';

import { AlertTriangle } from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { useLanguage } from '@/i18n/LanguageContext';

export function NetworkBanner() {
  const { t } = useLanguage();
  const { isConnected, isCorrectNetwork, switchToBase } = useWallet();

  // Only show if connected but on wrong network
  if (!isConnected || isCorrectNetwork) {
    return null;
  }

  return (
    <div className="bg-yellow-500/10 border-b border-yellow-500/30">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-yellow-500">
          <AlertTriangle size={16} />
          <span>{t('wallet.wrongNetwork')}</span>
        </div>
        <button
          onClick={switchToBase}
          className="text-sm font-medium text-yellow-500 hover:text-yellow-400 underline underline-offset-2"
        >
          {t('wallet.switchToBase')}
        </button>
      </div>
    </div>
  );
}
