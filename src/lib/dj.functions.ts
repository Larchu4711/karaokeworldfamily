import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { checkPassword, endSession, isDj, requireDj, startSession } from "./dj.server";
import { defaultStageControl, type StageControl } from "./stage-control";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const djStatus = createServerFn({ method: "GET" }).handler(async () => ({ ok: await isDj() }));

export const djLogin = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ password: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    if (!checkPassword(data.password)) return { ok: false };
    await startSession();
    return { ok: true };
  });

export const djLogout = createServerFn({ method: "POST" }).handler(async () => {
  endSession();
  return { ok: true };
});

const statusEnum = z.enum(["waiting", "next", "playing", "done", "skipped"]);

export const djSetStatus = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid(), status: statusEnum }).parse(d))
  .handler(async ({ data }) => {
    await requireDj();
    const { data: res, error } = await (await admin()).rpc("dj_set_status", { p_id: data.id, p_status: data.status });
    if (error) throw new Error(error.message);
    return res as { ok: boolean; reason?: string };
  });

export const djReorder = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ ids: z.array(z.string().uuid()).max(500) }).parse(d))
  .handler(async ({ data }) => {
    await requireDj();
    const { data: res, error } = await (await admin()).rpc("dj_reorder", { p_ids: data.ids });
    if (error) throw new Error(error.message);
    return res as { ok: boolean; reason?: string };
  });

export const djDelete = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireDj();
    const { error } = await (await admin()).from("song_requests").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const djStageState = createServerFn({ method: "GET" }).handler(async (): Promise<StageControl> => {
  await requireDj();
  const { data, error } = await (await admin()).from("stage_control").select("paused,volume,revision,restart_revision,external").eq("id", true).maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? defaultStageControl;
});

export const djStageCommand = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ command: z.enum(["play", "pause", "restart", "volume", "external", "local"]), volume: z.number().int().min(0).max(100).default(100) }).parse(d))
  .handler(async ({ data }): Promise<StageControl> => {
    await requireDj();
    const { data: result, error } = await (await admin()).rpc("dj_stage_command", { p_command: data.command, p_volume: data.volume });
    if (error) throw new Error(error.message);
    return result as unknown as StageControl;
  });

export const djCompleteCurrent = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireDj();
    const { data: result, error } = await (await admin()).rpc("dj_complete_current", { p_id: data.id });
    if (error) throw new Error(error.message);
    return result as { ok: boolean; reason?: string };
  });
