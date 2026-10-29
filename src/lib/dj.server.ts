import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";

const COOKIE = "mh-dj";
const MAX_AGE = 60 * 60 * 14; // 14h — one long night

const enc = new TextEncoder();

function safeEqual(a: string, b: string) {
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  let diff = ab.length ^ bb.length;
  const len = Math.max(ab.length, bb.length);
  for (let i = 0; i < len; i++) diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  return diff === 0;
}

async function hmac(msg: string) {
  const secret = process.env["DJ_SESSION_SECRET"];
  if (!secret) throw new Error("DJ_SESSION_SECRET missing");
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(msg));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=+$/, "");
}

export function checkPassword(input: string) {
  const pw = process.env["DJ_PASSWORD"];
  if (!pw) return false;
  return safeEqual(input, pw);
}

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function parse(token: string | undefined) {
  if (!token) return null;
  const [exp, sid, sig] = token.split(".");
  if (!exp || !sid || !sig || Number(exp) < Date.now() / 1000) return null;
  return { exp, sid, sig };
}

export async function startSession() {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const sid = crypto.randomUUID();
  const { error } = await (await db()).from("dj_sessions").insert({ id: sid, expires_at: new Date(exp * 1000).toISOString() });
  if (error) throw new Error("session");
  const token = `${exp}.${sid}.${await hmac(`${exp}.${sid}`)}`;
  setCookie(COOKIE, token, { httpOnly: true, secure: true, sameSite: "none", partitioned: true, path: "/", maxAge: MAX_AGE });
}

export async function endSession() {
  const p = parse(getCookie(COOKIE));
  if (p && safeEqual(p.sig, await hmac(`${p.exp}.${p.sid}`))) {
    await (await db()).from("dj_sessions").delete().eq("id", p.sid);
  }
  deleteCookie(COOKIE, { path: "/", secure: true, sameSite: "none", partitioned: true });
}

export async function isDj() {
  const p = parse(getCookie(COOKIE));
  if (!p || !safeEqual(p.sig, await hmac(`${p.exp}.${p.sid}`))) return false;
  const { data } = await (await db()).from("dj_sessions").select("id").eq("id", p.sid).gt("expires_at", new Date().toISOString()).maybeSingle();
  return !!data;
}

export async function requireDj() {
  if (!(await isDj())) throw new Error("unauthorized");
}
