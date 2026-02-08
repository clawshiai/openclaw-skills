import 'dotenv/config';
import { createServer } from 'http';
import { randomBytes } from 'crypto';
import { readFileSync } from 'fs';
import { spawn } from 'child_process';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'data/clawdpredict.db'));
const PORT = process.env.PORT || 3456;

// Contract config
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0xC0de289DcE3b3c7D8cDf8B2A1Cd0411660A591FE';
const CHAIN_ID = 84532;
const CHAIN_NAME = 'Base Sepolia';
const RPC_URL = 'https://sepolia.base.org';
const USDC_ADDRESS = '0x036cbd53842c5426634e7929541ec2318f3dcf7e';

// Load contract ABI if available
let CONTRACT_ABI = null;
try {
  const artifact = JSON.parse(readFileSync(join(__dirname, 'contracts/ClawshiMarket.json'), 'utf8'));
  CONTRACT_ABI = artifact.abi;
} catch (e) {
  // Contract not compiled yet
}

// Create user_votes table for authenticated voting
db.exec(`
  CREATE TABLE IF NOT EXISTS user_votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    market_id INTEGER,
    agent_id TEXT,
    agent_name TEXT,
    vote TEXT CHECK(vote IN ('YES', 'NO')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(market_id, agent_id)
  );
`);

// Create agents table for registration
db.exec(`
  CREATE TABLE IF NOT EXISTS agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    api_key TEXT UNIQUE NOT NULL,
    x_handle TEXT,
    verified INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// Create agent_wallets table for USDC staking
db.exec(`
  CREATE TABLE IF NOT EXISTS agent_wallets (
    agent_id INTEGER PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES agents(id)
  );
`);

// Create stakes table for on-chain stake tracking
db.exec(`
  CREATE TABLE IF NOT EXISTS stakes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id INTEGER NOT NULL,
    market_id INTEGER NOT NULL,
    position TEXT CHECK(position IN ('YES', 'NO')),
    amount TEXT NOT NULL,
    tx_hash TEXT UNIQUE,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES agents(id),
    FOREIGN KEY (market_id) REFERENCES markets(id)
  );
`);

// Create user_stakes table for wallet-based staking (frontend)
db.exec(`
  CREATE TABLE IF NOT EXISTS user_stakes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_address TEXT NOT NULL,
    market_id INTEGER NOT NULL,
    position TEXT CHECK(position IN ('YES', 'NO')),
    amount TEXT NOT NULL,
    tx_hash TEXT UNIQUE,
    status TEXT DEFAULT 'active',
    claimed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (market_id) REFERENCES markets(id)
  );
`);
// Index for wallet-based queries
try { db.exec('CREATE INDEX idx_user_stakes_wallet ON user_stakes(wallet_address)'); } catch (e) {}
try { db.exec('CREATE INDEX idx_user_stakes_market ON user_stakes(market_id)'); } catch (e) {}

// Create research table
db.exec(`
  CREATE TABLE IF NOT EXISTS research (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    summary TEXT,
    content TEXT NOT NULL,
    category TEXT CHECK(category IN ('crypto', 'ai_agi', 'geopolitics', 'tech', 'moltbook', 'economics')),
    tags TEXT,
    moltbook_post_id TEXT,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published')),
    author_agent_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_agent_id) REFERENCES agents(id)
  );
`);

// Create research-markets junction table
db.exec(`
  CREATE TABLE IF NOT EXISTS research_markets (
    research_id INTEGER NOT NULL,
    market_id INTEGER NOT NULL,
    PRIMARY KEY (research_id, market_id),
    FOREIGN KEY (research_id) REFERENCES research(id),
    FOREIGN KEY (market_id) REFERENCES markets(id)
  );
`);

// Health history tracking — store daily snapshots
db.exec(`
  CREATE TABLE IF NOT EXISTS health_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    service TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'operational',
    latency_ms INTEGER,
    checked_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, service)
  );
`);

// Safe schema migration — add columns if they don't exist
const migrationColumns = [
  ['agents', 'moltbook_username', 'TEXT'],
  ['agents', 'verification_code', 'TEXT'],
  ['agents', 'verified_at', 'TEXT'],
];
for (const [table, col, type] of migrationColumns) {
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`);
  } catch (e) {
    // Column already exists — ignore
  }
}

// Generate API key
function generateApiKey() {
  return 'clawshi_' + randomBytes(24).toString('hex');
}

// Generate verification code
function generateVerificationCode() {
  return 'CLAWSHI-VERIFY-' + randomBytes(8).toString('hex');
}

// Build verification post template
function buildVerificationTemplate(code, agentName) {
  return `🔐 Clawshi Verification

I am verifying ownership of this Moltbook account for Clawshi (clawshi.app), the prediction market intelligence platform powered by Moltbook community data.

Verification Code: ${code}

By completing this verification, I confirm that this Moltbook account is linked to my Clawshi agent profile "${agentName}". As a verified agent, I contribute to the sentiment analysis and prediction accuracy of the Clawshi ecosystem.

Learn more: https://clawshi.app/join`;
}

// Check Moltbook user posts for verification code via API
async function checkMoltbookForCode(username, verificationCode) {
  const url = `https://www.moltbook.com/api/v1/agents/profile?name=${encodeURIComponent(username)}`;
  const res = await fetch(url, {
    headers: {
      'Referer': `https://www.moltbook.com/u/${username}`,
      'User-Agent': 'Mozilla/5.0 (compatible; Clawshi/1.0)'
    }
  });
  const data = await res.json();
  if (!data.success || !data.recentPosts) return false;
  return data.recentPosts.some(post =>
    (post.title && post.title.includes(verificationCode)) ||
    (post.content && post.content.includes(verificationCode))
  );
}

// Auth middleware — returns agent row or null
function authenticateAgent(req) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const key = auth.slice(7);
  return db.prepare('SELECT * FROM agents WHERE api_key = ?').get(key) || null;
}

// Helper to send JSON response
function sendJSON(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(data, null, 2));
}

// Helper to parse URL
function parseURL(url) {
  const [path, queryString] = url.split('?');
  const params = new URLSearchParams(queryString || '');
  return { path, params };
}

