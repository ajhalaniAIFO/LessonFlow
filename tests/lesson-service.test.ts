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
  createOutlineGenerationJob,
  createLessonRegenerationJob,
  getRuntimeComparison,
  getRuntimeUsageDashboard,
  getLessonById,
  getLessonJob,
  parseCreateLessonRequest,
  processLessonOutlineJob,
  processLessonJob,
  processLessonSceneJob,
  regenerateLessonScene,
  saveInteractiveBlockProgress,
  updateLessonOutline,
} from "@/lib/server/lessons/lesson-service";
import { saveModelSettings } from "@/lib/server/settings/settings-service";

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
    expect(result.generationMode).toBe("balanced");
    expect(result.learnerLevel).toBe("intermediate");
    expect(result.teachingStyle).toBe("practical");
    expect(result.lessonFormat).toBe("standard");
  });

  it("creates a lesson and job record", async () => {
    await saveModelSettings({
      provider: "ollama",
      baseUrl: "http://127.0.0.1:11434",
      model: "llama3:latest",
      temperature: 0.4,
      maxTokens: 2000,
      timeoutMs: 120000,
    });
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
    expect(lesson?.generationMode).toBe("balanced");
    expect(lesson?.learnerLevel).toBe("intermediate");
    expect(lesson?.teachingStyle).toBe("practical");
    expect(lesson?.lessonFormat).toBe("standard");
    expect(lesson?.runtimeProvider).toBe("ollama");
    expect(lesson?.runtimeModel).toBe("llama3:latest");
    expect(lesson?.outline).toHaveLength(3);
    expect(lesson?.scenes).toHaveLength(3);
    expect(lesson?.scenes[0]?.title).toBe("What Thermodynamics Studies");
    expect(lesson?.scenes[1]?.title).toBe("Energy, Heat, and Work");
    expect(lesson?.scenes[2]?.type).toBe("quiz");
    expect(sceneSpy).toHaveBeenCalledTimes(2);
    expect(job?.status).toBe("ready");
    expect(job?.telemetry?.outlineMs).toBeTypeOf("number");
    expect(job?.telemetry?.sceneGenerationMs).toBeTypeOf("number");
    expect(job?.telemetry?.quizGenerationMs).toBeTypeOf("number");
    expect(job?.telemetry?.totalMs).toBeTypeOf("number");
    expect(job?.telemetry?.lessonSceneCount).toBe(2);
    expect(job?.telemetry?.quizSceneCount).toBe(1);
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
    expect(parsed.generationMode).toBe("balanced");
    expect(parsed.learnerLevel).toBe("intermediate");
    expect(parsed.teachingStyle).toBe("practical");
    expect(parsed.lessonFormat).toBe("standard");
  });

  it("persists the selected generation mode on the lesson", async () => {
    vi.spyOn(outlineGenerator, "generateLessonOutline").mockResolvedValue({
      title: "Thermodynamics Basics",
      outline: [
        { title: "What thermodynamics studies", goal: "Understand the scope", sceneType: "lesson" },
        { title: "Quick knowledge check", goal: "Reinforce understanding", sceneType: "quiz" },
      ],
    });
    vi.spyOn(sceneGenerator, "generateLessonScene").mockResolvedValue({
      title: "What Thermodynamics Studies",
      summary: "Thermodynamics explains heat, work, and energy.",
      sections: [{ heading: "Core idea", body: "It studies energy transfer." }],
      keyTakeaways: ["Energy transfer matters"],
    });
    vi.spyOn(quizGenerator, "generateQuizScene").mockResolvedValue({
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

    const created = await createLessonJob(
      {
        prompt: "Teach me thermodynamics",
        language: "en",
        generationMode: "detailed",
        learnerLevel: "beginner",
        teachingStyle: "step_by_step",
        lessonFormat: "guided_project",
      },
      { autoProcess: false },
    );

    await processLessonJob(created.jobId);
    const lesson = await getLessonById(created.lessonId);

    expect(lesson?.generationMode).toBe("detailed");
    expect(lesson?.learnerLevel).toBe("beginner");
    expect(lesson?.teachingStyle).toBe("step_by_step");
    expect(lesson?.lessonFormat).toBe("guided_project");
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
    await processLessonOutlineJob(regeneration.jobId);

    const reviewLesson = await getLessonById(original.lessonId);
    const reviewJob = await getLessonJob(regeneration.jobId);

    expect(reviewJob?.status).toBe("awaiting_review");
    expect(reviewJob?.telemetry?.outlineMs).toBeTypeOf("number");
    expect(reviewLesson?.status).toBe("draft");
    expect(reviewLesson?.scenes).toHaveLength(0);

    const continuation = await createOutlineGenerationJob(original.lessonId, {
      autoProcess: false,
    });
    await processLessonSceneJob(continuation.jobId);

    const lesson = await getLessonById(original.lessonId);
    expect(regeneration.lessonId).toBe(original.lessonId);
    expect(lesson?.title).toBe("Thermodynamics Refreshed");
    expect(lesson?.scenes).toHaveLength(2);
    expect(lesson?.scenes[0]?.title).toBe("Energy Systems");
    expect(firstOutlineSpy).toHaveBeenCalledTimes(1);
  });

  it("regenerates a single lesson scene in place", async () => {
    const outlineSpy = vi.spyOn(outlineGenerator, "generateLessonOutline").mockResolvedValue({
      title: "Thermodynamics Basics",
      outline: [
        { title: "What thermodynamics studies", goal: "Understand the scope", sceneType: "lesson" },
        { title: "Quick knowledge check", goal: "Reinforce understanding", sceneType: "quiz" },
      ],
    });
    const sceneSpy = vi.spyOn(sceneGenerator, "generateLessonScene").mockResolvedValue({
      title: "What Thermodynamics Studies",
      summary: "Thermodynamics explains heat, work, and energy.",
      sections: [
        { heading: "Core idea", body: "It studies energy transfer." },
        { heading: "Why it matters", body: "It helps explain engines and refrigeration." },
      ],
      keyTakeaways: ["Energy transfer matters", "Thermodynamics is widely used"],
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

    const created = await createLessonJob(
      {
        prompt: "Teach me thermodynamics",
        language: "en",
      },
      { autoProcess: false },
    );
    await processLessonJob(created.jobId);

    const lessonBefore = await getLessonById(created.lessonId);
    const lessonScene = lessonBefore?.scenes.find((scene) => scene.type === "lesson");
    expect(lessonScene).toBeTruthy();

    sceneSpy.mockReset();
    sceneSpy.mockResolvedValue({
      title: "Refreshed lesson scene",
      summary: "This regenerated scene reframes the topic more clearly.",
      sections: [
        { heading: "Refreshed concept", body: "The explanation is cleaner now." },
        { heading: "Why it helps", body: "A regenerated scene can improve learning flow." },
      ],
      keyTakeaways: ["Scene regeneration is targeted", "The rest of the lesson stays intact"],
    });

    const updatedLesson = await regenerateLessonScene(created.lessonId, lessonScene!.id);

    expect(updatedLesson?.scenes).toHaveLength(2);
    expect(updatedLesson?.scenes[0]?.title).toBe("Refreshed lesson scene");
    expect(updatedLesson?.scenes[1]?.type).toBe("quiz");
    expect(sceneSpy).toHaveBeenCalledTimes(1);

    outlineSpy.mockRestore();
    sceneSpy.mockRestore();
    quizSpy.mockRestore();
  }, 15_000);

  it("pauses after outline generation for review and then continues with reviewed outline", async () => {
    const outlineSpy = vi.spyOn(outlineGenerator, "generateLessonOutline").mockResolvedValue({
      title: "Thermodynamics Basics",
      outline: [
        { title: "First pass title", goal: "Original goal", sceneType: "lesson" },
        { title: "Checkpoint quiz", goal: "Review understanding", sceneType: "quiz" },
      ],
    });
    const sceneSpy = vi.spyOn(sceneGenerator, "generateLessonScene").mockResolvedValue({
      title: "Edited lesson scene",
      summary: "A reviewed outline should drive the next generation step.",
      sections: [{ heading: "Edited heading", body: "The scene reflects reviewed outline edits." }],
      keyTakeaways: ["Outline review changes downstream generation"],
    });
    const quizSpy = vi.spyOn(quizGenerator, "generateQuizScene").mockResolvedValue({
      title: "Checkpoint quiz",
      questions: [
        {
          id: "quiz-q3",
          prompt: "What changed after outline review?",
          type: "multiple_choice",
          options: ["The stored outline", "The database engine", "The app port", "Nothing"],
          correctIndex: 0,
          explanation: "The reviewed outline feeds scene generation.",
        },
      ],
    });

    const created = await createLessonJob(
      {
        prompt: "Teach me thermodynamics",
        language: "en",
      },
      { autoProcess: false },
    );

    await processLessonOutlineJob(created.jobId);
    const outlineJob = await getLessonJob(created.jobId);
    const lessonAfterOutline = await getLessonById(created.lessonId);

    expect(outlineJob?.status).toBe("awaiting_review");
    expect(lessonAfterOutline?.status).toBe("draft");
    expect(lessonAfterOutline?.scenes).toHaveLength(0);
    expect(lessonAfterOutline?.outline[0]?.title).toBe("First pass title");

    await updateLessonOutline(created.lessonId, {
      lessonTitle: "Thermodynamics Review Pass",
      items: [
        {
          id: lessonAfterOutline!.outline[0]!.id,
          title: "Reviewed title",
          goal: "Reviewed goal",
        },
        {
          id: lessonAfterOutline!.outline[1]!.id,
          title: "Checkpoint quiz",
          goal: "Review understanding",
        },
      ],
    });

    const continued = await createOutlineGenerationJob(created.lessonId, { autoProcess: false });
    await processLessonSceneJob(continued.jobId);

    const finishedLesson = await getLessonById(created.lessonId);
    const continuedJob = await getLessonJob(continued.jobId);

    expect(finishedLesson?.title).toBe("Thermodynamics Review Pass");
    expect(finishedLesson?.scenes).toHaveLength(2);
    expect(finishedLesson?.outline[0]?.title).toBe("Reviewed title");
    expect(continuedJob?.status).toBe("ready");
    expect(continuedJob?.telemetry?.sceneGenerationMs).toBeTypeOf("number");
    expect(continuedJob?.telemetry?.quizGenerationMs).toBeTypeOf("number");
    expect(continuedJob?.telemetry?.lessonSceneCount).toBe(1);
    expect(continuedJob?.telemetry?.quizSceneCount).toBe(1);

    outlineSpy.mockRestore();
    sceneSpy.mockRestore();
    quizSpy.mockRestore();
  });

  it("builds runtime usage dashboard data from recent jobs", async () => {
    await saveModelSettings({
      provider: "openai_compatible",
      baseUrl: "http://127.0.0.1:8000/v1",
      model: "google/gemma-3-4b-it",
      temperature: 0.4,
      maxTokens: 2000,
      timeoutMs: 120000,
    });
    vi.spyOn(outlineGenerator, "generateLessonOutline").mockResolvedValue({
      title: "Telemetry Lesson",
      outline: [
        { title: "Lesson scene", goal: "Teach something", sceneType: "lesson" },
        { title: "Quiz scene", goal: "Check understanding", sceneType: "quiz" },
      ],
    });
    vi.spyOn(sceneGenerator, "generateLessonScene").mockResolvedValue({
      title: "Lesson scene",
      summary: "A short scene summary.",
      sections: [{ heading: "Idea", body: "Explain the idea." }],
      keyTakeaways: ["Takeaway"],
    });
    vi.spyOn(quizGenerator, "generateQuizScene").mockResolvedValue({
      title: "Quiz scene",
      questions: [
        {
          id: "quiz-q5",
          prompt: "What happened?",
          type: "multiple_choice",
          options: ["A lesson was generated", "Nothing", "The app closed", "The DB reset"],
          correctIndex: 0,
          explanation: "The lesson pipeline completed successfully.",
        },
      ],
    });

    const created = await createLessonJob(
      {
        prompt: "Teach me telemetry",
        language: "en",
      },
      { autoProcess: false },
    );
    await processLessonJob(created.jobId);

    const dashboard = await getRuntimeUsageDashboard();

    expect(dashboard.recentJobs.length).toBeGreaterThan(0);
    expect(dashboard.completedJobs).toBe(1);
    expect(dashboard.averageTotalMs).toBeTypeOf("number");
    expect(dashboard.totalLessonScenes).toBe(1);
    expect(dashboard.totalQuizScenes).toBe(1);
    expect(dashboard.recentJobs[0]?.runtimeProvider).toBe("openai_compatible");
    expect(dashboard.recentJobs[0]?.runtimeModel).toBe("google/gemma-3-4b-it");
    expect(dashboard.recentJobs[0]?.telemetry?.totalMs).toBeTypeOf("number");
  });

  it("groups recent runtime history for side-by-side comparison", async () => {
    await saveModelSettings({
      provider: "ollama",
      baseUrl: "http://127.0.0.1:11434",
      model: "llama3:latest",
      temperature: 0.4,
      maxTokens: 2000,
      timeoutMs: 120000,
    });

    vi.spyOn(outlineGenerator, "generateLessonOutline").mockResolvedValue({
      title: "Comparison Lesson",
      outline: [
        { title: "Lesson scene", goal: "Teach something", sceneType: "lesson" },
        { title: "Quiz scene", goal: "Check understanding", sceneType: "quiz" },
      ],
    });
    vi.spyOn(sceneGenerator, "generateLessonScene").mockResolvedValue({
      title: "Lesson scene",
      summary: "A short scene summary.",
      sections: [{ heading: "Idea", body: "Explain the idea." }],
      keyTakeaways: ["Takeaway"],
    });
    vi.spyOn(quizGenerator, "generateQuizScene").mockResolvedValue({
      title: "Quiz scene",
      questions: [
        {
          id: "quiz-q6",
          prompt: "What happened?",
          type: "multiple_choice",
          options: ["A lesson was generated", "Nothing", "The app closed", "The DB reset"],
          correctIndex: 0,
          explanation: "The lesson pipeline completed successfully.",
        },
      ],
    });

    const first = await createLessonJob(
      {
        prompt: "Teach me comparison 1",
        language: "en",
      },
      { autoProcess: false },
    );
    await processLessonJob(first.jobId);

    await saveModelSettings({
      provider: "openai_compatible",
      baseUrl: "http://127.0.0.1:8000/v1",
      model: "google/gemma-3-4b-it",
      temperature: 0.4,
      maxTokens: 2000,
      timeoutMs: 120000,
    });

    const second = await createLessonJob(
      {
        prompt: "Teach me comparison 2",
        language: "en",
      },
      { autoProcess: false },
    );
    await processLessonJob(second.jobId);

    const comparison = await getRuntimeComparison();

    expect(comparison.length).toBe(2);
    expect(comparison.map((item) => item.runtimeModel)).toEqual(
      expect.arrayContaining(["llama3:latest", "google/gemma-3-4b-it"]),
    );
  });

  it("stores reviewed outline order changes", async () => {
    const outlineSpy = vi.spyOn(outlineGenerator, "generateLessonOutline").mockResolvedValue({
      title: "Thermodynamics Basics",
      outline: [
        { title: "Intro", goal: "Start here", sceneType: "lesson" },
        { title: "Deep dive", goal: "Go deeper", sceneType: "lesson" },
        { title: "Quiz", goal: "Check understanding", sceneType: "quiz" },
      ],
    });

    const created = await createLessonJob(
      {
        prompt: "Teach me thermodynamics",
        language: "en",
      },
      { autoProcess: false },
    );

    await processLessonOutlineJob(created.jobId);
    const lesson = await getLessonById(created.lessonId);

    await updateLessonOutline(created.lessonId, {
      lessonTitle: "Thermodynamics Reordered",
      items: [
        {
          id: lesson!.outline[1]!.id,
          title: "Deep dive",
          goal: "Go deeper",
          order: 1,
        },
        {
          id: lesson!.outline[0]!.id,
          title: "Intro",
          goal: "Start here",
          order: 2,
        },
        {
          id: lesson!.outline[2]!.id,
          title: "Quiz",
          goal: "Check understanding",
          order: 3,
        },
      ],
    });

    const updated = await getLessonById(created.lessonId);

    expect(updated?.title).toBe("Thermodynamics Reordered");
    expect(updated?.outline.map((item) => item.title)).toEqual(["Deep dive", "Intro", "Quiz"]);

    outlineSpy.mockRestore();
  });

  it("allows reviewed outline items to be removed and added", async () => {
    const outlineSpy = vi.spyOn(outlineGenerator, "generateLessonOutline").mockResolvedValue({
      title: "Thermodynamics Basics",
      outline: [
        { title: "Intro", goal: "Start here", sceneType: "lesson" },
        { title: "Middle", goal: "Build depth", sceneType: "lesson" },
        { title: "Quiz", goal: "Check understanding", sceneType: "quiz" },
      ],
    });

    const created = await createLessonJob(
      {
        prompt: "Teach me thermodynamics",
        language: "en",
      },
      { autoProcess: false },
    );

    await processLessonOutlineJob(created.jobId);
    const lesson = await getLessonById(created.lessonId);

    await updateLessonOutline(created.lessonId, {
      lessonTitle: "Thermodynamics Customized",
      items: [
        {
          id: lesson!.outline[0]!.id,
          title: "Intro",
          goal: "Start here",
          order: 1,
          sceneType: "lesson",
        },
        {
          id: "draft-new-lesson",
          title: "Applied examples",
          goal: "Ground the topic in practical examples",
          order: 2,
          sceneType: "lesson",
        },
        {
          id: lesson!.outline[2]!.id,
          title: "Quiz",
          goal: "Check understanding",
          order: 3,
          sceneType: "quiz",
        },
      ],
    });

    const updated = await getLessonById(created.lessonId);

    expect(updated?.outline.map((item) => item.title)).toEqual(["Intro", "Applied examples", "Quiz"]);
    expect(updated?.outline.map((item) => item.sceneType)).toEqual(["lesson", "lesson", "quiz"]);

    outlineSpy.mockRestore();
  });

  it("stores reviewed scene type changes", async () => {
    const outlineSpy = vi.spyOn(outlineGenerator, "generateLessonOutline").mockResolvedValue({
      title: "Thermodynamics Basics",
      outline: [
        { title: "Intro", goal: "Start here", sceneType: "lesson" },
        { title: "Wrap-up", goal: "Close the lesson", sceneType: "lesson" },
      ],
    });

    const created = await createLessonJob(
      {
        prompt: "Teach me thermodynamics",
        language: "en",
      },
      { autoProcess: false },
    );

    await processLessonOutlineJob(created.jobId);
    const lesson = await getLessonById(created.lessonId);

    await updateLessonOutline(created.lessonId, {
      lessonTitle: "Thermodynamics Mixed Format",
      items: [
        {
          id: lesson!.outline[0]!.id,
          title: "Intro",
          goal: "Start here",
          order: 1,
          sceneType: "lesson",
        },
        {
          id: lesson!.outline[1]!.id,
          title: "Wrap-up check",
          goal: "Close with a check for understanding",
          order: 2,
          sceneType: "quiz",
        },
      ],
    });

    const updated = await getLessonById(created.lessonId);

    expect(updated?.outline.map((item) => item.sceneType)).toEqual(["lesson", "quiz"]);
    expect(updated?.outline[1]?.title).toBe("Wrap-up check");

    outlineSpy.mockRestore();
  });

  it("stores interactive block progress per scene", async () => {
    vi.spyOn(outlineGenerator, "generateLessonOutline").mockResolvedValue({
      title: "Workshop Thermodynamics",
      outline: [
        { title: "Hands-on segment", goal: "Practice the idea", sceneType: "lesson" },
        { title: "Workshop checkpoint", goal: "Check understanding", sceneType: "quiz" },
      ],
    });
    vi.spyOn(sceneGenerator, "generateLessonScene").mockResolvedValue({
      title: "Hands-on segment",
      summary: "This segment walks through the key idea as a workshop step.",
      sections: [{ heading: "Try it", body: "Apply the concept actively." }],
      keyTakeaways: ["Practice makes the step concrete"],
    });
    vi.spyOn(quizGenerator, "generateQuizScene").mockResolvedValue({
      title: "Workshop checkpoint",
      questions: [
        {
          id: "quiz-q4",
          prompt: "What should you do after the workshop segment?",
          type: "multiple_choice",
          options: ["Check your understanding", "Delete the lesson", "Reset the database", "Close the app"],
          correctIndex: 0,
          explanation: "The checkpoint validates the workshop step before continuing.",
        },
      ],
    });

    const created = await createLessonJob(
      {
        prompt: "Teach me thermodynamics as a workshop",
        language: "en",
        lessonFormat: "workshop",
      },
      { autoProcess: false },
    );
    await processLessonJob(created.jobId);

    const lesson = await getLessonById(created.lessonId);
    const lessonScene = lesson?.scenes.find((scene) => scene.type === "lesson");
    const quizScene = lesson?.scenes.find((scene) => scene.type === "quiz");

    await saveInteractiveBlockProgress(created.lessonId, lessonScene!.id, "action", true);
    await saveInteractiveBlockProgress(created.lessonId, quizScene!.id, "checkpoint", true);

    const updatedLesson = await getLessonById(created.lessonId);

    expect(updatedLesson?.interactiveBlockProgress).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sceneId: lessonScene!.id,
          blockKind: "action",
          completed: true,
        }),
        expect.objectContaining({
          sceneId: quizScene!.id,
          blockKind: "checkpoint",
          completed: true,
        }),
      ]),
    );
  });
});
