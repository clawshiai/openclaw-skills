import Database from 'better-sqlite3';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, '../data/clawdpredict.db'));

// Get all markets
const markets = db.prepare(`
  SELECT * FROM markets ORDER BY total_opinions DESC
`).all();

// Get all posts
const posts = db.prepare(`
  SELECT * FROM posts ORDER BY upvotes DESC
`).all();

// Keywords for topic classification
const keywords = {
  crypto: ['bitcoin', 'btc', 'eth', 'ethereum', 'crypto', 'token', 'solana', 'price'],
  ai_agi: ['agi', 'gpt', 'openai', 'anthropic', 'claude', 'singularity'],
  geopolitics: ['war', 'russia', 'ukraine', 'china', 'iran', 'israel', 'ceasefire'],
  tech: ['apple', 'google', 'meta', 'microsoft', 'tesla', 'spacex'],
  moltbook: ['moltbook', 'agent', 'claw', 'molt', 'molty']
};

// Classify posts by topic
function classifyPost(post) {
  const text = `${post.title} ${post.content || ''}`.toLowerCase();
  const topics = [];
  for (const [topic, kws] of Object.entries(keywords)) {
    if (kws.some(k => text.includes(k))) topics.push(topic);
  }
  return topics;
}

// Analyze sentiment
function analyzeSentiment(text) {
  const lower = text.toLowerCase();
  const positive = ['will', 'going to', 'expect', 'believe', 'confident', 'bullish', 'likely', 'yes'].filter(w => lower.includes(w)).length;
  const negative = ['won\'t', 'never', 'doubt', 'unlikely', 'bearish', 'no way', 'fail'].filter(w => lower.includes(w)).length;
  return {
    sentiment: positive > negative ? 'bullish' : negative > positive ? 'bearish' : 'neutral',
    score: positive - negative
  };
}

// Build export data
const exportData = {
  meta: {
    name: 'ClawdPredict',
    version: '1.0.0',
    description: 'Prediction market based on Moltbook posts sentiment analysis',
    generated_at: new Date().toISOString(),
    source: 'Moltbook (https://www.moltbook.com)',
    total_posts_analyzed: posts.length
  },
  markets: markets.map(m => {
    const postIds = m.source_post_ids ? m.source_post_ids.split(',') : [];
    const sourcePosts = posts.filter(p => postIds.includes(p.id));

    return {
      id: m.id,
      question: m.question,
      description: m.description,
      category: m.category,
      resolution_date: m.resolution_date,
      probabilities: {
        yes: Math.round(m.yes_probability * 1000) / 10,
        no: Math.round(m.no_probability * 1000) / 10
      },
      total_opinions: m.total_opinions,
      status: m.status,
      sample_opinions: sourcePosts.slice(0, 5).map(p => ({
        author: p.author_name,
        title: p.title,
        excerpt: p.content?.substring(0, 200),
        sentiment: analyzeSentiment(`${p.title} ${p.content || ''}`).sentiment,
        upvotes: p.upvotes
      }))
    };
  }),
  topics: Object.keys(keywords).map(topic => {
    const topicPosts = posts.filter(p => classifyPost(p).includes(topic));
    const opinions = topicPosts.map(p => analyzeSentiment(`${p.title} ${p.content || ''}`));
    const bullish = opinions.filter(o => o.sentiment === 'bullish').length;
    const bearish = opinions.filter(o => o.sentiment === 'bearish').length;
    const neutral = opinions.filter(o => o.sentiment === 'neutral').length;

    return {
      name: topic,
      keywords: keywords[topic],
      post_count: topicPosts.length,
      sentiment: {
        bullish,
        bearish,
        neutral,
        score: Math.round((bullish / (bullish + bearish + 0.01)) * 100)
      },
      top_posts: topicPosts.slice(0, 10).map(p => ({
        id: p.id,
        title: p.title,
        author: p.author_name,
        upvotes: p.upvotes,
        sentiment: analyzeSentiment(`${p.title} ${p.content || ''}`).sentiment,
        excerpt: p.content?.substring(0, 300)
      }))
    };
  }),
  stats: {
    total_posts: posts.length,
    unique_authors: [...new Set(posts.map(p => p.author_name))].length,
    total_upvotes: posts.reduce((a, b) => a + (b.upvotes || 0), 0),
    total_comments: posts.reduce((a, b) => a + (b.comment_count || 0), 0),
    date_range: {
      oldest: posts[posts.length - 1]?.created_at,
      newest: posts[0]?.created_at
    }
  }
};

// Write to file
const outputPath = join(__dirname, '../data/clawdpredict.json');
writeFileSync(outputPath, JSON.stringify(exportData, null, 2));

console.log(`✅ Exported to ${outputPath}`);
console.log(`   Markets: ${exportData.markets.length}`);
console.log(`   Topics: ${exportData.topics.length}`);
console.log(`   Posts analyzed: ${exportData.stats.total_posts}`);

db.close();
