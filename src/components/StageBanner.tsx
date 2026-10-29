import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuthUser } from "@/hooks/use-auth-user";
import type { SongRequest } from "@/lib/queue";
import { getDeviceId } from "@/lib/device";

export function StageBanner({ current }: { current: SongRequest | undefined }) {
  const { t } = useI18n();
  const { user } = useAuthUser();
  const [count, setCount] = useState(0);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!current) return;
    let alive = true;
    const refresh = async () => {
      const { data } = await supabase.rpc("like_counts", { p_ids: [current.id] });
      if (alive) setCount(Number(data?.[0]?.likes ?? 0));
    };
    refresh();
    const iv = setInterval(refresh, 5000);
    if (!user) setLiked(localStorage.getItem(`pm-liked-${current.id}`) === "1");
    if (user) {
      supabase.from("performance_likes").select("id").eq("request_id", current.id).eq("liker_id", user.id).maybeSingle()
        .then(({ data }) => alive && setLiked(!!data));
    }
    return () => { alive = false; clearInterval(iv); };
  }, [current?.id, user?.id]);

  if (!current) return null;
  const own = !!user && current.user_id === user.id;

  const toggle = async (): Promise<void> => {
    if (!user) {
      if (liked) return;
      const { data, error } = await supabase.rpc("guest_like", { p_request_id: current.id, p_device: getDeviceId() });
      const r = data as { ok?: boolean; reason?: string; already?: boolean } | null;
      if (error || !r) { toast.error(t.errGeneric); return; }
      if (r.ok && !r.already) { setLiked(true); setCount((c) => c + 1); toast.success(t.likeThanks); localStorage.setItem(`pm-liked-${current.id}`, "1"); }
      else if (r.reason === "own") toast.error(t.likeOwn);
      else if (r.reason === "gone") toast.error(t.likeGone);
      else { setLiked(true); localStorage.setItem(`pm-liked-${current.id}`, "1"); toast(t.likeAlready); }
      return;
    }
    if (liked) {
      await supabase.from("performance_likes").delete().eq("request_id", current.id).eq("liker_id", user.id);
      setLiked(false); setCount((c) => Math.max(0, c - 1));
    } else {
      const { error } = await supabase.from("performance_likes").insert({ request_id: current.id, liker_id: user.id });
      if (error) { toast.error(t.errGeneric); return; }
      setLiked(true); setCount((c) => c + 1);
    }
  };

  return (
    <div className="animate-neon-pulse glass flex items-center gap-4 rounded-2xl p-4">
      {current.thumbnail_url && <img src={current.thumbnail_url} alt="" className="size-14 rounded-lg object-cover" />}
      <div className="min-w-0 flex-1">
        <div className="text-xs font-bold uppercase tracking-widest text-accent">● {t.onStage}</div>
        <div className="truncate font-display text-lg">{current.singer_name}</div>
        <div className="truncate text-sm text-muted-foreground">{current.song_title}</div>
      </div>
      <button
        onClick={toggle}
        disabled={own}
        aria-label={t.like}
        className={`flex flex-col items-center rounded-xl px-3 py-2 transition ${liked ? "text-primary" : "text-foreground"} disabled:opacity-40`}
      >
        <Heart className={`size-7 ${liked ? "fill-current neon-text" : ""}`} />
        <span className="text-sm font-bold">{count}</span>
      </button>
    </div>
  );
}
