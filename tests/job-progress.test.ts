import { describe, expect, it } from "vitest";
import {
  generationStages,
  getJobHeadline,
  getJobSupportCopy,
  getStageState,
} from "@/lib/server/lessons/job-progress";
import type { LessonJob } from "@/types/job";

function createJob(overrides: Partial<LessonJob>): LessonJob {
  return {
    id: "job-1",
    lessonId: "lesson-1",
    status: "queued",
    stage: "queued",
    progress: 0,
    ...overrides,
  };
}

describe("job-progress helpers", () => {
  it("marks prior stages complete and current stage active", () => {
    const job = createJob({
      status: "generating_scenes",
      stage: "generating_scenes",
      progress: 72,
    });

    expect(getStageState(job, generationStages[1].key)).toBe("complete");
    expect(getStageState(job, generationStages[2].key)).toBe("active");
    expect(getStageState(job, generationStages[3].key)).toBe("upcoming");
  });

  it("marks all stages complete when the job is ready", () => {
    const job = createJob({
      status: "ready",
      stage: "ready",
      progress: 100,
    });

    expect(getStageState(job, generationStages[0].key)).toBe("complete");
    expect(getStageState(job, generationStages[3].key)).toBe("complete");
    expect(getJobHeadline(job)).toBe("Your lesson is ready");
  });

  it("surfaces an error state for the failing stage", () => {
    const job = createJob({
      status: "error",
      stage: "generating_quizzes",
      progress: 91,
      errorMessage: "Model returned invalid quiz JSON.",
    });

    expect(getStageState(job, generationStages[2].key)).toBe("complete");
    expect(getStageState(job, generationStages[3].key)).toBe("error");
    expect(getJobSupportCopy(job)).toContain("not completed");
  });

  it("provides a placeholder headline before the first poll returns", () => {
    expect(getJobHeadline(null)).toBe("Preparing your lesson job");
  });
});
