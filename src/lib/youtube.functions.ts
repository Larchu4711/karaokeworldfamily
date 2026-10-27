import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { searchYouTube, type VideoResult } from "./youtube.server";

export const searchSongs = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ q: z.string().trim().min(1).max(150) }).parse(d))
  .handler(async ({ data }): Promise<{ results: VideoResult[]; error: string | null }> => {
    const key = process.env["YOUTUBE_API_KEY"];
    if (!key) return { results: [], error: "config" };
    try {
      return { results: await searchYouTube(data.q, key), error: null };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      console.error("YouTube search failed:", msg);
      return { results: [], error: msg === "quota" ? "quota" : "unavailable" };
    }
  });
