import { describe, expect, it } from "vitest";
import { canLikePerformance, singerPoints } from "./singer";
describe("singer points", () => {
  it("awards one point per received like and removes points for removed likes", () => {
    expect(singerPoints(7)).toBe(7);
    expect(singerPoints(6)).toBe(6);
    expect(singerPoints(0)).toBe(0);
  });
});
describe("performance likes", () => {
  const now = Date.parse("2026-10-26T02:45:00Z");
  const recent = new Date(now - 1000).toISOString();
  it("prevents self-likes and signed-out votes", () => {
    expect(canLikePerformance("anna", "anna", "playing", recent, now)).toBe(false);
    expect(canLikePerformance(undefined, "anna", "playing", recent, now)).toBe(false);
    expect(canLikePerformance("lars", "anna", "playing", recent, now)).toBe(true);
  });
  it("only accepts playing or completed performances within twelve hours", () => {
    expect(canLikePerformance("lars", "anna", "waiting", recent, now)).toBe(false);
    expect(canLikePerformance("lars", "anna", "done", recent, now)).toBe(true);
    expect(canLikePerformance("lars", "anna", "done", new Date(now - 12 * 3600 * 1000).toISOString(), now)).toBe(false);
  });
});