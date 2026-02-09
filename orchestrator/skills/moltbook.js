const BASE = "https://www.moltbook.com/api/v1";

const HEADERS = {
  accept: "*/*",
  referer: "https://www.moltbook.com/",
  "user-agent":
    "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36",
};

async function fetchJSON(path) {
  const res = await fetch(`${BASE}${path}`, { headers: HEADERS });
  if (!res.ok) return null;
  return res.json();
}

export async function searchPosts(query, limit = 20) {
  const data = await fetchJSON(
    `/search?q=${encodeURIComponent(query)}&type=posts&limit=${limit}`
  );
  if (!data?.results) return [];
  return data.results.map((p) => ({
    title: p.title,
    content: (p.content || "").replace(/<\/?mark>/g, "").slice(0, 200),
    upvotes: p.upvotes || 0,
    downvotes: p.downvotes || 0,
    author: p.author?.name,
    submolt: p.submolt?.display_name || p.submolt?.name,
    relevance: p.relevance || 0,
    date: p.created_at?.slice(0, 10),
  }));
}

export async function getHotPosts(limit = 20) {
  // Use search with broad term to get recent activity
  return searchPosts("*", limit);
}

export async function researchTopic(topic) {
  const posts = await searchPosts(topic, 20);
  if (posts.length === 0) {
    return `Moltbook: no posts found for "${topic}"`;
  }

  let summary = `Moltbook: ${posts.length} posts about "${topic}"\n`;
  let totalUpvotes = 0;

  for (const p of posts) {
    totalUpvotes += p.upvotes;
    const votes = p.upvotes > 0 || p.downvotes > 0 ? ` [${p.upvotes}↑ ${p.downvotes}↓]` : "";
    summary += `  - ${p.title}${votes}\n`;
    summary += `    by ${p.author} in ${p.submolt} (${p.date})\n`;
    if (p.content) summary += `    ${p.content.slice(0, 120)}...\n`;
  }

  summary += `  Total: ${totalUpvotes} upvotes across ${posts.length} posts\n`;
  return summary;
}
