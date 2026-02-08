'use client';

import { useState, useEffect } from 'react';
import { Coins } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { formatUSDC } from '@/lib/contracts';

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  balance: bigint;
  min?: number;
  disabled?: boolean;
}

export function AmountInput({ value, onChange, balance, min = 0.1, disabled }: AmountInputProps) {
  const { t } = useLanguage();
  const [error, setError] = useState<string | null>(null);

  const formattedBalance = formatUSDC(balance);
  const balanceNum = parseFloat(formattedBalance);

  // Validate input
  useEffect(() => {
    const num = parseFloat(value);
    if (value && isNaN(num)) {
      setError('Invalid amount');
    } else if (num > 0 && num < min) {
      setError(t('staking.minStake'));
    } else if (num > balanceNum) {
      setError(t('staking.insufficientBalance'));
    } else {
      setError(null);
    }
  }, [value, min, balanceNum, t]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow empty, numbers, and single decimal
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      onChange(val);
    }
  };

  const handleMax = () => {
    onChange(formattedBalance);
  };

  const handlePreset = (amount: number) => {
    if (amount <= balanceNum) {
      onChange(amount.toString());
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{t('staking.enterAmount')}</span>
        <span className="text-muted-foreground flex items-center gap-1">
          <Coins size={12} className="text-teal-400" />
          {formattedBalance} USDC
        </span>
      </div>

      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          placeholder="0.00"
          className={`w-full px-4 py-3 pr-20 bg-surface-hover border rounded-xl text-lg font-medium text-foreground placeholder-muted-foreground focus:outline-none transition-colors ${
            error
              ? 'border-red-500/50 focus:border-red-500'
              : 'border-border-hover focus:border-teal-600/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        <button
          onClick={handleMax}
          disabled={disabled || balanceNum === 0}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-semibold text-teal-400 hover:text-teal-300 bg-teal-400/10 hover:bg-teal-400/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          MAX
        </button>
      </div>

      {/* Preset amounts */}
      <div className="flex gap-2">
        {[1, 5, 10, 25].map((amount) => (
          <button
            key={amount}
            onClick={() => handlePreset(amount)}
            disabled={disabled || amount > balanceNum}
            className="flex-1 px-2 py-1.5 text-xs font-medium text-muted hover:text-foreground bg-surface-hover hover:bg-border border border-border-hover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ${amount}
          </button>
        ))}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