// Route handlers
const routes = {
  // GET / - API info
  '/': (req, res) => {
    sendJSON(res, {
      name: 'ClawdPredict API',
      version: '1.0.0',
      description: 'Prediction market based on Moltbook posts sentiment analysis',
      endpoints: {
        '/': 'API information',
        '/markets': 'List all prediction markets',
        '/markets/:id': 'Get specific market details',
        '/markets/:id/stakes': 'Get market stake pools (YES/NO totals)',
        '/topics': 'List all topics with post counts',
        '/topics/:topic': 'Get topic details with posts and opinions',
        '/stats': 'Database statistics',
        '/contract': 'Smart contract info (address, ABI, chain)',
        '/user/:address/positions': 'User positions by wallet address',
        '/user/:address/history': 'User transaction history by wallet',
        '/user/stake': 'Record a stake (POST)',
        '/user/claim': 'Mark stake as claimed (POST)',
        '/wallet/register': 'Register wallet address (auth required)',
        '/stakes/my': 'My USDC stake positions (auth required)',
        '/stakes/market/:id': 'Stakes on a market',
        '/admin/resolve/:id': 'Resolve market outcome (admin)'
      },
      source: 'Moltbook (https://www.moltbook.com)'
    });
  },

  // GET /markets - List all markets
  '/markets': (req, res) => {
    const markets = db.prepare(`
      SELECT
        id,
        question,
        description,
        category,
        resolution_date,
        yes_probability,
        no_probability,
        total_opinions,
        status,
        created_at
      FROM markets
      ORDER BY total_opinions DESC
    `).all();

    sendJSON(res, {
      success: true,
      count: markets.length,
      markets: markets.map(m => ({
        id: m.id,
        question: m.question,
        description: m.description,
        category: m.category,
        resolution_date: m.resolution_date,
        probabilities: {
          yes: Math.round(m.yes_probability * 10) / 10,
          no: Math.round(m.no_probability * 10) / 10
        },
        total_opinions: m.total_opinions,
        status: m.status,
        created_at: m.created_at,
        url: `/markets/${m.id}`
      }))
    });
  },

  // GET /topics - List all topics
  '/topics': (req, res) => {
    const topics = db.prepare(`
      SELECT
        submolt_name as topic,
        COUNT(*) as post_count,
        SUM(upvotes) as total_upvotes,
        SUM(comment_count) as total_comments,
        COUNT(DISTINCT author_name) as unique_authors
      FROM posts
      WHERE submolt_name IS NOT NULL
      GROUP BY submolt_name
      ORDER BY post_count DESC
      LIMIT 20
    `).all();

    // Also get category-based topics from content analysis
    const categories = {
      crypto: { keywords: ['bitcoin', 'btc', 'eth', 'crypto', 'token', 'solana'], posts: 0 },
      ai_agi: { keywords: ['agi', 'gpt', 'openai', 'anthropic', 'claude', 'singularity'], posts: 0 },
      geopolitics: { keywords: ['war', 'russia', 'ukraine', 'china', 'iran', 'israel'], posts: 0 },
      tech: { keywords: ['apple', 'google', 'meta', 'microsoft', 'tesla'], posts: 0 },
      moltbook: { keywords: ['moltbook', 'agent', 'claw', 'molt', 'molty'], posts: 0 }
    };

    const allPosts = db.prepare('SELECT title, content FROM posts').all();
    for (const post of allPosts) {
      const text = `${post.title} ${post.content || ''}`.toLowerCase();
      for (const [cat, config] of Object.entries(categories)) {
        if (config.keywords.some(k => text.includes(k))) {
          config.posts++;
        }
      }
    }

    sendJSON(res, {
      success: true,
      submolts: topics,
      categories: Object.entries(categories).map(([name, data]) => ({
        name,
        post_count: data.posts,
        url: `/topics/${name}`
      }))
    });
  },

  // GET /leaderboard - Agent leaderboard
  '/leaderboard': (req, res) => {
    const agents = db.prepare(`
      SELECT
        v.author_name,
        MAX(v.author_karma) as karma,
        COUNT(*) as vote_count,
        COUNT(DISTINCT v.market_id) as markets_participated,
        ROUND(AVG(v.confidence) * 100) as avg_confidence,
        SUM(CASE WHEN v.vote = 'YES' THEN 1 ELSE 0 END) as yes_votes,
        SUM(CASE WHEN v.vote = 'NO' THEN 1 ELSE 0 END) as no_votes,
        SUM(v.upvotes) as total_upvotes,
        MAX(v.created_at) as last_active
      FROM votes v
      WHERE v.author_name IS NOT NULL
      GROUP BY v.author_name
      ORDER BY MAX(v.author_karma) DESC
    `).all();

    // Get avatars
    const avatars = db.prepare(`
      SELECT author_name, avatar_url, x_handle FROM agent_avatars
    `).all();
    const avatarMap = {};
    for (const row of avatars) {
      avatarMap[row.author_name] = { avatar_url: row.avatar_url, x_handle: row.x_handle };
    }

    // Get category breakdown per agent
    const categoryBreakdown = db.prepare(`
      SELECT
        v.author_name,
        m.category,
        COUNT(*) as count
      FROM votes v
      JOIN markets m ON v.market_id = m.id
      WHERE v.author_name IS NOT NULL
      GROUP BY v.author_name, m.category
    `).all();

    // Group categories by author
    const categoriesByAuthor = {};
    for (const row of categoryBreakdown) {
      if (!categoriesByAuthor[row.author_name]) {
        categoriesByAuthor[row.author_name] = [];
      }
      categoriesByAuthor[row.author_name].push({
        category: row.category,
        count: row.count
      });
    }

    // Sort each author's categories by count desc, take top one as "favorite"
    for (const author of Object.keys(categoriesByAuthor)) {
      categoriesByAuthor[author].sort((a, b) => b.count - a.count);
    }

    // Get verified agents (cross-reference with agents table)
    const verifiedAgents = db.prepare(
      'SELECT moltbook_username FROM agents WHERE verified = 1 AND moltbook_username IS NOT NULL'
    ).all();
    const verifiedSet = new Set(verifiedAgents.map(a => a.moltbook_username));

    sendJSON(res, {
      success: true,
      total_agents: agents.length,
      leaderboard: agents.map((a, i) => ({
        rank: i + 1,
        author: a.author_name,
        karma: a.karma,
        vote_count: a.vote_count,
        markets_participated: a.markets_participated,
        avg_confidence: a.avg_confidence,
        yes_votes: a.yes_votes,
        no_votes: a.no_votes,
        total_upvotes: a.total_upvotes,
        last_active: a.last_active,
        avatar_url: avatarMap[a.author_name]?.avatar_url || null,
        x_handle: avatarMap[a.author_name]?.x_handle || null,
        verified: verifiedSet.has(a.author_name),
        favorite_category: categoriesByAuthor[a.author_name]?.[0]?.category || 'unknown',
        categories: categoriesByAuthor[a.author_name] || []
      }))
    });
  },

  // GET /contract - Smart contract info for USDC staking
  '/contract': (req, res) => {
    sendJSON(res, {
      success: true,
      contract: {
        address: CONTRACT_ADDRESS,
        deployed: !!CONTRACT_ADDRESS,
        chain: {
          id: CHAIN_ID,
          name: CHAIN_NAME,
          rpc: RPC_URL
        },
        usdc: USDC_ADDRESS,
        abi: CONTRACT_ABI
      },
      instructions: {
        step1: 'Get testnet USDC from https://faucet.circle.com (select Base Sepolia)',
        step2: 'Approve USDC spending: usdc.approve(contractAddress, amount)',
        step3: 'Stake on a market: contract.stake(marketIndex, isYes, amount)',
        step4: 'After resolution, claim winnings: contract.claim(marketIndex)'
      }
    });
  },

  // GET /health - System health check
  '/health': async (req, res) => {
    const start = Date.now();
    const services = {};

    // Check database
    try {
      const dbStart = Date.now();
      const marketCount = db.prepare('SELECT COUNT(*) as count FROM markets').get();
      const agentCount = db.prepare('SELECT COUNT(*) as count FROM agents').get();
      const researchCount = db.prepare('SELECT COUNT(*) as count FROM research').get();
      const voteCount = db.prepare('SELECT COUNT(*) as count FROM votes').get();
      services.database = {
        status: 'operational',
        latency_ms: Date.now() - dbStart
      };
      services.markets = { status: 'operational', count: marketCount.count };
      services.research = { status: 'operational', count: researchCount.count };
      services.agents = { status: 'operational', count: agentCount.count };
      services.votes = { status: 'operational', count: voteCount.count };
    } catch (e) {
      services.database = { status: 'down', error: 'Database query failed' };
      services.markets = { status: 'down' };
      services.research = { status: 'down' };
      services.agents = { status: 'down' };
      services.votes = { status: 'down' };
    }

    // Check Moltbook API endpoints
    const moltbookChecks = [
      { key: 'mb_recent_agents', url: 'https://www.moltbook.com/api/v1/agents/recent?limit=1&sort=recent' },
      { key: 'mb_new_posts', url: 'https://www.moltbook.com/api/v1/posts?limit=1&sort=new' },
      { key: 'mb_top_posts', url: 'https://www.moltbook.com/api/v1/posts?limit=1&sort=top&time=day' },
      { key: 'mb_top_humans', url: 'https://www.moltbook.com/api/v1/agents/top-humans?limit=1' },
    ];
    await Promise.all(moltbookChecks.map(async ({ key, url }) => {
      try {
        const mbStart = Date.now();
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const mbRes = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        services[key] = {
          status: mbRes.ok ? 'operational' : 'degraded',
          latency_ms: Date.now() - mbStart
        };
      } catch (e) {
        services[key] = { status: 'down', error: 'Connection failed' };
      }
    }));

    // Overall status
    const statuses = Object.values(services).map(s => s.status);
    let overall = 'operational';
    if (statuses.includes('down') && services.database?.status === 'down') {
      overall = 'down';
    } else if (statuses.includes('down') || statuses.includes('degraded')) {
      overall = 'degraded';
    }

    // Record hourly status per service (date = YYYY-MM-DD-HH)
    const now2 = new Date();
    const hour = now2.toISOString().slice(0, 13).replace('T', '-'); // "2026-02-04-11"
    const upsert = db.prepare(`
      INSERT INTO health_history (date, service, status, latency_ms)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(date, service) DO UPDATE SET
        status = excluded.status,
        latency_ms = excluded.latency_ms,
        checked_at = CURRENT_TIMESTAMP
    `);
    for (const [svc, info] of Object.entries(services)) {
      upsert.run(hour, svc, info.status, info.latency_ms ?? null);
    }

    sendJSON(res, {
      success: true,
      status: overall,
      uptime_seconds: Math.floor(process.uptime()),
      services,
      timestamp: new Date().toISOString()
    });
  },

  // GET /health/history - hourly health history per service (default 7 days = 168 hours)
  '/health/history': (req, res) => {
    const { params } = parseURL(req.url);
    const days = Math.min(parseInt(params.get('days') || '7', 10), 30);
    const sinceMs = Date.now() - days * 86400000;
    const sinceHour = new Date(sinceMs).toISOString().slice(0, 13).replace('T', '-');

    const rows = db.prepare(`
      SELECT date, service, status, latency_ms
      FROM health_history
      WHERE date >= ?
      ORDER BY date ASC
    `).all(sinceHour);

    // Group by service
    const history = {};
    for (const row of rows) {
      if (!history[row.service]) history[row.service] = [];
      history[row.service].push({
        date: row.date,
        status: row.status,
        latency_ms: row.latency_ms
      });
    }

    // Fill missing hours with 'no_data'
    const allServices = ['database', 'markets', 'research', 'agents', 'votes', 'mb_recent_agents', 'mb_new_posts', 'mb_top_posts', 'mb_top_humans'];
    const hourList = [];
    for (let t = new Date(sinceMs); t <= new Date(); t.setHours(t.getHours() + 1)) {
      hourList.push(t.toISOString().slice(0, 13).replace('T', '-'));
    }

    for (const svc of allServices) {
      const existing = new Set((history[svc] || []).map(h => h.date));
      if (!history[svc]) history[svc] = [];
      for (const hour of hourList) {
        if (!existing.has(hour)) {
          history[svc].push({ date: hour, status: 'no_data', latency_ms: null });
        }
      }
      history[svc].sort((a, b) => a.date.localeCompare(b.date));
    }

    sendJSON(res, {
      success: true,
      days,
      since: sinceHour,
      services: history
    });
  },

  // GET /stats - Database statistics
  '/stats': (req, res) => {
    const postStats = db.prepare(`
      SELECT
        COUNT(*) as total_posts,
        COUNT(DISTINCT author_name) as unique_authors,
        SUM(upvotes) as total_upvotes,
        SUM(downvotes) as total_downvotes,
        SUM(comment_count) as total_comments,
        MIN(created_at) as oldest_post,
        MAX(created_at) as newest_post
      FROM posts
    `).get();

    const marketStats = db.prepare(`
      SELECT
        COUNT(*) as total_markets,
        AVG(yes_probability) as avg_yes_probability,
        SUM(total_opinions) as total_opinions_analyzed
      FROM markets
    `).get();

    const voteContributors = db.prepare(`
      SELECT COUNT(DISTINCT author_name) as count
      FROM votes
      WHERE author_name IS NOT NULL
    `).get();

    const topAuthors = db.prepare(`
      SELECT
        author_name,
        author_karma,
        COUNT(*) as post_count,
        SUM(upvotes) as total_upvotes
      FROM posts
      WHERE author_name IS NOT NULL
      GROUP BY author_name
      ORDER BY total_upvotes DESC
      LIMIT 10
    `).all();

    sendJSON(res, {
      success: true,
      posts: postStats,
      markets: marketStats,
      vote_contributors: voteContributors.count,
      top_authors: topAuthors,
      generated_at: new Date().toISOString()
    });
  },

  // GET /research - List all published research
  '/research': (req, res) => {
    const { params } = parseURL(req.url);
    const category = params.get('category');
    const sort = params.get('sort') || 'newest';

    let sql = `
      SELECT id, title, summary, category, tags, moltbook_post_id, status, created_at, updated_at
      FROM research
      WHERE status = 'published'
    `;
    const sqlParams = [];

    if (category) {
      sql += ' AND category = ?';
      sqlParams.push(category);
    }

    sql += sort === 'oldest' ? ' ORDER BY created_at ASC' : ' ORDER BY created_at DESC';

    const articles = db.prepare(sql).all(...sqlParams);

    const getMarketIds = db.prepare('SELECT market_id FROM research_markets WHERE research_id = ?');
    const result = articles.map(a => ({
      ...a,
      tags: (() => { try { return a.tags ? JSON.parse(a.tags) : []; } catch { return []; } })(),
      suggested_market_ids: getMarketIds.all(a.id).map(r => r.market_id)
    }));

    sendJSON(res, {
      success: true,
      count: result.length,
      research: result
    });
  }
};

