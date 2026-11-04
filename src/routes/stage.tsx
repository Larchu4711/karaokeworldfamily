import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";
import { Heart, Loader2, Maximize, Minimize, Monitor, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StageVideo } from "@/components/StageVideo";
import { StageHearts } from "@/components/StageHearts";
import { useQueue } from "@/hooks/use-queue";
import { useI18n } from "@/lib/i18n";
import { djStatus, djSetStatus } from "@/lib/dj.functions";
import { announceTts } from "@/lib/tts.functions";
import { playShowOpener } from "@/lib/stage-audio";
import { countdownRemaining } from "@/lib/stage";
import { playOrder, type SongRequest } from "@/lib/queue";
import logoAsset from "@/assets/world-family-logo.png.asset.json";
const logo = logoAsset.url;
import { QRCodeSVG } from "qrcode.react";
import { useStageControl } from "@/hooks/use-stage-control";
import type { StageControl } from "@/lib/stage-control";

export const Route = createFileRoute("/stage")({
  head: () => ({ meta: [
    { title: "Escenario en directo — The World Family Karaoke" },
    { name: "description", content: "Pantalla del escenario de The World Family: karaoke, cuenta atrás y aplausos en directo." },
    { property: "og:title", content: "Escenario en directo — The World Family Karaoke" },
    { property: "og:description", content: "Karaoke y aplausos en directo en The World Family." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
    { name: "robots", content: "noindex" },
  ] }),
  component: StagePage,
});

function StagePage() {
  const { t } = useI18n();
  const check = useServerFn(djStatus);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const screen = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const refresh = () => check().then((r) => setAuthed(r.ok)).catch(() => setAuthed(false));
    refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [check]);
  useEffect(() => {
    const changed = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", changed);
    return () => document.removeEventListener("fullscreenchange", changed);
  }, []);
  const toggleFullscreen = () => {
    const result = document.fullscreenElement ? document.exitFullscreen() : screen.current?.requestFullscreen();
    result?.catch(() => toast.error(t.errGeneric));
  };
  const activate = () => {
    // Prime audio in the direct user gesture before remote DJ commands arrive.
    const ctx = new AudioContext();
    ctx.resume().then(() => ctx.close()).catch(() => {});
    setEnabled(true);
    toggleFullscreen();
  };
  return <div ref={screen} className="stage-screen relative h-dvh min-h-80 overflow-hidden bg-background text-foreground">
    {enabled && authed ? <StageShow onUnauthorized={() => { setAuthed(false); setEnabled(false); }} /> : <div className="flex h-full flex-col items-center justify-center gap-6 px-6 pb-16 text-center">
      <img src={logo} alt="The World Family" className="logo-glow size-28 sm:size-40" />
      <div><h1 className="font-display text-4xl text-rainbow sm:text-6xl">The World Family</h1><p className="mt-3 text-lg text-accent">{t.stageView}</p></div>
      {authed === null ? <Loader2 className="size-7 animate-spin text-accent" /> : authed ? <Button size="lg" onClick={activate}><Volume2 />{t.stageEnable}</Button> : <Button asChild size="lg"><Link to="/dj">{t.stageLogin}</Link></Button>}
    </div>}
    <div className="stage-toolbar absolute right-5 top-5 z-40 flex gap-2 opacity-0 focus-within:opacity-100">
      <Button asChild variant="secondary" size="icon" title={t.dj} aria-label={t.dj}><Link to="/dj"><Monitor className="size-5" /></Link></Button>
      <Button variant="secondary" size="icon" title={fullscreen ? t.stageExitFullscreen : t.stageFullscreen} aria-label={fullscreen ? t.stageExitFullscreen : t.stageFullscreen} onClick={toggleFullscreen}>{fullscreen ? <Minimize className="size-5" /> : <Maximize className="size-5" />}</Button>
    </div>
  </div>;
}

