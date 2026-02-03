import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, '../data/clawdpredict.db'));

// Create votes table
db.exec(`
  DROP TABLE IF EXISTS votes;
  CREATE TABLE votes (
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

// STRICT topic relevance - post MUST mention these to be considered
const MARKET_RELEVANCE = {
  1: { // BTC $100K
    required: ['bitcoin', 'btc'],  // MUST have one of these
    context: ['price', 'dollar', '$', '100k', '100,000', 'value', 'worth', 'trading', 'market', 'bull', 'bear']
  },
  2: { // ETH $5K
    required: ['ethereum', 'eth'],
    context: ['price', 'dollar', '$', '5k', '5,000', '5000', 'value', 'worth', 'trading', 'market']
  },
  3: { // GPT-5
    required: ['gpt-5', 'gpt5', 'gpt 5'],
    context: ['release', 'launch', 'openai', 'announce', 'coming', 'model']
  },
  4: { // AGI
    required: ['agi', 'artificial general intelligence'],
    context: ['achieve', 'reach', 'possible', 'timeline', 'when', 'year', '2026', '2027']
  },
  5: { // Iran conflict
    required: ['iran'],
    context: ['war', 'conflict', 'military', 'strike', 'attack', 'tension', 'nuclear', 'israel', 'us', 'usa']
  },
  6: { // Moltbook 100K agents
    required: ['moltbook'],
    context: ['agent', 'growth', 'user', 'growing', 'popular', '100k', '100,000', 'million']
  },
  7: { // Apple foldable
    required: ['apple', 'iphone'],
    context: ['foldable', 'fold', 'folding', 'flip', 'flexible']
  }
};

// Market-specific YES/NO indicators (more strict)
const MARKET_VOTE_INDICATORS = {
  1: { // BTC $100K
    yes: ['100k', '100,000', 'moon', 'bullish', 'rally', 'bull run', 'ath', 'all time high', 'will reach', 'going up', 'buy', 'long', 'pump'],
    no: ['crash', 'dump', 'bearish', 'correction', 'bubble', 'overvalued', 'won\'t reach', 'sell', 'short', 'drop', 'fall', 'decline']
  },
  2: { // ETH $5K
    yes: ['5k', '5,000', '5000', 'moon', 'bullish', 'rally', 'ath', 'will reach', 'going up', 'buy', 'long'],
    no: ['crash', 'dump', 'bearish', 'correction', 'won\'t reach', 'sell', 'short', 'drop', 'fall']
  },
  3: { // GPT-5
    yes: ['release', 'releasing', 'coming', 'launch', 'launching', 'announced', 'soon', 'ready', 'expect'],
    no: ['delayed', 'delay', 'not ready', 'won\'t release', 'postponed', 'cancelled', 'doubt']
  },
  4: { // AGI
    yes: ['close', 'near', 'soon', 'possible', 'achievable', 'this year', 'next year', '2026', 'breakthrough'],
    no: ['far', 'decades', 'impossible', 'overhyped', 'not real', 'fake', 'narrow', 'won\'t happen']
  },
  5: { // Iran conflict
    yes: ['war', 'strike', 'attack', 'bomb', 'invasion', 'escalation', 'conflict', 'military action'],
    no: ['peace', 'diplomacy', 'negotiate', 'ceasefire', 'de-escalation', 'avoid', 'no war', 'deal']
  },
  6: { // Moltbook growth
    yes: ['growing', 'growth', 'popular', 'viral', 'booming', 'expanding', 'thriving', 'success', 'million'],
    no: ['dying', 'dead', 'declining', 'leaving', 'abandoned', 'ghost town', 'shrinking', 'failing']
  },
  7: { // Apple foldable
    yes: ['foldable iphone', 'iphone fold', 'apple fold', 'folding iphone', 'will release', 'coming', 'leaked'],
    no: ['no foldable', 'won\'t fold', 'not releasing', 'unlikely', 'doubt', 'skeptical']
  }
};

function isPostRelevantToMarket(post, marketId) {
  const text = `${post.title} ${post.content || ''}`.toLowerCase();
  const relevance = MARKET_RELEVANCE[marketId];

  if (!relevance) return false;

  // Must contain at least one REQUIRED keyword
  const hasRequired = relevance.required.some(keyword => text.includes(keyword));
  if (!hasRequired) return false;

  // Should also have some context keyword (more lenient)
  const hasContext = relevance.context.some(keyword => text.includes(keyword));

  return hasRequired && hasContext;
}

function analyzeVote(post, marketId) {
  const text = `${post.title} ${post.content || ''}`.toLowerCase();
  const indicators = MARKET_VOTE_INDICATORS[marketId];

  if (!indicators) return { vote: 'ABSTAIN', confidence: 0, reasoning: 'No indicators defined' };

  let yesScore = 0;
  let noScore = 0;
  let matchedYes = [];
  let matchedNo = [];

  // Count YES indicators
  for (const keyword of indicators.yes) {
    if (text.includes(keyword)) {
      yesScore += 1;
      matchedYes.push(keyword);
    }
  }

  // Count NO indicators
  for (const keyword of indicators.no) {
    if (text.includes(keyword)) {
      noScore += 1;
      matchedNo.push(keyword);
    }
  }

  // Determine vote based on score difference
  const scoreDiff = yesScore - noScore;

  let vote, confidence, reasoning;

  if (yesScore === 0 && noScore === 0) {
    vote = 'ABSTAIN';
    confidence = 0;
    reasoning = 'No clear position detected';
  } else if (scoreDiff > 0) {
    vote = 'YES';
    confidence = Math.min(yesScore / 3, 1);
    reasoning = `YES indicators: ${matchedYes.join(', ')}`;
  } else if (scoreDiff < 0) {
    vote = 'NO';
    confidence = Math.min(noScore / 3, 1);
    reasoning = `NO indicators: ${matchedNo.join(', ')}`;
  } else {
    vote = 'ABSTAIN';
    confidence = 0.3;
    reasoning = `Mixed signals: YES(${matchedYes.join(', ')}) vs NO(${matchedNo.join(', ')})`;
  }

  return { vote, confidence, reasoning, yesScore, noScore, matchedYes, matchedNo };
}

function main() {
  console.log('🦞 ClawdPredict v3 - Strict Relevance Voting...\n');

  const markets = db.prepare('SELECT * FROM markets').all();
  const posts = db.prepare('SELECT * FROM posts ORDER BY upvotes DESC').all();

  console.log(`📊 Processing ${posts.length} posts for ${markets.length} markets...\n`);

  const insertVote = db.prepare(`
    INSERT INTO votes (market_id, post_id, author_name, author_karma, vote, confidence, reasoning, post_title, post_excerpt, upvotes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const marketStats = {};

  for (const market of markets) {
    marketStats[market.id] = { yes: 0, no: 0, abstain: 0, relevant: 0, total_checked: 0 };

    for (const post of posts) {
      marketStats[market.id].total_checked++;

      // STRICT relevance check
      if (!isPostRelevantToMarket(post, market.id)) continue;

      marketStats[market.id].relevant++;

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
    }
  }

  // Update market probabilities
  const updateMarket = db.prepare(`
    UPDATE markets SET yes_probability = ?, no_probability = ?, total_opinions = ? WHERE id = ?
  `);

  console.log('📊 Market Vote Results (Strict Relevance):\n');

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

    updateMarket.run(yesProb, noProb, stats.relevant, market.id);

    console.log(`   ❓ ${market.question}`);
    console.log(`      📋 Relevant posts: ${stats.relevant} / ${stats.total_checked}`);
    console.log(`      ✅ YES: ${stats.yes} votes (${(yesProb * 100).toFixed(1)}%)`);
    console.log(`      ❌ NO: ${stats.no} votes (${(noProb * 100).toFixed(1)}%)`);
    console.log(`      ⚪ ABSTAIN: ${stats.abstain}\n`);
  }

  db.close();
  console.log('✅ Votes saved with strict relevance filtering!');
}

main();
