import { describe, expect, it } from "vitest";
import { getSyntheticBenchmarkTrend } from "@/lib/runtime/synthetic-benchmark-trends";
import type { SyntheticBenchmarkRecord } from "@/types/settings";

function createBenchmark(
  overrides: Partial<SyntheticBenchmarkRecord>,
): SyntheticBenchmarkRecord {
  return {
    id: "benchmark-1",
    provider: "ollama",
    model: "llama3:latest",
    baseUrl: "http://127.0.0.1:11434",
    benchmarkKind: "smoke_prompt",
    status: "success",
    durationMs: 3_000,
    createdAt: 1,
    ...overrides,
  };
}

describe("synthetic-benchmark-trends", () => {
  it("returns insufficient data when there are too few successful benchmark runs", () => {
    const trend = getSyntheticBenchmarkTrend(
      { provider: "ollama", model: "llama3:latest" },
      [
        createBenchmark({ id: "one", durationMs: 3_000, createdAt: 3 }),
        createBenchmark({ id: "two", durationMs: 2_900, createdAt: 2 }),
      ],
    );

    expect(trend.label).toBe("insufficient_data");
  });

  it("detects improving synthetic benchmark performance", () => {
    const trend = getSyntheticBenchmarkTrend(
      { provider: "ollama", model: "llama3:latest" },
      [
        createBenchmark({ id: "one", durationMs: 2_000, createdAt: 5 }),
        createBenchmark({ id: "two", durationMs: 2_200, createdAt: 4 }),
        createBenchmark({ id: "three", durationMs: 4_800, createdAt: 3 }),
        createBenchmark({ id: "four", durationMs: 4_600, createdAt: 2 }),
      ],
    );

    expect(trend.label).toBe("improving");
    expect(trend.headline).toContain("improving");
  });

  it("detects regressing synthetic benchmark performance", () => {
    const trend = getSyntheticBenchmarkTrend(
      { provider: "ollama", model: "llama3:latest" },
      [
        createBenchmark({ id: "one", durationMs: 5_000, createdAt: 5 }),
        createBenchmark({ id: "two", durationMs: 4_900, createdAt: 4 }),
        createBenchmark({ id: "three", durationMs: 2_400, createdAt: 3 }),
        createBenchmark({ id: "four", durationMs: 2_300, createdAt: 2 }),
      ],
    );

    expect(trend.label).toBe("regressing");
    expect(trend.headline).toContain("slowing down");
  });
});
