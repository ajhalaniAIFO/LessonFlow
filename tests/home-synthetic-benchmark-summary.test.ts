import { describe, expect, it } from "vitest";
import { getHomeSyntheticBenchmarkSummary } from "@/lib/runtime/home-synthetic-benchmark-summary";
import type { SyntheticBenchmarkComparisonItem } from "@/types/settings";

describe("home-synthetic-benchmark-summary", () => {
  it("returns a placeholder when there is no benchmark winner yet", () => {
    const summary = getHomeSyntheticBenchmarkSummary(
      { provider: "ollama", model: "llama3:latest" },
      [],
    );

    expect(summary.headline).toContain("grows");
    expect(summary.benchmarkWinnerLabel).toBeUndefined();
  });

  it("marks the current setup as leading when it matches the benchmark winner", () => {
    const comparison: SyntheticBenchmarkComparisonItem[] = [
      {
        provider: "ollama",
        model: "llama3:latest",
        successfulRuns: 3,
        averageDurationMs: 3_000,
        fastestDurationMs: 2_800,
        slowestDurationMs: 3_200,
        latestCreatedAt: 1,
      },
    ];

    const summary = getHomeSyntheticBenchmarkSummary(
      { provider: "ollama", model: "llama3:latest" },
      comparison,
    );

    expect(summary.isCurrentBest).toBe(true);
    expect(summary.headline).toContain("leading");
    expect(summary.actionHref).toBe("/settings");
  });

  it("surfaces a benchmark winner when the current setup is not best", () => {
    const comparison: SyntheticBenchmarkComparisonItem[] = [
      {
        provider: "openai_compatible",
        model: "gemma4",
        successfulRuns: 2,
        averageDurationMs: 2_400,
        fastestDurationMs: 2_100,
        slowestDurationMs: 2_700,
        latestCreatedAt: 1,
      },
    ];

    const summary = getHomeSyntheticBenchmarkSummary(
      { provider: "ollama", model: "llama3:latest" },
      comparison,
    );

    expect(summary.isCurrentBest).toBe(false);
    expect(summary.benchmarkWinnerLabel).toContain("openai_compatible");
    expect(summary.summary).toContain("fastest");
    expect(summary.actionHref).toBe("/settings?applySyntheticBenchmarkWinner=1");
    expect(summary.actionMessage).toContain("preload");
  });

  it("carries synthetic trend insight into the home summary when available", () => {
    const summary = getHomeSyntheticBenchmarkSummary(
      { provider: "ollama", model: "llama3:latest" },
      [],
      {
        label: "stable",
        headline: "Synthetic benchmarks look stable",
        summary: "Recent controlled benchmark runs are close enough to suggest a stable performance pattern.",
        details: [],
      },
    );

    expect(summary.trendHeadline).toContain("stable");
    expect(summary.trendSummary).toContain("controlled benchmark runs");
  });

  it("carries synthetic chart insight into the home summary when available", () => {
    const summary = getHomeSyntheticBenchmarkSummary(
      { provider: "ollama", model: "llama3:latest" },
      [],
      undefined,
      {
        label: "ready",
        headline: "Synthetic benchmark chart",
        summary: "Recent successful controlled benchmark runs for the current provider/model, shown oldest to newest.",
        minLabel: "2.0s",
        maxLabel: "4.0s",
        points: [
          { benchmarkId: "one", x: 0, y: 28, durationMs: 4000, createdAt: 1 },
          { benchmarkId: "two", x: 100, y: 4, durationMs: 2000, createdAt: 2 },
        ],
      },
    );

    expect(summary.chart?.label).toBe("ready");
    expect(summary.chart?.points).toHaveLength(2);
  });
});