function StageShow({ onUnauthorized }: { onUnauthorized: () => void }) {
  const { t } = useI18n();
  const { rows, loaded, reload } = useQueue();
  const status = useServerFn(djSetStatus);
  const { control } = useStageControl();
  const current = playOrder(rows).find((r) => r.status === "playing");
  useEffect(() => {
    const timer = setInterval(reload, 4000);
    return () => clearInterval(timer);
  }, [reload]);
  const complete = useCallback(async (id: string) => {
    try {
      const result = await status({ data: { id, status: "done" } });
      if (!result.ok) toast.error(result.reason ?? t.errGeneric);
      await reload();
    } catch (error) {
      if (error instanceof Error && error.message.includes("unauthorized")) onUnauthorized();
      else toast.error(t.errGeneric);
    }
  }, [status, reload, onUnauthorized, t.errGeneric]);
  if (current) return <StagePerformance key={current.id} song={current} control={control} onEnded={() => complete(current.id)} />;
  const next = playOrder(rows)[0];
  const steps = [t.ssStep1, t.ssStep2, t.ssStep3, t.ssStep4];
  return <div className="animate-in fade-in flex h-full flex-col items-center justify-center gap-8 px-8 duration-1000 lg:flex-row lg:gap-16">
    <div className="flex flex-col items-center gap-4 text-center">
      <img src={logo} alt="The World Family" className="logo-glow size-28 sm:size-36" />
      <h1 className="font-display text-4xl text-rainbow sm:text-6xl">The World Family</h1>
      <div className="stage-qr-pulse mt-2 rounded-2xl bg-foreground p-4"><QRCodeSVG value={typeof window !== "undefined" ? window.location.origin : ""} size={220} /></div>
      <p className="text-lg font-bold text-accent">{t.ssScan}</p>
    </div>
    <div className="max-w-xl">
      <h2 className="font-display text-3xl text-accent neon-text-cyan sm:text-5xl">{t.ssTitle}</h2>
      <ol className="mt-6 space-y-4">
        {steps.map((s, i) => <li key={i} className="stage-step flex items-center gap-4 text-xl sm:text-2xl" style={{ animationDelay: `${300 + i * 400}ms` }}>
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-primary font-display text-primary">{i + 1}</span>{s}</li>)}
      </ol>
      <div className="mt-8 rounded-xl border border-border bg-card/70 p-4">
        {!loaded ? <p className="text-muted-foreground">{t.stageLoading}</p> : next ? <><p className="text-sm uppercase text-muted-foreground">{t.upcoming}</p><p className="mt-1 break-words font-display text-2xl sm:text-3xl">{next.singer_name}</p><p className="break-words text-muted-foreground">{next.song_title}</p></> : <p className="text-muted-foreground">{t.stageWaiting}</p>}
      </div>
    </div>
  </div>;
}

function StagePerformance({ song, onEnded, control }: { song: SongRequest; onEnded: () => void; control: StageControl }) {
  const { t, lang } = useI18n();
  const tts = useServerFn(announceTts);
  const [count, setCount] = useState(5);
  const [announced, setAnnounced] = useState(false);
  const [brian, setBrian] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    const started = Date.now();
    const text = t.announce(song.singer_name, song.song_title);
    const voice = tts({ data: { text } }).then((r) => { if (alive) setBrian(!!r.audio); return r.audio; }).catch(() => { if (alive) setBrian(false); return null; });
    const opener = playShowOpener(text, lang, voice);
    opener.finished.then(() => { if (alive) setAnnounced(true); });
    const interval = setInterval(() => setCount(countdownRemaining(started, Date.now())), 100);
    return () => { alive = false; clearInterval(interval); opener.stop(); };
  }, [song.id]);
  return <>
    {count === 0 && announced ? <StageVideo videoId={song.video_id} title={song.song_title} onEnded={onEnded} control={control} /> : <div className="absolute inset-0 flex flex-col items-center justify-center px-8 pb-16 text-center">
      <div className="mb-7 flex items-center gap-3 text-sm uppercase text-accent"><Volume2 className="size-5" />{t.onStage}</div>
      <h1 className="max-w-5xl break-words font-display text-5xl text-primary neon-text sm:text-7xl">{song.singer_name}</h1>
      <p className="mt-5 max-w-4xl break-words text-xl text-muted-foreground sm:text-3xl">{song.song_title}</p>
      <div className="mt-8 flex h-36 w-36 items-center justify-center sm:h-48 sm:w-48" aria-live="off">{count > 0 ? <span key={count} className="animate-countdown font-display text-8xl text-accent neon-text-cyan sm:text-9xl">{count}</span> : <Heart className="stage-welcome-heart size-20 fill-current text-primary" />}</div>
      <p className="mt-4 text-sm text-muted-foreground">{brian === false ? t.stageAudioFallback : t.stageVoice}</p>
    </div>}
    <StageHearts requestId={song.id} />
    <div className="pointer-events-none absolute left-6 top-6 z-20 flex w-min flex-col items-center gap-1.5 rounded-lg border border-accent/40 bg-background/90 p-2">
      <div className="rounded bg-foreground p-1.5"><QRCodeSVG value={`${typeof window !== "undefined" ? window.location.origin : ""}/like/${song.id}`} size={96} /></div>
      <p className="w-full whitespace-nowrap text-center text-[11px] font-bold text-accent">{t.sendLike}</p>
    </div>
  </>;
}