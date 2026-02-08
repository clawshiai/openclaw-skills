'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import {
  HealthStatus,
  HealthHistoryEntry,
  HealthHistoryResponse,
  getHealthStatus,
  getHealthHistory,
} from '@/lib/api';
import { useLanguage } from '@/i18n/LanguageContext';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  RefreshCw,
} from 'lucide-react';

// Service group definitions — like OpenAI's APIs/ChatGPT/Sora
const SERVICE_GROUPS = [
  {
    id: 'core',
    labelKey: 'status.group.core',
    services: ['database'],
  },
  {
    id: 'data',
    labelKey: 'status.group.data',
    services: ['markets', 'research', 'agents', 'votes'],
  },
  {
    id: 'moltbook',
    labelKey: 'status.group.moltbook',
    services: ['mb_recent_agents', 'mb_new_posts', 'mb_top_posts', 'mb_top_humans'],
  },
];

const SERVICE_LABELS: Record<string, string> = {
  database: 'status.service.database',
  markets: 'status.service.markets',
  research: 'status.service.research',
  agents: 'status.service.agents',
  votes: 'status.service.votes',
  mb_recent_agents: 'status.service.mb_recent_agents',
  mb_new_posts: 'status.service.mb_new_posts',
  mb_top_posts: 'status.service.mb_top_posts',
  mb_top_humans: 'status.service.mb_top_humans',
};

const BAR_COLORS: Record<string, string> = {
  operational: 'bg-teal-400',
  degraded: 'bg-yellow-400',
  down: 'bg-red-400',
  no_data: 'bg-border',
};

function StatusIcon({ status, size = 20 }: { status: string; size?: number }) {
  if (status === 'operational')
    return <CheckCircle2 size={size} className="text-teal-400 shrink-0" />;
  if (status === 'degraded')
    return <AlertTriangle size={size} className="text-yellow-400 shrink-0" />;
  return <XCircle size={size} className="text-red-400 shrink-0" />;
}

// Format "2026-02-04-14" (UTC) → "Feb 4, 9:00 PM WIB" (user's local tz)
function formatBarDate(dateStr: string): string {
  if (!dateStr || dateStr.length < 13) return dateStr;
  const [y, m, d, h] = dateStr.split('-').map(Number);
  // Create as UTC, then display in user's local timezone
  const date = new Date(Date.UTC(y, m - 1, d, h));
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const localHour = date.getHours();
  const ampm = localHour >= 12 ? 'PM' : 'AM';
  const h12 = localHour % 12 || 12;
  // Get short timezone name (e.g. "WIB", "PST", "UTC")
  const tz = Intl.DateTimeFormat('en', { timeZoneName: 'short' }).formatToParts(date).find(p => p.type === 'timeZoneName')?.value || '';
  return `${months[date.getMonth()]} ${date.getDate()}, ${h12}:00 ${ampm} ${tz}`;
}

const STATUS_LABELS_FRIENDLY: Record<string, string> = {
  operational: 'All good',
  degraded: 'Issues detected',
  down: 'Outage',
  no_data: 'No data yet',
};

