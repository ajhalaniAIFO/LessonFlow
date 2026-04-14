import { describe, expect, it } from "vitest";
import { getHomeRuntimeSummary } from "@/lib/runtime/home-runtime-summary";
import type { RuntimeComparisonItem, RuntimeUsageDashboard } from "@/types/job";

function createDashboard(overrides: Partial<RuntimeUsageDashboard>): RuntimeUsageDashboard {
  return {
    recentJobs: [],
    completedJobs: 0,
    totalLessonScenes: 0,
    totalQuizScenes: 0,
    ...overrides,
  };
}

describe("home-runtime-summary", () => {
  it("returns a placeholder when there is no best recent setup yet", () => {
    const summary = getHomeRuntimeSummary(
      { provider: "ollama", model: "llama3:latest" },
      createDashboard({}),
      [],
    );

    expect(summary.headline).toContain("grows");
    expect(summary.bestSetupLabel).toBeUndefined();
  });

  it("marks the current setup as leading when it matches the best recent setup", () => {
    const comparison: RuntimeComparisonItem[] = [
      {
        runtimeProvider: "ollama",
        runtimeModel: "llama3:latest",
        completedJobs: 3,
        averageTotalMs: 12_000,
        fastestTotalMs: 9_000,
        slowestTotalMs: 15_000,
      },
    ];

    const dashboard = createDashboard({
      recentJobs: [
        {
          jobId: "job-1",
          lessonId: "lesson-1",
          lessonTitle: "Lesson",
          runtimeProvider: "ollama",
          runtimeModel: "llama3:latest",
          status: "ready",
          updatedAt: 1,
          telemetry: { totalMs: 12_000 },
        },
      ],
    });

    const summary = getHomeRuntimeSummary(
      { provider: "ollama", model: "llama3:latest" },
      dashboard,
      comparison,
    );

    expect(summary.isCurrentBest).toBe(true);
    expect(summary.headline).toContain("leading");
  });

  it("surfaces a stronger recent setup when the current setup is not best", () => {
    const comparison: RuntimeComparisonItem[] = [
      {
        runtimeProvider: "openai_compatible",
        runtimeModel: "gemma4",
        completedJobs: 2,
        averageTotalMs: 10_000,
        fastestTotalMs: 9_000,
        slowestTotalMs: 11_000,
      },
    ];

    const dashboard = createDashboard({
      recentJobs: [
        {
          jobId: "job-1",
          lessonId: "lesson-1",
          lessonTitle: "Lesson",
          runtimeProvider: "ollama",
          runtimeModel: "llama3:latest",
          status: "ready",
          updatedAt: 1,
          telemetry: { totalMs: 24_000 },
        },
      ],
    });

    const summary = getHomeRuntimeSummary(
      { provider: "ollama", model: "llama3:latest" },
      dashboard,
      comparison,
    );

    expect(summary.isCurrentBest).toBe(false);
    expect(summary.bestSetupLabel).toContain("openai_compatible");
    expect(summary.summary).toContain("outperforming");
  });
});
