import { describe, it, expect } from "vitest";
import { getScoreColor, getScoreGrade } from "@/lib/score-utils";

describe("getScoreColor", () => {
  it("returns primary for scores >= 80", () => {
    expect(getScoreColor(80)).toBe("text-primary");
    expect(getScoreColor(95)).toBe("text-primary");
    expect(getScoreColor(100)).toBe("text-primary");
  });

  it("returns accent for scores 60-79", () => {
    expect(getScoreColor(60)).toBe("text-accent");
    expect(getScoreColor(79)).toBe("text-accent");
  });

  it("returns muted-foreground for scores < 60", () => {
    expect(getScoreColor(59)).toBe("text-muted-foreground");
    expect(getScoreColor(0)).toBe("text-muted-foreground");
  });
});

describe("getScoreGrade", () => {
  it("returns S for scores >= 90", () => {
    expect(getScoreGrade(90)).toBe("S");
    expect(getScoreGrade(100)).toBe("S");
  });

  it("returns A for scores 80-89", () => {
    expect(getScoreGrade(80)).toBe("A");
    expect(getScoreGrade(89)).toBe("A");
  });

  it("returns B for scores 70-79", () => {
    expect(getScoreGrade(70)).toBe("B");
    expect(getScoreGrade(79)).toBe("B");
  });

  it("returns C for scores 60-69", () => {
    expect(getScoreGrade(60)).toBe("C");
    expect(getScoreGrade(69)).toBe("C");
  });

  it("returns D for scores < 60", () => {
    expect(getScoreGrade(59)).toBe("D");
    expect(getScoreGrade(0)).toBe("D");
  });
});
