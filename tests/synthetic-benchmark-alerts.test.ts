import { describe, expect, it } from "vitest";
import { getSyntheticBenchmarkAlerts } from "@/lib/runtime/synthetic-benchmark-alerts";
import type { SyntheticBenchmarkComparisonItem } from "@/types/settings";

describe("synthetic-benchmark-alerts", () => {
  it("warns when a faster benchmark winner exists", () => {
    const comparison: SyntheticBenchmarkComparisonItem[] = [
      {
        provider: "openai_compatible",
        model: "gemma4",
        successfulRuns: 3,
        averageDurationMs: 2_400,
        fastestDurationMs: 2_100,
        slowestDurationMs: 2_800,
        latestCreatedAt: 1,
      },
      {
        provider: "ollama",
        model: "llama3:latest",
        successfulRuns: 3,
        averageDurationMs: 4_500,
        fastestDurationMs: 4_200,
        slowestDurationMs: 4_900,
        latestCreatedAt: 2,
      },
    ];

    const alerts = getSyntheticBenchmarkAlerts(
      { provider: "ollama", model: "llama3:latest" },
      comparison,
    );

    expect(alerts[0]?.headline).toContain("benchmark winner");
    expect(alerts[0]?.level).toBe("warning");
  });

  it("shows a healthy info alert when the current setup is still the benchmark leader", () => {
    const comparison: SyntheticBenchmarkComparisonItem[] = [
      {
        provider: "ollama",
        model: "llama3:latest",
        successfulRuns: 2,
        averageDurationMs: 3_100,
        fastestDurationMs: 2_900,
        slowestDurationMs: 3_300,
        latestCreatedAt: 1,
      },
    ];

    const alerts = getSyntheticBenchmarkAlerts(
      { provider: "ollama", model: "llama3:latest" },
      comparison,
    );

    expect(alerts[0]?.headline).toContain("leading");
    expect(alerts[0]?.level).toBe("info");
  });

  it("stays quiet when there is not enough synthetic benchmark signal", () => {
    const comparison: SyntheticBenchmarkComparisonItem[] = [
      {
        provider: "openai_compatible",
        model: "gemma4",
        successfulRuns: 2,
        averageDurationMs: 3_000,
        fastestDurationMs: 2_800,
        slowestDurationMs: 3_200,
        latestCreatedAt: 1,
      },
    ];

    const alerts = getSyntheticBenchmarkAlerts(
      { provider: "ollama", model: "llama3:latest" },
      comparison,
    );

    expect(alerts).toHaveLength(0);
  });
});
