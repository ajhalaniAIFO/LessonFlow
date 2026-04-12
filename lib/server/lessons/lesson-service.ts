import { randomUUID } from "node:crypto";
import { getDatabase } from "@/lib/db/client";
import { generateLessonOutline } from "@/lib/server/lessons/outline-generator";
import { generateQuizScene } from "@/lib/server/lessons/quiz-generator";
import { generateLessonScene } from "@/lib/server/lessons/scene-generator";
import { AppError } from "@/lib/server/utils/errors";
import type { Lesson, OutlineItem, CreateLessonRequest } from "@/types/lesson";
import type { LessonJob, LessonJobStatus } from "@/types/job";
import type { Scene } from "@/types/scene";

type LessonRow = {
  id: string;
  title: string;
  prompt: string | null;
  source_type: Lesson["sourceType"];
  language: string;
  status: Lesson["status"];
  error_message: string | null;
  created_at: number;
  updated_at: number;
};

type OutlineRow = {
  id: string;
  lesson_id: string;
  title: string;
  goal: string | null;
  scene_type: OutlineItem["sceneType"];
  display_order: number;
};

type JobRow = {
  id: string;
  lesson_id: string;
  status: LessonJobStatus;
  stage: LessonJobStatus;
  progress: number;
  message: string | null;
  error_message: string | null;
};

type SceneRow = {
  id: string;
  lesson_id: string;
  outline_item_id: string;
  type: Scene["type"];
  title: string;
  display_order: number;
  status: Scene["status"];
  content_json: string | null;
  error_message: string | null;
};

function mapScene(row: SceneRow): Scene {
  return {
    id: row.id,
    lessonId: row.lesson_id,
    outlineItemId: row.outline_item_id,
    type: row.type,
    title: row.title,
    order: row.display_order,
    status: row.status,
    content: row.content_json ? JSON.parse(row.content_json) : undefined,
    errorMessage: row.error_message ?? undefined,
  };
}

