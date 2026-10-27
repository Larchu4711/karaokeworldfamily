import { describe, expect, it } from "vitest";
import { addedHearts, countdownRemaining } from "./stage";

describe("stage countdown", () => {
  it("counts five seconds without going below zero", () => {
    expect(countdownRemaining(1000, 1000)).toBe(5);
    expect(countdownRemaining(1000, 4000)).toBe(2);
    expect(countdownRemaining(1000, 6000)).toBe(0);
    expect(countdownRemaining(1000, 9000)).toBe(0);
  });
});
describe("live hearts", () => {
  it("only animates newly added likes, not the initial total or removals", () => {
    expect(addedHearts(null, 8)).toBe(0);
    expect(addedHearts(8, 11)).toBe(3);
    expect(addedHearts(11, 8)).toBe(0);
  });
});