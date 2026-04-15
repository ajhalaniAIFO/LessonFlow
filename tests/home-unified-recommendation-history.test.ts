import { describe, expect, it } from "vitest";
import { getHomeUnifiedRecommendationHistory } from "@/lib/runtime/home-unified-recommendation-history";
import type { RuntimeUsageJobInsight } from "@/types/job";
import type { SyntheticBenchmarkRecord } from "@/types/settings";

describe("home-unified-recommendation-history", () => {
  it("returns a placeholder when no runtime or benchmark activity exists", () => {
    const history = getHomeUnifiedRecommendationHistory(
      { provider: "ollama", model: "llama3:latest" },
      [],
      [],
    );

    expect(history.entries).toEqual([]);
    expect(history.headline).toContain("will appear");
  });

  it("captures meaningful recommendation shifts over time", () => {
    const jobs: RuntimeUsageJobInsight[] = [
      {
        jobId: "job-1",
        lessonId: "lesson-1",
        lessonTitle: "Lesson 1",
        runtimeProvider: "ollama",
        runtimeModel: "llama3:latest",
        status: "ready",
        updatedAt: 10,
        telemetry: { totalMs: 15000 },
      },
      {
        jobId: "job-2",
        lessonId: "lesson-2",
        lessonTitle: "Lesson 2",
        runtimeProvider: "openai_compatible",
        runtimeModel: "gemma4",
        status: "ready",
        updatedAt: 20,
        telemetry: { totalMs: 9000 },
      },
    ];

    const benchmarks: SyntheticBenchmarkRecord[] = [
      {
        id: "benchmark-1",
        provider: "ollama",
        model: "llama3:latest",
        baseUrl: "http://127.0.0.1:11434",
        benchmarkKind: "smoke_prompt",
        status: "success",
        durationMs: 3000,
        createdAt: 15,
      },
      {
        id: "benchmark-2",
        provider: "openai_compatible",
        model: "gemma4",
        baseUrl: "http://127.0.0.1:8000/v1",
        benchmarkKind: "smoke_prompt",
        status: "success",
        durationMs: 1800,
        createdAt: 25,
      },
    ];

    const history = getHomeUnifiedRecommendationHistory(
      { provider: "ollama", model: "llama3:latest" },
      jobs,
      benchmarks,
    );

    expect(history.entries.length).toBeGreaterThanOrEqual(2);
    expect(history.entries[0].headline).toContain("agree");
  });

  it("collapses duplicate adjacent recommendation states", () => {
    const jobs: RuntimeUsageJobInsight[] = [
      {
        jobId: "job-1",
        lessonId: "lesson-1",
        lessonTitle: "Lesson 1",
        runtimeProvider: "openai_compatible",
        runtimeModel: "gemma4",
        status: "ready",
        updatedAt: 10,
        telemetry: { totalMs: 9000 },
      },
      {
        jobId: "job-2",
        lessonId: "lesson-2",
        lessonTitle: "Lesson 2",
        runtimeProvider: "openai_compatible",
        runtimeModel: "gemma4",
        status: "ready",
        updatedAt: 20,
        telemetry: { totalMs: 8800 },
      },
    ];

    const history = getHomeUnifiedRecommendationHistory(
      { provider: "ollama", model: "llama3:latest" },
      jobs,
      [],
    );

    expect(history.entries).toHaveLength(1);
  });
});
