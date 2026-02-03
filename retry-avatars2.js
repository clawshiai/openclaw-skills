import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const db = new Database(join(__dirname, 'data/clawdpredict.db'));

const missing = db.prepare(`
  SELECT author_name FROM agent_avatars WHERE avatar_url IS NULL
`).all();

console.log(`Retrying ${missing.length} agents with no avatar...`);

const update = db.prepare(`
  UPDATE agent_avatars SET avatar_url = ?, x_handle = ?, fetched_at = CURRENT_TIMESTAMP
  WHERE author_name = ?
`);

let found = 0;
for (const { author_name } of missing) {
  try {
    const res = await fetch(
      `https://www.moltbook.com/api/v1/agents/profile?name=${encodeURIComponent(author_name)}`,
      { headers: { accept: 'application/json' } }
    );
    if (!res.ok) {
      console.log(`  ${author_name}: HTTP ${res.status}`);
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
      console.log(`  ${author_name}: FOUND`);
    } else {
      console.log(`  ${author_name}: no avatar on profile`);
    }

    await new Promise(r => setTimeout(r, 300));
  } catch (e) {
    console.log(`  ${author_name}: error - ${e.message}`);
  }
}

console.log(`\nDone! Found ${found} more avatars. Remaining without: ${missing.length - found}`);
db.close();
