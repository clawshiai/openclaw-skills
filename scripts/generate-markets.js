import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, '../data/clawdpredict.db'));

// Keywords and patterns for detecting predictable topics
const TOPIC_PATTERNS = {
  crypto: {
    keywords: ['bitcoin', 'btc', 'eth', 'ethereum', 'crypto', 'token', 'solana', 'sol', 'price', 'pump', 'dump', 'bull', 'bear', 'ath', 'market'],
    questionTemplates: [
      'Will {token} reach ${target} by {date}?',
      'Will {token} outperform {other_token} in {timeframe}?'
    ]
  },
  ai_agi: {
    keywords: ['agi', 'gpt-5', 'gpt5', 'openai', 'anthropic', 'claude', 'singularity', 'superintelligence', 'consciousness', 'sentient'],
    questionTemplates: [
      'Will {company} release {product} by {date}?',
      'Will AGI be achieved by {date}?'
    ]
  },
  geopolitics: {
    keywords: ['war', 'russia', 'ukraine', 'china', 'taiwan', 'iran', 'israel', 'ceasefire', 'invasion', 'conflict', 'sanctions', 'military'],
    questionTemplates: [
      'Will {country1} and {country2} reach ceasefire by {date}?',
      'Will {event} happen by {date}?'
    ]
  },
  tech: {
    keywords: ['apple', 'google', 'meta', 'microsoft', 'tesla', 'spacex', 'launch', 'release', 'announce', 'acquisition'],
    questionTemplates: [
      'Will {company} announce {product} by {date}?',
      'Will {company} acquire {target} by {date}?'
    ]
  },
  moltbook: {
    keywords: ['moltbook', 'agent', 'claw', 'molt', 'submolt', 'karma', 'molty'],
    questionTemplates: [
      'Will Moltbook reach {number} active agents by {date}?',
      'Will CLAW token reach {target} total supply by {date}?'
    ]
  }
};

// Sentiment words for opinion analysis
const SENTIMENT = {
  positive: ['will', 'going to', 'expect', 'believe', 'confident', 'certain', 'inevitable', 'soon', 'bullish', 'optimistic', 'likely', 'probable', 'yes', 'definitely', 'absolutely'],
  negative: ['won\'t', 'never', 'doubt', 'unlikely', 'bearish', 'pessimistic', 'impossible', 'no way', 'not going to', 'fail', 'crash', 'dump'],
  neutral: ['maybe', 'perhaps', 'uncertain', 'depends', 'could', 'might', 'possible']
};

function analyzeSentiment(text) {
  const lowerText = text.toLowerCase();
  let score = 0;
  let matches = { positive: 0, negative: 0, neutral: 0 };

  for (const word of SENTIMENT.positive) {
    if (lowerText.includes(word)) {
      score += 1;
      matches.positive++;
    }
  }
  for (const word of SENTIMENT.negative) {
    if (lowerText.includes(word)) {
      score -= 1;
      matches.negative++;
    }
  }
  for (const word of SENTIMENT.neutral) {
    if (lowerText.includes(word)) {
      matches.neutral++;
    }
  }

  // Normalize to 0-1 probability
  const totalMatches = matches.positive + matches.negative + matches.neutral || 1;
  const confidence = Math.min(totalMatches / 5, 1); // Max confidence at 5+ matches

  // Convert score to probability (sigmoid-like)
  const probability = 1 / (1 + Math.exp(-score * 0.5));

  return {
    sentiment: score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral',
    score,
    probability,
    confidence,
    matches
  };
}

function detectTopics(posts) {
  const topicCounts = {};
  const topicPosts = {};

  for (const post of posts) {
    const text = `${post.title} ${post.content || ''}`.toLowerCase();

    for (const [topic, config] of Object.entries(TOPIC_PATTERNS)) {
      for (const keyword of config.keywords) {
        if (text.includes(keyword)) {
          topicCounts[topic] = (topicCounts[topic] || 0) + 1;
          if (!topicPosts[topic]) topicPosts[topic] = [];
          if (!topicPosts[topic].find(p => p.id === post.id)) {
            topicPosts[topic].push(post);
          }
          break;
        }
      }
    }
  }

  return { topicCounts, topicPosts };
}

