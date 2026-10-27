import { useEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { addedHearts } from "@/lib/stage";
import { useI18n } from "@/lib/i18n";

export function StageHearts({ requestId }: { requestId: string }) {
  const { t } = useI18n();
  const [count, setCount] = useState(0);
  const [hearts, setHearts] = useState<number[]>([]);
  const sequence = useRef(0);
  useEffect(() => {
    let alive = true;
    let previous: number | null = null;
    let pending = false;
    setCount(0); setHearts([]);
    const refresh = async () => {
      if (pending) return;
      pending = true;
      try {
        const { data, error } = await supabase.rpc("like_counts", { p_ids: [requestId] });
        if (!alive || error) return;
        const total = Number(data?.[0]?.likes ?? 0);
        const added = addedHearts(previous, total);
        previous = total;
        setCount(total);
        if (added) setHearts((h) => [...h.slice(-12), ...Array.from({ length: added }, () => ++sequence.current)]);
      } finally { pending = false; }
    };
    refresh();
    const interval = setInterval(refresh, 2000);
    return () => { alive = false; clearInterval(interval); };
  }, [requestId]);
  return <div className="pointer-events-none absolute bottom-6 right-6 z-20 text-primary">
    <div className="relative" aria-hidden="true">{hearts.map((id) => <Heart key={id} className={`stage-heart stage-heart-${id % 4} absolute bottom-4 right-2 size-9 fill-current`} onAnimationEnd={() => setHearts((h) => h.filter((n) => n !== id))} />)}</div>
    <div className="flex items-center gap-3 rounded-lg border border-primary/40 bg-background/90 px-5 py-3" aria-label={t.likes}><Heart className="size-7 fill-current" /><span className="text-2xl font-bold tabular-nums">{count}</span></div>
  </div>;
}