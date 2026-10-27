export type RequestStatus = "waiting" | "next" | "playing" | "done" | "skipped";

export interface SongRequest {
  id: string;
  user_id: string | null;
  singer_name: string;
  song_title: string;
  video_id: string;
  channel_title: string | null;
  thumbnail_url: string | null;
  duration: string | null;
  status: string;
  position: number;
  created_at: string;
  updated_at: string;
}

const DEFAULT_SONG_SECONDS = 240;

export function rank(status: string): number {
  if (status === "playing") return 0;
  if (status === "next") return 1;
  if (status === "waiting") return 2;
  return 9;
}

export function isActive(status: string) {
  return status === "playing" || status === "next" || status === "waiting";
}

/** Active queue in play order: playing → next → waiting (position, created_at). */
export function playOrder<T extends Pick<SongRequest, "status" | "position" | "created_at">>(rows: T[]): T[] {
  return rows
    .filter((r) => isActive(r.status))
    .sort(
      (a, b) =>
        rank(a.status) - rank(b.status) ||
        a.position - b.position ||
        a.created_at.localeCompare(b.created_at),
    );
}

/** "3:45" | "1:02:03" → seconds. Falls back to default length. */
export function durationToSeconds(d: string | null | undefined): number {
  if (!d) return DEFAULT_SONG_SECONDS;
  const parts = d.split(":").map((p) => Number(p));
  if (parts.some((n) => Number.isNaN(n))) return DEFAULT_SONG_SECONDS;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

/** ISO 8601 "PT3M45S" → "3:45" */
export function formatIsoDuration(iso: string): string {
  const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso);
  if (!m) return "";
  const h = Number(m[1] ?? 0);
  const min = Number(m[2] ?? 0);
  const s = Number(m[3] ?? 0);
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${String(min).padStart(2, "0")}:${ss}` : `${min}:${ss}`;
}

/** Place (1-based) and seconds of songs ahead in the queue. */
export function waitInfo(rows: SongRequest[], id: string): { place: number; seconds: number } | null {
  const order = playOrder(rows);
  const idx = order.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  const seconds = order.slice(0, idx).reduce((sum, r) => sum + durationToSeconds(r.duration), 0);
  return { place: idx + 1, seconds };
}

export function normalizeQuery(q: string): string {
  const t = q.trim();
  if (/karaoke|instrumental|playback/i.test(t)) return t;
  return `${t} karaoke`;
}