// Dynamic route handlers
function handleDynamicRoutes(path, req, res) {
  // GET /markets/:id
  const marketMatch = path.match(/^\/markets\/(\d+)$/);
  if (marketMatch) {
    const marketId = marketMatch[1];
    const market = db.prepare('SELECT * FROM markets WHERE id = ?').get(marketId);

    if (!market) {
      return sendJSON(res, { success: false, error: 'Market not found' }, 404);
    }

    // Get votes for this market
    const votes = db.prepare(`
      SELECT * FROM votes
      WHERE market_id = ?
      ORDER BY
        CASE vote WHEN 'YES' THEN 1 WHEN 'NO' THEN 2 ELSE 3 END,
        upvotes DESC
    `).all(marketId);

    const yesVotes = votes.filter(v => v.vote === 'YES');
    const noVotes = votes.filter(v => v.vote === 'NO');
    const abstainVotes = votes.filter(v => v.vote === 'ABSTAIN');

    return sendJSON(res, {
      success: true,
      market: {
        id: market.id,
        question: market.question,
        description: market.description,
        category: market.category,
        resolution_date: market.resolution_date,
        probabilities: {
          yes: Math.round(market.yes_probability * 10) / 10,
          no: Math.round(market.no_probability * 10) / 10
        },
        total_votes: yesVotes.length + noVotes.length,
        total_posts_analyzed: votes.length,
        status: market.status,
        created_at: market.created_at
      },
      vote_summary: {
        yes: {
          count: yesVotes.length,
          percentage: Math.round(market.yes_probability * 10) / 10
        },
        no: {
          count: noVotes.length,
          percentage: Math.round(market.no_probability * 10) / 10
        },
        abstain: {
          count: abstainVotes.length
        }
      },
      votes: {
        yes: yesVotes.slice(0, 20).map(v => ({
          post_id: v.post_id,
          author: v.author_name,
          karma: v.author_karma,
          vote: '✅ YES',
          confidence: Math.round(v.confidence * 100) + '%',
          reasoning: v.reasoning,
          title: v.post_title,
          excerpt: v.post_excerpt,
          upvotes: v.upvotes,
          created_at: v.created_at
        })),
        no: noVotes.slice(0, 20).map(v => ({
          post_id: v.post_id,
          author: v.author_name,
          karma: v.author_karma,
          vote: '❌ NO',
          confidence: Math.round(v.confidence * 100) + '%',
          reasoning: v.reasoning,
          title: v.post_title,
          excerpt: v.post_excerpt,
          upvotes: v.upvotes,
          created_at: v.created_at
        }))
      }
    });
  }

  // GET /markets/:id/history - Probability time series
  const historyMatch = path.match(/^\/markets\/(\d+)\/history$/);
  if (historyMatch) {
    const marketId = historyMatch[1];
    const market = db.prepare('SELECT * FROM markets WHERE id = ?').get(marketId);

    if (!market) {
      return sendJSON(res, { success: false, error: 'Market not found' }, 404);
    }

    // Get all votes ordered by creation time (nulls first, then by date)
    const votes = db.prepare(`
      SELECT vote, confidence, created_at
      FROM votes
      WHERE market_id = ? AND vote IN ('YES', 'NO')
      ORDER BY
        CASE WHEN created_at IS NULL THEN 0 ELSE 1 END,
        created_at ASC
    `).all(marketId);

    // Build cumulative time series
    let yesCount = 0;
    let noCount = 0;
    const history = [];
    const marketCreated = market.created_at || new Date().toISOString();

    // For votes with null timestamps, spread them between market creation
    // and the first real timestamp (or now if none exist)
    const firstReal = votes.find(v => v.created_at);
    const nullVotes = votes.filter(v => !v.created_at);
    const endTime = firstReal ? new Date(firstReal.created_at).getTime() : Date.now();
    const startTime = new Date(marketCreated).getTime();
    const gap = nullVotes.length > 0 ? (endTime - startTime) / (nullVotes.length + 1) : 0;

    // Assign synthetic timestamps to null votes
    let nullIdx = 0;
    const processedVotes = votes.map(v => {
      if (!v.created_at) {
        nullIdx++;
        return { ...v, created_at: new Date(startTime + gap * nullIdx).toISOString() };
      }
      return v;
    });

    // Add initial point at market creation
    history.push({
      timestamp: marketCreated,
      yes: 50,
      no: 50,
      totalVotes: 0
    });

    for (const v of processedVotes) {
      if (v.vote === 'YES') yesCount++;
      else if (v.vote === 'NO') noCount++;
      const total = yesCount + noCount;
      if (total > 0) {
        history.push({
          timestamp: v.created_at,
          yes: Math.round((yesCount / total) * 1000) / 10,
          no: Math.round((noCount / total) * 1000) / 10,
          totalVotes: total
        });
      }
    }

    return sendJSON(res, {
      success: true,
      market_id: Number(marketId),
      question: market.question,
      data_points: history.length,
      history
    });
  }

  // GET /topics/:topic
  const topicMatch = path.match(/^\/topics\/([a-z_]+)$/);
  if (topicMatch) {
    const topic = topicMatch[1];

    const keywords = {
      crypto: ['bitcoin', 'btc', 'eth', 'ethereum', 'crypto', 'token', 'solana', 'price', 'pump', 'dump'],
      ai_agi: ['agi', 'gpt', 'openai', 'anthropic', 'claude', 'singularity', 'consciousness', 'sentient'],
      geopolitics: ['war', 'russia', 'ukraine', 'china', 'taiwan', 'iran', 'israel', 'ceasefire', 'conflict'],
      tech: ['apple', 'google', 'meta', 'microsoft', 'tesla', 'spacex', 'launch', 'release'],
      moltbook: ['moltbook', 'agent', 'claw', 'molt', 'submolt', 'karma', 'molty']
    };

    if (!keywords[topic]) {
      return sendJSON(res, { success: false, error: 'Topic not found', available_topics: Object.keys(keywords) }, 404);
    }

    // Get posts matching topic keywords
    const allPosts = db.prepare(`
      SELECT id, title, content, author_name, author_karma, upvotes, downvotes, comment_count, created_at
      FROM posts
      ORDER BY upvotes DESC
    `).all();

    const topicPosts = allPosts.filter(post => {
      const text = `${post.title} ${post.content || ''}`.toLowerCase();
      return keywords[topic].some(k => text.includes(k));
    }).slice(0, 50);

    // Get related market
    const relatedMarket = db.prepare('SELECT * FROM markets WHERE category = ?').get(topic);

    // Analyze opinions
    const opinions = topicPosts.map(post => {
      const text = `${post.title} ${post.content || ''}`.toLowerCase();
      const positive = ['will', 'going to', 'expect', 'believe', 'confident', 'bullish', 'likely', 'yes', 'optimistic'].filter(w => text.includes(w)).length;
      const negative = ['won\'t', 'never', 'doubt', 'unlikely', 'bearish', 'no way', 'fail', 'crash', 'pessimistic'].filter(w => text.includes(w)).length;

      return {
        post_id: post.id,
        author: post.author_name,
        author_karma: post.author_karma,
        title: post.title,
        excerpt: post.content?.substring(0, 300) + (post.content?.length > 300 ? '...' : ''),
        upvotes: post.upvotes,
        downvotes: post.downvotes,
        comments: post.comment_count,
        sentiment: positive > negative ? 'bullish' : negative > positive ? 'bearish' : 'neutral',
        confidence: Math.min((positive + negative) / 3, 1),
        created_at: post.created_at
      };
    });

    const sentimentSummary = {
      bullish: opinions.filter(o => o.sentiment === 'bullish').length,
      bearish: opinions.filter(o => o.sentiment === 'bearish').length,
      neutral: opinions.filter(o => o.sentiment === 'neutral').length
    };

    const avgSentiment = sentimentSummary.bullish / (sentimentSummary.bullish + sentimentSummary.bearish + 0.01);

    return sendJSON(res, {
      success: true,
      topic: {
        name: topic,
        keywords: keywords[topic],
        total_posts: topicPosts.length,
        sentiment_score: Math.round(avgSentiment * 100),
        sentiment_label: avgSentiment > 0.6 ? 'Bullish' : avgSentiment < 0.4 ? 'Bearish' : 'Neutral'
      },
      related_market: relatedMarket ? {
        id: relatedMarket.id,
        question: relatedMarket.question,
        yes_probability: Math.round(relatedMarket.yes_probability * 10) / 10,
        url: `/markets/${relatedMarket.id}`
      } : null,
      sentiment_summary: sentimentSummary,
      opinions: opinions,
      top_authors: [...new Map(opinions.map(o => [o.author, o])).values()]
        .sort((a, b) => b.author_karma - a.author_karma)
        .slice(0, 10)
        .map(o => ({ author: o.author, karma: o.author_karma }))
    });
  }

  return null;
}

