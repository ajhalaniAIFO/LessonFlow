import { describe, expect, it } from "vitest";
import {
  getRecommendedSyntheticBenchmarkSetup,
  getSyntheticBenchmarkComparisonSummary,
} from "@/lib/runtime/synthetic-benchmark-comparison";
import type { SyntheticBenchmarkComparisonItem } from "@/types/settings";

describe("synthetic-benchmark-comparison", () => {
  it("returns a placeholder summary when there is no synthetic benchmark comparison data", () => {
    const summary = getSyntheticBenchmarkComparisonSummary([]);

    expect(summary.headline).toContain("Synthetic comparison will appear");
    expect(summary.best).toBeUndefined();
  });

  it("uses the first ranked benchmarked setup as the leader", () => {
    const items: SyntheticBenchmarkComparisonItem[] = [
      {
        provider: "openai_compatible",
        model: "google/gemma-3-4b-it",
        successfulRuns: 3,
        averageDurationMs: 3200,
        fastestDurationMs: 2800,
        slowestDurationMs: 3600,
        latestCreatedAt: 1_750_000_000_000,
      },
    ];

    const summary = getSyntheticBenchmarkComparisonSummary(items);

    expect(summary.best?.model).toBe("google/gemma-3-4b-it");
    expect(summary.summary).toContain("google/gemma-3-4b-it");
  });

  it("returns the first ranked synthetic benchmark setup as the recommendation", () => {
    const recommendation = getRecommendedSyntheticBenchmarkSetup([
      {
        provider: "ollama",
        model: "llama3:latest",
        successfulRuns: 2,
        averageDurationMs: 4100,
        fastestDurationMs: 3900,
        slowestDurationMs: 4300,
        latestCreatedAt: 1_750_000_000_000,
      },
    ]);

    expect(recommendation).toEqual({
      provider: "ollama",
      model: "llama3:latest",
    });
  });
});
