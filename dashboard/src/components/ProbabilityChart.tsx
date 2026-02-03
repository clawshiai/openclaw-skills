'use client';

import { useEffect, useState } from 'react';
import { HistoryPoint, getMarketHistory } from '@/lib/api';
import { useLanguage } from '@/i18n/LanguageContext';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Loader2 } from 'lucide-react';

function formatLabel(ts: string, allSameDay: boolean) {
  const d = new Date(ts);
  if (allSameDay) {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
      <div className="text-muted-foreground mb-1">
        {new Date(d.timestamp).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-green-500 font-medium">YES {d.yes}%</span>
        <span className="text-muted-foreground">|</span>
        <span className="text-red-500 font-medium">NO {d.no}%</span>
      </div>
      <div className="text-subtle mt-0.5">{d.totalVotes} votes</div>
    </div>
  );
}

export function ProbabilityChart({ marketId }: { marketId: number }) {
  const { t } = useLanguage();
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMarketHistory(marketId)
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [marketId]);

  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6 flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
      </div>
    );
  }

  if (history.length < 2) {
    return null;
  }

  // Detect if all data points are on the same day
  const firstDay = new Date(history[0].timestamp).toDateString();
  const lastDay = new Date(history[history.length - 1].timestamp).toDateString();
  const allSameDay = firstDay === lastDay;

  const data = history.map((h) => ({
    ...h,
    label: formatLabel(h.timestamp, allSameDay),
  }));

  return (
    <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 mb-8">
      <h3 className="text-sm font-semibold mb-4 text-muted-foreground">
        {t('market.probabilityOverTime')}
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="yesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="noGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <ReferenceLine y={50} stroke="var(--border)" strokeDasharray="3 3" />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="yes"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#yesGrad)"
          />
          <Area
            type="monotone"
            dataKey="no"
            stroke="#ef4444"
            strokeWidth={2}
            fill="url(#noGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          YES
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          NO
        </div>
      </div>
    </div>
  );
}
