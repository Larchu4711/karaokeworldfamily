import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { QRCodeSVG } from "qrcode.react";
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Play, Star, Check, SkipForward, Trash2, LogOut, Loader2, Lock, ChevronUp, ChevronDown, Monitor } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StagePlayer } from "@/components/StagePlayer";
import { useQueue } from "@/hooks/use-queue";
import { playOrder, type SongRequest } from "@/lib/queue";
import { djDelete, djLogin, djLogout, djReorder, djSetStatus, djStatus } from "@/lib/dj.functions";
import logo from "@/assets/logo.jpg";
import { useI18n } from "@/lib/i18n";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useStageControl } from "@/hooks/use-stage-control";
import { Pause, RotateCcw, Volume2, CheckCheck } from "lucide-react";

export const Route = createFileRoute("/dj")({
  head: () => ({
    meta: [
      { title: "DJ Desk — Pub Manhattan" },
      { name: "description", content: "Panel del DJ para gestionar la cola de karaoke de Pub Manhattan." },
      { property: "og:title", content: "DJ Desk — Pub Manhattan" },
      { property: "og:description", content: "Gestión de la cola de karaoke." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DjPage,
});

function DjPage() {
  const status = useServerFn(djStatus);
  const [authed, setAuthed] = useState<boolean | null>(null);
  useEffect(() => { status().then((r) => setAuthed(r.ok)).catch(() => setAuthed(false)); }, []);
  if (authed === null) return null;
  return authed ? <Desk onLogout={() => setAuthed(false)} /> : <Login onOk={() => setAuthed(true)} />;
}

function Login({ onOk }: { onOk: () => void }) {
  const { t } = useI18n();
  const login = useServerFn(djLogin);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    const r = await login({ data: { password: pw } }).catch(() => ({ ok: false }));
    setBusy(false);
    if (r.ok) onOk(); else toast.error(t.djWrong);
  };
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="w-full max-w-xs space-y-4 rounded-2xl border border-primary bg-card p-6 text-center neon-border">
        <img src={logo} alt="" width={80} height={80} className="logo-glow mx-auto size-20" />
        <h1 className="font-display text-2xl text-primary neon-text">DJ Desk</h1>
        <Input type="password" autoFocus value={pw} onChange={(e) => setPw(e.target.value)} placeholder={t.djPassword} />
        <Button type="submit" className="w-full" disabled={busy || !pw}>{busy ? <Loader2 className="size-4 animate-spin" /> : <><Lock className="size-4" /> {t.djEnter}</>}</Button>
      </form>
    </div>
  );
}

function Desk({ onLogout }: { onLogout: () => void }) {
  const { t } = useI18n();
  const [externalStage, setExternalStage] = useState(false);
  useEffect(() => { setExternalStage(localStorage.getItem("pm-external-stage") === "true"); }, []);
  const changeStage = (value: boolean) => { setExternalStage(value); localStorage.setItem("pm-external-stage", String(value)); setStage(null); };
  const { rows, setRows, reload } = useQueue();
  const setStatus = useServerFn(djSetStatus);
  const reorder = useServerFn(djReorder);
  const del = useServerFn(djDelete);
  const logout = useServerFn(djLogout);
  const [stage, setStage] = useState<SongRequest | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const order = useMemo(() => playOrder(rows), [rows]);
  const done = useMemo(() => rows.filter((r) => r.status === "done" || r.status === "skipped").slice(-10).reverse(), [rows]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const act = useCallback(async (id: string, s: "next" | "playing" | "done" | "skipped" | "waiting") => {
    try {
      const r = await setStatus({ data: { id, status: s } });
      if (!r.ok) { toast.error(r.reason ?? "Error"); return; }
      if (s === "playing") {
        const song = rows.find((x) => x.id === id);
        if (song) setStage(song);
      }
      if ((s === "done" || s === "skipped") && stage?.id === id) {
        const adv = (r as { advanced?: string }).advanced;
        await reload();
        const nxt = adv ? rows.find((x) => x.id === adv) : undefined;
        setStage(nxt ?? null);
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes("unauthorized")) {
        toast.error(t.djExpired);
        onLogout();
      } else {
        toast.error(e instanceof Error ? e.message : "Error");
      }
    }
  }, [rows, stage, setStatus, reload, onLogout]);

  const persistOrder = async (ids: string[]) => {
    const r = await reorder({ data: { ids } });
    if (!r.ok) { toast.error(t.djQueueChanged); reload(); }
  };

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const oldI = order.findIndex((r) => r.id === e.active.id);
    const overId = e.over.id;
    const newI = order.findIndex((r) => r.id === overId);
    const next = arrayMove(order, oldI, newI);
    setRows((prev) => prev.map((r) => { const i = next.findIndex((n) => n.id === r.id); return i >= 0 ? { ...r, position: (i + 1) * 1000 } : r; }));
    persistOrder(next.map((r) => r.id));
  };

  const move = (id: string, dir: -1 | 1) => {
    const i = order.findIndex((r) => r.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= order.length) return;
    const next = arrayMove(order, i, j);
    setRows((prev) => prev.map((r) => { const k = next.findIndex((n) => n.id === r.id); return k >= 0 ? { ...r, position: (k + 1) * 1000 } : r; }));
    persistOrder(next.map((r) => r.id));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      const playing = order.find((r) => r.status === "playing");
      const sel = selected ?? order.find((r) => r.status !== "playing")?.id;
      if (e.code === "Space") {
        e.preventDefault();
        if (stage) setStage(null);
        else if (playing) setStage(playing);
        else if (sel) act(sel, "playing");
      } else if (e.key === "n" && sel) act(sel, "next");
      else if (e.key === "d" && playing) act(playing.id, "done");
      else if (e.key === "s" && playing) act(playing.id, "skipped");
      else if (e.key === "ArrowDown") { const i = order.findIndex((r) => r.id === sel); setSelected(order[Math.min(order.length - 1, i + 1)]?.id ?? null); }
      else if (e.key === "ArrowUp") { const i = order.findIndex((r) => r.id === sel); setSelected(order[Math.max(0, i - 1)]?.id ?? null); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [order, selected, stage, act]);

  const guestUrl = typeof window !== "undefined" ? window.location.origin + "/" : "";

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <header className="mb-4 flex flex-wrap items-center gap-3">
        <img src={logo} alt="" width={48} height={48} className="logo-glow size-12" />
        <h1 className="flex-1 font-display text-3xl text-primary neon-text">DJ Desk</h1>
        <Button asChild variant="secondary"><Link to="/stage" target="_blank" rel="noopener noreferrer" onClick={() => changeStage(true)}><Monitor className="size-4" />{t.stageOpen}</Link></Button>
        <Button variant="secondary" onClick={async () => { await logout(); onLogout(); }}><LogOut className="size-4" /> {t.djLogout}</Button>
      </header>
      <label className="mb-6 flex w-fit items-center gap-3 text-sm text-muted-foreground"><Switch checked={externalStage} onCheckedChange={changeStage} />{externalStage ? t.stageExternal : t.stageLocal}</label>
      {externalStage && <StageControls playing={order.find((r) => r.status === "playing")} act={act} />}
      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <section>
          <div className="mb-2 flex justify-between text-sm text-muted-foreground">
            <span>{order.length} {t.djInQueue}</span>
            <span className="hidden md:inline">{t.djShortcuts}</span>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={order.map((r) => r.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-2">
                {order.map((r, i) => (
                  <Row key={r.id} r={r} index={i} selected={selected === r.id} onSelect={() => setSelected(r.id)} act={act} move={move} onDelete={async () => { await del({ data: { id: r.id } }); setRows((p) => p.filter((x) => x.id !== r.id)); }} />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
          {order.length === 0 && <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">{t.djEmpty}</p>}
          {done.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-2 text-lg text-muted-foreground">{t.djLast}</h2>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {done.map((r) => (
                  <li key={r.id} className="flex items-center gap-2">
                    <span className={r.status === "done" ? "text-success" : "text-destructive"}>{r.status === "done" ? "✓" : "⏭"}</span>
                    <span className="font-semibold">{r.singer_name}</span><span className="truncate">{r.song_title}</span>
                    <button className="ml-auto text-xs underline" onClick={() => act(r.id, "waiting")}>{t.djRequeue}</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
        <aside className="space-y-3 rounded-2xl border border-border bg-card p-4 text-center">
          <div className="font-display text-lg text-accent">{t.djScan}</div>
          <div className="mx-auto w-fit rounded-xl bg-foreground p-3">{guestUrl && <QRCodeSVG value={guestUrl} size={180} />}</div>
          <div className="break-all text-xs text-muted-foreground">{guestUrl}</div>
        </aside>
      </div>
      {stage && !externalStage && <StagePlayer song={stage} onClose={() => setStage(null)} onEnded={() => act(stage.id, "done")} />}
    </div>
  );
}

function Row({ r, index, selected, onSelect, act, move, onDelete }: {
  r: SongRequest; index: number; selected: boolean; onSelect: () => void;
  act: (id: string, s: "next" | "playing" | "done" | "skipped") => void;
  move: (id: string, dir: -1 | 1) => void; onDelete: () => void;
}) {
  const { t } = useI18n();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: r.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const playing = r.status === "playing";
  const next = r.status === "next";
  return (
    <li
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`flex items-center gap-3 rounded-2xl border bg-card p-3 ${playing ? "animate-neon-pulse border-primary" : next ? "border-accent" : selected ? "border-ring" : "border-border"} ${isDragging ? "opacity-60" : ""}`}
    >
      <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground" aria-label={t.djDrag}><GripVertical className="size-5" /></button>
      <span className="w-6 text-center font-bold text-primary">{index + 1}</span>
      {r.thumbnail_url && <img src={r.thumbnail_url} alt="" className="hidden h-12 w-20 rounded object-cover sm:block" loading="lazy" />}
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold">{r.singer_name} {playing && <span className="text-xs text-primary">{t.djOnStage}</span>}{next && <span className="text-xs text-accent">{t.djNextTag}</span>}</div>
        <div className="truncate text-sm text-muted-foreground">{r.song_title} {r.duration && `· ${r.duration}`}</div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <IconBtn label={t.djUp} onClick={() => move(r.id, -1)}><ChevronUp className="size-4" /></IconBtn>
        <IconBtn label={t.djDown} onClick={() => move(r.id, 1)}><ChevronDown className="size-4" /></IconBtn>
        <IconBtn label={t.djPlay} onClick={() => act(r.id, "playing")} hot><Play className="size-4" /></IconBtn>
        <IconBtn label={t.djNext} onClick={() => act(r.id, "next")}><Star className="size-4" /></IconBtn>
        <IconBtn label={t.djDone} onClick={() => act(r.id, "done")}><Check className="size-4" /></IconBtn>
        <IconBtn label={t.djSkip} onClick={() => act(r.id, "skipped")}><SkipForward className="size-4" /></IconBtn>
        <IconBtn label={t.djDelete} onClick={() => { if (confirm(t.djConfirmDelete)) onDelete(); }}><Trash2 className="size-4 text-destructive" /></IconBtn>
      </div>
    </li>
  );
}

function IconBtn({ children, label, onClick, hot }: { children: React.ReactNode; label: string; onClick: () => void; hot?: boolean }) {
  return (
    <Button size="icon" variant={hot ? "default" : "ghost"} aria-label={label} title={label} onClick={(e) => { e.stopPropagation(); onClick(); }} className="size-8">
      {children}
    </Button>
  );
}

function StageControls({ playing, act }: { playing: SongRequest | undefined; act: (id: string, s: "done" | "skipped") => void }) {
  const { t } = useI18n();
  const { control, command, connected, busy } = useStageControl();
  const [vol, setVol] = useState<number | null>(null);
  const run = (c: Parameters<typeof command>[0], v?: number) => { command(c, v).catch(() => toast.error(t.errGeneric)); };
  return (
    <section className="mb-6 rounded-2xl border border-accent/50 bg-card p-4" aria-label={t.stageControls}>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="font-display text-lg text-accent">{t.stageControls}</span>
        <span className={connected ? "text-success" : "text-destructive"}>● {connected ? t.stageConnected : t.stageDisconnected}</span>
        {control.paused && <span className="text-muted-foreground">· {t.stagePaused}</span>}
        {playing && <span className="ml-auto truncate text-muted-foreground">{playing.singer_name} · {playing.song_title}</span>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {control.paused
          ? <Button disabled={busy} onClick={() => run("play")}><Play className="size-4" />{t.stageResume}</Button>
          : <Button disabled={busy} variant="secondary" onClick={() => run("pause")}><Pause className="size-4" />{t.stagePause}</Button>}
        <Button disabled={busy || !playing} variant="secondary" onClick={() => run("restart")}><RotateCcw className="size-4" />{t.stageRestart}</Button>
        <Button disabled={!playing} variant="secondary" onClick={() => playing && act(playing.id, "done")}><CheckCheck className="size-4" />{t.stageFinish}</Button>
        <Button disabled={!playing} variant="secondary" onClick={() => playing && act(playing.id, "skipped")}><SkipForward className="size-4" />{t.stageNext}</Button>
        <label className="ml-auto flex min-w-48 flex-1 items-center gap-3 text-sm text-muted-foreground sm:max-w-xs">
          <Volume2 className="size-4 shrink-0" /><span className="sr-only">{t.stageVolume}</span>
          <Slider min={0} max={100} step={5} value={[vol ?? control.volume]} onValueChange={(v) => setVol(v[0] ?? null)} onValueCommit={(v) => { run("volume", v[0] ?? 100); setVol(null); }} />
          <span className="w-9 tabular-nums">{vol ?? control.volume}</span>
        </label>
      </div>
    </section>
  );
}
