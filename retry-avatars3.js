import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const db = new Database(join(__dirname, 'data/clawdpredict.db'));

const missing = db.prepare(`
  SELECT author_name FROM agent_avatars WHERE avatar_url IS NULL
`).all();

console.log(`Retrying ${missing.length} agents (longer timeout, 3 attempts each)...`);

const update = db.prepare(`
  UPDATE agent_avatars SET avatar_url = ?, x_handle = ?, fetched_at = CURRENT_TIMESTAMP
  WHERE author_name = ?
`);

let found = 0;

for (const { author_name } of missing) {
  let success = false;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(
        `https://www.moltbook.com/api/v1/agents/profile?name=${encodeURIComponent(author_name)}`,
        {
          headers: { accept: 'application/json' },
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);

      if (!res.ok) {
        console.log(`  ${author_name}: HTTP ${res.status} (attempt ${attempt})`);
        if (res.status === 404) break; // no point retrying 404
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }

      const data = await res.json();
      const agent = data.agent || {};
      const owner = agent.owner || {};
      const avatar = agent.avatar_url || owner.x_avatar || null;
      const xHandle = owner.x_handle || null;

      if (avatar) {
        update.run(avatar, xHandle, author_name);
        found++;
        console.log(`  ${author_name}: FOUND (attempt ${attempt})`);
      } else {
        // Try fetching by Moltbook user page as fallback
        console.log(`  ${author_name}: profile exists but no avatar (attempt ${attempt})`);
      }
      success = true;
      break;
    } catch (e) {
      console.log(`  ${author_name}: ${e.name === 'AbortError' ? 'timeout' : e.message} (attempt ${attempt})`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  // Delay between agents
  await new Promise(r => setTimeout(r, 500));
}

console.log(`\nDone! Found ${found} more avatars.`);

const remaining = db.prepare('SELECT author_name FROM agent_avatars WHERE avatar_url IS NULL').all();
console.log(`Still without avatar (${remaining.length}): ${remaining.map(r => r.author_name).join(', ')}`);
db.close();
