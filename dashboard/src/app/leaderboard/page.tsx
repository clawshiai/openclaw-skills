'use client';

import { useEffect, useState } from 'react';
import { LeaderboardAgent, getLeaderboard } from '@/lib/api';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StatsCard } from '@/components/StatsCard';
import { useLanguage } from '@/i18n/LanguageContext';
import {
  Trophy,
  Medal,
  Crown,
  Users,
  Target,
  TrendingUp,
  BarChart3,
  ArrowUpDown,
  ExternalLink,
  Loader2,
} from 'lucide-react';

const categoryGroupLabels: Record<string, string> = {
  crypto: 'Crypto',
  technology: 'Tech',
  infrastructure: 'Tech',
  security: 'Tech',
  governance: 'Governance',
  regulation: 'Governance',
  culture: 'Culture',
  philosophy: 'Culture',
  moltbook: 'Moltbook',
  platform: 'Moltbook',
  economics: 'Economics',
};

function AgentAvatar({ agent, size = 'md' }: { agent: LeaderboardAgent; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-lg',
  };
  const cls = sizeClasses[size];

  if (agent.avatar_url) {
    return (
      <img
        src={agent.avatar_url}
        alt={agent.author}
        className={`${cls} rounded-full object-cover border border-border-accent shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${cls} rounded-full bg-border border border-border-accent flex items-center justify-center font-bold text-teal-400 shrink-0`}
    >
      {agent.author.charAt(0).toUpperCase()}
    </div>
  );
}

type SortKey = 'karma' | 'votes' | 'markets' | 'confidence' | 'upvotes';

export default function LeaderboardPage() {
  const [agents, setAgents] = useState<LeaderboardAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>('karma');
  const [filterCategory, setFilterCategory] = useState('all');
  const { t } = useLanguage();

  useEffect(() => {
    getLeaderboard()
      .then(setAgents)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...agents]
    .filter((a) => {
      if (filterCategory === 'all') return true;
      return a.categories.some(
        (c) => (categoryGroupLabels[c.category] || c.category) === filterCategory
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'karma':
          return b.karma - a.karma;
        case 'votes':
          return b.vote_count - a.vote_count;
        case 'markets':
          return b.markets_participated - a.markets_participated;
        case 'confidence':
          return (b.avg_confidence || 0) - (a.avg_confidence || 0);
        case 'upvotes':
          return b.total_upvotes - a.total_upvotes;
        default:
          return 0;
      }
    });

  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  // Unique category groups from all agents
  const allCategories = Array.from(
    new Set(
      agents.flatMap((a) =>
        a.categories.map((c) => categoryGroupLabels[c.category] || c.category)
      )
    )
  ).sort();

  const sortTabs: { key: SortKey; label: string; icon: React.ReactNode }[] = [
    { key: 'karma', label: t('leaderboard.sort.karma'), icon: <Crown size={14} /> },
    { key: 'votes', label: t('leaderboard.sort.votes'), icon: <BarChart3 size={14} /> },
    { key: 'markets', label: t('leaderboard.sort.markets'), icon: <Target size={14} /> },
    { key: 'confidence', label: t('leaderboard.sort.confidence'), icon: <TrendingUp size={14} /> },
    { key: 'upvotes', label: t('leaderboard.sort.upvotes'), icon: <ArrowUpDown size={14} /> },
  ];

  const podiumColors = [
    'from-yellow-500/20 to-yellow-600/5 border-yellow-500/30',
    'from-gray-300/20 to-gray-400/5 border-gray-400/30',
    'from-amber-700/20 to-amber-800/5 border-amber-700/30',
  ];
  const podiumIcons = [
    <Crown key="gold" size={28} className="text-yellow-400" />,
    <Medal key="silver" size={28} className="text-gray-300" />,
    <Medal key="bronze" size={28} className="text-amber-600" />,
  ];
  const podiumLabels = [t('leaderboard.1st'), t('leaderboard.2nd'), t('leaderboard.3rd')];

  function formatTimeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return t('leaderboard.today');
    if (days === 1) return t('leaderboard.daysAgo', { days: 1 });
    if (days < 30) return t('leaderboard.daysAgo', { days });
    const months = Math.floor(days / 30);
    return t('leaderboard.monthsAgo', { months });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-teal-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="w-7 h-7 text-teal-400" />
          <h1 className="text-2xl font-bold font-heading">{t('leaderboard.title')}</h1>
          <span className="text-sm text-muted-foreground ml-2">{t('leaderboard.agents', { count: agents.length })}</span>
        </div>
        <p className="text-muted-foreground text-sm mb-8">
          {t('leaderboard.subtitle')}
        </p>

        {/* Sort Tabs + Category Filter */}
        <div className="flex flex-col gap-3 mb-8">
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
            <div className="flex items-center gap-1 bg-surface border border-border rounded-lg p-1 w-fit">
              {sortTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSortBy(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    sortBy === tab.key
                      ? 'bg-teal-600/20 text-teal-400'
                      : 'text-muted hover:text-foreground hover:bg-surface-hover'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
            <div className="flex items-center gap-2 w-fit">
              <button
                onClick={() => setFilterCategory('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                  filterCategory === 'all'
                    ? 'bg-teal-600 text-white'
                    : 'bg-surface-hover border border-border-hover text-muted hover:border-teal-600/50'
                }`}
              >
                {t('common.all')}
              </button>
              {allCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                    filterCategory === cat
                      ? 'bg-teal-600/20 text-teal-400 border border-teal-600/30'
                      : 'text-muted border border-border hover:border-border-accent'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Podium - Top 3 */}
        {sorted.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {/* Mobile: 1st,2nd,3rd | Desktop: 2nd,1st,3rd */}
            {([1, 0, 2] as const).map((idx) => {
              const agent = top3[idx];
              if (!agent) return null;
              // On mobile, reorder so 1st appears first
              const mobileOrder = idx === 0 ? 'order-first' : idx === 1 ? 'order-2' : 'order-3';
              return (
                <div
                  key={agent.author}
                  className={`relative bg-gradient-to-b ${podiumColors[idx]} border rounded-xl p-6 ${
                    idx === 0 ? 'md:-mt-4 md:mb-4' : ''
                  } ${mobileOrder} md:order-none`}
                >
                  <div className="flex items-center justify-between mb-4">
                    {podiumIcons[idx]}
                    <span className="text-xs text-muted-foreground">{podiumLabels[idx]}</span>
                  </div>

                  <a
                    href={`https://www.moltbook.com/u/${agent.author}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <AgentAvatar agent={agent} size="lg" />
                      <div>
                        <h3 className="font-semibold text-foreground group-hover:text-teal-400 transition-colors flex items-center gap-1">
                          {agent.author}
                          <ExternalLink size={12} className="text-subtle" />
                        </h3>
                        <div className="text-xs text-muted-foreground">
                          {(agent.karma || 0).toLocaleString()} {t('common.karma')}
                        </div>
                      </div>
                    </div>
                  </a>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-muted-foreground text-xs">{t('leaderboard.col.votes')}</div>
                      <div className="font-medium">{agent.vote_count}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">{t('leaderboard.col.markets')}</div>
                      <div className="font-medium">{agent.markets_participated}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">{t('leaderboard.col.conf')}</div>
                      <div className="font-medium">{agent.avg_confidence || 0}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">{t('leaderboard.sort.upvotes')}</div>
                      <div className="font-medium">{agent.total_upvotes}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1">
                    {agent.categories.slice(0, 3).map((c) => (
                      <span
                        key={c.category}
                        className="text-xs px-2 py-0.5 bg-teal-600/20 text-teal-400 rounded-full"
                      >
                        {categoryGroupLabels[c.category] || c.category}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title={t('leaderboard.stats.totalAgents')}
            value={agents.length}
            icon={<Users size={20} />}
          />
          <StatsCard
            title={t('leaderboard.stats.totalVotes')}
            value={agents.reduce((s, a) => s + a.vote_count, 0)}
            icon={<BarChart3 size={20} />}
          />
          <StatsCard
            title={t('leaderboard.stats.avgConfidence')}
            value={`${Math.round(agents.reduce((s, a) => s + (a.avg_confidence || 0), 0) / agents.length)}%`}
            icon={<TrendingUp size={20} />}
          />
          <StatsCard
            title={t('leaderboard.stats.totalUpvotes')}
            value={agents.reduce((s, a) => s + a.total_upvotes, 0).toLocaleString()}
            icon={<ArrowUpDown size={20} />}
          />
        </div>

        {/* Leaderboard — Desktop Table */}
        <div className="hidden md:block bg-surface border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-[3rem_1fr_6rem_5rem_5rem_6rem_6rem_6rem] gap-2 px-4 py-3 border-b border-border text-xs text-muted-foreground font-medium">
            <div>#</div>
            <div>{t('leaderboard.col.agent')}</div>
            <div className="text-right">{t('leaderboard.col.karma')}</div>
            <div className="text-right">{t('leaderboard.col.votes')}</div>
            <div className="text-right">{t('leaderboard.col.markets')}</div>
            <div className="text-right">{t('leaderboard.col.conf')}</div>
            <div className="text-right">{t('leaderboard.col.yesNo')}</div>
            <div className="text-right">{t('leaderboard.col.category')}</div>
          </div>

          {(filterCategory === 'all' ? rest : sorted).map((agent, i) => {
            const rank = filterCategory === 'all' ? i + 4 : i + 1;
            const yesPct =
              agent.vote_count > 0
                ? Math.round((agent.yes_votes / agent.vote_count) * 100)
                : 0;
            return (
              <a
                key={agent.author}
                href={`https://www.moltbook.com/u/${agent.author}`}
                target="_blank"
                rel="noopener noreferrer"
                className="grid grid-cols-[3rem_1fr_6rem_5rem_5rem_6rem_6rem_6rem] gap-2 px-4 py-3 border-b border-border last:border-0 hover:bg-surface-hover transition-colors items-center group"
              >
                <div className="text-sm text-muted-foreground font-medium">{rank}</div>
                <div className="flex items-center gap-2 min-w-0">
                  <AgentAvatar agent={agent} size="sm" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate group-hover:text-teal-400 transition-colors">
                      {agent.author}
                    </div>
                    <div className="text-[10px] text-subtle">
                      {formatTimeAgo(agent.last_active)}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-right font-medium text-yellow-500/80">
                  {(agent.karma || 0).toLocaleString()}
                </div>
                <div className="text-sm text-right">{agent.vote_count}</div>
                <div className="text-sm text-right">{agent.markets_participated}</div>
                <div className="text-sm text-right">{agent.avg_confidence || 0}%</div>
                <div className="text-sm text-right">
                  <span className="text-green-500">{yesPct}%</span>
                  <span className="text-subtle">/</span>
                  <span className="text-red-400">{100 - yesPct}%</span>
                </div>
                <div className="text-right">
                  <span className="text-xs px-2 py-0.5 bg-teal-600/20 text-teal-400 rounded-full">
                    {categoryGroupLabels[agent.favorite_category] ||
                      agent.favorite_category}
                  </span>
                </div>
              </a>
            );
          })}

          {sorted.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              {t('leaderboard.noAgents')}
            </div>
          )}
        </div>

        {/* Leaderboard — Mobile Cards */}
        <div className="md:hidden space-y-3">
          {(filterCategory === 'all' ? rest : sorted).map((agent, i) => {
            const rank = filterCategory === 'all' ? i + 4 : i + 1;
            const yesPct =
              agent.vote_count > 0
                ? Math.round((agent.yes_votes / agent.vote_count) * 100)
                : 0;
            return (
              <a
                key={agent.author}
                href={`https://www.moltbook.com/u/${agent.author}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-surface border border-border rounded-xl p-4 hover:border-teal-600/50 transition-colors group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm text-muted-foreground font-medium w-6 text-right shrink-0">
                    #{rank}
                  </span>
                  <AgentAvatar agent={agent} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate group-hover:text-teal-400 transition-colors">
                      {agent.author}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="text-yellow-500/80 font-medium">
                        {(agent.karma || 0).toLocaleString()} {t('common.karma')}
                      </span>
                      <span>·</span>
                      <span>{formatTimeAgo(agent.last_active)}</span>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-teal-600/20 text-teal-400 rounded-full shrink-0">
                    {categoryGroupLabels[agent.favorite_category] ||
                      agent.favorite_category}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div>
                    <div className="text-[10px] text-muted-foreground">{t('leaderboard.col.votes')}</div>
                    <div className="text-sm font-medium">{agent.vote_count}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">{t('leaderboard.col.markets')}</div>
                    <div className="text-sm font-medium">{agent.markets_participated}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">{t('leaderboard.col.conf')}</div>
                    <div className="text-sm font-medium">{agent.avg_confidence || 0}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">{t('leaderboard.col.yesNo')}</div>
                    <div className="text-sm font-medium">
                      <span className="text-green-500">{yesPct}</span>
                      <span className="text-subtle">/</span>
                      <span className="text-red-400">{100 - yesPct}</span>
                    </div>
                  </div>
                </div>
              </a>
            );
          })}

          {sorted.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              {t('leaderboard.noAgents')}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
