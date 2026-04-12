import { randomUUID } from "node:crypto";
import { getDatabase } from "@/lib/db/client";
import { generateLessonOutline } from "@/lib/server/lessons/outline-generator";
import { AppError } from "@/lib/server/utils/errors";
import type { Lesson, OutlineItem, CreateLessonRequest } from "@/types/lesson";
import type { LessonJob, LessonJobStatus } from "@/types/job";

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

function mapLesson(row: LessonRow, outline: OutlineRow[]): Lesson {
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
      message: "Outline ready",
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
  return mapLesson(lesson, outline);
}
