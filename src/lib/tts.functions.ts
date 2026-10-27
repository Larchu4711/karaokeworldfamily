import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireDj } from "./dj.server";

/** ElevenLabs announcement for the stage teaser. DJ-only; returns base64 MP3 or null (client falls back to browser voice). */
export const announceTts = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ text: z.string().trim().min(1).max(400) }).parse(d))
  .handler(async ({ data }): Promise<{ audio: string | null }> => {
    await requireDj();
    const key = process.env["ELEVENLABS_API_KEY"];
    const voice = process.env["ELEVENLABS_VOICE_ID"]?.trim() || "nPczCjzI2devNBz1zQrb"; // Brian (free standard voice)
    if (!key || !voice) return { audio: null };
    try {
      const res = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_128`,
        {
          method: "POST",
          headers: { "xi-api-key": key, "Content-Type": "application/json" },
          body: JSON.stringify({
            text: data.text,
            model_id: "eleven_multilingual_v2",
            voice_settings: { stability: 0.4, similarity_boost: 0.8, style: 0.6, use_speaker_boost: true },
          }),
        },
      );
      if (!res.ok) {
        console.error(`ElevenLabs TTS failed [${res.status}]: ${await res.text()}`);
        return { audio: null };
      }
      const bytes = new Uint8Array(await res.arrayBuffer());
      let bin = "";
      for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return { audio: btoa(bin) };
    } catch (e) {
      console.error("ElevenLabs TTS error:", e instanceof Error ? e.message : e);
      return { audio: null };
    }
  });
