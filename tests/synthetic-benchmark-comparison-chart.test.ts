import { describe, expect, it } from "vitest";
import { getSyntheticBenchmarkComparisonCharts } from "@/lib/runtime/synthetic-benchmark-comparison-chart";
import type { SyntheticBenchmarkRecord } from "@/types/settings";

describe("synthetic-benchmark-comparison-chart", () => {
  it("returns no rows when there are no successful synthetic benchmarks", () => {
    const rows = getSyntheticBenchmarkComparisonCharts([
      {
        id: "error-1",
        provider: "ollama",
        model: "llama3:latest",
        baseUrl: "http://127.0.0.1:11434",
        benchmarkKind: "smoke_prompt",
        status: "error",
        errorMessage: "boom",
        createdAt: 10,
      },
    ]);

    expect(rows).toEqual([]);
  });

  it("groups recent successful runs by provider and model", () => {
    const rows = getSyntheticBenchmarkComparisonCharts([
      {
        id: "one",
        provider: "ollama",
        model: "llama3:latest",
        baseUrl: "http://127.0.0.1:11434",
        benchmarkKind: "smoke_prompt",
        status: "success",
        durationMs: 3200,
        createdAt: 30,
      },
      {
        id: "two",
        provider: "ollama",
        model: "llama3:latest",
        baseUrl: "http://127.0.0.1:11434",
        benchmarkKind: "smoke_prompt",
        status: "success",
        durationMs: 2800,
        createdAt: 40,
      },
      {
        id: "three",
        provider: "openai_compatible",
        model: "gemma4",
        baseUrl: "http://127.0.0.1:8000/v1",
        benchmarkKind: "smoke_prompt",
        status: "success",
        durationMs: 2200,
        createdAt: 50,
      },
    ] satisfies SyntheticBenchmarkRecord[]);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      provider: "openai_compatible",
      model: "gemma4",
      successfulRuns: 1,
    });
    expect(rows[1]).toMatchObject({
      provider: "ollama",
      model: "llama3:latest",
      successfulRuns: 2,
    });
  });

  it("normalizes chart points oldest to newest within each setup", () => {
    const rows = getSyntheticBenchmarkComparisonCharts([
      {
        id: "older",
        provider: "ollama",
        model: "llama3:latest",
        baseUrl: "http://127.0.0.1:11434",
        benchmarkKind: "smoke_prompt",
        status: "success",
        durationMs: 4000,
        createdAt: 10,
      },
      {
        id: "newer",
        provider: "ollama",
        model: "llama3:latest",
        baseUrl: "http://127.0.0.1:11434",
        benchmarkKind: "smoke_prompt",
        status: "success",
        durationMs: 2000,
        createdAt: 20,
      },
    ] satisfies SyntheticBenchmarkRecord[]);

    expect(rows).toHaveLength(1);
    expect(rows[0].points).toHaveLength(2);
    expect(rows[0].points[0]).toMatchObject({ benchmarkId: "older", x: 0 });
    expect(rows[0].points[1]).toMatchObject({ benchmarkId: "newer", x: 100 });
    expect(rows[0].points[0].y).toBeLessThan(rows[0].points[1].y);
  });
});
