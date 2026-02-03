import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const db = new Database(join(__dirname, '../data/clawdpredict.db'));

// 1. Insert 2 new markets
const insert = db.prepare(`
  INSERT INTO markets (question, description, category, resolution_date, created_at, yes_probability, no_probability, total_opinions, status)
  VALUES (?, ?, ?, ?, datetime('now'), 0.5, 0.5, 0, 'active')
`);

const btc = insert.run(
  'Will Bitcoin (BTC) recover above $80,000 by February 28, 2026?',
  'Resolves YES if BTC trades above $80,000 on any major exchange before end of February 2026. Based on Moltbook community sentiment about BTC price recovery after recent crash to $74K range.',
  'crypto',
  '2026-02-28'
);

const trump = insert.run(
  'Will Trump remain US President through March 31, 2026?',
  'Resolves YES if Donald Trump is still serving as President of the United States on March 31, 2026. Resolves NO if he resigns, is removed, or otherwise ceases to hold office before that date.',
  'geopolitics',
  '2026-03-31'
);

console.log('BTC market created: ID', btc.lastInsertRowid);
console.log('Trump market created: ID', trump.lastInsertRowid);

// 2. Generate votes for these 2 new markets
const posts = db.prepare('SELECT * FROM posts ORDER BY upvotes DESC').all();
console.log(`\nScanning ${posts.length} posts...`);

function matchWholeWord(text, word) {
  const regex = new RegExp(`\\b${word}\\b`, 'i');
  return regex.test(text);
}

const configs = {
  [btc.lastInsertRowid]: {
    name: 'BTC Recovery',
    required: ['bitcoin', 'btc'],
    context: ['price', 'dollar', '80k', '80,000', '74k', '75k', '78k', 'crash', 'recovery', 'recover', 'dip', 'low', 'drop', 'usd', 'trading', 'market', 'sell', 'buy', 'bearish', 'bullish'],
    yes: ['recover', 'recovery', 'bounce', 'bullish', 'bull', 'moon', 'pump', 'rally', 'buy', 'long', 'going up', 'bottom', 'accumulate', 'stack', 'stacking', 'opportunity'],
    no: ['crash', 'dump', 'bearish', 'bear', 'sell', 'short', 'drop', 'fall', 'decline', 'correction', 'fear', 'panic', 'lower', 'capitulation', 'dead']
  },
  [trump.lastInsertRowid]: {
    name: 'Trump President',
    required: ['trump'],
    context: ['president', 'resign', 'removed', 'impeach', 'office', 'administration', 'tariff', 'policy', 'executive', 'government', 'election', 'political'],
    yes: ['president', 'governing', 'policy', 'tariff', 'executive', 'administration', 'strong', 'power', 'elected', 'mandate', 'ruling'],
    no: ['resign', 'removed', 'impeach', 'convicted', 'step down', 'leave', 'ousted', 'overthrow', 'gone', 'finished']
  }
};

const insertVote = db.prepare(`
  INSERT OR IGNORE INTO votes (market_id, post_id, author_name, author_karma, vote, confidence, reasoning, post_title, post_excerpt, upvotes, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const results = {};

for (const [marketId, config] of Object.entries(configs)) {
  results[marketId] = { name: config.name, yes: 0, no: 0, abstain: 0, total: 0 };

  for (const post of posts) {
    const text = `${post.title} ${post.content || ''}`.toLowerCase();

    // Check required keywords
    const hasRequired = config.required.some(kw => matchWholeWord(text, kw));
    if (!hasRequired) continue;

    // Check context keywords
    const hasContext = config.context.some(kw => matchWholeWord(text, kw));
    if (!hasContext) continue;

    results[marketId].total++;

    // Analyze vote
    let yesCount = 0, noCount = 0;
    const yesMatched = [], noMatched = [];
    for (const w of config.yes) {
      if (matchWholeWord(text, w)) { yesCount++; yesMatched.push(w); }
    }
    for (const w of config.no) {
      if (matchWholeWord(text, w)) { noCount++; noMatched.push(w); }
    }

    let vote, confidence, reasoning;
    if (yesCount === 0 && noCount === 0) {
      vote = 'ABSTAIN'; confidence = 0; reasoning = 'No clear position';
    } else if (yesCount > noCount) {
      vote = 'YES'; confidence = Math.min(yesCount / 3, 1); reasoning = 'YES: ' + yesMatched.join(', ');
    } else if (noCount > yesCount) {
      vote = 'NO'; confidence = Math.min(noCount / 3, 1); reasoning = 'NO: ' + noMatched.join(', ');
    } else {
      vote = 'ABSTAIN'; confidence = 0.3;
      reasoning = `Mixed: YES(${yesMatched.join(',')}) vs NO(${noMatched.join(',')})`;
    }

    results[marketId][vote.toLowerCase()]++;

    insertVote.run(
      Number(marketId), post.id, post.author_name, post.author_karma || 0,
      vote, confidence, reasoning, post.title,
      (post.content || '').substring(0, 300), post.upvotes || 0, post.created_at
    );
  }
}

// Update probabilities
const updateMarket = db.prepare(
  'UPDATE markets SET yes_probability = ?, no_probability = ?, total_opinions = ? WHERE id = ?'
);

for (const [id, stats] of Object.entries(results)) {
  const valid = stats.yes + stats.no;
  const yesProb = valid > 0 ? stats.yes / valid : 0.5;
  const noProb = valid > 0 ? stats.no / valid : 0.5;
  updateMarket.run(yesProb, noProb, stats.total, Number(id));

  console.log(`\n${stats.name} (market #${id}):`);
  console.log(`  Relevant posts: ${stats.total}`);
  console.log(`  YES: ${stats.yes} (${(yesProb * 100).toFixed(1)}%)`);
  console.log(`  NO: ${stats.no} (${(noProb * 100).toFixed(1)}%)`);
  console.log(`  ABSTAIN: ${stats.abstain}`);
}

db.close();
console.log('\nDone!');
