/** Las-Vegas show opener synthesized in WebAudio + TTS announcement. */
export function playShowOpener(announce: string, lang: string, voiceAudio?: Promise<string | null>): { stop: () => void; finished: Promise<void> } {
  let finish: () => void = () => {};
  const finished = new Promise<void>((resolve) => { finish = resolve; });
  const deadline = setTimeout(() => { audioEl?.pause(); window.speechSynthesis?.cancel(); finish(); }, 25000);
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  const master = ctx.createGain();
  master.gain.value = 0.35;
  master.connect(ctx.destination);
  const t0 = ctx.currentTime + 0.05;

  const tone = (freq: number, start: number, dur: number, type: OscillatorType, vol = 0.2) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 3200;
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(vol, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, start + dur);
    o.connect(f).connect(g).connect(master);
    o.start(start);
    o.stop(start + dur + 0.05);
  };

  const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
  const ch = noiseBuf.getChannelData(0);
  for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / ch.length);
  const hit = (start: number, vol = 0.5) => {
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf;
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 1800;
    g.gain.setValueAtTime(vol, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
    s.connect(f).connect(g).connect(master);
    s.start(start);
  };

  // Brass stabs: C → F → G7
  const chords = [
    [261.63, 329.63, 392.0],
    [349.23, 440.0, 523.25],
    [392.0, 493.88, 587.33, 698.46],
  ];
  chords.forEach((c, i) => {
    const st = t0 + i * 0.32;
    c.forEach((f) => tone(f, st, 0.28, "sawtooth", 0.12));
    hit(st, 0.25);
  });
  // Glissando 392 → 1568
  const gl = ctx.createOscillator();
  const gg = ctx.createGain();
  gl.type = "sawtooth";
  const gs = t0 + 1.0;
  gl.frequency.setValueAtTime(392, gs);
  gl.frequency.exponentialRampToValueAtTime(1568, gs + 0.6);
  gg.gain.setValueAtTime(0.08, gs);
  gg.gain.exponentialRampToValueAtTime(0.001, gs + 0.65);
  gl.connect(gg).connect(master);
  gl.start(gs);
  gl.stop(gs + 0.7);
  // Drum bursts
  [1.65, 1.8, 1.95, 2.1].forEach((d) => hit(t0 + d, 0.4));
  // Final C major chord
  const fin = t0 + 2.25;
  [130.81, 261.63, 329.63, 392.0, 523.25].forEach((f) => {
    tone(f, fin, 1.8, "triangle", 0.12);
    tone(f, fin, 1.6, "sawtooth", 0.05);
  });
  hit(fin, 0.6);

  let timer: ReturnType<typeof setTimeout> | null = null;
  let audioEl: HTMLAudioElement | null = null;
  let stopped = false;
  const startAt = Date.now() + 600 + 2600;

  const browserVoice = () => {
    if (!("speechSynthesis" in window)) { finish(); return; }
    const u = new SpeechSynthesisUtterance(announce);
    u.lang = lang === "es" ? "es-ES" : lang === "de" ? "de-DE" : "en-US";
    u.rate = 1;
    u.pitch = 1.05;
    u.onend = finish;
    u.onerror = finish;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  (voiceAudio ?? Promise.resolve(null))
    .catch(() => null)
    .then((b64) => {
      if (stopped) return;
      const play = () => {
        if (stopped) return;
        if (b64) {
          audioEl = new Audio(`data:audio/mpeg;base64,${b64}`);
          audioEl.onended = finish;
          audioEl.onerror = browserVoice;
          audioEl.play().catch(browserVoice);
        } else browserVoice();
      };
      timer = setTimeout(play, Math.max(0, startAt - Date.now()));
    });

  return {
    finished: finished.finally(() => clearTimeout(deadline)),
    stop: () => {
      clearTimeout(deadline);
      finish();
      stopped = true;
      if (timer) clearTimeout(timer);
      try { audioEl?.pause(); } catch { /* noop */ }
      try { window.speechSynthesis?.cancel(); } catch { /* noop */ }
      ctx.close().catch(() => {});
    },
  };
}
