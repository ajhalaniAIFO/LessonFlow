import { describe, expect, it } from "vitest";
import { getRuntimeTrend } from "@/lib/runtime/runtime-trends";

describe("runtime-trends", () => {
  it("returns insufficient data when there are too few samples", () => {
    const trend = getRuntimeTrend(
      {
        provider: "ollama",
        model: "llama3:latest",
      },
      [{ updatedAt: Date.now(), totalMs: 10_000 }],
    );

    expect(trend.label).toBe("insufficient_data");
  });

  it("marks faster recent runs as improving", () => {
    const trend = getRuntimeTrend(
      {
        provider: "ollama",
        model: "llama3:latest",
      },
      [
        { updatedAt: 4, totalMs: 10_000 },
        { updatedAt: 3, totalMs: 12_000 },
        { updatedAt: 2, totalMs: 30_000 },
        { updatedAt: 1, totalMs: 32_000 },
      ],
    );

    expect(trend.label).toBe("improving");
  });

  it("marks slower recent runs as regressing", () => {
    const trend = getRuntimeTrend(
      {
        provider: "openai_compatible",
        model: "google/gemma-3-4b-it",
      },
      [
        { updatedAt: 4, totalMs: 40_000 },
        { updatedAt: 3, totalMs: 42_000 },
        { updatedAt: 2, totalMs: 18_000 },
        { updatedAt: 1, totalMs: 20_000 },
      ],
    );

    expect(trend.label).toBe("regressing");
  });
});
