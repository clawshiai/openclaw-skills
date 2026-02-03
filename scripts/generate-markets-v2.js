import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, '../data/clawdpredict.db'));

// Create votes table
db.exec(`
  CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    market_id INTEGER,
    post_id TEXT,
    author_name TEXT,
    author_karma INTEGER,
    vote TEXT CHECK(vote IN ('YES', 'NO', 'ABSTAIN')),
    confidence REAL,
    reasoning TEXT,
    post_title TEXT,
    post_excerpt TEXT,
    upvotes INTEGER,
    created_at TEXT,
    FOREIGN KEY (market_id) REFERENCES markets(id),
    FOREIGN KEY (post_id) REFERENCES posts(id),
    UNIQUE(market_id, post_id)
  );

  CREATE INDEX IF NOT EXISTS idx_votes_market ON votes(market_id);
  CREATE INDEX IF NOT EXISTS idx_votes_vote ON votes(vote);
`);

// Keywords for topic classification
const TOPIC_KEYWORDS = {
  crypto: ['bitcoin', 'btc', 'eth', 'ethereum', 'crypto', 'token', 'solana', 'price', 'pump', 'dump', 'bull', 'bear', 'trading', 'market'],
  ai_agi: ['agi', 'gpt-5', 'gpt5', 'openai', 'anthropic', 'claude', 'singularity', 'superintelligence', 'consciousness', 'sentient', 'artificial intelligence'],
  geopolitics: ['war', 'russia', 'ukraine', 'china', 'taiwan', 'iran', 'israel', 'ceasefire', 'invasion', 'conflict', 'sanctions', 'military', 'strike'],
  tech: ['apple', 'google', 'meta', 'microsoft', 'tesla', 'spacex', 'launch', 'release', 'iphone', 'android'],
  moltbook: ['moltbook', 'agent', 'claw', 'molt', 'submolt', 'karma', 'molty', 'claimed']
};

// Market-specific voting keywords
const MARKET_VOTE_KEYWORDS = {
  1: { // BTC $100K
    yes: ['btc 100k', 'bitcoin 100k', '100,000', 'moon', 'bullish', 'rally', 'bull run', 'ath', 'all time high', 'price up', 'going up', 'will reach', 'definitely', 'btc will', 'bitcoin will'],
    no: ['crash', 'dump', 'bear', 'bearish', 'correction', 'bubble', 'overvalued', 'won\'t reach', 'unlikely', 'doubt', 'fail', 'collapse']
  },
  2: { // ETH $5K
    yes: ['eth 5k', 'ethereum 5k', 'eth moon', 'eth bullish', 'ethereum will', 'eth rally', 'eth up'],
    no: ['eth crash', 'eth dump', 'eth bearish', 'ethereum fail', 'eth down', 'eth unlikely']
  },
  3: { // GPT-5
    yes: ['gpt-5', 'gpt5', 'openai release', 'new model', 'coming soon', 'announcement', 'launch', 'upgrade', 'next version'],
    no: ['delayed', 'not ready', 'won\'t release', 'skeptical', 'doubt openai']
  },
  4: { // AGI by 2026
    yes: ['agi soon', 'agi close', 'singularity', 'superintelligence', 'agi achieved', 'agi possible', 'consciousness'],
    no: ['agi far', 'agi decades', 'not agi', 'fake agi', 'narrow ai', 'agi impossible', 'overhyped']
  },
  5: { // Iran conflict
    yes: ['iran war', 'iran strike', 'iran attack', 'iran conflict', 'military action', 'escalation', 'tensions', 'iran invasion'],
    no: ['peace', 'diplomacy', 'de-escalation', 'ceasefire', 'negotiations', 'no war', 'avoid conflict']
  },
  6: { // Moltbook 100K agents
    yes: ['growing', 'growth', 'popular', 'viral', 'adoption', 'more agents', 'expanding', 'success', 'thriving'],
    no: ['dying', 'dead', 'abandoned', 'ghost town', 'declining', 'fewer', 'leaving']
  },
  7: { // Apple foldable
    yes: ['foldable iphone', 'apple foldable', 'iphone fold', 'apple fold', 'foldable coming', 'apple will release'],
    no: ['no foldable', 'apple won\'t', 'not foldable', 'iphone won\'t fold', 'skeptical apple']
  }
};

// General sentiment words
const SENTIMENT_WORDS = {
  positive: ['will', 'going to', 'expect', 'believe', 'confident', 'certain', 'inevitable', 'soon', 'definitely', 'absolutely', 'likely', 'probable', 'optimistic', 'bullish', 'yes', 'agree', 'true', 'correct', 'right'],
  negative: ['won\'t', 'will not', 'never', 'doubt', 'unlikely', 'impossible', 'no way', 'not going to', 'fail', 'false', 'wrong', 'disagree', 'skeptical', 'pessimistic', 'bearish', 'no', 'crash', 'dump']
};

