import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Mic, Trophy } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/rangliste")({
  head: () => ({
    meta: [
      { title: "Ranking de cantantes — The World Family" },
      { name: "description", content: "Los cantantes más aplaudidos de The World Family: esta noche, este mes y de siempre." },
      { property: "og:title", content: "Ranking de cantantes — The World Family" },
      { property: "og:description", content: "Los cantantes con más likes y actuaciones." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Leaderboard,
});

type Period = "night" | "month" | "all";
type Row = { singer_id: string; display_name: string; card_code: string; likes: number; performances: number };

function Leaderboard() {
  const { t } = useI18n();
  const [period, setPeriod] = useState<Period>("night");
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    setRows(null);
    supabase.rpc("leaderboard", { p_period: period }).then(({ data }) => setRows((data ?? []) as Row[]));
  }, [period]);

  const medal = ["text-gold", "text-silver", "text-bronze"];
  const tabs: [Period, string][] = [["night", t.tonight], ["month", t.month], ["all", t.allTime]];

  return (
    <div className="pb-20">
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-6 px-4">
        <h1 className="text-center font-display text-4xl text-primary neon-text"><Trophy className="mr-2 inline size-8" />{t.leaderboard}</h1>
        <div className="mx-auto flex w-fit rounded-full border border-border p-1">
          {tabs.map(([p, label]) => (
            <button key={p} onClick={() => setPeriod(p)} className={`rounded-full px-4 py-2 text-sm font-bold ${period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{label}</button>
          ))}
        </div>
        {rows === null ? (
          <p className="text-center text-muted-foreground">…</p>
        ) : rows.length === 0 ? (
          <p className="text-center text-muted-foreground">{t.noRanking}</p>
        ) : (
          <ol className="space-y-2">
            {rows.map((r, i) => (
              <li key={r.singer_id} className={`flex items-center gap-4 rounded-2xl border bg-card p-4 ${i < 3 ? "border-primary neon-border" : "border-border"}`}>
                <span className={`w-10 text-center font-display text-3xl ${medal[i] ?? "text-muted-foreground"}`}>{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-lg">{r.display_name}</div>
                  <div className="text-xs text-muted-foreground">{r.card_code}</div>
                </div>
                <span className="flex items-center gap-1 font-bold text-primary"><Heart className="size-4 fill-current" />{r.likes} <span className="text-xs font-normal">{t.points}</span></span>
                <span className="flex items-center gap-1 text-accent"><Mic className="size-4" />{r.performances}</span>
              </li>
            ))}
          </ol>
        )}
      </main>
    </div>
  );
}
