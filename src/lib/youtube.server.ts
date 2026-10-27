import { formatIsoDuration, normalizeQuery } from "./queue";

export interface VideoResult {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  duration: string;
}

const cache = new Map<string, { at: number; data: VideoResult[] }>();
const TTL = 10 * 60 * 1000;

function decode(s: string) {
  return s
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

async function fetchJson(url: string) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (res.status === 403 || res.status === 429) throw new Error("quota");
    if (!res.ok) throw new Error(`youtube_${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function searchYouTube(rawQuery: string, apiKey: string): Promise<VideoResult[]> {
  const q = normalizeQuery(rawQuery).slice(0, 150);
  const key = q.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.data;

  const params = new URLSearchParams({
    part: "snippet", type: "video", videoEmbeddable: "true", maxResults: "12", q, key: apiKey,
  });
  const search = await fetchJson(`https://www.googleapis.com/youtube/v3/search?${params}`);
  const items = (search.items ?? []) as Array<{ id: { videoId: string }; snippet: { title: string; channelTitle: string; thumbnails: Record<string, { url: string }> } }>;
  const ids = items.map((i) => i.id.videoId).filter(Boolean);
  const durations = new Map<string, string>();
  if (ids.length) {
    const vp = new URLSearchParams({ part: "contentDetails", id: ids.join(","), key: apiKey });
    const vids = await fetchJson(`https://www.googleapis.com/youtube/v3/videos?${vp}`);
    for (const v of vids.items ?? []) durations.set(v.id, formatIsoDuration(v.contentDetails?.duration ?? ""));
  }
  const data = items.map((i) => ({
    videoId: i.id.videoId,
    title: decode(i.snippet.title),
    channelTitle: decode(i.snippet.channelTitle),
    thumbnail: i.snippet.thumbnails?.["medium"]?.url ?? i.snippet.thumbnails?.["default"]?.url ?? "",
    duration: durations.get(i.id.videoId) ?? "",
  }));
  if (cache.size >= 100) cache.delete(cache.keys().next().value as string);
  cache.set(key, { at: Date.now(), data });
  return data;
}
