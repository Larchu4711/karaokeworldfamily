import { useEffect, useRef, useState } from "react";
import { Heart, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { addedHearts } from "@/lib/stage";
import { playApplause } from "@/lib/applause";
import { useI18n } from "@/lib/i18n";

type Particle = { id: number; star: boolean; left: number; dx: number; rot: number; delay: number; dur: number; size: number; color: number };
const SWARM = 10;

function burst(next: () => number): Particle[] {
  return Array.from({ length: SWARM * 2 }, (_, i) => {
    const star = i >= SWARM;
    return {
      id: next(), star,
      left: 5 + Math.random() * 90,
      dx: (Math.random() - 0.5) * 300,
      rot: (Math.random() - 0.5) * 720,
      delay: Math.random() * 600,
      dur: 2600 + Math.random() * 1600,
      size: 28 + Math.random() * 30,
      color: (star ? 4 : 0) + Math.floor(Math.random() * 4),
    };
  });
}

export function StageHearts({ requestId }: { requestId: string }) {
  const { t } = useI18n();
  const [count, setCount] = useState(0);
  const [parts, setParts] = useState<Particle[]>([]);
  const sequence = useRef(0);
  useEffect(() => {
    let alive = true;
    let previous: number | null = null;
    let pending = false;
    setCount(0); setParts([]);
    const refresh = async () => {
      if (pending) return;
      pending = true;
      try {
        const { data, error } = await supabase.rpc("like_counts", { p_ids: [requestId] });
        if (!alive || error) return;
        const total = Number(data?.[0]?.likes ?? 0);
        const added = Math.min(3, addedHearts(previous, total));
        previous = total;
        setCount(total);
        if (added) {
          playApplause();
          const fresh = Array.from({ length: added }, () => burst(() => ++sequence.current)).flat();
          setParts((p) => [...p.slice(-60), ...fresh]);
        }
      } finally { pending = false; }
    };
    refresh();
    const interval = setInterval(refresh, 2000);
    return () => { alive = false; clearInterval(interval); };
  }, [requestId]);
  const remove = (id: number) => setParts((p) => p.filter((n) => n.id !== id));
  return <>
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden" aria-hidden="true">
      {parts.map((p) => {
        const Icon = p.star ? Star : Heart;
        return <Icon key={p.id} className={`stage-swarm swarm-c${p.color} fill-current`} onAnimationEnd={() => remove(p.id)}
          style={{ left: `${p.left}%`, width: p.size, height: p.size, ["--dx" as string]: `${p.dx}px`, ["--rot" as string]: `${p.rot}deg`, ["--delay" as string]: `${p.delay}ms`, ["--dur" as string]: `${p.dur}ms` }} />;
      })}
    </div>
    <div className="pointer-events-none absolute bottom-6 right-6 z-20 text-primary">
      <div className="flex items-center gap-3 rounded-lg border border-primary/40 bg-background/90 px-5 py-3" aria-label={t.likes}><Heart className="size-7 fill-current" /><span className="text-2xl font-bold tabular-nums">{count}</span></div>
    </div>
  </>;
}