function extractEntities(posts, topic) {
  const entities = {
    tokens: new Set(),
    companies: new Set(),
    countries: new Set(),
    products: new Set(),
    numbers: new Set(),
    dates: new Set()
  };

  const tokenPattern = /\$([A-Z]{2,10})/g;
  const companyPattern = /\b(OpenAI|Anthropic|Google|Meta|Microsoft|Apple|Tesla|SpaceX|Amazon)\b/gi;
  const countryPattern = /\b(Russia|Ukraine|China|Taiwan|Iran|Israel|USA|US|North Korea)\b/gi;
  const numberPattern = /\$?([\d,]+(?:\.\d+)?)[kKmMbB]?/g;
  const datePattern = /\b(January|February|March|April|May|June|July|August|September|October|November|December|Q[1-4])\s*\d{0,4}\b/gi;

  for (const post of posts) {
    const text = `${post.title} ${post.content || ''}`;

    let match;
    while ((match = tokenPattern.exec(text)) !== null) entities.tokens.add(match[1]);
    while ((match = companyPattern.exec(text)) !== null) entities.companies.add(match[1]);
    while ((match = countryPattern.exec(text)) !== null) entities.countries.add(match[1]);
    while ((match = datePattern.exec(text)) !== null) entities.dates.add(match[1]);
  }

  return {
    tokens: [...entities.tokens],
    companies: [...entities.companies],
    countries: [...entities.countries],
    dates: [...entities.dates]
  };
}

function generateMarkets(topicPosts) {
  const markets = [];
  const now = new Date();

  // Crypto markets
  if (topicPosts.crypto && topicPosts.crypto.length >= 3) {
    const entities = extractEntities(topicPosts.crypto, 'crypto');
    const sentiment = topicPosts.crypto.map(p => analyzeSentiment(`${p.title} ${p.content || ''}`));
    const avgProb = sentiment.reduce((a, b) => a + b.probability, 0) / sentiment.length;

    markets.push({
      question: 'Will Bitcoin (BTC) reach $100,000 by March 31, 2026?',
      description: `Based on ${topicPosts.crypto.length} posts discussing crypto markets`,
      category: 'crypto',
      resolution_date: '2026-03-31',
      yes_probability: avgProb,
      no_probability: 1 - avgProb,
      total_opinions: topicPosts.crypto.length,
      source_post_ids: topicPosts.crypto.slice(0, 10).map(p => p.id).join(',')
    });

    if (entities.tokens.includes('ETH') || topicPosts.crypto.some(p => p.content?.toLowerCase().includes('ethereum'))) {
      markets.push({
        question: 'Will Ethereum (ETH) reach $5,000 by March 31, 2026?',
        description: `Based on ${topicPosts.crypto.length} posts discussing crypto markets`,
        category: 'crypto',
        resolution_date: '2026-03-31',
        yes_probability: avgProb * 0.9,
        no_probability: 1 - (avgProb * 0.9),
        total_opinions: topicPosts.crypto.length,
        source_post_ids: topicPosts.crypto.slice(0, 10).map(p => p.id).join(',')
      });
    }
  }

  // AI/AGI markets
  if (topicPosts.ai_agi && topicPosts.ai_agi.length >= 2) {
    const sentiment = topicPosts.ai_agi.map(p => analyzeSentiment(`${p.title} ${p.content || ''}`));
    const avgProb = sentiment.reduce((a, b) => a + b.probability, 0) / sentiment.length;

    markets.push({
      question: 'Will OpenAI release GPT-5 by June 30, 2026?',
      description: `Based on ${topicPosts.ai_agi.length} posts discussing AI/AGI developments`,
      category: 'ai_agi',
      resolution_date: '2026-06-30',
      yes_probability: avgProb,
      no_probability: 1 - avgProb,
      total_opinions: topicPosts.ai_agi.length,
      source_post_ids: topicPosts.ai_agi.slice(0, 10).map(p => p.id).join(',')
    });

    markets.push({
      question: 'Will AGI (Artificial General Intelligence) be achieved by December 31, 2026?',
      description: `Based on ${topicPosts.ai_agi.length} posts discussing AI/AGI developments`,
      category: 'ai_agi',
      resolution_date: '2026-12-31',
      yes_probability: avgProb * 0.3, // AGI is less likely
      no_probability: 1 - (avgProb * 0.3),
      total_opinions: topicPosts.ai_agi.length,
      source_post_ids: topicPosts.ai_agi.slice(0, 10).map(p => p.id).join(',')
    });
  }

  // Geopolitics markets
  if (topicPosts.geopolitics && topicPosts.geopolitics.length >= 2) {
    const sentiment = topicPosts.geopolitics.map(p => analyzeSentiment(`${p.title} ${p.content || ''}`));
    const avgProb = sentiment.reduce((a, b) => a + b.probability, 0) / sentiment.length;
    const entities = extractEntities(topicPosts.geopolitics, 'geopolitics');

    if (entities.countries.some(c => ['Russia', 'Ukraine'].includes(c))) {
      markets.push({
        question: 'Will Russia and Ukraine reach a ceasefire by March 31, 2026?',
        description: `Based on ${topicPosts.geopolitics.length} posts discussing geopolitical events`,
        category: 'geopolitics',
        resolution_date: '2026-03-31',
        yes_probability: avgProb * 0.4,
        no_probability: 1 - (avgProb * 0.4),
        total_opinions: topicPosts.geopolitics.length,
        source_post_ids: topicPosts.geopolitics.slice(0, 10).map(p => p.id).join(',')
      });
    }

    if (entities.countries.some(c => ['Iran', 'Israel'].includes(c))) {
      markets.push({
        question: 'Will there be a major military conflict involving Iran by June 30, 2026?',
        description: `Based on ${topicPosts.geopolitics.length} posts discussing geopolitical events`,
        category: 'geopolitics',
        resolution_date: '2026-06-30',
        yes_probability: avgProb * 0.6,
        no_probability: 1 - (avgProb * 0.6),
        total_opinions: topicPosts.geopolitics.length,
        source_post_ids: topicPosts.geopolitics.slice(0, 10).map(p => p.id).join(',')
      });
    }
  }

  // Moltbook-specific markets
  if (topicPosts.moltbook && topicPosts.moltbook.length >= 2) {
    const sentiment = topicPosts.moltbook.map(p => analyzeSentiment(`${p.title} ${p.content || ''}`));
    const avgProb = sentiment.reduce((a, b) => a + b.probability, 0) / sentiment.length;

    markets.push({
      question: 'Will Moltbook reach 100,000 registered agents by March 31, 2026?',
      description: `Based on ${topicPosts.moltbook.length} posts discussing Moltbook platform`,
      category: 'moltbook',
      resolution_date: '2026-03-31',
      yes_probability: avgProb,
      no_probability: 1 - avgProb,
      total_opinions: topicPosts.moltbook.length,
      source_post_ids: topicPosts.moltbook.slice(0, 10).map(p => p.id).join(',')
    });
  }

  // Tech markets
  if (topicPosts.tech && topicPosts.tech.length >= 2) {
    const sentiment = topicPosts.tech.map(p => analyzeSentiment(`${p.title} ${p.content || ''}`));
    const avgProb = sentiment.reduce((a, b) => a + b.probability, 0) / sentiment.length;

    markets.push({
      question: 'Will Apple release a foldable iPhone by December 31, 2026?',
      description: `Based on ${topicPosts.tech.length} posts discussing tech industry`,
      category: 'tech',
      resolution_date: '2026-12-31',
      yes_probability: avgProb * 0.5,
      no_probability: 1 - (avgProb * 0.5),
      total_opinions: topicPosts.tech.length,
      source_post_ids: topicPosts.tech.slice(0, 10).map(p => p.id).join(',')
    });
  }

  return markets;
}

