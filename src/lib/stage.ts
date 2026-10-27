/** Countdown and announcement both finish before the karaoke audio starts. */
export const STAGE_COUNTDOWN_SECONDS = 5;
export function countdownRemaining(startedAt: number, now: number): number {
  return Math.max(0, STAGE_COUNTDOWN_SECONDS - Math.floor(Math.max(0, now - startedAt) / 1000));
}
export function addedHearts(previous: number | null, current: number): number {
  return previous === null ? 0 : Math.min(12, Math.max(0, current - previous));
}