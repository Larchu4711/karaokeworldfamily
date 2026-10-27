let ctx: AudioContext | null = null;
let last = 0;
/** Short crowd applause on its own WebAudio context; never touches the YouTube player. */
export function playApplause(seconds = 2.4): void {
  const now = Date.now();
  if (now - last < 1500) return; // avoid stacking on rapid likes
  last = now;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const c = ctx;
    const out = c.createGain();
    out.gain.value = 0.5;
    out.connect(c.destination);
    const len = Math.floor(c.sampleRate * 0.05);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    const t0 = c.currentTime + 0.02;
    const claps = Math.floor(seconds * 70);
    for (let i = 0; i < claps; i++) {
      const at = t0 + Math.random() * seconds;
      const env = Math.sin(Math.PI * ((at - t0) / seconds)); // swell in and out
      const s = c.createBufferSource();
      s.buffer = buf;
      s.playbackRate.value = 0.8 + Math.random() * 0.5;
      const f = c.createBiquadFilter();
      f.type = "bandpass"; f.frequency.value = 900 + Math.random() * 1800; f.Q.value = 0.9;
      const g = c.createGain();
      g.gain.value = 0.12 + env * 0.28 * Math.random();
      s.connect(f).connect(g).connect(out);
      s.start(at);
    }
  } catch { /* audio unavailable */ }
}
