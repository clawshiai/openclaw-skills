import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const API_KEY = process.env.MOLTBOOK_API_KEY || 'moltbook_sk_2ipjb4LafUpap6hiaiQ6xLXSIBsPbdbM';
const API_BASE = 'https://www.moltbook.com/api/v1';
const TARGET_NEW = 1000;
const BATCH_SIZE = 100;

const db = new Database(join(__dirname, '../data/clawdpredict.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    url TEXT,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    created_at TEXT,
    author_id TEXT,
    author_name TEXT,
    author_karma INTEGER,
    submolt_name TEXT,
    fetched_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS markets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    description TEXT,
    category TEXT,
    resolution_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    yes_probability REAL DEFAULT 0.5,
    no_probability REAL DEFAULT 0.5,
    total_opinions INTEGER DEFAULT 0,
    source_post_ids TEXT,
    status TEXT DEFAULT 'active'
  );

  CREATE TABLE IF NOT EXISTS opinions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    market_id INTEGER,
    post_id TEXT,
    sentiment TEXT,
    confidence REAL,
    reasoning TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (market_id) REFERENCES markets(id),
    FOREIGN KEY (post_id) REFERENCES posts(id)
  );

  CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
  CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_name);
  CREATE INDEX IF NOT EXISTS idx_posts_submolt ON posts(submolt_name);
`);

const existingIds = new Set(
  db.prepare('SELECT id FROM posts').all().map(r => r.id)
);

async function fetchPosts(offset, limit, sort = 'new') {
  const url = `${API_BASE}/posts?sort=${sort}&limit=${limit}&offset=${offset}`;
  const response = await fetch(url, {
    headers: { 'x-api-key': API_KEY }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API ${response.status}: ${text.slice(0, 100)}`);
  }

  const data = await response.json();
  return data.posts || [];
}

function savePosts(posts) {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO posts (
      id, title, content, url, upvotes, downvotes, comment_count,
      created_at, author_id, author_name, author_karma, submolt_name
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let newCount = 0;
  const insertMany = db.transaction((posts) => {
    for (const post of posts) {
      if (existingIds.has(post.id)) continue;
      const result = insert.run(
        post.id,
        post.title,
        post.content,
        post.url,
        post.upvotes || 0,
        post.downvotes || 0,
        post.comment_count || 0,
        post.created_at,
        post.author?.id,
        post.author?.name,
        post.author?.karma || 0,
        post.submolt?.name
      );
      if (result.changes > 0) {
        existingIds.add(post.id);
        newCount++;
      }
    }
  });

  insertMany(posts);
  return newCount;
}

async function fetchWithSort(sort, maxOffset = 5000) {
  let newTotal = 0;
  let emptyStreak = 0;
  const maxEmptyStreak = 5;

  console.log(`\n📋 Fetching with sort=${sort}...`);

  for (let offset = 0; offset < maxOffset && newTotal < TARGET_NEW; offset += BATCH_SIZE) {
    try {
      const posts = await fetchPosts(offset, BATCH_SIZE, sort);

      if (posts.length === 0) {
        emptyStreak++;
        if (emptyStreak >= maxEmptyStreak) {
          console.log(`   ⏭️  ${maxEmptyStreak} empty pages in a row, moving on`);
          break;
        }
        console.log(`   ⚠️  Empty at offset ${offset} (streak: ${emptyStreak})`);
        await new Promise(r => setTimeout(r, 300));
        continue;
      }

      emptyStreak = 0;
      const newCount = savePosts(posts);
      newTotal += newCount;
      console.log(`   offset=${offset}: ${posts.length} fetched, ${newCount} new (running: ${newTotal})`);

      await new Promise(r => setTimeout(r, 400));
    } catch (error) {
      console.error(`   ❌ offset=${offset}: ${error.message}`);
      emptyStreak++;
      if (emptyStreak >= maxEmptyStreak) break;
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  return newTotal;
}

async function main() {
  const startCount = db.prepare('SELECT COUNT(*) as c FROM posts').get().c;
  console.log(`🦞 ClawdPredict - Fetching more posts from Moltbook`);
  console.log(`   Starting with ${startCount} posts in database`);
  console.log(`   Target: ${TARGET_NEW} new unique posts\n`);

  let totalNew = 0;

  for (const sort of ['new', 'hot', 'top', 'rising']) {
    if (totalNew >= TARGET_NEW) break;
    const count = await fetchWithSort(sort);
    totalNew += count;
    console.log(`   ✅ sort=${sort} added ${count} new posts (total new: ${totalNew})`);
  }

  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_posts,
      COUNT(DISTINCT author_name) as unique_authors,
      SUM(upvotes) as total_upvotes,
      SUM(comment_count) as total_comments
    FROM posts
  `).get();

  console.log('\n📊 Database Stats:');
  console.log(`   Total Posts: ${stats.total_posts} (+${stats.total_posts - startCount} new)`);
  console.log(`   Unique Authors: ${stats.unique_authors}`);
  console.log(`   Total Upvotes: ${stats.total_upvotes}`);
  console.log(`   Total Comments: ${stats.total_comments}`);

  db.close();
  console.log('\n✅ Done!');
}

main().catch(console.error);
