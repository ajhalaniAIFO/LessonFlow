import { describe, expect, it } from "vitest";
import { getRuntimeComparisonCharts } from "@/lib/runtime/runtime-comparison-chart";
import type { RuntimeUsageJobInsight } from "@/types/job";

function createJob(
  overrides: Partial<RuntimeUsageJobInsight>,
): RuntimeUsageJobInsight {
  return {
    jobId: "job-1",
    lessonId: "lesson-1",
    lessonTitle: "Lesson",
    runtimeProvider: "ollama",
    runtimeModel: "llama3:latest",
    status: "ready",
    updatedAt: 1_710_000_000_000,
    telemetry: {
      totalMs: 12_000,
    },
    ...overrides,
  };
}

describe("runtime-comparison-chart", () => {
  it("ignores jobs without runtime identity or telemetry", () => {
    const charts = getRuntimeComparisonCharts([
      createJob({ runtimeProvider: undefined }),
      createJob({ runtimeModel: undefined }),
      createJob({ telemetry: {} }),
    ]);

    expect(charts).toHaveLength(0);
  });

  it("groups runs by provider and model", () => {
    const charts = getRuntimeComparisonCharts([
      createJob({ jobId: "job-a" }),
      createJob({ jobId: "job-b", runtimeProvider: "openai_compatible", runtimeModel: "gemma4" }),
    ]);

    expect(charts).toHaveLength(2);
    expect(charts[0]?.runtimeProvider).toBe("ollama");
    expect(charts[1]?.runtimeProvider).toBe("openai_compatible");
  });

  it("creates normalized points and sorts by completed jobs then speed", () => {
    const charts = getRuntimeComparisonCharts([
      createJob({ jobId: "job-a", telemetry: { totalMs: 10_000 } }),
      createJob({ jobId: "job-b", telemetry: { totalMs: 20_000 } }),
      createJob({
        jobId: "job-c",
        runtimeProvider: "openai_compatible",
        runtimeModel: "gemma4",
        telemetry: { totalMs: 8_000 },
      }),
    ]);

    expect(charts[0]?.runtimeProvider).toBe("ollama");
    expect(charts[0]?.completedJobs).toBe(2);
    expect(charts[0]?.points[0]?.x).toBe(0);
    expect(charts[0]?.points[1]?.x).toBe(100);
    expect(charts[0]?.points[0]?.y).toBe(28);
    expect(charts[0]?.points[1]?.y).toBe(0);
  });
});
