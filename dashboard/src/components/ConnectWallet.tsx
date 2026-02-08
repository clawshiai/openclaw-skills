'use client';

import { useState, useRef, useEffect } from 'react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useDisconnect } from 'wagmi';
import { Wallet, ChevronDown, LogOut, ExternalLink, AlertTriangle, Coins } from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { useLanguage } from '@/i18n/LanguageContext';

export function ConnectWallet() {
  const { t } = useLanguage();
  const { address, isConnected, isCorrectNetwork, formattedBalance, switchToBase } = useWallet();
  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Not connected - show connect button
  if (!isConnected) {
    return (
      <button
        onClick={openConnectModal}
        className="flex items-center gap-2 px-3 py-1.5 bg-accent hover:bg-accent-hover text-black rounded-lg text-sm font-medium transition-colors"
      >
        <Wallet size={16} />
        <span className="hidden sm:inline">{t('wallet.connect')}</span>
      </button>
    );
  }

  // Wrong network - show switch button
  if (!isCorrectNetwork) {
    return (
      <button
        onClick={switchToBase}
        className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 hover:bg-yellow-500/30 rounded-lg text-sm font-medium transition-colors"
      >
        <AlertTriangle size={16} />
        <span className="hidden sm:inline">{t('wallet.switchToBase')}</span>
      </button>
    );
  }

  // Connected - show address with dropdown
  const truncatedAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-surface-hover border border-border-hover hover:border-teal-600/50 rounded-lg text-sm font-medium transition-colors"
      >
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <span className="hidden sm:inline">{truncatedAddress}</span>
        <ChevronDown size={14} className={`text-muted transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {dropdownOpen && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-surface border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-fadeUp">
          {/* Balance */}
          <div className="px-4 py-3 border-b border-border">
            <div className="text-xs text-muted-foreground mb-1">{t('wallet.balance')}</div>
            <div className="flex items-center gap-2">
              <Coins size={16} className="text-teal-400" />
              <span className="font-semibold">{formattedBalance} USDC</span>
            </div>
          </div>

          {/* Address */}
          <div className="px-4 py-3 border-b border-border">
            <div className="text-xs text-muted-foreground mb-1">Address</div>
            <div className="text-sm font-mono text-muted">{truncatedAddress}</div>
          </div>

          {/* Actions */}
          <div className="p-2">
            <a
              href={`https://basescan.org/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-hover rounded-lg transition-colors"
            >
              <ExternalLink size={14} />
              {t('wallet.viewOnBaseScan')}
            </a>
            <button
              onClick={() => {
                disconnect();
                setDropdownOpen(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-600/10 rounded-lg transition-colors"
            >
              <LogOut size={14} />
              {t('wallet.disconnect')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
