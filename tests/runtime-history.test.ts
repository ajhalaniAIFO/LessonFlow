import { describe, expect, it } from "vitest";
import { getRuntimeHistory } from "@/lib/runtime/runtime-history";
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
      lessonSceneCount: 3,
      quizSceneCount: 1,
    },
    ...overrides,
  };
}

describe("runtime-history", () => {
  it("returns a placeholder when the current setup has no completed runs", () => {
    const history = getRuntimeHistory(
      { provider: "ollama", model: "llama3:latest" },
      [],
    );

    expect(history.headline).toContain("will appear");
    expect(history.entries).toHaveLength(0);
  });

  it("filters to the current provider and model", () => {
    const history = getRuntimeHistory(
      { provider: "ollama", model: "llama3:latest" },
      [
        createJob({ jobId: "job-a" }),
        createJob({
          jobId: "job-b",
          runtimeProvider: "openai_compatible",
          runtimeModel: "mistral",
        }),
        createJob({
          jobId: "job-c",
          runtimeModel: "gemma4",
        }),
      ],
    );

    expect(history.entries).toHaveLength(1);
    expect(history.entries[0]?.jobId).toBe("job-a");
  });

  it("limits history entries and carries scene counts", () => {
    const history = getRuntimeHistory(
      { provider: "ollama", model: "llama3:latest" },
      [
        createJob({ jobId: "job-a", updatedAt: 3 }),
        createJob({ jobId: "job-b", updatedAt: 2, telemetry: { totalMs: 14_000, lessonSceneCount: 2, quizSceneCount: 2 } }),
        createJob({ jobId: "job-c", updatedAt: 1, telemetry: { totalMs: 16_000, lessonSceneCount: 4, quizSceneCount: 1 } }),
      ],
      2,
    );

    expect(history.entries).toHaveLength(2);
    expect(history.entries[0]?.jobId).toBe("job-a");
    expect(history.entries[1]?.lessonSceneCount).toBe(2);
  });
});
