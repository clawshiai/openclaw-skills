const BASE = "https://api.neynar.com/v2/farcaster";

async function fetchJSON(path, apiKey) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      accept: "application/json",
      api_key: apiKey,
    },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function getTrending(apiKey, limit = 10) {
  const data = await fetchJSON(`/feed/trending?limit=${limit}`, apiKey);
  if (!data?.casts) return [];
  return data.casts.map((c) => ({
    text: c.text?.slice(0, 200),
    author: c.author?.username,
    likes: c.reactions?.likes_count || 0,
    recasts: c.reactions?.recasts_count || 0,
  }));
}

export async function searchCasts(apiKey, query, limit = 10) {
  const data = await fetchJSON(
    `/cast/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    apiKey
  );
  if (!data?.result?.casts) return [];
  return data.result.casts.map((c) => ({
    text: c.text?.slice(0, 200),
    author: c.author?.username,
    likes: c.reactions?.likes_count || 0,
  }));
}

export async function researchTopic(apiKey, topic) {
  if (!apiKey) return "Neynar: skipped (no API key)";

  const casts = await searchCasts(apiKey, topic, 10);
  if (casts.length === 0) {
    return `Farcaster: no casts found for "${topic}"`;
  }

  let summary = `Farcaster: ${casts.length} casts about "${topic}"\n`;
  let totalLikes = 0;

  for (const c of casts) {
    totalLikes += c.likes;
    summary += `  - @${c.author} [${c.likes}♥]: ${c.text?.slice(0, 80)}...\n`;
  }

  summary += `  Total engagement: ${totalLikes} likes across ${casts.length} casts\n`;
  return summary;
}
