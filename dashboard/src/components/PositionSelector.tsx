'use client';

import { useLanguage } from '@/i18n/LanguageContext';

interface PositionSelectorProps {
  selected: 'YES' | 'NO' | null;
  onSelect: (position: 'YES' | 'NO') => void;
  odds: {
    yes: number;
    no: number;
  };
  disabled?: boolean;
}

export function PositionSelector({ selected, onSelect, odds, disabled }: PositionSelectorProps) {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={() => onSelect('YES')}
        disabled={disabled}
        className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
          selected === 'YES'
            ? 'border-green-500 bg-green-500/10'
            : 'border-border-hover hover:border-green-500/50 hover:bg-green-500/5'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className={`text-lg font-bold ${selected === 'YES' ? 'text-green-400' : 'text-muted'}`}>
          {t('common.yes')}
        </span>
        <span className={`text-2xl font-bold ${selected === 'YES' ? 'text-green-400' : 'text-foreground'}`}>
          {odds.yes.toFixed(1)}%
        </span>
        {selected === 'YES' && (
          <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-green-500" />
        )}
      </button>

      <button
        onClick={() => onSelect('NO')}
        disabled={disabled}
        className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
          selected === 'NO'
            ? 'border-red-500 bg-red-500/10'
            : 'border-border-hover hover:border-red-500/50 hover:bg-red-500/5'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className={`text-lg font-bold ${selected === 'NO' ? 'text-red-400' : 'text-muted'}`}>
          {t('common.no')}
        </span>
        <span className={`text-2xl font-bold ${selected === 'NO' ? 'text-red-400' : 'text-foreground'}`}>
          {odds.no.toFixed(1)}%
        </span>
        {selected === 'NO' && (
          <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-red-500" />
        )}
      </button>
    </div>
  );
}
