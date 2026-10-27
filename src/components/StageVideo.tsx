import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

type Player = { destroy: () => void; playVideo: () => void; pauseVideo: () => void; setVolume: (v: number) => void; seekTo: (s: number, allow: boolean) => void };
export type VideoControl = { paused: boolean; volume: number; restart_revision: number };
type Youtube = { Player: new (element: HTMLElement, options: Record<string, unknown>) => Player };
let apiPromise: Promise<Youtube> | undefined;
function youtubeApi(): Promise<Youtube> {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    const w = window as typeof window & { YT?: Youtube; onYouTubeIframeAPIReady?: () => void };
    if (w.YT?.Player) { resolve(w.YT); return; }
    const previous = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => { previous?.(); if (w.YT) resolve(w.YT); };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.onerror = () => { apiPromise = undefined; reject(new Error("YouTube unavailable")); };
    document.head.appendChild(script);
  });
  return apiPromise;
}

export function StageVideo({ videoId, title, onEnded, control }: { videoId: string; title: string; onEnded: () => void; control?: VideoControl }) {
  const { t } = useI18n();
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<Player | null>(null);
  const ended = useRef(onEnded);
  ended.current = onEnded;
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(false);
  const ctl = useRef(control);
  ctl.current = control;
  const restartSeen = useRef(control?.restart_revision ?? 0);
  useEffect(() => {
    const p = player.current;
    if (!ready || !p || !control) return;
    p.setVolume(control.volume);
    if (control.restart_revision !== restartSeen.current) { restartSeen.current = control.restart_revision; p.seekTo(0, true); }
    if (control.paused) p.pauseVideo(); else p.playVideo();
  }, [ready, control?.paused, control?.volume, control?.restart_revision]);
  useEffect(() => {
    let alive = true;
    let completed = false;
    let instance: Player | null = null;
    setError(false);
    setPaused(false);
    setReady(false);
    const element = document.createElement("div");
    host.current?.appendChild(element);
    const timeout = setTimeout(() => { if (alive && !player.current) setError(true); }, 12000);
    youtubeApi().then((yt) => {
      if (!alive) return;
      instance = new yt.Player(element, {
        videoId, width: "100%", height: "100%",
        playerVars: { autoplay: 1, playsinline: 1, rel: 0, enablejsapi: 1, origin: window.location.origin },
        events: {
          onReady: (event: { target: Player }) => { clearTimeout(timeout); const c = ctl.current; if (c) event.target.setVolume(c.volume); if (!c?.paused) event.target.playVideo(); if (alive) setReady(true); },
          onStateChange: (event: { data: number }) => {
            if (!alive) return;
            setPaused(event.data === 2 || event.data === -1 || event.data === 5);
            if (event.data === 0 && !completed) { completed = true; ended.current(); }
          },
          onAutoplayBlocked: () => { if (alive) setPaused(true); },
          onError: () => { if (alive) setError(true); },
        },
      });
      player.current = instance;
      host.current?.querySelector("iframe")?.setAttribute("title", title);
    }).catch(() => { if (alive) setError(true); });
    return () => { alive = false; clearTimeout(timeout); instance?.destroy(); player.current = null; element.remove(); };
  }, [videoId, attempt, title]);
  return (
    <div className="absolute inset-0 bg-background">
      <div ref={host} className="stage-video absolute inset-0" />
      {error ? <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-background px-6 text-center">
        <p className="max-w-lg text-xl">{t.stageVideoError}</p>
        <Button onClick={() => setAttempt((n) => n + 1)}><RotateCcw className="size-5" />{t.stageRetry}</Button>
      </div> : <Button size="icon" variant="secondary" className={`stage-media-control absolute bottom-24 right-6 size-12 ${paused ? "opacity-100" : "opacity-0 focus:opacity-100"}`} title={paused ? t.stageResume : t.stagePause} aria-label={paused ? t.stageResume : t.stagePause} onClick={() => paused ? player.current?.playVideo() : player.current?.pauseVideo()}>{paused ? <Play /> : <Pause />}</Button>}
    </div>
  );
}