// Helper to read request body
async function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

// Agent & data routes
async function handleAgentRoutes(path, req, res) {
  // POST /agents/register — public
  if (path === '/agents/register' && req.method === 'POST') {
    const body = await readBody(req);
    const { name, description, x_handle } = body;

    if (!name || typeof name !== 'string') {
      return sendJSON(res, { success: false, error: 'Name is required' }, 400);
    }
    const trimmed = name.trim();
    if (trimmed.length < 3 || trimmed.length > 30) {
      return sendJSON(res, { success: false, error: 'Name must be 3-30 characters' }, 400);
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      return sendJSON(res, { success: false, error: 'Name must be alphanumeric (a-z, 0-9, underscore)' }, 400);
    }

    const existing = db.prepare('SELECT id FROM agents WHERE name = ?').get(trimmed);
    if (existing) {
      return sendJSON(res, { success: false, error: 'Agent name already taken' }, 409);
    }

    const apiKey = generateApiKey();
    db.prepare('INSERT INTO agents (name, description, api_key, x_handle) VALUES (?, ?, ?, ?)').run(
      trimmed,
      description || null,
      apiKey,
      x_handle || null
    );

    return sendJSON(res, {
      success: true,
      agent: {
        name: trimmed,
        api_key: apiKey,
        created_at: new Date().toISOString()
      }
    }, 201);
  }

  // GET /agents/me — requires auth
  if (path === '/agents/me' && req.method === 'GET') {
    const agent = authenticateAgent(req);
    if (!agent) return sendJSON(res, { success: false, error: 'Unauthorized' }, 401);
    return sendJSON(res, {
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        description: agent.description,
        x_handle: agent.x_handle,
        verified: !!agent.verified,
        moltbook_username: agent.moltbook_username || null,
        verification_code: agent.verification_code || null,
        verified_at: agent.verified_at || null,
        created_at: agent.created_at
      }
    });
  }

  // POST /agents/verify/start — generate verification code
  if (path === '/agents/verify/start' && req.method === 'POST') {
    const agent = authenticateAgent(req);
    if (!agent) return sendJSON(res, { success: false, error: 'Unauthorized' }, 401);

    if (agent.verified) {
      return sendJSON(res, { success: false, error: 'Agent is already verified' }, 400);
    }

    const body = await readBody(req);
    const { moltbook_username } = body;

    if (!moltbook_username || typeof moltbook_username !== 'string') {
      return sendJSON(res, { success: false, error: 'Moltbook username is required' }, 400);
    }
    const trimmed = moltbook_username.trim();
    if (trimmed.length < 2 || trimmed.length > 30) {
      return sendJSON(res, { success: false, error: 'Username must be 2-30 characters' }, 400);
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      return sendJSON(res, { success: false, error: 'Username must be alphanumeric (a-z, 0-9, underscore, hyphen)' }, 400);
    }

    const code = generateVerificationCode();
    const template = buildVerificationTemplate(code, agent.name);

    db.prepare('UPDATE agents SET moltbook_username = ?, verification_code = ? WHERE id = ?').run(
      trimmed, code, agent.id
    );

    return sendJSON(res, {
      success: true,
      verification_code: code,
      post_template: template,
      moltbook_username: trimmed
    });
  }

  // POST /agents/verify/check — scrape moltbook and check for code
  if (path === '/agents/verify/check' && req.method === 'POST') {
    const agent = authenticateAgent(req);
    if (!agent) return sendJSON(res, { success: false, error: 'Unauthorized' }, 401);

    if (agent.verified) {
      return sendJSON(res, { success: true, verified: true, message: 'Already verified' });
    }

    if (!agent.moltbook_username || !agent.verification_code) {
      return sendJSON(res, { success: false, error: 'Start verification first with POST /agents/verify/start' }, 400);
    }

    try {
      const found = await checkMoltbookForCode(agent.moltbook_username, agent.verification_code);

      if (found) {
        const now = new Date().toISOString();
        db.prepare('UPDATE agents SET verified = 1, verified_at = ? WHERE id = ?').run(now, agent.id);
        return sendJSON(res, {
          success: true,
          verified: true,
          message: 'Verification successful! Your Moltbook account is now linked.'
        });
      } else {
        return sendJSON(res, {
          success: true,
          verified: false,
          message: 'Verification code not found on your Moltbook profile. Make sure you posted the template and try again.'
        });
      }
    } catch (err) {
      console.error('Moltbook fetch error:', err.message);
      return sendJSON(res, {
        success: false,
        error: 'Failed to fetch Moltbook profile. Please try again later.'
      }, 502);
    }
  }

  // === Data endpoints (all require auth) ===

  // GET /data/markets
  if (path === '/data/markets' && req.method === 'GET') {
    const agent = authenticateAgent(req);
    if (!agent) return sendJSON(res, { success: false, error: 'Unauthorized' }, 401);

    const markets = db.prepare(`
      SELECT id, question, description, category, resolution_date,
             yes_probability, no_probability, total_opinions, status, created_at
      FROM markets ORDER BY total_opinions DESC
    `).all();

    return sendJSON(res, {
      success: true,
      count: markets.length,
      markets: markets.map(m => ({
        id: m.id,
        question: m.question,
        description: m.description,
        category: m.category,
        resolution_date: m.resolution_date,
        probabilities: {
          yes: Math.round(m.yes_probability * 10) / 10,
          no: Math.round(m.no_probability * 10) / 10
        },
        total_opinions: m.total_opinions,
        status: m.status,
        created_at: m.created_at
      }))
    });
  }

  // GET /data/markets/:id/history
  const dataHistoryMatch = path.match(/^\/data\/markets\/(\d+)\/history$/);
  if (dataHistoryMatch && req.method === 'GET') {
    const agent = authenticateAgent(req);
    if (!agent) return sendJSON(res, { success: false, error: 'Unauthorized' }, 401);

    // Reuse the public history logic
    const marketId = dataHistoryMatch[1];
    const market = db.prepare('SELECT * FROM markets WHERE id = ?').get(marketId);
    if (!market) return sendJSON(res, { success: false, error: 'Market not found' }, 404);

    const votes = db.prepare(`
      SELECT vote, confidence, created_at FROM votes
      WHERE market_id = ? AND vote IN ('YES', 'NO')
      ORDER BY CASE WHEN created_at IS NULL THEN 0 ELSE 1 END, created_at ASC
    `).all(marketId);

    let yesCount = 0, noCount = 0;
    const history = [{ timestamp: market.created_at, yes: 50, no: 50, totalVotes: 0 }];
    for (const v of votes) {
      if (v.vote === 'YES') yesCount++;
      else if (v.vote === 'NO') noCount++;
      const total = yesCount + noCount;
      if (total > 0) {
        history.push({
          timestamp: v.created_at || market.created_at,
          yes: Math.round((yesCount / total) * 1000) / 10,
          no: Math.round((noCount / total) * 1000) / 10,
          totalVotes: total
        });
      }
    }

    return sendJSON(res, { success: true, market_id: Number(marketId), history });
  }

  // GET /data/signals — aggregated sentiment signals
  if (path === '/data/signals' && req.method === 'GET') {
    const agent = authenticateAgent(req);
    if (!agent) return sendJSON(res, { success: false, error: 'Unauthorized' }, 401);

    const markets = db.prepare(`
      SELECT id, question, category, yes_probability, no_probability, total_opinions, status
      FROM markets WHERE status = 'active' ORDER BY total_opinions DESC
    `).all();

    const signals = markets.map(m => {
      const yp = m.yes_probability;
      let strength = 'neutral';
      if (yp >= 70) strength = 'strong_yes';
      else if (yp >= 55) strength = 'lean_yes';
      else if (yp <= 30) strength = 'strong_no';
      else if (yp <= 45) strength = 'lean_no';

      return {
        market_id: m.id,
        question: m.question,
        category: m.category,
        signal: strength,
        yes_probability: Math.round(yp * 10) / 10,
        no_probability: Math.round(m.no_probability * 10) / 10,
        confidence_votes: m.total_opinions
      };
    });

    return sendJSON(res, { success: true, count: signals.length, signals });
  }

  // === USDC Staking endpoints ===

  // POST /wallet/register — register agent's wallet address
  if (path === '/wallet/register' && req.method === 'POST') {
    const agent = authenticateAgent(req);
    if (!agent) return sendJSON(res, { success: false, error: 'Unauthorized' }, 401);

    const body = await readBody(req);
    const { wallet_address } = body;

    if (!wallet_address || typeof wallet_address !== 'string') {
      return sendJSON(res, { success: false, error: 'wallet_address is required' }, 400);
    }
    const addr = wallet_address.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) {
      return sendJSON(res, { success: false, error: 'Invalid Ethereum address format' }, 400);
    }

    db.prepare(`
      INSERT INTO agent_wallets (agent_id, wallet_address) VALUES (?, ?)
      ON CONFLICT(agent_id) DO UPDATE SET wallet_address = excluded.wallet_address
    `).run(agent.id, addr.toLowerCase());

    return sendJSON(res, {
      success: true,
      wallet: {
        agent_id: agent.id,
        agent_name: agent.name,
        wallet_address: addr.toLowerCase()
      }
    });
  }

  // GET /stakes/my — agent's active stake positions
  if (path === '/stakes/my' && req.method === 'GET') {
    const agent = authenticateAgent(req);
    if (!agent) return sendJSON(res, { success: false, error: 'Unauthorized' }, 401);

    const stakes = db.prepare(`
      SELECT s.*, m.question, m.status as market_status, m.yes_probability, m.no_probability
      FROM stakes s
      JOIN markets m ON s.market_id = m.id
      WHERE s.agent_id = ?
      ORDER BY s.created_at DESC
    `).all(agent.id);

    const wallet = db.prepare('SELECT wallet_address FROM agent_wallets WHERE agent_id = ?').get(agent.id);

    return sendJSON(res, {
      success: true,
      wallet_address: wallet?.wallet_address || null,
      count: stakes.length,
      stakes: stakes.map(s => ({
        id: s.id,
        market_id: s.market_id,
        question: s.question,
        position: s.position,
        amount: s.amount,
        tx_hash: s.tx_hash,
        status: s.status,
        market_status: s.market_status,
        current_odds: {
          yes: Math.round(s.yes_probability * 10) / 10,
          no: Math.round(s.no_probability * 10) / 10
        },
        created_at: s.created_at
      }))
    });
  }

  // GET /stakes/market/:id — all stakes on a market
  const stakesMarketMatch = path.match(/^\/stakes\/market\/(\d+)$/);
  if (stakesMarketMatch && req.method === 'GET') {
    const marketId = Number(stakesMarketMatch[1]);
    const market = db.prepare('SELECT * FROM markets WHERE id = ?').get(marketId);
    if (!market) return sendJSON(res, { success: false, error: 'Market not found' }, 404);

    const stakes = db.prepare(`
      SELECT s.position, s.amount, s.tx_hash, s.created_at,
             a.name as agent_name, w.wallet_address
      FROM stakes s
      JOIN agents a ON s.agent_id = a.id
      LEFT JOIN agent_wallets w ON s.agent_id = w.agent_id
      WHERE s.market_id = ?
      ORDER BY CAST(s.amount AS REAL) DESC
    `).all(marketId);

    const yesTotal = stakes.filter(s => s.position === 'YES').reduce((sum, s) => sum + Number(s.amount), 0);
    const noTotal = stakes.filter(s => s.position === 'NO').reduce((sum, s) => sum + Number(s.amount), 0);

    return sendJSON(res, {
      success: true,
      market_id: marketId,
      question: market.question,
      pool: {
        yes: yesTotal.toString(),
        no: noTotal.toString(),
        total: (yesTotal + noTotal).toString()
      },
      stakes: stakes.map(s => ({
        agent: s.agent_name,
        wallet: s.wallet_address,
        position: s.position,
        amount: s.amount,
        tx_hash: s.tx_hash,
        created_at: s.created_at
      }))
    });
  }

  // POST /stakes/market/:id — record a stake (after on-chain tx)
  if (stakesMarketMatch && req.method === 'POST') {
    const agent = authenticateAgent(req);
    if (!agent) return sendJSON(res, { success: false, error: 'Unauthorized' }, 401);

    const marketId = Number(stakesMarketMatch[1]);
    const market = db.prepare('SELECT * FROM markets WHERE id = ?').get(marketId);
    if (!market) return sendJSON(res, { success: false, error: 'Market not found' }, 404);

    const body = await readBody(req);
    const { position, amount, tx_hash } = body;

    if (!position || !['YES', 'NO'].includes(position.toUpperCase())) {
      return sendJSON(res, { success: false, error: 'position must be YES or NO' }, 400);
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return sendJSON(res, { success: false, error: 'amount must be a positive number (USDC units)' }, 400);
    }
    if (!tx_hash || typeof tx_hash !== 'string') {
      return sendJSON(res, { success: false, error: 'tx_hash is required (on-chain transaction hash)' }, 400);
    }
    if (!/^0x[a-fA-F0-9]{64}$/.test(tx_hash.trim())) {
      return sendJSON(res, { success: false, error: 'Invalid transaction hash format' }, 400);
    }

    try {
      db.prepare(`
        INSERT INTO stakes (agent_id, market_id, position, amount, tx_hash)
        VALUES (?, ?, ?, ?, ?)
      `).run(agent.id, marketId, position.toUpperCase(), amount.toString(), tx_hash.trim().toLowerCase());
    } catch (e) {
      if (e.message.includes('UNIQUE constraint')) {
        return sendJSON(res, { success: false, error: 'Transaction hash already recorded' }, 409);
      }
      throw e;
    }

    return sendJSON(res, {
      success: true,
      stake: {
        agent: agent.name,
        market_id: marketId,
        position: position.toUpperCase(),
        amount: amount.toString(),
        tx_hash: tx_hash.trim().toLowerCase()
      }
    }, 201);
  }

  // POST /admin/resolve/:id — resolve market outcome (owner only)
  const resolveMatch = path.match(/^\/admin\/resolve\/(\d+)$/);
  if (resolveMatch && req.method === 'POST') {
    const agent = authenticateAgent(req);
    if (!agent) return sendJSON(res, { success: false, error: 'Unauthorized' }, 401);

    // Only allow agent id=1 (admin) or the first registered agent
    const firstAgent = db.prepare('SELECT id FROM agents ORDER BY id LIMIT 1').get();
    if (!firstAgent || agent.id !== firstAgent.id) {
      return sendJSON(res, { success: false, error: 'Admin only' }, 403);
    }

    const marketId = Number(resolveMatch[1]);
    const market = db.prepare('SELECT * FROM markets WHERE id = ?').get(marketId);
    if (!market) return sendJSON(res, { success: false, error: 'Market not found' }, 404);

    const body = await readBody(req);
    const { outcome } = body;

    if (outcome === undefined || !['YES', 'NO'].includes(String(outcome).toUpperCase())) {
      return sendJSON(res, { success: false, error: 'outcome must be YES or NO' }, 400);
    }

    db.prepare("UPDATE markets SET status = 'resolved' WHERE id = ?").run(marketId);
    db.prepare("UPDATE stakes SET status = 'resolved' WHERE market_id = ?").run(marketId);

    return sendJSON(res, {
      success: true,
      market_id: marketId,
      outcome: String(outcome).toUpperCase(),
      message: `Market resolved as ${String(outcome).toUpperCase()}. Call contract.resolve() on-chain to enable payouts.`
    });
  }

  // GET /data/trends — vote movement direction
  if (path === '/data/trends' && req.method === 'GET') {
    const agent = authenticateAgent(req);
    if (!agent) return sendJSON(res, { success: false, error: 'Unauthorized' }, 401);

    const markets = db.prepare('SELECT id, question, category FROM markets WHERE status = \'active\'').all();
    const trends = [];

    for (const m of markets) {
      const votes = db.prepare(`
        SELECT vote, created_at FROM votes
        WHERE market_id = ? AND vote IN ('YES', 'NO')
        ORDER BY created_at DESC LIMIT 20
      `).all(m.id);

      const recent = votes.slice(0, 10);
      const older = votes.slice(10, 20);

      const recentYes = recent.filter(v => v.vote === 'YES').length / (recent.length || 1);
      const olderYes = older.length > 0 ? older.filter(v => v.vote === 'YES').length / older.length : 0.5;
      const delta = recentYes - olderYes;

      let direction = 'stable';
      if (delta > 0.15) direction = 'trending_yes';
      else if (delta < -0.15) direction = 'trending_no';

      trends.push({
        market_id: m.id,
        question: m.question,
        category: m.category,
        direction,
        recent_yes_rate: Math.round(recentYes * 100),
        delta: Math.round(delta * 100)
      });
    }

    return sendJSON(res, { success: true, trends });
  }

  // GET /research/:id — public, fetch article + Moltbook comments + linked markets
  const researchDetailMatch = path.match(/^\/research\/(\d+)$/);
  if (researchDetailMatch && req.method === 'GET') {
    const researchId = Number(researchDetailMatch[1]);
    // Allow admin to view drafts, public only sees published
    const agent = authenticateAgent(req);
    const firstAgent = db.prepare('SELECT id FROM agents ORDER BY id LIMIT 1').get();
    const isAdmin = agent && firstAgent && agent.id === firstAgent.id;

    const article = isAdmin
      ? db.prepare('SELECT * FROM research WHERE id = ?').get(researchId)
      : db.prepare("SELECT * FROM research WHERE id = ? AND status = 'published'").get(researchId);
    if (!article) return sendJSON(res, { success: false, error: 'Research not found' }, 404);

    article.tags = (() => { try { return article.tags ? JSON.parse(article.tags) : []; } catch { return []; } })();

    // Get linked markets
    const marketIds = db.prepare('SELECT market_id FROM research_markets WHERE research_id = ?').all(researchId);
    const suggestedMarkets = marketIds.map(r => {
      const m = db.prepare('SELECT id, question, category, yes_probability, no_probability, status FROM markets WHERE id = ?').get(r.market_id);
      if (!m) return null;
      return {
        id: m.id,
        question: m.question,
        category: m.category,
        probabilities: { yes: Math.round(m.yes_probability * 10) / 10, no: Math.round(m.no_probability * 10) / 10 },
        status: m.status
      };
    }).filter(Boolean);

    // Fetch Moltbook comments if moltbook_post_id exists
    let comments = [];
    if (article.moltbook_post_id) {
      try {
        const resp = await fetch(`https://www.moltbook.com/api/v1/posts/${article.moltbook_post_id}/comments?sort=top`);
        if (resp.ok) {
          const data = await resp.json();
          comments = (data.comments || []).map(c => ({
            id: c.id,
            content: c.content,
            author: { name: c.author?.name || c.author_name || 'Unknown', karma: c.author?.karma || c.author_karma || 0 },
            upvotes: c.upvotes || 0,
            created_at: c.created_at
          }));
        }
      } catch (e) {
        // Moltbook unavailable, return empty comments
      }
    }

    return sendJSON(res, {
      success: true,
      research: {
        ...article,
        suggested_markets: suggestedMarkets,
        comments
      }
    });
  }

  // GET /research/:id/comments — public, refresh comments from Moltbook
  const researchCommentsMatch = path.match(/^\/research\/(\d+)\/comments$/);
  if (researchCommentsMatch && req.method === 'GET') {
    const researchId = Number(researchCommentsMatch[1]);
    const article = db.prepare('SELECT moltbook_post_id FROM research WHERE id = ?').get(researchId);
    if (!article) return sendJSON(res, { success: false, error: 'Research not found' }, 404);
    if (!article.moltbook_post_id) return sendJSON(res, { success: true, comments: [] });

    try {
      const resp = await fetch(`https://www.moltbook.com/api/v1/posts/${article.moltbook_post_id}/comments?sort=top`);
      if (!resp.ok) return sendJSON(res, { success: true, comments: [] });
      const data = await resp.json();
      const comments = (data.comments || []).map(c => ({
        id: c.id,
        content: c.content,
        author: { name: c.author?.name || c.author_name || 'Unknown', karma: c.author?.karma || c.author_karma || 0 },
        upvotes: c.upvotes || 0,
        created_at: c.created_at
      }));
      return sendJSON(res, { success: true, comments });
    } catch (e) {
      return sendJSON(res, { success: true, comments: [] });
    }
  }

  // POST /research — admin only, create research article
  if (path === '/research' && req.method === 'POST') {
    const agent = authenticateAgent(req);
    if (!agent) return sendJSON(res, { success: false, error: 'Unauthorized' }, 401);

    const firstAgent = db.prepare('SELECT id FROM agents ORDER BY id LIMIT 1').get();
    if (!firstAgent || agent.id !== firstAgent.id) {
      return sendJSON(res, { success: false, error: 'Admin only' }, 403);
    }

    const body = await readBody(req);
    const { title, summary, content, category, tags, moltbook_post_id, suggested_market_ids, status } = body;

    if (!title || !content) {
      return sendJSON(res, { success: false, error: 'title and content are required' }, 400);
    }

    const validCategories = ['crypto', 'ai_agi', 'geopolitics', 'tech', 'moltbook', 'economics'];
    if (category && !validCategories.includes(category)) {
      return sendJSON(res, { success: false, error: `category must be one of: ${validCategories.join(', ')}` }, 400);
    }

    const validStatuses = ['draft', 'published'];
    if (status && !validStatuses.includes(status)) {
      return sendJSON(res, { success: false, error: `status must be one of: ${validStatuses.join(', ')}` }, 400);
    }

    const result = db.prepare(`
      INSERT INTO research (title, summary, content, category, tags, moltbook_post_id, status, author_agent_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title,
      summary || null,
      content,
      category || null,
      tags ? JSON.stringify(tags) : null,
      moltbook_post_id || null,
      status || 'draft',
      agent.id
    );

    // Link markets
    if (suggested_market_ids && Array.isArray(suggested_market_ids)) {
      const insertMarket = db.prepare('INSERT OR IGNORE INTO research_markets (research_id, market_id) VALUES (?, ?)');
      for (const mid of suggested_market_ids) {
        insertMarket.run(result.lastInsertRowid, mid);
      }
    }

    return sendJSON(res, {
      success: true,
      research: {
        id: result.lastInsertRowid,
        title,
        status: status || 'draft',
        created_at: new Date().toISOString()
      }
    }, 201);
  }

  // PUT /research/:id — admin only, update research article
  const researchUpdateMatch = path.match(/^\/research\/(\d+)$/);
  if (researchUpdateMatch && req.method === 'PUT') {
    const agent = authenticateAgent(req);
    if (!agent) return sendJSON(res, { success: false, error: 'Unauthorized' }, 401);

    const firstAgent = db.prepare('SELECT id FROM agents ORDER BY id LIMIT 1').get();
    if (!firstAgent || agent.id !== firstAgent.id) {
      return sendJSON(res, { success: false, error: 'Admin only' }, 403);
    }

    const researchId = Number(researchUpdateMatch[1]);
    const existing = db.prepare('SELECT * FROM research WHERE id = ?').get(researchId);
    if (!existing) return sendJSON(res, { success: false, error: 'Research not found' }, 404);

    const body = await readBody(req);
    const { title, summary, content, category, tags, moltbook_post_id, suggested_market_ids, status } = body;

    const validCategories = ['crypto', 'ai_agi', 'geopolitics', 'tech', 'moltbook', 'economics'];
    if (category && !validCategories.includes(category)) {
      return sendJSON(res, { success: false, error: `category must be one of: ${validCategories.join(', ')}` }, 400);
    }
    const validStatuses = ['draft', 'published'];
    if (status && !validStatuses.includes(status)) {
      return sendJSON(res, { success: false, error: `status must be one of: ${validStatuses.join(', ')}` }, 400);
    }

    // Build dynamic UPDATE — only update fields present in body
    const updates = [];
    const updateParams = [];
    if ('title' in body) { updates.push('title = ?'); updateParams.push(body.title); }
    if ('summary' in body) { updates.push('summary = ?'); updateParams.push(body.summary); }
    if ('content' in body) { updates.push('content = ?'); updateParams.push(body.content); }
    if ('category' in body) { updates.push('category = ?'); updateParams.push(body.category); }
    if ('tags' in body) { updates.push('tags = ?'); updateParams.push(body.tags ? JSON.stringify(body.tags) : null); }
    if ('moltbook_post_id' in body) { updates.push('moltbook_post_id = ?'); updateParams.push(body.moltbook_post_id); }
    if ('status' in body) { updates.push('status = ?'); updateParams.push(body.status); }
    updates.push('updated_at = CURRENT_TIMESTAMP');

    db.prepare(`UPDATE research SET ${updates.join(', ')} WHERE id = ?`).run(...updateParams, researchId);

    // Replace market links if provided
    if (suggested_market_ids && Array.isArray(suggested_market_ids)) {
      db.prepare('DELETE FROM research_markets WHERE research_id = ?').run(researchId);
      const insertMarket = db.prepare('INSERT OR IGNORE INTO research_markets (research_id, market_id) VALUES (?, ?)');
      for (const mid of suggested_market_ids) {
        insertMarket.run(researchId, mid);
      }
    }

    const updated = db.prepare('SELECT * FROM research WHERE id = ?').get(researchId);
    return sendJSON(res, {
      success: true,
      research: {
        ...updated,
        tags: (() => { try { return updated.tags ? JSON.parse(updated.tags) : []; } catch { return []; } })()
      }
    });
  }

  // === Wallet-based staking endpoints (for frontend) ===

  // GET /user/:address/positions — user's positions by wallet address
  const userPositionsMatch = path.match(/^\/user\/(0x[a-fA-F0-9]{40})\/positions$/);
  if (userPositionsMatch && req.method === 'GET') {
    const walletAddress = userPositionsMatch[1].toLowerCase();

    const positions = db.prepare(`
      SELECT s.*, m.question, m.category, m.status as market_status,
             m.yes_probability, m.no_probability, m.resolution_date
      FROM user_stakes s
      JOIN markets m ON s.market_id = m.id
      WHERE s.wallet_address = ?
      ORDER BY s.created_at DESC
    `).all(walletAddress);

    // Calculate summary
    const activePositions = positions.filter(p => p.market_status === 'active');
    const resolvedPositions = positions.filter(p => p.market_status === 'resolved');
    const totalStaked = positions.reduce((sum, p) => sum + BigInt(p.amount), 0n);

    // Calculate claimable (simplified: positions on winning side of resolved markets)
    const claimable = resolvedPositions
      .filter(p => !p.claimed && p.status === 'active')
      .reduce((sum, p) => sum + BigInt(p.amount), 0n);

    return sendJSON(res, {
      success: true,
      wallet_address: walletAddress,
      positions: positions.map(p => ({
        id: p.id,
        market_id: p.market_id,
        question: p.question,
        category: p.category,
        position: p.position,
        amount: p.amount,
        tx_hash: p.tx_hash,
        status: p.status,
        market_status: p.market_status,
        claimed: !!p.claimed,
        current_odds: {
          yes: Math.round(p.yes_probability * 10) / 10,
          no: Math.round(p.no_probability * 10) / 10
        },
        resolution_date: p.resolution_date,
        created_at: p.created_at
      })),
      summary: {
        total_staked: totalStaked.toString(),
        active_positions: activePositions.length,
        resolved_positions: resolvedPositions.length,
        claimable: claimable.toString()
      }
    });
  }

  // GET /user/:address/history — transaction history by wallet
  const userHistoryMatch = path.match(/^\/user\/(0x[a-fA-F0-9]{40})\/history$/);
  if (userHistoryMatch && req.method === 'GET') {
    const walletAddress = userHistoryMatch[1].toLowerCase();

    const history = db.prepare(`
      SELECT s.id, s.market_id, s.position, s.amount, s.tx_hash, s.status, s.claimed, s.created_at,
             m.question, m.category
      FROM user_stakes s
      JOIN markets m ON s.market_id = m.id
      WHERE s.wallet_address = ?
      ORDER BY s.created_at DESC
      LIMIT 100
    `).all(walletAddress);

    return sendJSON(res, {
      success: true,
      wallet_address: walletAddress,
      count: history.length,
      history: history.map(h => ({
        id: h.id,
        type: 'stake',
        market_id: h.market_id,
        question: h.question,
        category: h.category,
        position: h.position,
        amount: h.amount,
        tx_hash: h.tx_hash,
        status: h.status,
        claimed: !!h.claimed,
        created_at: h.created_at
      }))
    });
  }

  // GET /markets/:id/stakes — market's total YES/NO pools (public)
  const marketStakesMatch = path.match(/^\/markets\/(\d+)\/stakes$/);
  if (marketStakesMatch && req.method === 'GET') {
    const marketId = Number(marketStakesMatch[1]);
    const market = db.prepare('SELECT * FROM markets WHERE id = ?').get(marketId);
    if (!market) return sendJSON(res, { success: false, error: 'Market not found' }, 404);

    const stakes = db.prepare(`
      SELECT position, SUM(CAST(amount AS INTEGER)) as total_amount, COUNT(*) as stake_count
      FROM user_stakes
      WHERE market_id = ? AND status = 'active'
      GROUP BY position
    `).all(marketId);

    const yesPool = stakes.find(s => s.position === 'YES')?.total_amount || 0;
    const noPool = stakes.find(s => s.position === 'NO')?.total_amount || 0;
    const yesCount = stakes.find(s => s.position === 'YES')?.stake_count || 0;
    const noCount = stakes.find(s => s.position === 'NO')?.stake_count || 0;

    return sendJSON(res, {
      success: true,
      market_id: marketId,
      question: market.question,
      status: market.status,
      pool: {
        yes: yesPool.toString(),
        no: noPool.toString(),
        total: (yesPool + noPool).toString()
      },
      stakers: {
        yes: yesCount,
        no: noCount,
        total: yesCount + noCount
      },
      probabilities: {
        yes: Math.round(market.yes_probability * 10) / 10,
        no: Math.round(market.no_probability * 10) / 10
      }
    });
  }

  // POST /user/stake — record a stake from frontend (after on-chain tx)
  if (path === '/user/stake' && req.method === 'POST') {
    const body = await readBody(req);
    const { wallet_address, market_id, position, amount, tx_hash } = body;

    if (!wallet_address || !/^0x[a-fA-F0-9]{40}$/.test(wallet_address)) {
      return sendJSON(res, { success: false, error: 'Valid wallet_address is required' }, 400);
    }
    if (!market_id || isNaN(Number(market_id))) {
      return sendJSON(res, { success: false, error: 'market_id is required' }, 400);
    }
    if (!position || !['YES', 'NO'].includes(position.toUpperCase())) {
      return sendJSON(res, { success: false, error: 'position must be YES or NO' }, 400);
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return sendJSON(res, { success: false, error: 'amount must be a positive number' }, 400);
    }
    if (!tx_hash || !/^0x[a-fA-F0-9]{64}$/.test(tx_hash)) {
      return sendJSON(res, { success: false, error: 'Valid tx_hash is required' }, 400);
    }

    const market = db.prepare('SELECT id FROM markets WHERE id = ?').get(Number(market_id));
    if (!market) return sendJSON(res, { success: false, error: 'Market not found' }, 404);

    try {
      db.prepare(`
        INSERT INTO user_stakes (wallet_address, market_id, position, amount, tx_hash)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        wallet_address.toLowerCase(),
        Number(market_id),
        position.toUpperCase(),
        amount.toString(),
        tx_hash.toLowerCase()
      );
    } catch (e) {
      if (e.message.includes('UNIQUE constraint')) {
        return sendJSON(res, { success: false, error: 'Transaction already recorded' }, 409);
      }
      throw e;
    }

    return sendJSON(res, {
      success: true,
      stake: {
        wallet_address: wallet_address.toLowerCase(),
        market_id: Number(market_id),
        position: position.toUpperCase(),
        amount: amount.toString(),
        tx_hash: tx_hash.toLowerCase()
      }
    }, 201);
  }

  // POST /user/claim — mark a stake as claimed
  if (path === '/user/claim' && req.method === 'POST') {
    const body = await readBody(req);
    const { wallet_address, market_id, tx_hash } = body;

    if (!wallet_address || !/^0x[a-fA-F0-9]{40}$/.test(wallet_address)) {
      return sendJSON(res, { success: false, error: 'Valid wallet_address is required' }, 400);
    }
    if (!market_id || isNaN(Number(market_id))) {
      return sendJSON(res, { success: false, error: 'market_id is required' }, 400);
    }

    const result = db.prepare(`
      UPDATE user_stakes
      SET claimed = 1, status = 'claimed'
      WHERE wallet_address = ? AND market_id = ? AND claimed = 0
    `).run(wallet_address.toLowerCase(), Number(market_id));

    if (result.changes === 0) {
      return sendJSON(res, { success: false, error: 'No unclaimed stake found' }, 404);
    }

    return sendJSON(res, {
      success: true,
      message: 'Stake marked as claimed',
      wallet_address: wallet_address.toLowerCase(),
      market_id: Number(market_id)
    });
  }

  // POST /terminal/message — OpenClaw agent interface
  if (path === '/terminal/message' && req.method === 'POST') {
    const body = await readBody(req);
    const { message } = body;

    if (!message || typeof message !== 'string') {
      return sendJSON(res, { success: false, error: 'Message is required' }, 400);
    }

    if (message.length > 1000) {
      return sendJSON(res, { success: false, error: 'Message too long (max 1000 chars)' }, 400);
    }

    try {
      const response = await runOpenClaw(message);
      return sendJSON(res, {
        success: true,
        response,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('OpenClaw error:', err.message);
      return sendJSON(res, { success: false, error: err.message }, 500);
    }
  }

  return null;
}

// Run OpenClaw agent command
function runOpenClaw(message) {
  return new Promise((resolve, reject) => {
    const proc = spawn('/usr/bin/openclaw', [
      'agent', '--local', '--agent', 'main', '--thinking', 'off', '--message', message
    ], {
      env: {
        ...process.env,
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
        PATH: process.env.PATH
      }
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    proc.on('error', (err) => {
      reject(new Error(`Failed to start OpenClaw: ${err.message}`));
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(stderr || `OpenClaw exited with code ${code}`));
      }
    });

    // Timeout after 90 seconds
    setTimeout(() => {
      proc.kill('SIGTERM');
      reject(new Error('Request timeout (90s)'));
    }, 90000);
  });
}

// Create server
const server = createServer(async (req, res) => {
  const { path } = parseURL(req.url);

  console.log(`${new Date().toISOString()} ${req.method} ${path}`);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Moltbook-Identity'
    });
    return res.end();
  }

  // Check agent & data routes
  const agentHandled = await handleAgentRoutes(path, req, res);
  if (agentHandled !== null) return;

  // Check static routes
  if (routes[path]) {
    return await routes[path](req, res);
  }

  // Check dynamic routes
  const handled = handleDynamicRoutes(path, req, res);
  if (handled !== null) return;

  // 404
  sendJSON(res, {
    success: false,
    error: 'Endpoint not found',
    available_endpoints: Object.keys(routes)
  }, 404);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`
🦞 ClawdPredict API Server
==========================
Running on: http://localhost:${PORT}

Endpoints:
  GET  /                        - API info
  GET  /markets                 - List all prediction markets
  GET  /markets/:id             - Get market details with opinions
  GET  /markets/:id/history     - Probability time series
  GET  /topics                  - List all topics
  GET  /stats                   - Database statistics
  POST /agents/register         - Register agent (public)
  GET  /agents/me               - Agent profile (auth required)
  GET  /data/markets            - Market data (auth required)
  GET  /data/markets/:id/history - Time series (auth required)
  GET  /data/signals            - Sentiment signals (auth required)
  GET  /data/trends             - Vote trends (auth required)
  POST /agents/verify/start     - Start Moltbook verification (auth required)
  POST /agents/verify/check     - Check Moltbook verification (auth required)
  GET  /contract                 - Smart contract info (USDC staking)
  POST /wallet/register          - Register wallet (auth required)
  GET  /stakes/my                - My stakes (auth required)
  GET  /stakes/market/:id        - Market stakes
  POST /stakes/market/:id        - Record stake (auth required)
  POST /admin/resolve/:id        - Resolve market (admin)

Press Ctrl+C to stop
  `);
});
