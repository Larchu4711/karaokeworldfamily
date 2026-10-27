import { useEffect, useRef, useState } from "react";
import { Maximize2, X, GripHorizontal, Volume2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { playShowOpener } from "@/lib/stage-audio";
import { announceTts } from "@/lib/tts.functions";
import { useI18n } from "@/lib/i18n";
import type { SongRequest } from "@/lib/queue";

export function StagePlayer({ song, onClose, onEnded }: { song: SongRequest; onClose: () => void; onEnded: () => void }) {
  const { t, lang } = useI18n();
  const [count, setCount] = useState(5);
  const [pos, setPos] = useState({ x: 24, y: 24 });
  const [size, setSize] = useState({ w: 640, h: 400 });
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  const tts = useServerFn(announceTts);
  useEffect(() => {
    setCount(5);
    const text = t.announce(song.singer_name, song.song_title);
    const voice = tts({ data: { text } }).then((r) => r.audio).catch(() => null);
    const handle = playShowOpener(text, lang, voice);
    const iv = setInterval(() => setCount((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => { clearInterval(iv); handle.stop(); };
  }, [song.id]);

  // Detect end of video via YouTube iframe postMessage API
  useEffect(() => {
    if (count > 0) return;
    const onMsg = (e: MessageEvent) => {
      if (typeof e.data !== "string" || !e.origin.includes("youtube")) return;
      try {
        const d = JSON.parse(e.data);
        if (d.event === "onStateChange" && d.info === 0) onEnded();
        if (d.event === "infoDelivery" && d.info?.playerState === 0) onEnded();
      } catch { /* ignore */ }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [count, onEnded]);

  const onDown = (e: React.PointerEvent) => {
    drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (drag.current) setPos({ x: e.clientX - drag.current.dx, y: Math.max(0, e.clientY - drag.current.dy) });
  };

  const fullscreen = () => box.current?.requestFullscreen?.();
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div
      ref={box}
      className="fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-primary bg-background neon-border"
      style={{ left: pos.x, top: pos.y, width: size.w, height: size.h, resize: "both" }}
      onMouseUp={() => box.current && setSize({ w: box.current.offsetWidth, h: box.current.offsetHeight })}
    >
      <div className="flex cursor-move items-center gap-2 bg-card px-3 py-2" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={() => (drag.current = null)}>
        <GripHorizontal className="size-4 text-muted-foreground" />
        <div className="min-w-0 flex-1 truncate text-sm"><b className="text-primary">{song.singer_name}</b> — {song.song_title}</div>
        <button onClick={fullscreen} className="p-1 hover:text-accent" aria-label="Fullscreen"><Maximize2 className="size-4" /></button>
        <button onClick={onClose} className="p-1 hover:text-destructive" aria-label="Close"><X className="size-4" /></button>
      </div>
      <div className="relative flex-1 bg-background">
        {count > 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-neon/10 text-center">
            <div className="text-sm uppercase tracking-[0.4em] text-accent"><Volume2 className="mr-1 inline size-4" />{t.onStage}</div>
            <div className="mt-2 font-display text-4xl text-primary neon-text">{song.singer_name}</div>
            <div className="mt-1 text-muted-foreground">{song.song_title}</div>
            <div key={count} className="animate-countdown mt-6 font-display text-8xl text-accent neon-text-cyan">{count}</div>
          </div>
        ) : (
          <iframe
            className="absolute inset-0 size-full"
            src={`https://www.youtube.com/embed/${song.video_id}?autoplay=1&enablejsapi=1&rel=0&origin=${encodeURIComponent(origin)}`}
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
            title={song.song_title}
            onLoad={(e) => e.currentTarget.contentWindow?.postMessage(JSON.stringify({ event: "listening" }), "*")}
          />
        )}
      </div>
    </div>
  );
}
