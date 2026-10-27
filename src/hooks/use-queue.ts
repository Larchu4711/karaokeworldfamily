import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { SongRequest } from "@/lib/queue";

/** Live list of tonight's requests (last 12h), kept fresh via Realtime. */
export function useQueue() {
  const [rows, setRows] = useState<SongRequest[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const since = new Date(Date.now() - 12 * 3600 * 1000).toISOString();
    const { data } = await supabase
      .from("song_requests")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: true })
      .limit(500);
    setRows((data ?? []) as SongRequest[]);
    setLoaded(true);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`song_requests_live_${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "song_requests" }, (payload) => {
        setRows((prev) => {
          if (payload.eventType === "DELETE") return prev.filter((r) => r.id !== (payload.old as { id: string }).id);
          const row = payload.new as SongRequest;
          const i = prev.findIndex((r) => r.id === row.id);
          if (i < 0) return [...prev, row];
          const next = prev.slice();
          next[i] = row;
          return next;
        });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  return { rows, setRows, loaded, reload: load };
}
