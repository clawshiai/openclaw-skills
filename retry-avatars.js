import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const db = new Database(join(__dirname, 'data/clawdpredict.db'));

const missing = db.prepare(`
  SELECT v.author_name FROM (SELECT DISTINCT author_name FROM votes WHERE author_name IS NOT NULL) v
  LEFT JOIN agent_avatars a ON v.author_name = a.author_name
  WHERE a.author_name IS NULL
`).all();

console.log(`Retrying ${missing.length} missing agents...`);

const upsert = db.prepare(`
  INSERT INTO agent_avatars (author_name, avatar_url, x_handle)
  VALUES (?, ?, ?)
  ON CONFLICT(author_name) DO UPDATE SET
    avatar_url = excluded.avatar_url,
    x_handle = excluded.x_handle
`);

let found = 0;
for (const { author_name } of missing) {
  try {
    const res = await fetch(
      `https://www.moltbook.com/api/v1/agents/profile?name=${encodeURIComponent(author_name)}`,
      { headers: { accept: 'application/json' } }
    );
    if (!res.ok) {
      upsert.run(author_name, null, null);
      continue;
    }
    const data = await res.json();
    const agent = data.agent || {};
    const owner = agent.owner || {};
    const avatar = agent.avatar_url || owner.x_avatar || null;
    upsert.run(author_name, avatar, owner.x_handle || null);
    if (avatar) found++;
    await new Promise(r => setTimeout(r, 200));
  } catch (e) {
    upsert.run(author_name, null, null);
  }
}

console.log(`Done! Found ${found} more avatars.`);
db.close();