function UptimeBar({ history }: { history: HealthHistoryEntry[] }) {
  // Show last 72 entries max (3 days × 24 hours)
  const bars = history.slice(-72);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; entry: HealthHistoryEntry } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = (e: React.MouseEvent, entry: HealthHistoryEntry) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const barRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltip({
      x: barRect.left + barRect.width / 2 - rect.left,
      y: -8,
      entry,
    });
  };

  const statusDot: Record<string, string> = {
    operational: 'bg-teal-400',
    degraded: 'bg-yellow-400',
    down: 'bg-red-400',
    no_data: 'bg-zinc-500',
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        className="flex gap-[2px] items-end h-8 w-full overflow-hidden rounded"
        onMouseLeave={() => setTooltip(null)}
      >
        {bars.map((entry, i) => (
          <div
            key={entry.date || i}
            onMouseEnter={(e) => handleMouseEnter(e, entry)}
            className={`flex-1 min-w-[3px] rounded-sm transition-all duration-150 cursor-pointer
              hover:scale-y-110 hover:brightness-125 hover:z-10
              ${BAR_COLORS[entry.status] || BAR_COLORS.no_data}`}
            style={{
              height: entry.status === 'no_data' ? '40%' : '100%',
              transformOrigin: 'bottom',
            }}
          />
        ))}
      </div>

      {/* Custom tooltip */}
      {tooltip && (
        <div
          className="absolute z-50 pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)' }}
        >
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl text-xs whitespace-nowrap">
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${statusDot[tooltip.entry.status] || statusDot.no_data}`} />
              <span className="text-foreground font-medium">
                {STATUS_LABELS_FRIENDLY[tooltip.entry.status] || tooltip.entry.status}
              </span>
            </div>
            <div className="text-muted-foreground text-[11px]">
              {formatBarDate(tooltip.entry.date)}
              {tooltip.entry.latency_ms != null && (
                <span className="ml-2 text-zinc-400">{tooltip.entry.latency_ms}ms</span>
              )}
            </div>
            {/* Arrow */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-zinc-700" />
          </div>
        </div>
      )}
    </div>
  );
}

function calcUptime(history: HealthHistoryEntry[]): string {
  const withData = history.filter((h) => h.status !== 'no_data');
  if (withData.length === 0) return '—';
  const operational = withData.filter((h) => h.status === 'operational').length;
  return ((operational / withData.length) * 100).toFixed(2) + '%';
}

function getGroupStatus(
  services: string[],
  healthServices: Record<string, { status: string }> | undefined
): string {
  if (!healthServices) return 'operational';
  const statuses = services.map((s) => healthServices[s]?.status || 'operational');
  if (statuses.includes('down')) return 'down';
  if (statuses.includes('degraded')) return 'degraded';
  return 'operational';
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

// Merge multiple service histories into one group-level bar
function mergeGroupHistory(
  services: string[],
  historyData: Record<string, HealthHistoryEntry[]>
): HealthHistoryEntry[] {
  // Get all dates from first available service
  const first = services.find((s) => historyData[s]?.length);
  if (!first) return [];
  const dates = historyData[first].map((h) => h.date);

  return dates.map((date, i) => {
    let worst: 'operational' | 'degraded' | 'down' | 'no_data' = 'no_data';
    let anyData = false;
    for (const svc of services) {
      const entry = historyData[svc]?.[i];
      if (!entry || entry.status === 'no_data') continue;
      anyData = true;
      if (entry.status === 'down') worst = 'down';
      else if (entry.status === 'degraded' && worst !== 'down') worst = 'degraded';
      else if (entry.status === 'operational' && worst === 'no_data') worst = 'operational';
    }
    return { date, status: anyData ? worst : 'no_data', latency_ms: null };
  });
}

export default function StatusPage() {
  const { t } = useLanguage();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [history, setHistory] = useState<HealthHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [lastChecked, setLastChecked] = useState(0);
  const [secondsAgo, setSecondsAgo] = useState(0);

  const fetchAll = useCallback(async () => {
    try {
      const [h, hist] = await Promise.all([getHealthStatus(), getHealthHistory(3)]);
      setHealth(h);
      setHistory(hist);
      setLastChecked(Date.now());
    } catch {
      // Keep previous data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  useEffect(() => {
    const tick = setInterval(() => {
      if (lastChecked) setSecondsAgo(Math.floor((Date.now() - lastChecked) / 1000));
    }, 1000);
    return () => clearInterval(tick);
  }, [lastChecked]);

  const overallStatus = health?.status || 'operational';

  const statusTitle =
    overallStatus === 'operational'
      ? t('status.allOperational')
      : overallStatus === 'degraded'
      ? t('status.degraded')
      : t('status.down');

  const statusSubtitle =
    overallStatus === 'operational'
      ? t('status.subtitle.operational')
      : overallStatus === 'degraded'
      ? t('status.subtitle.degraded')
      : t('status.subtitle.down');

  const bannerColors = {
    operational: 'bg-accent-surface border-accent-border',
    degraded: 'bg-yellow-600/10 border-yellow-600/30',
    down: 'bg-red-600/10 border-red-600/30',
  };

  // Date range label — last 3 days (computed on client only to avoid hydration mismatch)
  const [dateRange, setDateRange] = useState('');
  useEffect(() => {
    const now = new Date();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const threeDaysAgo = new Date(now.getTime() - 3 * 86400000);
    const fmtDate = (d: Date) => `${monthNames[d.getMonth()]} ${d.getDate()}`;
    setDateRange(`${fmtDate(threeDaysAgo)} – ${fmtDate(now)}, ${now.getFullYear()}`);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status banner */}
        {loading ? (
          <div className="border border-border rounded-xl p-8 mb-8 animate-pulse">
            <div className="h-6 bg-border rounded w-56 mb-2" />
            <div className="h-4 bg-border rounded w-80" />
          </div>
        ) : (
          <div
            className={`border rounded-xl p-6 mb-8 ${bannerColors[overallStatus as keyof typeof bannerColors]}`}
          >
            <div className="flex items-center gap-3 mb-1">
              <StatusIcon status={overallStatus} size={22} />
              <h1 className="text-lg sm:text-xl font-semibold">{statusTitle}</h1>
            </div>
            <p className="text-sm text-muted-foreground ml-[34px]">{statusSubtitle}</p>
          </div>
        )}

        {/* System status card */}
        <div className="bg-surface border border-border rounded-xl mb-8">
          {/* Header */}
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold">{t('status.systemStatus')}</h2>
            <span className="text-xs text-muted-foreground">{dateRange}</span>
          </div>

          {/* Service groups */}
          <div className="divide-y divide-border">
            {loading
              ? [1, 2].map((i) => (
                  <div key={i} className="px-5 py-5 animate-pulse">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-5 w-5 bg-border rounded-full" />
                      <div className="h-4 bg-border rounded w-40" />
                    </div>
                    <div className="flex gap-[2px] h-8">
                      {Array.from({ length: 60 }).map((_, j) => (
                        <div key={j} className="flex-1 bg-border rounded-sm" />
                      ))}
                    </div>
                  </div>
                ))
              : SERVICE_GROUPS.map((group) => {
                  const groupStatus = getGroupStatus(group.services, health?.services);
                  const isExpanded = expanded[group.id] ?? false;
                  const groupHistory = history
                    ? mergeGroupHistory(group.services, history.services)
                    : [];
                  const groupUptime = calcUptime(groupHistory);

                  return (
                    <div key={group.id}>
                      {/* Group header */}
                      <div className="px-5 pt-5 pb-2">
                        <div className="flex flex-wrap items-center justify-between gap-y-1 mb-1">
                          <div className="flex items-center gap-2.5">
                            <StatusIcon status={groupStatus} size={18} />
                            <span className="text-sm font-semibold">
                              {t(group.labelKey)}
                            </span>
                            <button
                              onClick={() =>
                                setExpanded((prev) => ({
                                  ...prev,
                                  [group.id]: !prev[group.id],
                                }))
                              }
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {group.services.length} {t('status.components')}
                              {isExpanded ? (
                                <ChevronUp size={14} />
                              ) : (
                                <ChevronDown size={14} />
                              )}
                            </button>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {groupUptime} {t('status.uptime').toLowerCase()}
                          </span>
                        </div>
                        <UptimeBar history={groupHistory} />
                      </div>

                      {/* Expanded sub-components */}
                      {isExpanded && (
                        <div className="px-5 pb-4 pt-2 space-y-4">
                          {group.services.map((svc) => {
                            const svcHistory = history?.services[svc] || [];
                            const svcStatus =
                              health?.services[svc]?.status || 'operational';
                            const svcUptime = calcUptime(svcHistory);
                            const svcInfo = health?.services[svc];

                            return (
                              <div key={svc} className="ml-7">
                                <div className="flex flex-wrap items-center justify-between gap-y-1 mb-1">
                                  <div className="flex items-center gap-2">
                                    <StatusIcon status={svcStatus} size={14} />
                                    <span className="text-xs font-medium">
                                      {t(SERVICE_LABELS[svc] || svc)}
                                    </span>
                                    {svcInfo?.latency_ms !== undefined && (
                                      <span className="text-[10px] text-subtle">
                                        {svcInfo.latency_ms}ms
                                      </span>
                                    )}
                                    {svcInfo?.count !== undefined && (
                                      <span className="text-[10px] text-subtle">
                                        ({svcInfo.count})
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-muted-foreground">
                                    {svcUptime} {t('status.uptime').toLowerCase()}
                                  </span>
                                </div>
                                <UptimeBar history={svcHistory} />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
          </div>

          {/* Legend row inside the card */}
          <div className="px-5 py-3 border-t border-border flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-teal-400" />
              {t('status.operational')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-yellow-400" />
              {t('status.degradedLabel')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-red-400" />
              {t('status.downLabel')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-border" />
              {t('status.noData')}
            </span>
          </div>
        </div>

        {/* Footer info card */}
        {health && (
          <div className="bg-surface border border-border rounded-xl px-5 py-4 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3 sm:gap-5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock size={13} className="text-teal-400" />
                  {t('status.uptime')}: <span className="text-foreground font-medium">{formatUptime(health.uptime_seconds)}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <RefreshCw size={13} className="text-teal-400" />
                  {t('status.lastChecked')}: <span className="text-foreground font-medium">{t('status.secondsAgo').replace('{seconds}', String(secondsAgo))}</span>
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground">{t('status.autoRefresh')}</span>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
