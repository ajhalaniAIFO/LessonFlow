import { describe, expect, it } from "vitest";
import { getHomeSyntheticBenchmarkHistory } from "@/lib/runtime/home-synthetic-benchmark-history";
import type { SyntheticBenchmarkRecord } from "@/types/settings";

describe("home-synthetic-benchmark-history", () => {
  it("returns a placeholder when there are no synthetic benchmarks yet", () => {
    const history = getHomeSyntheticBenchmarkHistory([]);

    expect(history.headline).toContain("will appear");
    expect(history.benchmarks).toEqual([]);
  });

  it("keeps recent synthetic benchmark entries for home display", () => {
    const benchmarks: SyntheticBenchmarkRecord[] = [
      {
        id: "one",
        provider: "ollama",
        model: "llama3:latest",
        baseUrl: "http://127.0.0.1:11434",
        benchmarkKind: "smoke_prompt",
        status: "success",
        durationMs: 3200,
        outputChars: 22,
        outputPreview: "benchmark ready",
        createdAt: 30,
      },
      {
        id: "two",
        provider: "ollama",
        model: "llama3:latest",
        baseUrl: "http://127.0.0.1:11434",
        benchmarkKind: "smoke_prompt",
        status: "error",
        durationMs: 4100,
        errorMessage: "connect ECONNREFUSED",
        createdAt: 20,
      },
      {
        id: "three",
        provider: "ollama",
        model: "llama3:latest",
        baseUrl: "http://127.0.0.1:11434",
        benchmarkKind: "smoke_prompt",
        status: "success",
        durationMs: 2800,
        outputChars: 22,
        outputPreview: "benchmark ready",
        createdAt: 10,
      },
    ];

    const history = getHomeSyntheticBenchmarkHistory(benchmarks);

    expect(history.headline).toContain("Recent");
    expect(history.benchmarks).toHaveLength(3);
    expect(history.benchmarks[0].id).toBe("one");
  });

  it("limits the Home history to a compact recent slice", () => {
    const benchmarks = Array.from({ length: 6 }, (_, index) => ({
      id: `benchmark-${index}`,
      provider: "ollama" as const,
      model: "llama3:latest",
      baseUrl: "http://127.0.0.1:11434",
      benchmarkKind: "smoke_prompt" as const,
      status: "success" as const,
      durationMs: 2500 + index * 100,
      createdAt: 100 - index,
    }));

    const history = getHomeSyntheticBenchmarkHistory(benchmarks);

    expect(history.benchmarks).toHaveLength(4);
    expect(history.benchmarks[0].id).toBe("benchmark-0");
    expect(history.benchmarks[3].id).toBe("benchmark-3");
  });
});
