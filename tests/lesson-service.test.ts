import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDatabase, resetDatabase } from "@/lib/db/client";
import * as outlineGenerator from "@/lib/server/lessons/outline-generator";
import {
  createLessonJob,
  getLessonById,
  getLessonJob,
  parseCreateLessonRequest,
  processLessonJob,
} from "@/lib/server/lessons/lesson-service";

function createTempDbPath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lessonflow-service-test-"));
  return path.join(dir, "app.db");
}

describe("lesson-service", () => {
  beforeEach(() => {
    resetDatabase();
    process.env.LESSONFLOW_DB_PATH = createTempDbPath();
  });

  it("parses a create lesson request", () => {
    const result = parseCreateLessonRequest({
      prompt: "Teach me thermodynamics",
      language: "en",
    });

    expect(result.prompt).toBe("Teach me thermodynamics");
  });

  it("creates a lesson and job record", async () => {
    const spy = vi.spyOn(outlineGenerator, "generateLessonOutline").mockResolvedValue({
      title: "Thermodynamics Basics",
      outline: [
        { title: "What thermodynamics studies", goal: "Understand the scope", sceneType: "lesson" },
        { title: "Energy, heat, and work", goal: "Learn the key concepts", sceneType: "lesson" },
        { title: "Quick knowledge check", goal: "Reinforce understanding", sceneType: "quiz" },
      ],
    });

    const result = await createLessonJob(
      {
        prompt: "Teach me thermodynamics",
        language: "en",
      },
      { autoProcess: false },
    );

    await processLessonJob(result.jobId);
    const lesson = await getLessonById(result.lessonId);
    const job = await getLessonJob(result.jobId);

    expect(lesson?.title).toBe("Thermodynamics Basics");
    expect(lesson?.outline).toHaveLength(3);
    expect(job?.status).toBe("ready");
    spy.mockRestore();
  });

  it("stores an error state when generation fails", async () => {
    vi.spyOn(outlineGenerator, "generateLessonOutline").mockRejectedValue(
      new Error("provider unavailable"),
    );

    const result = await createLessonJob(
      {
        prompt: "Teach me thermodynamics",
        language: "en",
      },
      { autoProcess: false },
    );

    await processLessonJob(result.jobId);
    const job = await getLessonJob(result.jobId);
    const lesson = await getLessonById(result.lessonId);

    expect(job?.status).toBe("error");
    expect(lesson?.status).toBe("error");
    expect(lesson?.errorMessage).toContain("provider unavailable");
  });
});
