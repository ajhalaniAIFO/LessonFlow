import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetDatabase } from "@/lib/db/client";
import * as outlineGenerator from "@/lib/server/lessons/outline-generator";
import * as quizGenerator from "@/lib/server/lessons/quiz-generator";
import * as sceneGenerator from "@/lib/server/lessons/scene-generator";
import {
  createLessonJob,
  createLessonRegenerationJob,
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
    const sceneSpy = vi
      .spyOn(sceneGenerator, "generateLessonScene")
      .mockResolvedValueOnce({
        title: "What Thermodynamics Studies",
        summary: "Thermodynamics explains heat, work, and energy.",
        sections: [
          { heading: "Core idea", body: "It studies energy transfer." },
          { heading: "Why it matters", body: "It helps explain engines and refrigeration." },
        ],
        keyTakeaways: ["Energy transfer matters", "Thermodynamics is widely used"],
      })
      .mockResolvedValueOnce({
        title: "Energy, Heat, and Work",
        summary: "Heat and work are two ways energy moves between systems.",
        sections: [
          { heading: "Heat", body: "Heat is energy transfer driven by temperature difference." },
          { heading: "Work", body: "Work transfers energy through force and motion." },
        ],
        keyTakeaways: ["Heat and work move energy", "Both concepts are central to thermodynamics"],
      });
    const quizSpy = vi.spyOn(quizGenerator, "generateQuizScene").mockResolvedValue({
      title: "Quick knowledge check",
      questions: [
        {
          id: "quiz-q1",
          prompt: "What does thermodynamics study?",
          type: "multiple_choice",
          options: ["Energy transfer", "Only gravity", "Only electricity", "Only chemistry"],
          correctIndex: 0,
          explanation: "Thermodynamics studies heat, work, and energy transfer.",
        },
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
    expect(lesson?.scenes).toHaveLength(3);
    expect(lesson?.scenes[0]?.title).toBe("What Thermodynamics Studies");
    expect(lesson?.scenes[1]?.title).toBe("Energy, Heat, and Work");
    expect(lesson?.scenes[2]?.type).toBe("quiz");
    expect(sceneSpy).toHaveBeenCalledTimes(2);
    expect(job?.status).toBe("ready");
    spy.mockRestore();
    sceneSpy.mockRestore();
    quizSpy.mockRestore();
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

  it("accepts document-backed lesson requests without a prompt", () => {
    const parsed = parseCreateLessonRequest({
      uploadId: "upload-1",
      language: "en",
    });

    expect(parsed.uploadId).toBe("upload-1");
    expect(parsed.prompt).toBeUndefined();
  });

  it("creates a regeneration job for an existing lesson", async () => {
    const firstOutlineSpy = vi.spyOn(outlineGenerator, "generateLessonOutline").mockResolvedValue({
      title: "Thermodynamics Basics",
      outline: [
        { title: "What thermodynamics studies", goal: "Understand the scope", sceneType: "lesson" },
        { title: "Quick knowledge check", goal: "Reinforce understanding", sceneType: "quiz" },
      ],
    });
    const firstSceneSpy = vi.spyOn(sceneGenerator, "generateLessonScene").mockResolvedValue({
      title: "What Thermodynamics Studies",
      summary: "Thermodynamics explains heat, work, and energy.",
      sections: [
        { heading: "Core idea", body: "It studies energy transfer." },
        { heading: "Why it matters", body: "It helps explain engines and refrigeration." },
      ],
      keyTakeaways: ["Energy transfer matters", "Thermodynamics is widely used"],
    });
    const firstQuizSpy = vi.spyOn(quizGenerator, "generateQuizScene").mockResolvedValue({
      title: "Quick knowledge check",
      questions: [
        {
          id: "quiz-q1",
          prompt: "What does thermodynamics study?",
          type: "multiple_choice",
          options: ["Energy transfer", "Only gravity", "Only electricity", "Only chemistry"],
          correctIndex: 0,
          explanation: "Thermodynamics studies heat, work, and energy transfer.",
        },
      ],
    });

    const original = await createLessonJob(
      {
        prompt: "Teach me thermodynamics",
        language: "en",
      },
      { autoProcess: false },
    );
    await processLessonJob(original.jobId);

    firstOutlineSpy.mockReset();
    firstSceneSpy.mockReset();
    firstQuizSpy.mockReset();

    firstOutlineSpy.mockResolvedValue({
      title: "Thermodynamics Refreshed",
      outline: [
        { title: "Energy systems", goal: "Refocus the lesson", sceneType: "lesson" },
        { title: "Quick knowledge check", goal: "Reinforce understanding", sceneType: "quiz" },
      ],
    });
    firstSceneSpy.mockResolvedValue({
      title: "Energy Systems",
      summary: "A regenerated lesson can change the framing of the same topic.",
      sections: [
        { heading: "Refreshed angle", body: "This version focuses on systems and transfers." },
        { heading: "Why regenerate", body: "It can improve clarity after a weak first pass." },
      ],
      keyTakeaways: ["Regeneration can refine structure", "The same lesson can be reframed"],
    });
    firstQuizSpy.mockResolvedValue({
      title: "Quick knowledge check",
      questions: [
        {
          id: "quiz-q2",
          prompt: "Why might you regenerate a lesson?",
          type: "multiple_choice",
          options: ["To improve clarity", "To delete settings", "To stop the app", "To remove all scenes"],
          correctIndex: 0,
          explanation: "Regenerating can produce a better structure or explanation.",
        },
      ],
    });

    const regeneration = await createLessonRegenerationJob(original.lessonId, {
      autoProcess: false,
    });
    await processLessonJob(regeneration.jobId);

    const lesson = await getLessonById(original.lessonId);
    expect(regeneration.lessonId).toBe(original.lessonId);
    expect(lesson?.title).toBe("Thermodynamics Refreshed");
    expect(lesson?.scenes).toHaveLength(2);
    expect(lesson?.scenes[0]?.title).toBe("Energy Systems");
    expect(firstOutlineSpy).toHaveBeenCalledTimes(1);
  });
});
