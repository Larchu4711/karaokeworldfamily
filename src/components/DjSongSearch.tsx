import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Plus, Search, PlayCircle, ChevronUp, ChevronDown, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchSongs } from "@/lib/youtube.functions";
import { djAddSong } from "@/lib/dj.functions";
import { useI18n } from "@/lib/i18n";
import type { VideoResult } from "@/lib/youtube.server";

export function DjSongSearch({ queueLength, onAdded }: { queueLength: number; onAdded: () => void }) {
  const { t } = useI18n();
  const search = useServerFn(searchSongs);
  const add = useServerFn(djAddSong);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<VideoResult[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [singer, setSinger] = useState("");
  const [pos, setPos] = useState("end");
  const [adding, setAdding] = useState<string | null>(null);
  const [open, setOpen] = useState(true);

  const run = async () => {
    if (!q.trim()) return;
    setBusy(true);
    try {
      const r = await search({ data: { q } });
      if (r.error) toast.error(t.errGeneric);
      setResults(r.results); setOpen(true);
    } catch { toast.error(t.errGeneric); }
    finally { setBusy(false); }
  };

  const insert = async (v: VideoResult) => {
    if (!singer.trim()) { toast.error(t.djSingerName); return; }
    setAdding(v.videoId);
    try {
      await add({ data: { singer: singer.trim(), title: v.title, videoId: v.videoId, channel: v.channelTitle, thumbnail: v.thumbnail, duration: v.duration, index: pos === "end" ? null : Number(pos) } });
      toast.success(t.djAdded);
      setSinger(""); setOpen(false); setPreview(null); onAdded();
    } catch { toast.error(t.errGeneric); }
    finally { setAdding(null); }
  };

  return (
    <section className="mb-6 rounded-2xl border border-primary/50 bg-card p-4">
      <h2 className="mb-3 font-display text-lg text-primary">{t.djSearchTitle}</h2>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); run(); }}>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.searchPh} />
        <Button type="submit" disabled={busy}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}{t.search}</Button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        <Input className="max-w-xs flex-1" value={singer} maxLength={60} onChange={(e) => setSinger(e.target.value)} placeholder={t.djSingerName} />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">{t.djInsertAt}
          <select value={pos} onChange={(e) => setPos(e.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-foreground">
            {Array.from({ length: queueLength }, (_, i) => <option key={i} value={i}>{i + 1}</option>)}
            <option value="end">{t.djEnd}</option>
          </select>
        </label>
      </div>
      {results && results.length === 0 && <p className="mt-3 text-sm text-muted-foreground">{t.djSearchNoResults}</p>}
      {results && results.length > 0 && (
        <>
        <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-1.5 text-sm">
          <span className="text-muted-foreground">{results.length} ✓</span>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={() => { setOpen(!open); setPreview(null); }} aria-label={open ? t.djCollapse : t.djExpand} title={open ? t.djCollapse : t.djExpand}>{open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}{open ? t.djCollapse : t.djExpand}</Button>
            <Button size="icon" variant="ghost" className="size-8" onClick={() => { setResults(null); setPreview(null); }} aria-label={t.djClose} title={t.djClose}><X className="size-4" /></Button>
          </div>
        </div>
        {open && <ul className="mt-2 max-h-96 space-y-2 overflow-y-auto">
          {results.map((v) => (
            <li key={v.videoId} className="rounded-xl border border-border p-2">
              <div className="flex items-center gap-3">
                <img src={v.thumbnail} alt="" className="h-12 w-20 rounded object-cover" loading="lazy" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{v.title}</div>
                  <div className="truncate text-xs text-muted-foreground">{v.channelTitle} · {v.duration}</div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setPreview(preview === v.videoId ? null : v.videoId)}><PlayCircle className="size-4" />{t.djPreview}</Button>
                <Button size="sm" disabled={adding !== null} onClick={() => insert(v)}>{adding === v.videoId ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}{t.djAddToQueue}</Button>
              </div>
              {preview === v.videoId && (
                <iframe className="mt-2 aspect-video w-full rounded-lg" src={`https://www.youtube-nocookie.com/embed/${v.videoId}?autoplay=1`} allow="autoplay; encrypted-media" title={v.title} />
              )}
            </li>
          ))}
        </ul>}
        </>
      )}
    </section>
  );
}
