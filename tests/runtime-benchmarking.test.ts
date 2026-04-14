import { describe, expect, it } from "vitest";
import { getRuntimeBenchmark } from "@/lib/runtime/runtime-benchmarking";
import type { RuntimeUsageDashboard } from "@/types/job";
import type { ModelSettings } from "@/types/settings";

const baseSettings: ModelSettings = {
  provider: "ollama",
  baseUrl: "http://127.0.0.1:11434",
  model: "llama3:latest",
  temperature: 0.4,
  maxTokens: 2000,
  timeoutMs: 120000,
};

function createDashboard(overrides: Partial<RuntimeUsageDashboard>): RuntimeUsageDashboard {
  return {
    recentJobs: [],
    completedJobs: 0,
    totalLessonScenes: 0,
    totalQuizScenes: 0,
    ...overrides,
  };
}

describe("runtime-benchmarking", () => {
  it("returns a placeholder benchmark when there is not enough history", () => {
    const benchmark = getRuntimeBenchmark(baseSettings, createDashboard({}));

    expect(benchmark.headline).toContain("appear after a few completed lessons");
    expect(benchmark.details[0]).toContain("ollama");
  });

  it("classifies fast recent jobs as quick", () => {
    const benchmark = getRuntimeBenchmark(
      baseSettings,
      createDashboard({
        completedJobs: 3,
        averageTotalMs: 12_000,
        fastestTotalMs: 9_000,
        slowestTotalMs: 15_000,
      }),
    );

    expect(benchmark.label).toBe("quick");
    expect(benchmark.headline).toContain("quick");
  });

  it("classifies slow recent jobs as heavy", () => {
    const benchmark = getRuntimeBenchmark(
      baseSettings,
      createDashboard({
        completedJobs: 3,
        averageTotalMs: 90_000,
        fastestTotalMs: 60_000,
        slowestTotalMs: 120_000,
      }),
    );

    expect(benchmark.label).toBe("heavy");
    expect(benchmark.summary).toContain("taking noticeably longer");
  });
});
