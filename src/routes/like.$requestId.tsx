import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { StageBanner } from "@/components/StageBanner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import type { SongRequest } from "@/lib/queue";

export const Route = createFileRoute("/like/$requestId")({
  head: () => ({ meta: [
    { title: "Dale like al cantante — Pub Manhattan Karaoke" },
    { name: "description", content: "Aplaude con un like a quien canta ahora en Pub Manhattan, Fisterra." },
    { property: "og:title", content: "Dale like al cantante — Pub Manhattan" },
    { property: "og:description", content: "Un like = un punto en el ranking de Pub Manhattan." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: LikePage,
});

function LikePage() {
  const { requestId } = Route.useParams();
  const { t } = useI18n();
  const [song, setSong] = useState<SongRequest | null | undefined>(undefined);
  useEffect(() => {
    supabase.from("song_requests").select("*").eq("id", requestId).maybeSingle().then(({ data }) => setSong((data as SongRequest | null) ?? null));
  }, [requestId]);
  return <div className="pb-20">
    <SiteHeader />
    <main className="mx-auto max-w-md space-y-6 px-4 text-center">
      <h1 className="font-display text-3xl text-primary neon-text">{t.likeTitle}</h1>
      {song === undefined ? <p className="text-muted-foreground">…</p> : song ? <StageBanner current={song} /> : <p className="text-muted-foreground">{t.likeGone}</p>}
      {song && <p className="text-sm text-muted-foreground">{t.likeTap}</p>}
      <Button asChild variant="link"><Link to="/rangliste">{t.leaderboard}</Link></Button>
    </main>
  </div>;
}
