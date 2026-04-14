import { describe, expect, it } from "vitest";
import { getRuntimeAlerts } from "@/lib/runtime/runtime-alerts";
import type { RuntimeComparisonItem, RuntimeUsageDashboard } from "@/types/job";
import type { RuntimeTrend } from "@/lib/runtime/runtime-trends";

function createDashboard(overrides: Partial<RuntimeUsageDashboard>): RuntimeUsageDashboard {
  return {
    recentJobs: [],
    completedJobs: 0,
    totalLessonScenes: 0,
    totalQuizScenes: 0,
    ...overrides,
  };
}

function createTrend(overrides: Partial<RuntimeTrend>): RuntimeTrend {
  return {
    label: "stable",
    headline: "Stable",
    summary: "Stable",
    details: [],
    ...overrides,
  };
}

describe("runtime-alerts", () => {
  it("warns when a faster recent setup exists", () => {
    const alerts = getRuntimeAlerts(
      { provider: "ollama", model: "llama3:latest" },
      createDashboard({
        recentJobs: [
          {
            jobId: "job-1",
            lessonId: "lesson-1",
            lessonTitle: "Lesson",
            runtimeProvider: "ollama",
            runtimeModel: "llama3:latest",
            status: "ready",
            updatedAt: 1,
            telemetry: { totalMs: 30_000 },
          },
        ],
      }),
      [
        {
          runtimeProvider: "openai_compatible",
          runtimeModel: "gemma4",
          completedJobs: 2,
          averageTotalMs: 15_000,
          fastestTotalMs: 12_000,
          slowestTotalMs: 18_000,
        },
      ],
      createTrend({}),
    );

    expect(alerts[0]?.headline).toContain("faster recent setup");
  });

  it("warns when the current setup is regressing", () => {
    const alerts = getRuntimeAlerts(
      { provider: "ollama", model: "llama3:latest" },
      createDashboard({}),
      [],
      createTrend({ label: "regressing" }),
    );

    expect(alerts[0]?.headline).toContain("slowing down");
  });

  it("shows a healthy info alert when the current setup is still best", () => {
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

    const alerts = getRuntimeAlerts(
      { provider: "ollama", model: "llama3:latest" },
      createDashboard({
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
      }),
      comparison,
      createTrend({}),
    );

    expect(alerts[0]?.level).toBe("info");
    expect(alerts[0]?.headline).toContain("healthy");
  });
});
