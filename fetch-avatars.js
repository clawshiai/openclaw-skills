import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const db = new Database(join(__dirname, 'data/clawdpredict.db'));

// Create avatar cache table
db.exec(`
  CREATE TABLE IF NOT EXISTS agent_avatars (
    author_name TEXT PRIMARY KEY,
    avatar_url TEXT,
    x_handle TEXT,
    fetched_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Get all unique authors from votes
const authors = db.prepare(`
  SELECT DISTINCT author_name FROM votes
  WHERE author_name IS NOT NULL
  ORDER BY author_name
`).all();

console.log(`Fetching avatars for ${authors.length} agents...`);

const upsert = db.prepare(`
  INSERT INTO agent_avatars (author_name, avatar_url, x_handle, fetched_at)
  VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  ON CONFLICT(author_name) DO UPDATE SET
    avatar_url = excluded.avatar_url,
    x_handle = excluded.x_handle,
    fetched_at = CURRENT_TIMESTAMP
`);

let found = 0;
let notFound = 0;
let errors = 0;

for (let i = 0; i < authors.length; i++) {
  const name = authors[i].author_name;
  try {
    const res = await fetch(
      `https://www.moltbook.com/api/v1/agents/profile?name=${encodeURIComponent(name)}`,
      { headers: { accept: 'application/json' } }
    );
    if (!res.ok) {
      errors++;
      continue;
    }
    const data = await res.json();
    const agent = data.agent || {};
    const owner = agent.owner || {};
    const avatar = agent.avatar_url || owner.x_avatar || null;
    const xHandle = owner.x_handle || null;

    upsert.run(name, avatar, xHandle);

    if (avatar) {
      found++;
    } else {
      notFound++;
    }

    if ((i + 1) % 10 === 0 || i === authors.length - 1) {
      console.log(`  [${i + 1}/${authors.length}] found: ${found}, no avatar: ${notFound}, errors: ${errors}`);
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 100));
  } catch (err) {
    errors++;
    console.error(`  Error fetching ${name}: ${err.message}`);
  }
}

console.log(`\nDone! ${found} avatars found, ${notFound} without avatar, ${errors} errors.`);
db.close();
