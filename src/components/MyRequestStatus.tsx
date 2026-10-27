import { Clock, Mic } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { waitInfo, type SongRequest } from "@/lib/queue";
import { Button } from "@/components/ui/button";

export function MyRequestStatus({ rows, id, onNew }: { rows: SongRequest[]; id: string; onNew: () => void }) {
  const { t } = useI18n();
  const me = rows.find((r) => r.id === id);
  if (!me) return null;
  const info = waitInfo(rows, id);
  const label =
    me.status === "playing" ? t.statusPlaying :
    me.status === "next" ? t.statusNext :
    me.status === "done" ? t.statusDone :
    me.status === "skipped" ? t.statusSkipped : t.statusWaiting;
  const hot = me.status === "playing" || me.status === "next";
  return (
    <div className={`rounded-2xl border p-5 ${hot ? "animate-neon-pulse border-primary" : "border-border"} bg-card`}>
      <div className="text-xs font-bold uppercase tracking-widest text-accent">{t.queueTitle}</div>
      <div className="mt-1 font-display text-xl">{me.song_title}</div>
      <div className="mt-1 text-sm text-muted-foreground"><Mic className="mr-1 inline size-4" />{me.singer_name}</div>
      <div className={`mt-4 text-lg font-bold ${hot ? "text-primary neon-text" : ""}`}>{label}</div>
      {info && me.status === "waiting" && (
        <div className="mt-3 flex gap-6">
          <div><div className="font-display text-4xl text-primary neon-text">#{info.place}</div><div className="text-xs text-muted-foreground">{t.place} {t.inQueue}</div></div>
          <div><div className="font-display text-4xl text-accent neon-text-cyan"><Clock className="mr-1 inline size-6" />{Math.round(info.seconds / 60)}</div><div className="text-xs text-muted-foreground">{t.waitApprox} ({t.min})</div></div>
        </div>
      )}
      {(me.status === "done" || me.status === "skipped") && (
        <Button className="mt-4" onClick={onNew}>{t.newRequest}</Button>
      )}
    </div>
  );
}