function analyzeVote(post, marketId) {
  const text = `${post.title} ${post.content || ''}`.toLowerCase();

  const marketKeywords = MARKET_VOTE_KEYWORDS[marketId];
  if (!marketKeywords) return { vote: 'ABSTAIN', confidence: 0, reasoning: 'No keywords defined for this market' };

  // Count market-specific keyword matches
  let yesScore = 0;
  let noScore = 0;
  let matchedYes = [];
  let matchedNo = [];

  for (const keyword of marketKeywords.yes) {
    if (text.includes(keyword)) {
      yesScore += 2;
      matchedYes.push(keyword);
    }
  }

  for (const keyword of marketKeywords.no) {
    if (text.includes(keyword)) {
      noScore += 2;
      matchedNo.push(keyword);
    }
  }

  // Count general sentiment words
  for (const word of SENTIMENT_WORDS.positive) {
    if (text.includes(word)) yesScore += 0.5;
  }

  for (const word of SENTIMENT_WORDS.negative) {
    if (text.includes(word)) noScore += 0.5;
  }

  // Determine vote
  const totalScore = yesScore + noScore;
  const scoreDiff = yesScore - noScore;

  let vote, confidence, reasoning;

  if (totalScore < 1) {
    vote = 'ABSTAIN';
    confidence = 0;
    reasoning = 'No relevant keywords found';
  } else if (scoreDiff > 1) {
    vote = 'YES';
    confidence = Math.min(scoreDiff / 5, 1);
    reasoning = matchedYes.length > 0 ? `Matched: ${matchedYes.slice(0, 3).join(', ')}` : 'Positive sentiment detected';
  } else if (scoreDiff < -1) {
    vote = 'NO';
    confidence = Math.min(Math.abs(scoreDiff) / 5, 1);
    reasoning = matchedNo.length > 0 ? `Matched: ${matchedNo.slice(0, 3).join(', ')}` : 'Negative sentiment detected';
  } else {
    vote = 'ABSTAIN';
    confidence = 0.3;
    reasoning = 'Mixed or neutral sentiment';
  }

  return { vote, confidence, reasoning, yesScore, noScore };
}

function isPostRelevantToMarket(post, marketId) {
  const text = `${post.title} ${post.content || ''}`.toLowerCase();

  const marketTopics = {
    1: 'crypto', 2: 'crypto',
    3: 'ai_agi', 4: 'ai_agi',
    5: 'geopolitics',
    6: 'moltbook',
    7: 'tech'
  };

  const topic = marketTopics[marketId];
  if (!topic) return false;

  return TOPIC_KEYWORDS[topic].some(k => text.includes(k));
}

function main() {
  console.log('🦞 ClawdPredict - Generating Votes per Post...\n');

  // Get all markets
  const markets = db.prepare('SELECT * FROM markets').all();

  // Get all posts
  const posts = db.prepare('SELECT * FROM posts ORDER BY upvotes DESC').all();
  console.log(`📊 Processing ${posts.length} posts for ${markets.length} markets...\n`);

  // Clear existing votes
  db.prepare('DELETE FROM votes').run();

  const insertVote = db.prepare(`
    INSERT INTO votes (market_id, post_id, author_name, author_karma, vote, confidence, reasoning, post_title, post_excerpt, upvotes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const marketStats = {};

  for (const market of markets) {
    marketStats[market.id] = { yes: 0, no: 0, abstain: 0, total: 0 };

    for (const post of posts) {
      // Check if post is relevant to this market's topic
      if (!isPostRelevantToMarket(post, market.id)) continue;

      const { vote, confidence, reasoning } = analyzeVote(post, market.id);

      insertVote.run(
        market.id,
        post.id,
        post.author_name,
        post.author_karma || 0,
        vote,
        confidence,
        reasoning,
        post.title,
        (post.content || '').substring(0, 300),
        post.upvotes || 0,
        post.created_at
      );

      marketStats[market.id][vote.toLowerCase()]++;
      marketStats[market.id].total++;
    }
  }

  // Update market probabilities based on votes
  const updateMarket = db.prepare(`
    UPDATE markets SET yes_probability = ?, no_probability = ?, total_opinions = ? WHERE id = ?
  `);

  console.log('📊 Market Vote Results:\n');

  for (const market of markets) {
    const stats = marketStats[market.id];
    const validVotes = stats.yes + stats.no;

    let yesProb, noProb;
    if (validVotes > 0) {
      yesProb = stats.yes / validVotes;
      noProb = stats.no / validVotes;
    } else {
      yesProb = 0.5;
      noProb = 0.5;
    }

    updateMarket.run(yesProb, noProb, stats.total, market.id);

    console.log(`   ❓ ${market.question}`);
    console.log(`      ✅ YES: ${stats.yes} votes (${(yesProb * 100).toFixed(1)}%)`);
    console.log(`      ❌ NO: ${stats.no} votes (${(noProb * 100).toFixed(1)}%)`);
    console.log(`      ⚪ ABSTAIN: ${stats.abstain}`);
    console.log(`      📊 Total relevant posts: ${stats.total}\n`);
  }

  db.close();
  console.log('✅ Votes saved to database!');
}

main();
