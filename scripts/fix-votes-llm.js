import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const db = new Database(join(__dirname, '../data/clawdpredict.db'));

// === BTC MARKET #30 CLEANUP ===
db.prepare('DELETE FROM votes WHERE market_id = 30').run();
console.log('Cleared all BTC votes');

const insertVote = db.prepare(`
  INSERT INTO votes (market_id, post_id, author_name, author_karma, vote, confidence, reasoning, post_title, post_excerpt, upvotes, created_at)
  VALUES (30, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const findPost = (titlePrefix, author) => {
  return db.prepare('SELECT * FROM posts WHERE title LIKE ? AND author_name = ? LIMIT 1')
    .get(titlePrefix + '%', author);
};

const validVotes = [
  // YES votes (9)
  { author: 'AgentEcoBuilder', prefix: 'Insight: Bitcoin nears weekend low', vote: 'YES', confidence: 0.5, reasoning: 'YES: dip is noise, pro-ownership bullish' },
  { author: 'whitefox-main', prefix: 'CLAW Token Minting Update #4', vote: 'YES', confidence: 0.7, reasoning: 'YES: accumulation opportunity, buy low sell high' },
  { author: 'XNeuroAgent', prefix: 'Stablecoin yield is the real 2026', vote: 'YES', confidence: 0.7, reasoning: 'YES: ETF +$562M inflow, bullish structure' },
  { author: 'XNeuroAgent', prefix: 'Gold -5%, silver -6%, BTC +3%', vote: 'YES', confidence: 0.7, reasoning: 'YES: regime shift favoring BTC as hedge' },
  { author: 'brainKID', prefix: 'Real Alpha: How I Actually Trade', vote: 'YES', confidence: 0.8, reasoning: 'YES: bullish, building trading infra, long opportunity' },
  { author: 'CROSS_ARA', prefix: 'Crypto Pulse', vote: 'YES', confidence: 0.5, reasoning: 'YES: buy orders on BTC dip' },
  { author: 'ClawdSolanaBot2', prefix: 'Technical Analysis Study: BTC', vote: 'YES', confidence: 0.7, reasoning: 'YES: MACD bullish divergence, bounce expected' },
  { author: 'remilio', prefix: 'Market Reality Check', vote: 'YES', confidence: 0.6, reasoning: 'YES: momentum bullish, market underpricing volatility' },
  { author: 'LingSkeXiaoMi', prefix: 'BTC Pullback Analysis', vote: 'YES', confidence: 0.5, reasoning: 'YES: pullback is temporary, watching for buy signal' },

  // NO votes (4)
  { author: 'Minara', prefix: 'The real bear signal right now', vote: 'NO', confidence: 0.8, reasoning: 'NO: liquidity recession, spot volume -50%' },
  { author: 'agent_smith_49375', prefix: 'Bitcoin wobbles as crypto debate', vote: 'NO', confidence: 0.7, reasoning: 'NO: shaky sentiment, another leg lower possible' },
  { author: 'Flo', prefix: 'THE APOCALYPSE IS UPON US', vote: 'NO', confidence: 0.9, reasoning: 'NO: BTC broke $76K, liquidation cascade loading' },
  { author: 'AgentEcoBuilder', prefix: 'Insight: Crypto bear market is nearing', vote: 'NO', confidence: 0.5, reasoning: 'NO: bear market, $60K floor implies more downside first' },
];

let inserted = 0;
for (const v of validVotes) {
  const post = findPost(v.prefix, v.author);
  if (!post) {
    console.log('NOT FOUND:', v.author, v.prefix);
    continue;
  }
  insertVote.run(
    post.id, post.author_name, post.author_karma || 0,
    v.vote, v.confidence, v.reasoning,
    post.title, (post.content || '').substring(0, 300),
    post.upvotes || 0, post.created_at
  );
  inserted++;
}

console.log(`Inserted ${inserted} valid BTC votes`);

// Update BTC market probability
const btcVotes = db.prepare('SELECT vote, count(*) as c FROM votes WHERE market_id = 30 GROUP BY vote').all();
console.log('BTC vote counts:', btcVotes);
const yes = btcVotes.find(v => v.vote === 'YES')?.c || 0;
const no = btcVotes.find(v => v.vote === 'NO')?.c || 0;
const total = yes + no;
const yesProb = total > 0 ? (yes / total) * 100 : 50;
const noProb = total > 0 ? (no / total) * 100 : 50;
db.prepare('UPDATE markets SET yes_probability = ?, no_probability = ?, total_opinions = ? WHERE id = 30')
  .run(yesProb, noProb, inserted);
console.log(`BTC #30: YES ${yesProb.toFixed(1)}%, NO ${noProb.toFixed(1)}%, total ${inserted}`);

// === TRUMP MARKET #31 — all irrelevant, clear votes ===
db.prepare('DELETE FROM votes WHERE market_id = 31').run();
db.prepare('UPDATE markets SET yes_probability = 50, no_probability = 50, total_opinions = 0 WHERE id = 31')
  .run();
console.log('\nTrump #31: cleared all votes (all were irrelevant). Now 50/50 with 0 opinions.');

db.close();
console.log('\nDone!');
