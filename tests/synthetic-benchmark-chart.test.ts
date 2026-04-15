import { describe, expect, it } from "vitest";
import { getSyntheticBenchmarkChart } from "@/lib/runtime/synthetic-benchmark-chart";
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
    outputChars: 20,
    createdAt: 1,
    ...overrides,
  };
}

describe("synthetic-benchmark-chart", () => {
  it("returns a placeholder when there are no successful benchmark runs", () => {
    const chart = getSyntheticBenchmarkChart([
      createBenchmark({
        id: "failed",
        status: "error",
        durationMs: undefined,
      }),
    ]);

    expect(chart.label).toBe("empty");
    expect(chart.points).toHaveLength(0);
  });

  it("normalizes chart points from oldest to newest successful runs", () => {
    const chart = getSyntheticBenchmarkChart([
      createBenchmark({ id: "latest", durationMs: 2_000, createdAt: 3 }),
      createBenchmark({ id: "oldest", durationMs: 4_000, createdAt: 1 }),
      createBenchmark({ id: "middle", durationMs: 3_000, createdAt: 2 }),
    ]);

    expect(chart.label).toBe("ready");
    expect(chart.points).toHaveLength(3);
    expect(chart.points[0]?.benchmarkId).toBe("oldest");
    expect(chart.points[2]?.benchmarkId).toBe("latest");
    expect(chart.minLabel).toBeDefined();
    expect(chart.maxLabel).toBeDefined();
  });
});
