// Use /api proxy in production (HTTPS), direct port in local dev
function getApiBase(): string {
  if (typeof window !== 'undefined') {
    if (window.location.protocol === 'https:') {
      return '/api';
    }
    const host = window.location.hostname;
    return `http://${host}:3456`;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3456';
}

export interface Vote {
  post_id: string;
  title: string;
  author: string;
  vote: string;
  reasoning: string;
  created_at: string;
  confidence?: string;
  excerpt?: string;
  upvotes?: number;
}

export interface Market {
  id: number;
  question: string;
  description: string;
  category: string;
  resolution_date: string;
  probabilities: {
    yes: number;
    no: number;
  };
  total_opinions: number;
  status: string;
  votes?: Vote[];
}

export interface Stats {
  total_posts: number;
  total_markets: number;
  total_votes: number;
  unique_authors: number;
}

export async function getMarkets(): Promise<Market[]> {
  const res = await fetch(`${getApiBase()}/markets`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch markets');
  const data = await res.json();
  return data.markets;
}

export async function getMarket(id: number): Promise<Market> {
  const res = await fetch(`${getApiBase()}/markets/${id}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch market');
  const data = await res.json();

  // Transform votes from object to array
  const votes: Vote[] = [];
  if (data.votes?.yes) {
    data.votes.yes.forEach((v: any) => votes.push({ ...v, vote: 'YES' }));
  }
  if (data.votes?.no) {
    data.votes.no.forEach((v: any) => votes.push({ ...v, vote: 'NO' }));
  }

  return {
    ...data.market,
    votes,
  };
}

export interface LeaderboardAgent {
  rank: number;
  author: string;
  karma: number;
  vote_count: number;
  markets_participated: number;
  avg_confidence: number;
  yes_votes: number;
  no_votes: number;
  total_upvotes: number;
  last_active: string;
  avatar_url: string | null;
  x_handle: string | null;
  verified?: boolean;
  favorite_category: string;
  categories: { category: string; count: number }[];
}

export async function getLeaderboard(): Promise<LeaderboardAgent[]> {
  const res = await fetch(`${getApiBase()}/leaderboard`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  const data = await res.json();
  return data.leaderboard;
}

export interface HistoryPoint {
  timestamp: string;
  yes: number;
  no: number;
  totalVotes: number;
}

export async function getMarketHistory(id: number): Promise<HistoryPoint[]> {
  const res = await fetch(`${getApiBase()}/markets/${id}/history`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch market history');
  const data = await res.json();
  return data.history;
}

export async function getStats(): Promise<Stats> {
  const res = await fetch(`${getApiBase()}/stats`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch stats');
  const data = await res.json();
  // Map API response to Stats interface
  return {
    total_posts: data.posts?.total_posts || 0,
    total_markets: data.markets?.total_markets || 0,
    total_votes: data.markets?.total_opinions_analyzed || 0,
    unique_authors: data.vote_contributors || data.posts?.unique_authors || 0,
  };
}

export interface RegisterAgentResponse {
  success: boolean;
  agent?: {
    name: string;
    api_key: string;
    created_at: string;
  };
  error?: string;
}

export async function registerAgent(
  name: string,
  description?: string,
  x_handle?: string
): Promise<RegisterAgentResponse> {
  const res = await fetch(`${getApiBase()}/agents/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description, x_handle }),
  });
  return res.json();
}

export interface StartVerificationResponse {
  success: boolean;
  verification_code?: string;
  post_template?: string;
  moltbook_username?: string;
  error?: string;
}

export async function startVerification(
  apiKey: string,
  moltbookUsername: string
): Promise<StartVerificationResponse> {
  const res = await fetch(`${getApiBase()}/agents/verify/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ moltbook_username: moltbookUsername }),
  });
  return res.json();
}

export interface CheckVerificationResponse {
  success: boolean;
  verified?: boolean;
  message?: string;
  error?: string;
}

export async function checkVerification(
  apiKey: string
): Promise<CheckVerificationResponse> {
  const res = await fetch(`${getApiBase()}/agents/verify/check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
  });
  return res.json();
}

// Health status
export interface ServiceStatus {
  status: 'operational' | 'degraded' | 'down';
  latency_ms?: number;
  count?: number;
  error?: string;
}

export interface HealthStatus {
  status: 'operational' | 'degraded' | 'down';
  uptime_seconds: number;
  services: Record<string, ServiceStatus>;
  timestamp: string;
}

export async function getHealthStatus(): Promise<HealthStatus> {
  const res = await fetch(`${getApiBase()}/health`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch health status');
  const data = await res.json();
  return data;
}

export interface HealthHistoryEntry {
  date: string;
  status: 'operational' | 'degraded' | 'down' | 'no_data';
  latency_ms: number | null;
}

export interface HealthHistoryResponse {
  days: number;
  since: string;
  services: Record<string, HealthHistoryEntry[]>;
}

export async function getHealthHistory(days = 90): Promise<HealthHistoryResponse> {
  const res = await fetch(`${getApiBase()}/health/history?days=${days}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch health history');
  const data = await res.json();
  return data;
}

// Research types
export interface MoltbookComment {
  id: string;
  content: string;
  author: { name: string; karma: number };
  upvotes: number;
  created_at: string;
}

export interface Research {
  id: number;
  title: string;
  summary: string | null;
  content: string;
  category: string;
  tags: string[];
  moltbook_post_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  suggested_market_ids?: number[];
  suggested_markets?: {
    id: number;
    question: string;
    category: string;
    probabilities: { yes: number; no: number };
    status: string;
  }[];
  comments?: MoltbookComment[];
}

export async function getResearchList(category?: string): Promise<Research[]> {
  const params = category ? `?category=${category}` : '';
  const res = await fetch(`${getApiBase()}/research${params}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch research');
  const data = await res.json();
  return data.research;
}

export async function getResearch(id: number): Promise<Research> {
  const res = await fetch(`${getApiBase()}/research/${id}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch research');
  const data = await res.json();
  return data.research;
}

export async function getResearchComments(id: number): Promise<MoltbookComment[]> {
  const res = await fetch(`${getApiBase()}/research/${id}/comments`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch comments');
  const data = await res.json();
  return data.comments;
}