function mapLesson(row: LessonRow, outline: OutlineRow[], scenes: SceneRow[]): Lesson {
  return {
    id: row.id,
    title: row.title,
    prompt: row.prompt ?? undefined,
    sourceType: row.source_type,
    language: row.language,
    status: row.status,
    errorMessage: row.error_message ?? undefined,
    outline: outline
      .sort((a, b) => a.display_order - b.display_order)
      .map((item) => ({
        id: item.id,
        title: item.title,
        goal: item.goal ?? undefined,
        sceneType: item.scene_type,
        order: item.display_order,
      })),
    scenes: scenes.sort((a, b) => a.display_order - b.display_order).map(mapScene),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapJob(row: JobRow): LessonJob {
  return {
    id: row.id,
    lessonId: row.lesson_id,
    status: row.status,
    stage: row.stage,
    progress: row.progress,
    message: row.message ?? undefined,
    errorMessage: row.error_message ?? undefined,
  };
}

export function parseCreateLessonRequest(input: unknown): CreateLessonRequest {
  if (typeof input !== "object" || input === null) {
    throw new AppError("INVALID_REQUEST", "Lesson request payload is required.");
  }

  const raw = input as Record<string, unknown>;
  const prompt = String(raw.prompt ?? "").trim();
  const language = String(raw.language ?? "en").trim() || "en";

  if (!prompt) {
    throw new AppError("INVALID_REQUEST", "A lesson prompt is required.");
  }

  return {
    prompt,
    language,
  };
}

export async function createLessonJob(
  input: CreateLessonRequest,
  options?: { autoProcess?: boolean },
) {
  const now = Date.now();
  const lessonId = randomUUID();
  const jobId = randomUUID();
  const db = getDatabase();

  db.prepare(
    `INSERT INTO lessons (id, title, prompt, source_type, language, status, error_message, created_at, updated_at)
     VALUES (@id, @title, @prompt, @source_type, @language, @status, @error_message, @created_at, @updated_at)`,
  ).run({
    id: lessonId,
    title: "Generating lesson...",
    prompt: input.prompt,
    source_type: "prompt",
    language: input.language,
    status: "generating",
    error_message: null,
    created_at: now,
    updated_at: now,
  });

  db.prepare(
    `INSERT INTO lesson_jobs (id, lesson_id, status, stage, progress, message, error_message, created_at, updated_at)
     VALUES (@id, @lesson_id, @status, @stage, @progress, @message, @error_message, @created_at, @updated_at)`,
  ).run({
    id: jobId,
    lesson_id: lessonId,
    status: "queued",
    stage: "queued",
    progress: 0,
    message: "Queued for outline generation",
    error_message: null,
    created_at: now,
    updated_at: now,
  });

  if (options?.autoProcess !== false) {
    void processLessonJob(jobId);
  }

  return {
    lessonId,
    jobId,
  };
}

export async function processLessonJob(jobId: string) {
  const db = getDatabase();
  const job = db
    .prepare("SELECT * FROM lesson_jobs WHERE id = ?")
    .get(jobId) as JobRow | undefined;

  if (!job) {
    return;
  }

  const lesson = db
    .prepare("SELECT * FROM lessons WHERE id = ?")
    .get(job.lesson_id) as LessonRow | undefined;

  if (!lesson) {
    return;
  }

  const updateJob = db.prepare(
    `UPDATE lesson_jobs
     SET status = @status, stage = @stage, progress = @progress, message = @message, error_message = @error_message, updated_at = @updated_at
     WHERE id = @id`,
  );
  const updateLesson = db.prepare(
    `UPDATE lessons
     SET title = @title, status = @status, error_message = @error_message, updated_at = @updated_at
     WHERE id = @id`,
  );
  const insertOutline = db.prepare(
    `INSERT INTO outline_items (id, lesson_id, title, goal, scene_type, display_order, created_at, updated_at)
     VALUES (@id, @lesson_id, @title, @goal, @scene_type, @display_order, @created_at, @updated_at)`,
  );
  const insertScene = db.prepare(
    `INSERT INTO scenes (id, lesson_id, outline_item_id, type, title, display_order, status, content_json, error_message, created_at, updated_at)
     VALUES (@id, @lesson_id, @outline_item_id, @type, @title, @display_order, @status, @content_json, @error_message, @created_at, @updated_at)`,
  );

  try {
    updateJob.run({
      id: jobId,
      status: "generating_outline",
      stage: "generating_outline",
      progress: 25,
      message: "Generating lesson outline",
      error_message: null,
      updated_at: Date.now(),
    });

    const outline = await generateLessonOutline({
      prompt: lesson.prompt ?? "",
      language: lesson.language,
    });

    db.prepare("DELETE FROM outline_items WHERE lesson_id = ?").run(lesson.id);
    const now = Date.now();
    outline.outline.forEach((item, index) => {
      insertOutline.run({
        id: randomUUID(),
        lesson_id: lesson.id,
        title: item.title,
        goal: item.goal ?? null,
        scene_type: item.sceneType,
        display_order: index + 1,
        created_at: now,
        updated_at: now,
      });
    });

    const outlineRows = db
      .prepare("SELECT * FROM outline_items WHERE lesson_id = ? ORDER BY display_order ASC")
      .all(lesson.id) as OutlineRow[];
    const firstOutlineRow = outlineRows.find((row) => row.scene_type === "lesson");
    let firstSceneSummary: string | undefined;
    let firstSceneTakeaways: string[] | undefined;

    if (firstOutlineRow) {
      updateJob.run({
        id: jobId,
        status: "generating_scenes",
        stage: "generating_scenes",
        progress: 70,
        message: "Generating the first lesson scene",
        error_message: null,
        updated_at: Date.now(),
      });

      if (firstOutlineRow.scene_type === "lesson") {
        const scene = await generateLessonScene({
          lessonTitle: outline.title,
          lessonPrompt: lesson.prompt ?? "",
          outlineTitle: firstOutlineRow.title,
          outlineGoal: firstOutlineRow.goal ?? undefined,
          language: lesson.language,
        });

        firstSceneSummary = scene.summary;
        firstSceneTakeaways = scene.keyTakeaways;

        insertScene.run({
          id: randomUUID(),
          lesson_id: lesson.id,
          outline_item_id: firstOutlineRow.id,
          type: "lesson",
          title: scene.title,
          display_order: firstOutlineRow.display_order,
          status: "ready",
          content_json: JSON.stringify(scene),
          error_message: null,
          created_at: now,
          updated_at: now,
        });
      }
    }

    const quizOutlineRow = outlineRows.find((row) => row.scene_type === "quiz");
    if (quizOutlineRow) {
      updateJob.run({
        id: jobId,
        status: "generating_quizzes",
        stage: "generating_quizzes",
        progress: 88,
        message: "Generating quiz scene",
        error_message: null,
        updated_at: Date.now(),
      });

      const quizScene = await generateQuizScene({
        lessonTitle: outline.title,
        lessonPrompt: lesson.prompt ?? "",
        outlineTitle: quizOutlineRow.title,
        outlineGoal: quizOutlineRow.goal ?? undefined,
        sceneSummary: firstSceneSummary,
        keyTakeaways: firstSceneTakeaways,
        language: lesson.language,
      });

      insertScene.run({
        id: randomUUID(),
        lesson_id: lesson.id,
        outline_item_id: quizOutlineRow.id,
        type: "quiz",
        title: quizScene.title,
        display_order: quizOutlineRow.display_order,
        status: "ready",
        content_json: JSON.stringify(quizScene),
        error_message: null,
        created_at: now,
        updated_at: now,
      });
    }

    updateLesson.run({
      id: lesson.id,
      title: outline.title,
      status: "ready",
      error_message: null,
      updated_at: now,
    });

    updateJob.run({
      id: jobId,
      status: "ready",
      stage: "ready",
      progress: 100,
      message: "Outline, first lesson scene, and quiz scene are ready",
      error_message: null,
      updated_at: now,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Lesson outline generation failed.";
    const now = Date.now();
    updateLesson.run({
      id: lesson.id,
      title: lesson.title,
      status: "error",
      error_message: message,
      updated_at: now,
    });
    updateJob.run({
      id: jobId,
      status: "error",
      stage: "error",
      progress: 100,
      message: "Outline generation failed",
      error_message: message,
      updated_at: now,
    });
  }
}

export async function getLessonJob(jobId: string): Promise<LessonJob | null> {
  const db = getDatabase();
  const row = db.prepare("SELECT * FROM lesson_jobs WHERE id = ?").get(jobId) as JobRow | undefined;
  return row ? mapJob(row) : null;
}

export async function getLessonById(lessonId: string): Promise<Lesson | null> {
  const db = getDatabase();
  const lesson = db.prepare("SELECT * FROM lessons WHERE id = ?").get(lessonId) as LessonRow | undefined;
  if (!lesson) return null;
  const outline = db
    .prepare("SELECT * FROM outline_items WHERE lesson_id = ? ORDER BY display_order ASC")
    .all(lessonId) as OutlineRow[];
  const scenes = db
    .prepare("SELECT * FROM scenes WHERE lesson_id = ? ORDER BY display_order ASC")
    .all(lessonId) as SceneRow[];
  return mapLesson(lesson, outline, scenes);
}
