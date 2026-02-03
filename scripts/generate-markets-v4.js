import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, '../data/clawdpredict.db'));

// Recreate votes table
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
`);

// Helper: match whole word only (not substring)
function matchWholeWord(text, word) {
  const regex = new RegExp(`\\b${word}\\b`, 'i');
  return regex.test(text);
}

// Helper: match any of the words (whole word)
function matchAnyWholeWord(text, words) {
  return words.some(word => matchWholeWord(text, word));
}

// Helper: count whole word matches
function countWholeWordMatches(text, words) {
  let count = 0;
  let matched = [];
  for (const word of words) {
    if (matchWholeWord(text, word)) {
      count++;
      matched.push(word);
    }
  }
  return { count, matched };
}

// STRICT topic relevance with WHOLE WORD matching
const MARKET_CONFIG = {
  1: { // BTC $100K
    name: 'BTC $100K',
    required: ['bitcoin', 'btc'],  // Must have one of these (whole word)
    context: ['price', 'dollar', '\\$', '100k', '100,000', 'usd', 'trading', 'market cap'],
    yes: ['bullish', 'bull', 'moon', 'pump', 'rally', 'ath', 'buy', 'long', '100k', '100,000', 'will reach', 'going up'],
    no: ['bearish', 'bear', 'crash', 'dump', 'correction', 'sell', 'short', 'drop', 'fall', 'decline']
  },
  2: { // ETH $5K
    name: 'ETH $5K',
    required: ['ethereum'],  // Only "ethereum" not "eth" (too short, matches "something", "method", etc)
    context: ['price', 'dollar', '\\$', '5k', '5,000', '5000', 'usd', 'trading', 'market'],
    yes: ['bullish', 'bull', 'moon', 'pump', 'rally', 'ath', 'buy', 'long', '5k', '5,000', 'will reach', 'going up'],
    no: ['bearish', 'bear', 'crash', 'dump', 'correction', 'sell', 'short', 'drop', 'fall', 'decline']
  },
  3: { // GPT-5
    name: 'GPT-5 Release',
    required: ['gpt-5', 'gpt5', 'gpt 5'],
    context: ['release', 'launch', 'openai', 'announce', 'model', 'coming'],
    yes: ['release', 'releasing', 'launch', 'launching', 'announced', 'coming', 'soon', 'ready', 'confirmed'],
    no: ['delayed', 'delay', 'postponed', 'cancelled', 'not ready', 'doubt', 'unlikely']
  },
  4: { // AGI
    name: 'AGI Achievement',
    required: ['\\bagi\\b', 'artificial general intelligence'],  // \b for word boundary
    context: ['achieve', 'achieved', 'reach', 'possible', 'timeline', 'when', '2026', '2027', 'years'],
    yes: ['close', 'near', 'soon', 'possible', 'achievable', 'imminent', '2026', 'breakthrough', 'achieved'],
    no: ['far', 'decades', 'impossible', 'overhyped', 'not real', 'narrow', 'unlikely', 'never']
  },
  5: { // Iran conflict
    name: 'Iran Conflict',
    required: ['iran'],
    context: ['war', 'conflict', 'military', 'strike', 'attack', 'nuclear', 'israel', 'tension', 'sanctions'],
    yes: ['war', 'strike', 'attack', 'bomb', 'invasion', 'escalation', 'military action', 'conflict'],
    no: ['peace', 'diplomacy', 'negotiate', 'ceasefire', 'de-escalation', 'deal', 'talks', 'agreement']
  },
  6: { // Moltbook 100K
    name: 'Moltbook 100K',
    required: ['moltbook'],
    context: ['agent', 'agents', 'user', 'users', 'growth', 'growing', 'registered', '100k', '100,000', 'million'],
    yes: ['growing', 'growth', 'popular', 'viral', 'booming', 'expanding', 'thriving', 'success', 'million', 'adoption'],
    no: ['dying', 'dead', 'declining', 'leaving', 'abandoned', 'ghost town', 'shrinking', 'failing', 'empty']
  },
  7: { // Apple foldable
    name: 'Apple Foldable',
    required: ['apple', 'iphone'],
    context: ['foldable', 'fold', 'folding', 'flip', 'flexible', 'bendable'],
    yes: ['foldable', 'fold', 'will release', 'coming', 'leaked', 'confirmed', 'announcement'],
    no: ['no foldable', 'unlikely', 'doubt', 'not releasing', 'cancelled']
  }
};

function isPostRelevantToMarket(text, config) {
  // Check required keywords (whole word match)
  const hasRequired = config.required.some(keyword => {
    const regex = new RegExp(keyword.includes('\\b') ? keyword : `\\b${keyword}\\b`, 'i');
    return regex.test(text);
  });

  if (!hasRequired) return false;

  // Check context keywords
  const hasContext = config.context.some(keyword => {
    const regex = new RegExp(keyword.includes('\\') ? keyword : `\\b${keyword}\\b`, 'i');
    return regex.test(text);
  });

  return hasRequired && hasContext;
}

function analyzeVote(text, config) {
  const yesResult = countWholeWordMatches(text, config.yes);
  const noResult = countWholeWordMatches(text, config.no);

  const yesScore = yesResult.count;
  const noScore = noResult.count;
  const scoreDiff = yesScore - noScore;

  let vote, confidence, reasoning;

  if (yesScore === 0 && noScore === 0) {
    vote = 'ABSTAIN';
    confidence = 0;
    reasoning = 'No clear position detected';
  } else if (scoreDiff > 0) {
    vote = 'YES';
    confidence = Math.min(yesScore / 3, 1);
    reasoning = `YES: ${yesResult.matched.join(', ')}`;
  } else if (scoreDiff < 0) {
    vote = 'NO';
    confidence = Math.min(noScore / 3, 1);
    reasoning = `NO: ${noResult.matched.join(', ')}`;
  } else {
    vote = 'ABSTAIN';
    confidence = 0.3;
    reasoning = `Mixed: YES(${yesResult.matched.join(',')}) vs NO(${noResult.matched.join(',')})`;
  }

  return { vote, confidence, reasoning };
}

function main() {
  console.log('🦞 ClawdPredict v4 - Word Boundary Matching...\n');

  const markets = db.prepare('SELECT * FROM markets').all();
  const posts = db.prepare('SELECT * FROM posts ORDER BY upvotes DESC').all();

  console.log(`📊 Processing ${posts.length} posts for ${markets.length} markets...\n`);

  const insertVote = db.prepare(`
    INSERT INTO votes (market_id, post_id, author_name, author_karma, vote, confidence, reasoning, post_title, post_excerpt, upvotes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const marketStats = {};

  for (const market of markets) {
    const config = MARKET_CONFIG[market.id];
    if (!config) continue;

    marketStats[market.id] = { name: config.name, yes: 0, no: 0, abstain: 0, relevant: 0 };

    for (const post of posts) {
      const text = `${post.title} ${post.content || ''}`.toLowerCase();

      // Strict relevance check with whole word matching
      if (!isPostRelevantToMarket(text, config)) continue;

      marketStats[market.id].relevant++;

      const { vote, confidence, reasoning } = analyzeVote(text, config);

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

  console.log('📊 Market Vote Results (Word Boundary Matching):\n');

  for (const [id, stats] of Object.entries(marketStats)) {
    const validVotes = stats.yes + stats.no;
    let yesProb = validVotes > 0 ? stats.yes / validVotes : 0.5;
    let noProb = validVotes > 0 ? stats.no / validVotes : 0.5;

    updateMarket.run(yesProb, noProb, stats.relevant, id);

    const result = yesProb > 0.5 ? '✅ YES' : yesProb < 0.5 ? '❌ NO' : '⚪ TIE';

    console.log(`   ${stats.name}`);
    console.log(`      📋 Relevant: ${stats.relevant} posts`);
    console.log(`      ✅ YES: ${stats.yes} (${(yesProb * 100).toFixed(1)}%)`);
    console.log(`      ❌ NO: ${stats.no} (${(noProb * 100).toFixed(1)}%)`);
    console.log(`      ⚪ ABSTAIN: ${stats.abstain}`);
    console.log(`      🎯 Result: ${result}\n`);
  }

  db.close();
  console.log('✅ Done with word boundary matching!');
}

main();
