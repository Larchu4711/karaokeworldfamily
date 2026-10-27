import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { djStageCommand, djStageState } from "@/lib/dj.functions";
import { defaultStageControl, type StageCommand } from "@/lib/stage-control";

export function useStageControl() {
  const read = useServerFn(djStageState);
  const write = useServerFn(djStageCommand);
  const [control, setControl] = useState(defaultStageControl);
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let alive = true;
    let pending = false;
    const refresh = async () => {
      if (pending) return;
      pending = true;
      try { const next = await read(); if (alive) { setControl((old) => next.revision >= old.revision ? next : old); setConnected(true); } }
      catch { if (alive) setConnected(false); }
      finally { pending = false; }
    };
    void refresh();
    const timer = setInterval(refresh, 800);
    return () => { alive = false; clearInterval(timer); };
  }, [read]);
  const command = useCallback(async (command: StageCommand, volume?: number) => {
    setBusy(true);
    try { const next = await write({ data: { command, volume: volume ?? 100 } }); setControl((old) => next.revision >= old.revision ? next : old); setConnected(true); }
    finally { setBusy(false); }
  }, [write]);
  return { control, command, connected, busy };
}