export function singerPoints(receivedLikes: number): number {
  return Math.max(0, Math.floor(receivedLikes));
}
export function canLikePerformance(userId: string | undefined, singerId: string | null, status: string, updatedAt: string, now: number): boolean {
  return !!userId && singerId !== userId && (status === "playing" || status === "done") && new Date(updatedAt).getTime() > now - 12 * 3600 * 1000;
}