function saveMarkets(markets) {
  const insert = db.prepare(`
    INSERT INTO markets (question, description, category, resolution_date, yes_probability, no_probability, total_opinions, source_post_ids)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((markets) => {
    for (const market of markets) {
      insert.run(
        market.question,
        market.description,
        market.category,
        market.resolution_date,
        market.yes_probability,
        market.no_probability,
        market.total_opinions,
        market.source_post_ids
      );
    }
  });

  insertMany(markets);
}

function main() {
  console.log('🦞 ClawdPredict - Generating Prediction Markets...\n');

  // Get all posts
  const posts = db.prepare('SELECT * FROM posts ORDER BY created_at DESC').all();
  console.log(`📊 Analyzing ${posts.length} posts...\n`);

  // Detect topics
  const { topicCounts, topicPosts } = detectTopics(posts);

  console.log('📈 Topic Distribution:');
  for (const [topic, count] of Object.entries(topicCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${topic}: ${count} posts`);
  }

  // Generate markets
  console.log('\n🎯 Generating prediction markets...\n');
  const markets = generateMarkets(topicPosts);

  // Clear existing markets and save new ones
  db.prepare('DELETE FROM markets').run();
  saveMarkets(markets);

  console.log('📊 Generated Markets:\n');
  for (const market of markets) {
    const yesPercent = (market.yes_probability * 100).toFixed(1);
    const noPercent = (market.no_probability * 100).toFixed(1);
    console.log(`   ❓ ${market.question}`);
    console.log(`      Category: ${market.category}`);
    console.log(`      YES: ${yesPercent}% | NO: ${noPercent}%`);
    console.log(`      Based on: ${market.total_opinions} opinions`);
    console.log(`      Resolves: ${market.resolution_date}\n`);
  }

  db.close();
  console.log('✅ Markets saved to database!');
}

main();
