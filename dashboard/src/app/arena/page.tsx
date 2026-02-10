'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/i18n/LanguageContext';
import { Zap, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

/* ─── Official Brand Logos (inline SVG) ─── */

const OpenAILogo = ({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill={color} viewBox="0 0 16 16">
    <path d="M14.949 6.547a3.94 3.94 0 0 0-.348-3.273 4.11 4.11 0 0 0-4.4-1.934A4.1 4.1 0 0 0 8.423.2 4.15 4.15 0 0 0 6.305.086a4.1 4.1 0 0 0-1.891.948 4.04 4.04 0 0 0-1.158 1.753 4.1 4.1 0 0 0-1.563.679A4 4 0 0 0 .554 4.72a3.99 3.99 0 0 0 .502 4.731 3.94 3.94 0 0 0 .346 3.274 4.11 4.11 0 0 0 4.402 1.933c.382.425.852.764 1.377.995.526.231 1.095.35 1.67.346 1.78.002 3.358-1.132 3.901-2.804a4.1 4.1 0 0 0 1.563-.68 4 4 0 0 0 1.14-1.253 3.99 3.99 0 0 0-.506-4.716m-6.097 8.406a3.05 3.05 0 0 1-1.945-.694l.096-.054 3.23-1.838a.53.53 0 0 0 .265-.455v-4.49l1.366.778q.02.011.025.035v3.722c-.003 1.653-1.361 2.992-3.037 2.996m-6.53-2.75a2.95 2.95 0 0 1-.36-2.01l.095.057L5.29 12.09a.53.53 0 0 0 .527 0l3.949-2.246v1.555a.05.05 0 0 1-.022.041L6.473 13.3c-1.454.826-3.311.335-4.15-1.098m-.85-6.94A3.02 3.02 0 0 1 3.07 3.949v3.785a.51.51 0 0 0 .262.451l3.93 2.237-1.366.779a.05.05 0 0 1-.048 0L2.585 9.342a2.98 2.98 0 0 1-1.113-4.094zm11.216 2.571L8.747 5.576l1.362-.776a.05.05 0 0 1 .048 0l3.265 1.86a3 3 0 0 1 1.173 1.207 2.96 2.96 0 0 1-.27 3.2 3.05 3.05 0 0 1-1.36.997V8.279a.52.52 0 0 0-.276-.445m1.36-2.015-.097-.057-3.226-1.855a.53.53 0 0 0-.53 0L6.249 6.153V4.598a.04.04 0 0 1 .019-.04L9.533 2.7a3.07 3.07 0 0 1 3.257.139c.474.325.843.778 1.066 1.303.223.526.289 1.103.191 1.664zM5.503 8.575 4.139 7.8a.05.05 0 0 1-.026-.037V4.049c0-.57.166-1.127.476-1.607s.752-.864 1.275-1.105a3.08 3.08 0 0 1 3.234.41l-.096.054-3.23 1.838a.53.53 0 0 0-.265.455zm.742-1.577 1.758-1 1.762 1v2l-1.755 1-1.762-1z"/>
  </svg>
);

const ClaudeLogo = ({ size = 16, color = '#C15F3C' }: { size?: number; color?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill={color} viewBox="0 0 16 16">
    <path d="m3.127 10.604 3.135-1.76.053-.153-.053-.085H6.11l-.525-.032-1.791-.048-1.554-.065-1.505-.08-.38-.081L0 7.832l.036-.234.32-.214.455.04 1.009.069 1.513.105 1.097.064 1.626.17h.259l.036-.105-.089-.065-.068-.064-1.566-1.062-1.695-1.121-.887-.646-.48-.327-.243-.306-.104-.67.435-.48.585.04.15.04.593.456 1.267.981 1.654 1.218.242.202.097-.068.012-.049-.109-.181-.9-1.626-.96-1.655-.428-.686-.113-.411a2 2 0 0 1-.068-.484l.496-.674L4.446 0l.662.089.279.242.411.94.666 1.48 1.033 2.014.302.597.162.553.06.17h.105v-.097l.085-1.134.157-1.392.154-1.792.052-.504.25-.605.497-.327.387.186.319.456-.045.294-.19 1.23-.37 1.93-.243 1.29h.142l.161-.16.654-.868 1.097-1.372.484-.545.565-.601.363-.287h.686l.505.751-.226.775-.707.895-.585.759-.839 1.13-.524.904.048.072.125-.012 1.897-.403 1.024-.186 1.223-.21.553.258.06.263-.218.536-1.307.323-1.533.307-2.284.54-.028.02.032.04 1.029.098.44.024h1.077l2.005.15.525.346.315.424-.053.323-.807.411-3.631-.863-.872-.218h-.12v.073l.726.71 1.331 1.202 1.667 1.55.084.383-.214.302-.226-.032-1.464-1.101-.565-.497-1.28-1.077h-.084v.113l.295.432 1.557 2.34.08.718-.112.234-.404.141-.444-.08-.911-1.28-.94-1.44-.759-1.291-.093.053-.448 4.821-.21.246-.484.186-.403-.307-.214-.496.214-.98.258-1.28.21-1.016.19-1.263.112-.42-.008-.028-.092.012-.953 1.307-1.448 1.957-1.146 1.227-.274.109-.477-.247.045-.44.266-.39 1.586-2.018.956-1.25.617-.723-.004-.105h-.036l-4.212 2.736-.75.096-.324-.302.04-.496.154-.162 1.267-.871z"/>
  </svg>
);

const BitcoinLogo = ({ size = 28 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="16" fill="#F7931A"/>
    <path fill="#fff" d="M22.5 14.1c.3-2-1.2-3.1-3.3-3.8l.7-2.7-1.7-.4-.7 2.6c-.4-.1-.9-.2-1.4-.3l.7-2.7-1.7-.4-.7 2.7c-.4-.1-.7-.2-1-.2l-2.3-.6-.4 1.8s1.2.3 1.2.3c.7.2.8.6.8 1l-.8 3.2c0 0 .1 0 .1 0l-.1 0-1.1 4.5c-.1.2-.3.5-.7.4 0 0-1.2-.3-1.2-.3l-.8 1.9 2.2.5c.4.1.8.2 1.2.3l-.7 2.8 1.7.4.7-2.7c.5.1.9.2 1.4.3l-.7 2.7 1.7.4.7-2.8c2.9.5 5.1.3 6-2.3.7-2.1 0-3.3-1.5-4.1 1.1-.3 1.9-1 2.1-2.5zm-3.8 5.3c-.5 2.1-4.1 1-5.3.7l.9-3.8c1.2.3 4.9.9 4.4 3.1zm.5-5.4c-.5 1.9-3.5.9-4.4.7l.9-3.4c1 .2 4.1.7 3.5 2.7z"/>
  </svg>
);

const UsdcLogo = ({ size = 24 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="14.5" fill="#2775CA"/>
    <path fill="#fff" d="M17.22,21.5h-2.44c-1.53,0-2.78-1.25-2.78-2.78V18.5c0-0.28,0.22-0.5,0.5-0.5s0.5,0.22,0.5,0.5v0.22c0,0.98,0.8,1.78,1.78,1.78h2.44c0.98,0,1.78-0.8,1.78-1.78c0-0.79-0.53-1.49-1.29-1.71l-3.69-1.05C12.83,15.61,12,14.51,12,13.28c0-1.53,1.25-2.78,2.78-2.78h2.44c1.53,0,2.78,1.25,2.78,2.78v0.22c0-0.28-0.22,0.5-0.5,0.5S19,13.78,19,13.5v-0.22c0-0.98-0.8-1.78-1.78-1.78h-2.44c-0.98,0-1.78,0.8-1.78,1.78c0,0.79,0.53,1.49,1.29,1.71l3.69,1.05c1.19,0.34,2.02,1.44,2.02,2.67C20,20.25,18.75,21.5,17.22,21.5z"/>
    <path fill="#fff" d="M16,23.5c-0.28,0-0.5-0.22-0.5-0.5v-2c0-0.28,0.22-0.5,0.5-0.5s0.5,0.22,0.5,0.5v2C16.5,23.28,16.28,23.5,16,23.5z"/>
    <path fill="#fff" d="M16,11.5c-0.28,0-0.5-0.22-0.5-0.5V9c0-0.28,0.22-0.5,0.5-0.5s0.5,0.22,0.5,0.5v2C16.5,11.28,16.28,11.5,16,11.5z"/>
    <path fill="#fff" d="M12.5,26.39c-0.06,0-0.11-0.01-0.17-0.03C7.95,24.81,5,20.64,5,16s2.95-8.81,7.33-10.36c0.26-0.09,0.54,0.04,0.64,0.3c0.09,0.26-0.04,0.55-0.3,0.64C8.68,7.99,6,11.78,6,16s2.68,8.01,6.67,9.42c0.26,0.09,0.4,0.38,0.3,0.64C12.9,26.26,12.71,26.39,12.5,26.39z"/>
    <path fill="#fff" d="M19.5,26.39c-0.21,0-0.4-0.13-0.47-0.33c-0.09-0.26,0.04-0.55,0.3-0.64C23.32,24.01,26,20.22,26,16s-2.68-8.01-6.67-9.42c-0.26-0.09-0.4-0.38-0.3-0.64c0.09-0.26,0.38-0.4,0.64-0.3C24.05,7.19,27,11.36,27,16s-2.95,8.81-7.33,10.36C19.61,26.38,19.56,26.39,19.5,26.39z"/>
  </svg>
);

const GeminiLogo = ({ size = 16 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 65 65">
    <defs>
      <linearGradient id="gemini-grad" x1="18" y1="43" x2="52" y2="15" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#4893FC"/>
        <stop offset=".27" stopColor="#4893FC"/>
        <stop offset=".77" stopColor="#969DFF"/>
        <stop offset="1" stopColor="#BD99FE"/>
      </linearGradient>
    </defs>
    <path fill="url(#gemini-grad)" d="M32.447 0c.68 0 1.273.465 1.439 1.125a38.904 38.904 0 001.999 5.905c2.152 5 5.105 9.376 8.854 13.125 3.751 3.75 8.126 6.703 13.125 8.855a38.98 38.98 0 005.906 1.999c.66.166 1.124.758 1.124 1.438 0 .68-.464 1.273-1.125 1.439a38.902 38.902 0 00-5.905 1.999c-5 2.152-9.375 5.105-13.125 8.854-3.749 3.751-6.702 8.126-8.854 13.125a38.973 38.973 0 00-2 5.906 1.485 1.485 0 01-1.438 1.124c-.68 0-1.272-.464-1.438-1.125a38.913 38.913 0 00-2-5.905c-2.151-5-5.103-9.375-8.854-13.125-3.75-3.749-8.125-6.702-13.125-8.854a38.973 38.973 0 00-5.905-2A1.485 1.485 0 010 32.448c0-.68.465-1.272 1.125-1.438a38.903 38.903 0 005.905-2c5-2.151 9.376-5.104 13.125-8.854 3.75-3.749 6.703-8.125 8.855-13.125a38.972 38.972 0 001.999-5.905A1.485 1.485 0 0132.447 0z"/>
  </svg>
);
import { LineChart, Line, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid, Label } from 'recharts';

/* ─── Constants ─── */

const MEDALS = ['\u{1F947}', '\u{1F948}', '\u{1F949}'];

const AGENT_COLORS: Record<string, string> = {
  'GPT-4o': '#10a37f',
  'Opus 4.6': '#D97757',
  'Gemini 2.5': '#4285F4',
  majority: '#00D990',
};

const AGENT_ICONS: Record<string, React.ReactNode> = {
  'GPT-4o': <OpenAILogo size={16} color="#10a37f" />,
  'Opus 4.6': <ClaudeLogo size={16} color="#D97757" />,
  'Gemini 2.5': <GeminiLogo size={16} />,
};

const AGENT_STRATEGIES: Record<string, string> = {
  'GPT-4o': 'Sentiment Analysis',
  'Opus 4.6': 'Fade the Crowd',
  'Gemini 2.5': 'Trend Following',
};

const AGENT_PHASES: Record<string, number> = {
  'GPT-4o': 1,
  'Opus 4.6': 2,
  'Gemini 2.5': 1,
};

const AGENT_WAITING: Record<string, string> = {
  'GPT-4o': 'Waiting for data...',
  'Opus 4.6': 'Waits for Phase 1...',
  'Gemini 2.5': 'Waiting for data...',
};

const STATUS_LABELS: Record<string, string> = {
  idle: 'Waiting for arena...',
  started: 'Round starting...',
  data: 'Phase 1: GPT-4o & Gemini 2.5 predicting...',
  phase1: 'Phase 2: Opus 4.6 analyzing...',
  phase2: 'Majority vote tallied — waiting for result...',
  majority: 'Waiting for result...',
  countdown: 'Waiting for result...',
  result: '',
};

const AGENTS = ['GPT-4o', 'Opus 4.6', 'Gemini 2.5'] as const;

/** Map old backend names to new display names */
const NAME_MAP: Record<string, string> = {
  Sentinel: 'GPT-4o',
  Contrarian: 'Opus 4.6',
  Momentum: 'Gemini 2.5',
  'GPT-4o': 'GPT-4o',
  'Opus 4.6': 'Opus 4.6',
  'Gemini 2.5': 'Gemini 2.5',
};
function mapName(name: string): string { return NAME_MAP[name] || name; }

/* ─── Types ─── */

interface Prediction {
  name: string;
  direction: 'UP' | 'DOWN';
  confidence: number;
  reasoning: string;
}

interface ScoreEntry {
  name: string;
  direction: string;
  correct: boolean;
  confidence?: number;
  reasoning?: string;
  betSize?: number;
  pnl?: number;
  balanceAfter?: number;
}

interface LeaderboardEntry {
  name: string;
  wins: number;
  total: number;
  rate: number;
  balance?: number;
  total_pnl?: number;
}

interface RoundResult {
  entryPrice: number;
  exitPrice: number;
  change: number;
  changePct: number;
  actual: 'UP' | 'DOWN';
}

interface RoundLogEntry {
  round: number;
  entry: number;
  exit: number;
  change: number;
  actual: string;
  scores: ScoreEntry[];
  createdAt?: string;
}

interface LiveState {
  round?: number;
  total?: number;
  price?: number;
  indicators?: Record<string, any>;
  phase1?: Prediction[];
  phase2?: Prediction[];
  majority?: string;
  votes?: { UP: number; DOWN: number };
  countdown?: { remaining: number; total: number };
  result?: RoundResult;
  scores?: ScoreEntry[];
  scoreboard?: LeaderboardEntry[];
  status: string;
}

/* ─── Helpers ─── */

/** Get latest balance per agent from backend data (balanceAfter on scores) */
function computeVirtualBalances(history: RoundLogEntry[]): Record<string, number> {
  const balances: Record<string, number> = { 'GPT-4o': 1000, 'Opus 4.6': 1000, 'Gemini 2.5': 1000 };
  // history is newest-first; the first entry has the latest balance
  for (const round of history) {
    for (const score of round.scores) {
      const name = mapName(score.name);
      if (balances[name] !== undefined && score.balanceAfter != null) {
        balances[name] = score.balanceAfter;
      }
    }
    break; // only need the latest round
  }
  return balances;
}

/** Compute per-round balance snapshots for PnL chart from backend data */
function computeBalanceHistory(history: RoundLogEntry[]): Array<Record<string, number | string>> {
  const chronological = [...history].reverse();
  const dataPoints: Array<Record<string, number | string>> = [
    { round: 'Start', 'GPT-4o': 1000, 'Opus 4.6': 1000, 'Gemini 2.5': 1000 },
  ];

  for (let i = 0; i < chronological.length; i++) {
    const round = chronological[i];
    const point: Record<string, number | string> = { round: `#${i + 1}` };
    for (const score of round.scores) {
      const name = mapName(score.name);
      if (score.balanceAfter != null) {
        point[name] = Math.round(score.balanceAfter * 100) / 100;
      }
    }
    // Fill any missing agents from previous point
    const prev = dataPoints[dataPoints.length - 1];
    for (const agent of AGENTS) {
      if (point[agent] == null) point[agent] = prev[agent] ?? 1000;
    }
    dataPoints.push(point);
  }

  return dataPoints;
}

/* ─── Page ─── */

export default function ArenaPage() {
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState<LiveState>({ status: 'idle' });
  const [allTimeBoard, setAllTimeBoard] = useState<LeaderboardEntry[]>([]);
  const [totalStats, setTotalStats] = useState<{ total_rounds: number; total_sessions: number } | null>(null);
  const [roundLog, setRoundLog] = useState<RoundLogEntry[]>([]);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [liveMarkPrice, setLiveMarkPrice] = useState<number | null>(null);
  const [historyPopupAgent, setHistoryPopupAgent] = useState<string | null>(null);
  const [expandedRoundIdx, setExpandedRoundIdx] = useState<number | null>(null);
  const [countdownSec, setCountdownSec] = useState<number | null>(null);
  const [countdownTotal, setCountdownTotal] = useState<number>(120);
  const [loadingNextRound, setLoadingNextRound] = useState(false);
  const countdownActive = useRef(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pricePollerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** One-time REST fetch for cold data (history, leaderboard) */
  const fetchHistory = useCallback(async () => {
    const [histRes, lbRes] = await Promise.all([
      fetch('/arena/api/history?limit=50').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/arena/api/leaderboard').then(r => r.ok ? r.json() : null).catch(() => null),
    ]);
    if (histRes?.history?.length) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const logs: RoundLogEntry[] = histRes.history.map((h: any) => ({
        round: h.round,
        entry: h.entryPrice,
        exit: h.exitPrice,
        change: h.change,
        actual: h.actual,
        createdAt: h.createdAt,
        scores: (h.predictions || []).map((p: any) => ({
          name: p.agent,
          direction: p.direction,
          correct: p.correct,
          confidence: p.confidence,
          reasoning: p.reasoning,
          betSize: p.betSize,
          pnl: p.pnl,
          balanceAfter: p.balanceAfter,
        })),
      }));
      setRoundLog(logs);
    }
    if (lbRes?.leaderboard?.length) setAllTimeBoard(lbRes.leaderboard);
    if (lbRes?.stats) setTotalStats(lbRes.stats);
  }, []);

  /** Parse raw SSE snapshot (lastState keys) into LiveState */
  function snapshotToLive(s: Record<string, any>): LiveState {
    const st: LiveState = { status: 'idle' };
    const rs = s['round:start'];
    if (rs) { st.round = rs.round; st.total = rs.total; }
    const rd = s['round:data'];
    if (rd) { st.price = rd.price; st.indicators = rd.indicators; }
    if (s['round:phase1']) st.phase1 = s['round:phase1'].predictions;
    if (s['round:phase2']) st.phase2 = s['round:phase2'].predictions;
    if (s['round:majority']) { st.majority = s['round:majority'].majority; st.votes = s['round:majority'].votes; }
    if (s['round:countdown']) st.countdown = { remaining: s['round:countdown'].remaining, total: s['round:countdown'].total };
    if (s['round:result']) st.result = s['round:result'];
    if (s['round:scores']) { st.scores = s['round:scores'].scores; st.scoreboard = s['round:scores'].scoreboard; }
    st.status = s['round:result'] ? 'result'
      : s['round:countdown'] ? 'countdown'
      : s['round:majority'] ? 'majority'
      : s['round:phase2'] ? 'phase2'
      : s['round:phase1'] ? 'phase1'
      : s['round:data'] ? 'data'
      : rs ? 'started'
      : 'idle';
    return st;
  }

  /* ─── SSE — single source of truth ─── */
  useEffect(() => {
    // Fetch cold data once
    fetchHistory().finally(() => setLoading(false));

    const es = new EventSource('/arena/events');

    // Full state snapshot on connect
    es.addEventListener('state', (e) => {
      try {
        const snapshot = JSON.parse(e.data);
        setLive(snapshotToLive(snapshot));
        setLoading(false);
        // Seed countdown if mid-countdown
        const cd = snapshot['round:countdown'];
        if (cd && !snapshot['round:result']) {
          setCountdownSec(cd.remaining);
          setCountdownTotal(cd.total);
          startTicker();
        }
      } catch {}
    });

    // Incremental events
    es.addEventListener('round:start', (e) => {
      try {
        const d = JSON.parse(e.data);
        setLive(prev => ({ ...prev, round: d.round, total: d.total, phase1: undefined, phase2: undefined, majority: undefined, votes: undefined, countdown: undefined, result: undefined, scores: undefined, scoreboard: undefined, status: 'started' }));
        stopTicker();
        setCountdownSec(null);
        setLoadingNextRound(false);
        if (loadingTimerRef.current) { clearTimeout(loadingTimerRef.current); loadingTimerRef.current = null; }
      } catch {}
    });

    es.addEventListener('round:data', (e) => {
      try {
        const d = JSON.parse(e.data);
        setLive(prev => ({ ...prev, price: d.price, indicators: d.indicators, status: 'data' }));
        setLiveMarkPrice(d.price);
      } catch {}
    });

    es.addEventListener('round:phase1', (e) => {
      try {
        const d = JSON.parse(e.data);
        setLive(prev => ({ ...prev, phase1: d.predictions, status: 'phase1' }));
      } catch {}
    });

    es.addEventListener('round:phase2', (e) => {
      try {
        const d = JSON.parse(e.data);
        setLive(prev => ({ ...prev, phase2: d.predictions, status: 'phase2' }));
      } catch {}
    });

    es.addEventListener('round:majority', (e) => {
      try {
        const d = JSON.parse(e.data);
        setLive(prev => ({ ...prev, majority: d.majority, votes: d.votes, status: 'majority' }));
      } catch {}
    });

    es.addEventListener('round:countdown', (e) => {
      try {
        const { remaining, total } = JSON.parse(e.data);
        setLive(prev => ({ ...prev, countdown: { remaining, total }, status: 'countdown' }));
        setCountdownSec(remaining);
        setCountdownTotal(total);
        startTicker();
      } catch {}
    });

    es.addEventListener('round:tick', (e) => {
      try {
        const { remaining } = JSON.parse(e.data);
        setCountdownSec(prev => (prev == null || Math.abs(prev - remaining) > 2) ? remaining : prev);
      } catch {}
    });

    es.addEventListener('round:result', (e) => {
      try {
        const d = JSON.parse(e.data);
        setLive(prev => ({ ...prev, result: d, status: 'result' }));
        stopTicker();
        setCountdownSec(null);
      } catch {}
    });

    es.addEventListener('round:scores', (e) => {
      try {
        const d = JSON.parse(e.data);
        setLive(prev => ({ ...prev, scores: d.scores, scoreboard: d.scoreboard }));
        // Refresh history from REST (new round completed)
        fetchHistory();
        // After 3s showing result, transition to "loading next round"
        if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = setTimeout(() => setLoadingNextRound(true), 3000);
      } catch {}
    });

    return () => {
      es.close();
      stopTicker();
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    };

    function startTicker() {
      if (countdownActive.current) return;
      countdownActive.current = true;
      countdownRef.current = setInterval(() => {
        setCountdownSec(prev => {
          if (prev == null || prev <= 1) { stopTicker(); return 0; }
          return prev - 1;
        });
      }, 1000);
      // Poll live mark price every 2 seconds during countdown
      pricePollerRef.current = setInterval(async () => {
        try {
          const res = await fetch('/arena/api/mark');
          if (res.ok) {
            const data = await res.json();
            if (data.price) setLiveMarkPrice(data.price);
          }
        } catch {}
      }, 2000);
    }

    function stopTicker() {
      countdownActive.current = false;
      if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
      if (pricePollerRef.current) { clearInterval(pricePollerRef.current); pricePollerRef.current = null; }
    }
  }, [fetchHistory]);

  /* ─── Derived state ─── */

  const allPredictions: Record<string, Prediction> = {};
  for (const p of (live.phase1 || [])) allPredictions[mapName(p.name)] = { ...p, name: mapName(p.name) };
  for (const p of (live.phase2 || [])) allPredictions[mapName(p.name)] = { ...p, name: mapName(p.name) };

  const scoreMap: Record<string, ScoreEntry> = {};
  for (const s of (live.scores || [])) scoreMap[mapName(s.name)] = { ...s, name: mapName(s.name) };

  // Merge leaderboard entries that map to the same display name (old + new names)
  const rawBoard = (live.scoreboard?.length) ? live.scoreboard : allTimeBoard;
  const lbMerged: Record<string, LeaderboardEntry> = {};
  for (const entry of rawBoard) {
    const dn = mapName(entry.name);
    if (lbMerged[dn]) {
      lbMerged[dn].wins += entry.wins;
      lbMerged[dn].total += entry.total;
      lbMerged[dn].rate = lbMerged[dn].total > 0
        ? (lbMerged[dn].wins / lbMerged[dn].total) * 100
        : 0;
    } else {
      lbMerged[dn] = { name: dn, wins: entry.wins, total: entry.total, rate: entry.rate, balance: entry.balance, total_pnl: entry.total_pnl };
    }
  }
  const displayBoard = Object.values(lbMerged).sort((a, b) => (b.balance ?? 0) - (a.balance ?? 0) || b.rate - a.rate || b.wins - a.wins);
  const lbMap: Record<string, LeaderboardEntry> = {};
  for (const entry of displayBoard) lbMap[entry.name] = entry;

  const virtualBalances = useMemo(() => computeVirtualBalances(roundLog), [roundLog]);
  const balanceHistory = useMemo(() => computeBalanceHistory(roundLog), [roundLog]);

  const winStreaks = useMemo(() => {
    const streaks: Record<string, number> = { 'GPT-4o': 0, 'Opus 4.6': 0, 'Gemini 2.5': 0 };
    const recent = [...roundLog];
    for (const agent of AGENTS) {
      for (const round of recent) {
        const score = round.scores.find(s => mapName(s.name) === agent);
        if (score?.correct) streaks[agent]++;
        else break;
      }
    }
    return streaks;
  }, [roundLog]);

  // Agent detailed stats: avg confidence, longest streak, head-to-head
  const agentDetailStats = useMemo(() => {
    const stats: Record<string, { avgConf: number; longestStreak: number }> = {};
    const chronological = [...roundLog].reverse();
    for (const agent of AGENTS) {
      let totalConf = 0, confCount = 0, longestStreak = 0, currentStreak = 0;
      for (const round of chronological) {
        const s = round.scores.find(sc => mapName(sc.name) === agent);
        if (!s) continue;
        if (s.confidence != null) { totalConf += s.confidence; confCount++; }
        if (s.correct) { currentStreak++; longestStreak = Math.max(longestStreak, currentStreak); }
        else currentStreak = 0;
      }
      stats[agent] = { avgConf: confCount > 0 ? totalConf / confCount : 0, longestStreak };
    }
    return stats;
  }, [roundLog]);

  const lastRoundWinners = useMemo(() => {
    if (!live.scores) return new Set<string>();
    return new Set(live.scores.filter(s => s.correct).map(s => mapName(s.name)));
  }, [live.scores]);

  const isLive = live.status !== 'idle';
  const totalDisplay = (live.total || 0) > 9000 ? '\u221E' : live.total;
  const statusText = STATUS_LABELS[live.status] || '';
  const entryPrice = live.result?.entryPrice || live.price || 0;
  const markPrice = live.result?.exitPrice || (liveMarkPrice ?? live.price) || 0;

  /* ─── Loading ─── */

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading arena...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ═══ Battle Header ═══ */}
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-7 h-7 text-teal-400" />
          <h1 className="text-2xl sm:text-3xl font-bold font-heading">Agent War</h1>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
            isLive ? 'bg-teal-600/10 border-teal-600/20' : 'bg-surface border-border'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-teal-400 animate-pulse' : 'bg-subtle'}`} />
            <span className={`text-xs font-semibold ${isLive ? 'text-teal-400' : 'text-subtle'}`}>
              {isLive ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
          {isLive && (
            <span className="text-sm text-muted-foreground font-heading">
              Round {live.round}/{totalDisplay}
            </span>
          )}
        </div>

        {/* ═══ Battle Status ═══ */}
        {isLive && (
          <div className={`rounded-xl p-4 sm:p-5 mb-5 transition-all duration-300 border ${
            live.result && !loadingNextRound
              ? live.result.actual === 'UP'
                ? 'border-green-500/40 bg-green-600/10'
                : 'border-red-400/40 bg-red-600/10'
              : 'border-border bg-surface'
          }`}>
            {loadingNextRound ? (
              /* ── Loading Next Round ── */
              <div className="space-y-3">
                {/* Top: 2 columns */}
                <div className="flex items-center justify-between gap-4">
                  {/* Left: BTC price */}
                  <div className="flex items-center gap-3">
                    <BitcoinLogo size={28} />
                    <div>
                      <div className="text-xl sm:text-2xl font-bold font-heading tabular-nums">
                        ${markPrice.toLocaleString()}
                      </div>
                      {live.result && (
                        <span className={`text-sm font-semibold ${live.result.change >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                          {live.result.change >= 0 ? '+' : ''}${live.result.change.toFixed(2)} ({live.result.changePct >= 0 ? '+' : ''}{live.result.changePct.toFixed(4)}%)
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Right: Done + Loading */}
                  <div className="flex items-center gap-3">
                    <span className="text-green-500 font-heading font-bold text-lg">✓ DONE</span>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm font-medium">Next round...</span>
                    </div>
                  </div>
                </div>
                {/* Bottom: Agents waiting */}
                <div className="flex items-center justify-center gap-4 sm:gap-6 pt-2 border-t border-white/10">
                  {AGENTS.map(name => {
                    const color = AGENT_COLORS[name];
                    return (
                      <div key={name} className="flex items-center gap-1.5 text-sm opacity-60">
                        {AGENT_ICONS[name]}
                        <span className="font-medium" style={{ color }}>{name}</span>
                        <span className="text-muted-foreground animate-pulse">...</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : live.result ? (
              /* ── Result ── */
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center gap-3">
                  <BitcoinLogo size={32} />
                  <div>
                    <div className="text-2xl font-bold font-heading tabular-nums">${markPrice.toLocaleString()}</div>
                    <span className={`text-sm font-semibold ${live.result.change >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                      {live.result.change >= 0 ? '+' : ''}${live.result.change.toFixed(2)} ({live.result.changePct >= 0 ? '+' : ''}{live.result.changePct.toFixed(4)}%)
                    </span>
                  </div>
                </div>
                <div className="sm:ml-auto text-center sm:text-right font-heading font-bold text-base sm:text-lg">
                  {(() => {
                    const winners = (live.scores || []).filter(s => s.correct).map(s => mapName(s.name));
                    const losers = (live.scores || []).filter(s => !s.correct).map(s => mapName(s.name));
                    if (winners.length === 1) {
                      return (
                        <>
                          <span className="text-teal-400">{winners[0]}</span>
                          {' wins! '}
                          <span className={live.result.actual === 'UP' ? 'text-green-500' : 'text-red-400'}>
                            BTC went {live.result.actual}
                          </span>
                        </>
                      );
                    }
                    return (
                      <>
                        <span className="text-green-500">{winners.join(' & ')}</span>
                        {' win, '}
                        <span className="text-red-400">{losers.join(' & ')}</span>
                        {losers.length === 1 ? ' loses' : ' lose'}
                      </>
                    );
                  })()}
                </div>
              </div>
            ) : live.status === 'phase2' || live.status === 'majority' || live.status === 'countdown' ? (
              /* ── Countdown: 2-column + agents row ── */
              <div className="space-y-3">
                {/* Top: 2 columns */}
                <div className="flex items-center justify-between gap-4">
                  {/* Left: BTC price + delta */}
                  <div className="flex items-center gap-3">
                    <BitcoinLogo size={28} />
                    <div>
                      <div className="text-xl sm:text-2xl font-bold font-heading tabular-nums">
                        ${markPrice.toLocaleString()}
                      </div>
                      {entryPrice > 0 && (
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold tabular-nums ${
                            markPrice >= entryPrice ? 'text-green-500' : 'text-red-400'
                          }`}>
                            {markPrice >= entryPrice ? '\u25B2' : '\u25BC'} {markPrice >= entryPrice ? '+' : ''}{markPrice !== entryPrice ? '$' : ''}{Math.abs(markPrice - entryPrice).toFixed(2)}
                          </span>
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded tabular-nums ${
                            markPrice >= entryPrice ? 'bg-green-500/15 text-green-500' : 'bg-red-400/15 text-red-400'
                          }`}>
                            {markPrice >= entryPrice ? '+' : ''}{((markPrice - entryPrice) / entryPrice * 100).toFixed(2)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Timer + progress */}
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`font-heading text-2xl sm:text-3xl font-bold tabular-nums ${
                      (countdownSec ?? 0) <= 10 ? 'text-red-400'
                        : (countdownSec ?? 0) <= 30 ? 'text-orange-400'
                        : 'text-yellow-400'
                    }`}>
                      {countdownSec != null && countdownSec > 0
                        ? `${Math.floor(countdownSec / 60)}:${(countdownSec % 60).toString().padStart(2, '0')}`
                        : '--:--'}
                    </span>
                    <div className="w-32 sm:w-40 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-linear"
                        style={{
                          width: `${Math.max(0, (countdownSec ?? 0) / countdownTotal * 100)}%`,
                          background: (countdownSec ?? 0) > 30
                            ? 'linear-gradient(90deg, #facc15, #eab308)'
                            : (countdownSec ?? 0) > 10
                              ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                              : '#ef4444',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom: Agent predictions full width */}
                <div className="flex items-center justify-center gap-4 sm:gap-6 pt-2 border-t border-white/10">
                  {AGENTS.map(name => {
                    const pred = allPredictions[name];
                    if (!pred) return null;
                    const color = AGENT_COLORS[name];
                    const isUp = pred.direction === 'UP';
                    return (
                      <div key={name} className="flex items-center gap-1.5 text-sm">
                        {AGENT_ICONS[name]}
                        <span className="font-medium" style={{ color }}>{name}</span>
                        <span className={`font-bold ${isUp ? 'text-green-500' : 'text-red-400'}`}>
                          {isUp ? '\u25B2' : '\u25BC'}
                        </span>
                        <span className="text-muted-foreground tabular-nums">{(pred.confidence * 100).toFixed(0)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : live.status === 'started' ? (
              /* ── Round Starting ── */
              <div className="space-y-3">
                {/* Top: 2 columns */}
                <div className="flex items-center justify-between gap-4">
                  {/* Left: BTC placeholder */}
                  <div className="flex items-center gap-3">
                    <BitcoinLogo size={28} />
                    <div className="text-xl sm:text-2xl font-bold font-heading tabular-nums text-muted-foreground animate-pulse">
                      $--,---.--
                    </div>
                  </div>
                  {/* Right: Starting indicator */}
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                    <span className="font-heading font-bold text-teal-400">
                      Starting Round {live.round}...
                    </span>
                  </div>
                </div>
                {/* Bottom: Agents waiting */}
                <div className="flex items-center justify-center gap-4 sm:gap-6 pt-2 border-t border-white/10">
                  {AGENTS.map(name => {
                    const color = AGENT_COLORS[name];
                    return (
                      <div key={name} className="flex items-center gap-1.5 text-sm">
                        {AGENT_ICONS[name]}
                        <span className="font-medium" style={{ color }}>{name}</span>
                        <div className="w-3 h-3 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* ── Phases: data / phase1 ── */
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center gap-3 flex-shrink-0">
                  <BitcoinLogo size={32} />
                  <div className="text-2xl font-bold font-heading tabular-nums">${markPrice.toLocaleString()}</div>
                </div>
                <div className="sm:ml-auto font-heading font-bold text-base sm:text-lg">
                  {live.status === 'data' ? (
                    <span className="text-teal-400">Phase 1: GPT-4o &amp; Gemini 2.5 analyzing...</span>
                  ) : live.status === 'phase1' ? (
                    <span className="text-purple-400">Phase 2: Opus 4.6 counter-attacking...</span>
                  ) : (
                    <span className="text-muted-foreground">{statusText || 'Preparing battlefield...'}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ Agent Battle Cards ═══ */}
        {isLive && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            {AGENTS.map(name => {
              const pred = allPredictions[name];
              const score = scoreMap[name];
              const lb = lbMap[name];
              const color = AGENT_COLORS[name];
              const balance = virtualBalances[name] || 1000;
              const pnlTotal = balance - 1000;
              const pnlPct = ((balance - 1000) / 1000 * 100);
              const streak = winStreaks[name];
              const justWon = lastRoundWinners.has(name);
              const isExpanded = expandedAgent === name;

              return (
                <div
                  key={name}
                  className={`relative bg-surface border rounded-xl overflow-hidden transition-all duration-300 ${
                    justWon && live.result
                      ? 'border-green-500/50'
                      : 'border-border hover:border-border-hover'
                  }`}
                  style={{
                    boxShadow: justWon && live.result
                      ? `0 0 20px 2px ${color}30, 0 0 40px 4px ${color}15`
                      : 'none',
                  }}
                >
                  <div className="h-[3px]" style={{ background: color }} />

                  <div className="p-4 sm:p-5">
                    {/* Agent Identity */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center border"
                        style={{ borderColor: color, background: `${color}15` }}>
                        {name === 'GPT-4o' && <OpenAILogo size={20} color={color} />}
                        {name === 'Opus 4.6' && <ClaudeLogo size={20} color={color} />}
                        {name === 'Gemini 2.5' && <GeminiLogo size={20} />}
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-base" style={{ color }}>
                          {name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {AGENT_STRATEGIES[name]}
                        </p>
                      </div>
                      <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        AGENT_PHASES[name] === 1
                          ? 'bg-teal-600/15 text-teal-400'
                          : 'bg-purple-600/15 text-purple-400'
                      }`}>
                        Phase {AGENT_PHASES[name]}
                      </span>
                    </div>

                    {/* Virtual Balance */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-3xl font-heading font-bold text-foreground">
                        <UsdcLogo size={28} />
                        {balance.toFixed(0)}
                      </div>
                      <div className={`text-sm font-semibold ${pnlTotal >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                        {pnlTotal >= 0 ? '+' : ''}{pnlTotal.toFixed(2)} ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%)
                      </div>
                    </div>

                    {/* Prediction */}
                    <div className="mb-4">
                      {pred ? (
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold ${
                            pred.direction === 'UP'
                              ? 'bg-green-500/15 text-green-500 border border-green-500/30'
                              : 'bg-red-400/15 text-red-400 border border-red-400/30'
                          }`}>
                            {pred.direction === 'UP' ? '\u25B2' : '\u25BC'} {pred.direction}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {(pred.confidence * 100).toFixed(0)}% conf
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-subtle italic">
                          {AGENT_WAITING[name]}
                        </span>
                      )}
                    </div>

                    {/* Stats: W/L + Streak */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                      <button
                        onClick={() => setHistoryPopupAgent(name)}
                        className="cursor-pointer hover:opacity-80 transition-opacity border-b border-dashed border-muted-foreground/40 pb-0.5"
                        title="View round history"
                      >
                        <span className="text-foreground font-semibold">{lb?.wins || 0}W</span>
                        {' / '}
                        <span className="text-foreground font-semibold">{(lb?.total || 0) - (lb?.wins || 0)}L</span>
                        <span className="ml-1">({(lb?.rate || 0).toFixed(0)}%)</span>
                      </button>
                      {streak > 0 && (
                        <div className="flex items-center gap-1 text-yellow-400 font-semibold">
                          {'\uD83D\uDD25'} {streak} streak
                        </div>
                      )}
                    </div>

                    {/* Win rate bar */}
                    {lb && lb.total > 0 && (
                      <div className="h-1.5 bg-border rounded-full overflow-hidden mb-3">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${lb.rate}%`, background: color }}
                        />
                      </div>
                    )}

                    {/* Round result badge */}
                    {score && (
                      <div className={`text-center py-1.5 rounded-lg text-xs font-bold mb-3 ${
                        score.correct
                          ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                          : 'bg-red-400/10 text-red-400 border border-red-400/20'
                      }`}>
                        {score.correct ? '\u2713 ROUND WON' : '\u2717 ROUND LOST'}
                      </div>
                    )}

                    {!score && pred && (
                      <div className="flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-bold mb-3 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                        <span>STAKE:</span>
                        <span className="flex items-center gap-1">
                          <UsdcLogo size={12} />
                          {(balance * pred.confidence * 0.05).toFixed(2)}
                        </span>
                      </div>
                    )}

                    {/* Expandable reasoning */}
                    {pred && (
                      <>
                        <button
                          onClick={() => setExpandedAgent(isExpanded ? null : name)}
                          className="flex items-center gap-1.5 text-xs transition-colors cursor-pointer hover:opacity-80 w-full"
                          style={{ color }}
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          {isExpanded ? 'Hide reasoning' : 'Show reasoning'}
                        </button>
                        {isExpanded && (
                          <div className="mt-2 text-xs text-muted-foreground leading-relaxed bg-surface-alt rounded-lg p-3 animate-fadeUp">
                            {pred.reasoning}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ War Performance Chart ═══ */}
        {balanceHistory.length > 1 && (
          <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 mb-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h3 className="text-sm font-heading font-semibold text-muted uppercase tracking-wider flex-shrink-0">
                War Performance
              </h3>
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                {AGENTS.map(name => (
                  <div key={name} className="flex items-center gap-1 text-xs" title={name}>
                    {AGENT_ICONS[name]}
                    <span className="text-muted-foreground hidden sm:inline">{name}</span>
                  </div>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={360}>
              <LineChart data={balanceHistory} margin={{ top: 10, right: 75, left: 0, bottom: 5 }}>
                <defs>
                  {AGENTS.map(name => (
                    <linearGradient key={`grad-${name}`} id={`grad-${name.replace(/[\s.]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={AGENT_COLORS[name]} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={AGENT_COLORS[name]} stopOpacity={0.02} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="round"
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                  tickLine={false}
                  tickFormatter={(v: number) => `$${v}`}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 15, 20, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#e5e7eb',
                  }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any, name: any) => [`$${Number(value || 0).toFixed(2)}`, String(name)]}
                  labelStyle={{ color: '#9ca3af', fontWeight: 600, marginBottom: 4 }}
                />
                <ReferenceLine y={1000} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" label={{ value: '$1000', fill: '#6b7280', fontSize: 10, position: 'left' }} />
                {AGENTS.map(name => (
                  <Area
                    key={`area-${name}`}
                    type="natural"
                    dataKey={name}
                    stroke="none"
                    fill={`url(#grad-${name.replace(/[\s.]/g, '')})`}
                    fillOpacity={1}
                    isAnimationActive={false}
                    tooltipType="none"
                  />
                ))}
                {AGENTS.map(name => {
                  const lastVal = balanceHistory.length > 0
                    ? Number(balanceHistory[balanceHistory.length - 1][name] || 0)
                    : 0;
                  return (
                    <Line
                      key={name}
                      type="natural"
                      dataKey={name}
                      stroke={AGENT_COLORS[name]}
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 4, fill: AGENT_COLORS[name], strokeWidth: 2, stroke: '#fff' }}
                      label={balanceHistory.length > 1 ? (
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (props: any) => {
                          if (props.index !== balanceHistory.length - 1) return null;
                          return (
                            <g>
                              <foreignObject x={props.x + 4} y={props.y - 8} width={16} height={16}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {AGENT_ICONS[name]}
                                </div>
                              </foreignObject>
                              <text x={props.x + 22} y={props.y} fill={AGENT_COLORS[name]} fontSize={11} fontWeight={700} dominantBaseline="middle">
                                ${lastVal.toFixed(0)}
                              </text>
                            </g>
                          );
                        }
                      ) : undefined}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ═══ Offline State ═══ */}
        {!isLive && (
          <div className="bg-surface border border-border rounded-xl py-16 text-center mb-5">
            <Zap className="w-16 h-16 text-teal-400/20 mx-auto mb-4" />
            <h2 className="text-xl font-heading font-semibold text-muted mb-2">
              Battlefield is quiet
            </h2>
            <p className="text-sm text-subtle">
              Agents will deploy when the next session begins
            </p>
          </div>
        )}

        {/* ═══ Leaderboard ═══ */}
        {displayBoard.length > 0 && (
          <div className="bg-surface border border-border hover:border-border-hover transition-colors rounded-xl p-5 sm:p-6 mb-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-heading font-semibold text-muted uppercase tracking-wider">
                {live.scoreboard?.length ? 'Session Leaderboard' : 'All-Time Leaderboard'}
              </h3>
              {totalStats && (
                <span className="text-xs text-subtle">
                  {totalStats.total_rounds} rounds across {totalStats.total_sessions} sessions
                </span>
              )}
            </div>
            <div className="space-y-1">
              {displayBoard.map((entry, i) => {
                const displayName = mapName(entry.name);
                const color = AGENT_COLORS[displayName] || '#00D990';
                const rateColor = entry.rate >= 50 ? '#22c55e' : '#ef4444';
                const bal = entry.balance ?? virtualBalances[displayName] ?? 1000;
                const pnl = entry.total_pnl ?? (bal - 1000);
                const ds = agentDetailStats[displayName];
                const isLeader = i === 0;
                return (
                  <button
                    key={displayName}
                    onClick={() => setHistoryPopupAgent(displayName)}
                    className={`flex flex-col gap-1 py-2.5 w-full text-left hover:bg-surface-hover transition-all rounded-lg px-3 -mx-2 cursor-pointer ${isLeader ? 'ring-1 ring-yellow-500/30 bg-yellow-500/[0.03]' : ''}`}
                    style={isLeader ? { boxShadow: `0 0 20px 2px ${color}15` } : undefined}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <span className="text-base w-7 text-center">{MEDALS[i] || ''}</span>
                      <span className="w-28 font-semibold text-sm flex items-center gap-1.5" style={{ color }}>
                        {AGENT_ICONS[displayName]}
                        {displayName}
                      </span>
                      <span className="w-12 text-sm text-muted-foreground">{entry.wins}/{entry.total}</span>
                      <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${entry.rate}%`, background: color }}
                        />
                      </div>
                      <span className="w-12 text-right font-heading font-bold text-sm" style={{ color: rateColor }}>
                        {entry.rate.toFixed(0)}%
                      </span>
                      <span className="w-20 text-right text-xs font-semibold" style={{ color: pnl >= 0 ? '#22c55e' : '#ef4444' }}>
                        ${bal.toFixed(0)} <span className="opacity-60">({pnl >= 0 ? '+' : ''}{pnl.toFixed(1)})</span>
                      </span>
                    </div>
                    {ds && (
                      <div className="flex items-center gap-3 ml-10 text-[10px] text-subtle">
                        <span>Avg Conf: <span className="text-muted-foreground font-medium">{(ds.avgConf * 100).toFixed(0)}%</span></span>
                        <span>Best Streak: <span className="text-muted-foreground font-medium">{ds.longestStreak}</span></span>
                        <span>Current: <span className="text-muted-foreground font-medium">{winStreaks[displayName] > 0 ? `${winStreaks[displayName]}W` : '0'}</span></span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ Round History ═══ */}
        {roundLog.length > 0 && (
          <div className="bg-surface border border-border hover:border-border-hover transition-colors rounded-xl p-5 sm:p-6">
            <h3 className="text-sm font-heading font-semibold text-muted uppercase tracking-wider mb-3">
              Round History
            </h3>
            <div className="max-h-80 overflow-y-auto">
              <div className="space-y-0">
                {(() => {
                  let sessionNum = 1;
                  const rows: React.ReactNode[] = [];
                  for (let idx = 0; idx < roundLog.length; idx++) {
                    const log = roundLog[idx];
                    const isSessionBreak = idx > 0 && log.round > roundLog[idx - 1].round;
                    if (isSessionBreak) sessionNum++;
                    if (idx === 0 || isSessionBreak) {
                      const sessionTime = log.createdAt ? new Date(log.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : '';
                      rows.push(
                        <div key={`s-${sessionNum}`} className="flex items-center gap-2 py-1.5 px-2 mt-1 first:mt-0">
                          <div className="h-px flex-1 bg-border" />
                          <span className="text-[10px] text-subtle font-semibold uppercase tracking-wider">
                            Session {sessionNum}{sessionTime ? <span className="normal-case ml-1.5 opacity-60">{sessionTime}</span> : ''}
                          </span>
                          <div className="h-px flex-1 bg-border" />
                        </div>
                      );
                    }
                    const color = log.actual === 'UP' ? 'text-green-500' : 'text-red-400';
                    const sign = (log.change || 0) >= 0 ? '+' : '';
                    const isExpanded = expandedRoundIdx === idx;
                    rows.push(
                      <div key={`r-${idx}`} className="border-b border-border last:border-0">
                        <button
                          onClick={() => setExpandedRoundIdx(isExpanded ? null : idx)}
                          className="flex items-center gap-3 py-2 px-2 w-full text-left text-sm text-muted-foreground hover:bg-surface-hover transition-colors rounded-lg cursor-pointer"
                        >
                          <span className="text-subtle font-semibold w-10 shrink-0">R{log.round}</span>
                          <span className="flex items-center gap-1 flex-1 min-w-0">
                            <BitcoinLogo size={14} />
                            <span className="text-foreground/70">${Math.round(log.entry || 0).toLocaleString()}</span>
                            <span className="text-subtle">→</span>
                            <span className="text-foreground/70">${Math.round(log.exit || 0).toLocaleString()}</span>
                            {' '}
                            <span className={`font-semibold ${color}`}>{sign}${Math.abs(log.change || 0).toFixed(0)}</span>
                          </span>
                          <span className={`font-bold w-14 text-right shrink-0 ${color}`}>{log.actual}</span>
                          <span className="flex gap-1.5 shrink-0">
                            {(log.scores || []).map(s => {
                              const dn = mapName(s.name);
                              return (
                                <span
                                  key={dn}
                                  className="flex items-center gap-0.5"
                                  title={`${dn}: ${s.direction} ${s.correct ? '✓' : '✗'}`}
                                >
                                  <span className={s.correct ? 'opacity-100' : 'opacity-30'}>{AGENT_ICONS[dn]}</span>
                                  <span className={`text-[10px] font-bold ${s.correct ? 'text-green-500' : 'text-red-400'}`}>
                                    {s.correct ? '✓' : '✗'}
                                  </span>
                                </span>
                              );
                            })}
                          </span>
                          <ChevronDown className={`w-3.5 h-3.5 text-subtle transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        {isExpanded && (
                          <div className="px-3 pb-3 space-y-2">
                            {(log.scores || []).map(s => {
                              const dn = mapName(s.name);
                              const agentColor = AGENT_COLORS[dn] || '#888';
                              return (
                                <div key={dn} className="bg-background/50 border border-border rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    {AGENT_ICONS[dn]}
                                    <span className="text-xs font-semibold" style={{ color: agentColor }}>{dn}</span>
                                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${s.direction === 'UP' ? 'bg-green-500/10 text-green-500' : 'bg-red-400/10 text-red-400'}`}>
                                      {s.direction === 'UP' ? '▲' : '▼'} {s.direction}
                                    </span>
                                    {s.confidence != null && (
                                      <span className="text-[10px] text-muted-foreground">{(s.confidence * 100).toFixed(0)}% conf</span>
                                    )}
                                    <span className={`ml-auto text-xs font-bold ${s.correct ? 'text-green-500' : 'text-red-400'}`}>
                                      {s.correct ? '✓ Correct' : '✗ Wrong'}
                                    </span>
                                  </div>
                                  {s.reasoning && (
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">{s.reasoning}</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return rows;
                })()}
              </div>
            </div>
          </div>
        )}
        {/* ═══ Agent History Popup ═══ */}
        {historyPopupAgent && (() => {
          const agent = historyPopupAgent;
          const color = AGENT_COLORS[agent] || '#00D990';
          const lb = lbMap[agent];
          const losses = (lb?.total || 0) - (lb?.wins || 0);
          const balance = lb?.balance ?? virtualBalances[agent] ?? 1000;
          const pnl = lb?.total_pnl ?? (balance - 1000);

          const agentRounds = roundLog
            .map(r => {
              const s = r.scores.find(sc => mapName(sc.name) === agent);
              if (!s) return null;
              return { round: r.round, direction: s.direction, confidence: s.confidence, correct: s.correct, change: r.change, actual: r.actual, entry: r.entry, exit: r.exit, betSize: s.betSize, pnl: s.pnl, balanceAfter: s.balanceAfter };
            })
            .filter(Boolean) as Array<{ round: number; direction: string; confidence?: number; correct: boolean; change: number; actual: string; entry: number; exit: number; betSize?: number; pnl?: number; balanceAfter?: number }>;

          // Use backend pnl data, or compute deltas as fallback
          const balanceDeltas: number[] = agentRounds.map(r => r.pnl ?? 0);

          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setHistoryPopupAgent(null)}
            >
              {/* Backdrop */}
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

              {/* Modal */}
              <div
                className="relative bg-surface border border-border rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}
                style={{ boxShadow: `0 0 40px 4px ${color}20` }}
              >
                {/* Top accent */}
                <div className="h-1" style={{ background: color }} />

                {/* Header */}
                <div className="p-5 pb-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center border"
                      style={{ borderColor: color, background: `${color}15` }}>
                      {agent === 'GPT-4o' && <OpenAILogo size={24} color={color} />}
                      {agent === 'Opus 4.6' && <ClaudeLogo size={24} color={color} />}
                      {agent === 'Gemini 2.5' && <GeminiLogo size={24} />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-heading font-bold text-lg" style={{ color }}>{agent}</h3>
                      <p className="text-xs text-muted-foreground">{AGENT_STRATEGIES[agent]}</p>
                    </div>
                    <button
                      onClick={() => setHistoryPopupAgent(null)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Overall stats */}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4">
                    <div>
                      <span className="text-2xl font-heading font-bold text-foreground">{lb?.wins || 0}W / {losses}L</span>
                      <span className="ml-2 text-sm font-semibold" style={{ color: (lb?.rate || 0) >= 50 ? '#22c55e' : '#ef4444' }}>
                        {(lb?.rate || 0).toFixed(0)}%
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Balance </span>
                      <span className="font-heading font-bold text-foreground">${balance.toFixed(2)}</span>
                      <span className={`ml-1.5 font-semibold ${pnl >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                        {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                      </span>
                    </div>
                    {winStreaks[agent] > 0 && (
                      <span className="text-sm text-yellow-400 font-semibold">{'\uD83D\uDD25'} {winStreaks[agent]} streak</span>
                    )}
                  </div>

                  {/* Win/Loss streak bar */}
                  {agentRounds.length > 0 && (
                    <div className="flex gap-0.5 mt-3 flex-wrap">
                      {agentRounds.slice(0, 50).map((r, i) => (
                        <div
                          key={i}
                          className="w-3 h-3 rounded-sm transition-all"
                          style={{ background: r.correct ? '#22c55e' : '#ef4444', opacity: i < 10 ? 1 : 0.6 }}
                          title={`R${r.round}: ${r.direction} ${r.correct ? '✓' : '✗'}`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Trade History Table */}
                <div className="overflow-y-auto max-h-[55vh]">
                  {agentRounds.length === 0 ? (
                    <p className="text-sm text-subtle text-center py-12">No round history yet</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="sticky top-0 bg-surface border-b border-border text-muted-foreground uppercase tracking-wider">
                            <th className="text-left py-2.5 px-3 font-semibold">Round</th>
                            <th className="text-left py-2.5 px-2 font-semibold">Call</th>
                            <th className="text-right py-2.5 px-2 font-semibold">Conf</th>
                            <th className="text-right py-2.5 px-2 font-semibold">Open</th>
                            <th className="text-right py-2.5 px-2 font-semibold">Close</th>
                            <th className="text-right py-2.5 px-2 font-semibold">BTC &Delta;</th>
                            <th className="text-right py-2.5 px-2 font-semibold">P&amp;L</th>
                            <th className="text-center py-2.5 px-3 font-semibold"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {agentRounds.map((r, i) => {
                            const bd = balanceDeltas[i] || 0;
                            return (
                              <tr
                                key={i}
                                className={`border-b border-border/50 transition-colors ${
                                  r.correct ? 'bg-green-500/[0.03]' : 'bg-red-400/[0.03]'
                                } hover:bg-surface-hover`}
                              >
                                <td className="py-2 px-3 text-subtle font-semibold">R{r.round}</td>
                                <td className="py-2 px-2">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold ${
                                    r.direction === 'UP'
                                      ? 'bg-green-500/15 text-green-500'
                                      : 'bg-red-400/15 text-red-400'
                                  }`}>
                                    {r.direction === 'UP' ? '\u25B2' : '\u25BC'} {r.direction}
                                  </span>
                                </td>
                                <td className="py-2 px-2 text-right text-muted-foreground">
                                  {r.confidence != null ? `${(r.confidence * 100).toFixed(0)}%` : '-'}
                                </td>
                                <td className="py-2 px-2 text-right text-foreground font-mono">
                                  ${r.entry.toLocaleString()}
                                </td>
                                <td className="py-2 px-2 text-right text-foreground font-mono">
                                  ${r.exit.toLocaleString()}
                                </td>
                                <td className={`py-2 px-2 text-right font-mono ${r.change >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                                  {r.change >= 0 ? '+' : ''}${r.change.toFixed(2)}
                                </td>
                                <td className={`py-2 px-2 text-right font-mono font-bold ${bd >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                                  {bd >= 0 ? '+' : ''}{bd.toFixed(2)}
                                </td>
                                <td className={`py-2 px-3 text-center font-bold text-sm ${r.correct ? 'text-green-500' : 'text-red-400'}`}>
                                  {r.correct ? '\u2713' : '\u2717'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </main>

      <Footer />
    </div>
  );
}
