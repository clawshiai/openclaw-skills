const BASE = "https://www.moltbook.com/api/v1";

async function fetchJSON(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "clawshi-arena/1.0" },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function getHotPosts(limit = 20) {
  const data = await fetchJSON(`/posts?sort=hot&limit=${limit}`);
  if (!data?.posts) return [];
  return data.posts.map((p) => ({
    title: p.title,
    content: p.content?.slice(0, 200),
    upvotes: p.upvotes || 0,
    author: p.author,
    submolt: p.submolt,
  }));
}

export async function searchPosts(query, limit = 10) {
  const data = await fetchJSON(`/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  if (!data?.posts) return [];
  return data.posts.map((p) => ({
    title: p.title,
    content: p.content?.slice(0, 200),
    upvotes: p.upvotes || 0,
    author: p.author,
  }));
}

export async function researchTopic(topic) {
  const posts = await searchPosts(topic, 10);
  if (posts.length === 0) {
    return `No Moltbook posts found for "${topic}"`;
  }

  let summary = `Moltbook: ${posts.length} posts about "${topic}"\n`;
  let totalUpvotes = 0;

  for (const p of posts) {
    totalUpvotes += p.upvotes;
    summary += `  - [${p.upvotes}↑] ${p.title}\n`;
    if (p.content) summary += `    ${p.content.slice(0, 100)}...\n`;
  }

  summary += `  Total engagement: ${totalUpvotes} upvotes across ${posts.length} posts\n`;
  return summary;
}
