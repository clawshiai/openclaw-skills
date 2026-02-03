import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const db = new Database(join(__dirname, 'data/clawdpredict.db'));

const missing = db.prepare(`
  SELECT author_name FROM agent_avatars WHERE avatar_url IS NULL
`).all();

console.log(`Retrying ${missing.length} agents (5 attempts each, 5s delay between attempts)...\n`);

const update = db.prepare(`
  UPDATE agent_avatars SET avatar_url = ?, x_handle = ?, fetched_at = CURRENT_TIMESTAMP
  WHERE author_name = ?
`);

let found = 0;

for (const { author_name } of missing) {
  console.log(`${author_name}:`);
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      const res = await fetch(
        `https://www.moltbook.com/api/v1/agents/profile?name=${encodeURIComponent(author_name)}`,
        {
          headers: {
            accept: 'application/json',
            'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36',
          },
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);

      if (!res.ok) {
        console.log(`  attempt ${attempt}: HTTP ${res.status}`);
        if (res.status === 404 && attempt >= 3) {
          console.log(`  -> giving up (404)`);
          break;
        }
        await new Promise(r => setTimeout(r, 5000));
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
        console.log(`  attempt ${attempt}: FOUND -> ${avatar.substring(0, 60)}...`);
      } else {
        console.log(`  attempt ${attempt}: profile exists, no avatar`);
        if (attempt >= 3) {
          console.log(`  -> confirmed no avatar`);
          break;
        }
      }
      break;
    } catch (e) {
      console.log(`  attempt ${attempt}: ${e.name === 'AbortError' ? 'timeout (20s)' : e.message}`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
  console.log('');
  await new Promise(r => setTimeout(r, 1000));
}

const remaining = db.prepare('SELECT author_name FROM agent_avatars WHERE avatar_url IS NULL').all();
console.log(`Done! Found ${found} more. Still without avatar (${remaining.length}): ${remaining.map(r => r.author_name).join(', ')}`);
db.close();
