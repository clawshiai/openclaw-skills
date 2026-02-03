import { createServer } from 'http';
import { randomBytes } from 'crypto';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'data/clawdpredict.db'));
const PORT = process.env.PORT || 3456;

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
        '/topics': 'List all topics with post counts',
        '/topics/:topic': 'Get topic details with posts and opinions',
        '/stats': 'Database statistics'
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
        favorite_category: categoriesByAuthor[a.author_name]?.[0]?.category || 'unknown',
        categories: categoriesByAuthor[a.author_name] || []
      }))
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

  return null;
}

// Create server
const server = createServer(async (req, res) => {
  const { path } = parseURL(req.url);

  console.log(`${new Date().toISOString()} ${req.method} ${path}`);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Moltbook-Identity'
    });
    return res.end();
  }

  // Check agent & data routes
  const agentHandled = await handleAgentRoutes(path, req, res);
  if (agentHandled !== null) return;

  // Check static routes
  if (routes[path]) {
    return routes[path](req, res);
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

Press Ctrl+C to stop
  `);
});
