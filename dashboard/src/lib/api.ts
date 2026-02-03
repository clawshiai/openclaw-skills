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
