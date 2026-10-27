import { describe, expect, it } from "vitest";
import { durationToSeconds, formatIsoDuration, normalizeQuery, playOrder, waitInfo, type SongRequest } from "./queue";

const row = (id: string, status: string, position: number, duration = "3:00", created_at = "2026-01-01T00:00:00Z"): SongRequest => ({
  id, status, position, duration, created_at, user_id: null, singer_name: id, song_title: id,
  video_id: "x", channel_title: null, thumbnail_url: null, updated_at: created_at,
});

describe("queue", () => {
  it("orders playing, then next, then waiting by position", () => {
    const rows = [row("w2", "waiting", 2), row("n", "next", 9), row("w1", "waiting", 1), row("p", "playing", 5), row("d", "done", 0)];
    expect(playOrder(rows).map((r) => r.id)).toEqual(["p", "n", "w1", "w2"]);
  });
  it("sums durations of songs ahead", () => {
    const rows = [row("p", "playing", 0, "4:00"), row("a", "waiting", 1, "3:30"), row("me", "waiting", 2)];
    expect(waitInfo(rows, "me")).toEqual({ place: 3, seconds: 450 });
  });
  it("formats ISO durations", () => {
    expect(formatIsoDuration("PT3M45S")).toBe("3:45");
    expect(formatIsoDuration("PT1H2M3S")).toBe("1:02:03");
    expect(durationToSeconds("3:45")).toBe(225);
  });
  it("appends karaoke when missing", () => {
    expect(normalizeQuery("Queen Bohemian")).toBe("Queen Bohemian karaoke");
    expect(normalizeQuery("Queen instrumental")).toBe("Queen instrumental");
  });
});
