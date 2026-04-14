import { describe, expect, it } from "vitest";
import { getRuntimeChart } from "@/lib/runtime/runtime-chart";
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

describe("runtime-chart", () => {
  it("returns a placeholder when there are no completed runs for the current setup", () => {
    const chart = getRuntimeChart(
      { provider: "ollama", model: "llama3:latest" },
      [],
    );

    expect(chart.headline).toContain("will appear");
    expect(chart.points).toHaveLength(0);
  });

  it("filters to the current provider and model", () => {
    const chart = getRuntimeChart(
      { provider: "ollama", model: "llama3:latest" },
      [
        createJob({ jobId: "job-a" }),
        createJob({
          jobId: "job-b",
          runtimeProvider: "openai_compatible",
          runtimeModel: "mistral",
        }),
      ],
    );

    expect(chart.points).toHaveLength(1);
    expect(chart.points[0]?.jobId).toBe("job-a");
  });

  it("builds normalized chart points for multiple runs", () => {
    const chart = getRuntimeChart(
      { provider: "ollama", model: "llama3:latest" },
      [
        createJob({ jobId: "job-a", telemetry: { totalMs: 10_000 } }),
        createJob({ jobId: "job-b", telemetry: { totalMs: 20_000 } }),
        createJob({ jobId: "job-c", telemetry: { totalMs: 30_000 } }),
      ],
    );

    expect(chart.points).toHaveLength(3);
    expect(chart.minMs).toBe(10_000);
    expect(chart.maxMs).toBe(30_000);
    expect(chart.points[0]?.x).toBe(0);
    expect(chart.points[2]?.x).toBe(100);
    expect(chart.points[0]?.y).toBe(48);
    expect(chart.points[2]?.y).toBe(0);
  });
});
