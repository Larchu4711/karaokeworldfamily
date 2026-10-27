import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { suggestSongs } from "@/lib/ai-suggest.functions";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function AiSuggest({ onPick }: { onPick: (q: string) => void }) {
  const { t } = useI18n();
  const ask = useServerFn(suggestSongs);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [queries, setQueries] = useState<string[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const run = async () => {
    if (text.trim().length < 2) return;
    setBusy(true); setErr(null);
    try {
      const r = await ask({ data: { text } });
      setQueries(r.queries);
      if (r.error) setErr(t.errGeneric);
    } catch {
      setErr(t.errGeneric);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-4">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 text-left font-bold text-accent">
        <Sparkles className="size-4" /> {t.aiTitle}
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t.aiHint} maxLength={500} rows={2} />
          <Button onClick={run} disabled={busy} variant="secondary">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} {t.aiAsk}
          </Button>
          {err && <p className="text-sm text-destructive">{err}</p>}
          {queries && queries.length === 0 && !err && <p className="text-sm text-muted-foreground">{t.aiNone}</p>}
          <div className="flex flex-wrap gap-2">
            {queries?.map((q) => (
              <button key={q} onClick={() => onPick(q)} className="rounded-full border border-accent/50 px-3 py-1 text-sm text-accent hover:bg-accent hover:text-accent-foreground">
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
