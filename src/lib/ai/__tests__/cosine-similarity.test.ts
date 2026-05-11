import { describe, it, expect } from "vitest";
import {
  cosineSimilarity,
  calculateBrandFitScore,
} from "@/lib/ai/cosine-similarity";

describe("cosineSimilarity", () => {
  it("returns 1 for identical vectors", () => {
    const v = [1, 2, 3, 4, 5];
    expect(cosineSimilarity(v, v)).toBeCloseTo(1, 5);
  });

  it("returns 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 5);
  });

  it("returns 0 for different-length vectors", () => {
    expect(cosineSimilarity([1, 2], [1, 2, 3])).toBe(0);
  });

  it("returns 0 for empty vectors", () => {
    expect(cosineSimilarity([], [])).toBe(0);
  });

  it("returns 0 for zero vectors", () => {
    expect(cosineSimilarity([0, 0, 0], [1, 2, 3])).toBe(0);
  });

  it("handles negative values", () => {
    const result = cosineSimilarity([1, -1], [-1, 1]);
    expect(result).toBeCloseTo(-1, 5);
  });

  it("returns value between -1 and 1", () => {
    const a = [3, 7, 2, 9, 1];
    const b = [5, 1, 8, 3, 6];
    const result = cosineSimilarity(a, b);
    expect(result).toBeGreaterThanOrEqual(-1);
    expect(result).toBeLessThanOrEqual(1);
  });
});

describe("calculateBrandFitScore", () => {
  it("returns 100 for identical vectors", () => {
    const v = [1, 2, 3];
    expect(calculateBrandFitScore(v, v)).toBe(100);
  });

  it("returns 0 for very dissimilar vectors", () => {
    const score = calculateBrandFitScore([1, 0, 0], [0, 0, 1]);
    expect(score).toBeLessThanOrEqual(10);
  });

  it("returns value between 0 and 100", () => {
    const score = calculateBrandFitScore([1, 3, 5], [2, 4, 6]);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
