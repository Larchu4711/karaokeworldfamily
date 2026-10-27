import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SYSTEM = `You help karaoke bar guests find songs on YouTube.
The guest describes a song: a title, an artist, or remembered lyric fragments (any language, may contain typos).
Identify the most likely song(s) and return up to 4 concise YouTube search queries, each formatted as "Artist - Title karaoke".
Order by likelihood. If uncertain, include alternative candidate songs. Never invent nonsense; if nothing fits, return an empty list.`;

export const suggestSongs = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ text: z.string().trim().min(2).max(500) }).parse(d))
  .handler(async ({ data }): Promise<{ queries: string[]; error: string | null }> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { queries: [], error: "config" };
    const { createOpenAI } = await import("@ai-sdk/openai");
    const { streamText, Output } = await import("ai");
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });
    try {
      const result = streamText({
        model: provider.responses("openai/gpt-6-astra"),
        instructions: SYSTEM,
        messages: [{ role: "user", content: data.text }],
        output: Output.object({ schema: z.object({ queries: z.array(z.string()) }) }),
        providerOptions: {
          openai: {
            store: false,
            forceReasoning: true,
            reasoningEffort: "low",
            include: ["reasoning.encrypted_content"],
          },
        },
      });
      const out = await result.output;
      return { queries: (out?.queries ?? []).slice(0, 4), error: null };
    } catch (e) {
      const status = (e as { statusCode?: number })?.statusCode;
      console.error("AI suggest failed:", status, e instanceof Error ? e.message : e);
      if (status === 429) return { queries: [], error: "rate" };
      if (status === 402) return { queries: [], error: "credits" };
      return { queries: [], error: "unavailable" };
    }
  });
