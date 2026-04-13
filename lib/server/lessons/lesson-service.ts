import { randomUUID } from "node:crypto";
import { getDatabase } from "@/lib/db/client";
import { generateLessonOutline } from "@/lib/server/lessons/outline-generator";
import { generateQuizScene } from "@/lib/server/lessons/quiz-generator";
import { generateLessonScene } from "@/lib/server/lessons/scene-generator";
import { getUploadById } from "@/lib/server/uploads/upload-service";
import { AppError } from "@/lib/server/utils/errors";
import type {
  Lesson,
  LessonListItem,
  OutlineItem,
  CreateLessonRequest,
  OutlineReviewUpdate,
} from "@/types/lesson";
import type { LessonJob, LessonJobStatus } from "@/types/job";
import type { Scene } from "@/types/scene";

type LessonRow = {
  id: string;
  title: string;
  prompt: string | null;
  source_upload_id: string | null;
  source_type: Lesson["sourceType"];
  language: string;
  status: Lesson["status"];
  error_message: string | null;
  last_viewed_scene_order: number | null;
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
    lastViewedSceneOrder: row.last_viewed_scene_order ?? undefined,
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
  const uploadId = raw.uploadId ? String(raw.uploadId).trim() : undefined;

  if (!prompt && !uploadId) {
    throw new AppError("INVALID_REQUEST", "Provide a lesson prompt or an uploaded document.");
  }

  return {
    prompt: prompt || undefined,
    language,
    uploadId,
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
      `INSERT INTO lessons (id, title, prompt, source_upload_id, source_type, language, status, error_message, created_at, updated_at)
     VALUES (@id, @title, @prompt, @source_upload_id, @source_type, @language, @status, @error_message, @created_at, @updated_at)`,
  ).run({
    id: lessonId,
    title: "Generating lesson...",
    prompt: input.prompt ?? null,
    source_upload_id: input.uploadId ?? null,
    source_type: input.prompt && input.uploadId ? "prompt_and_document" : input.uploadId ? "document" : "prompt",
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
    void processLessonOutlineJob(jobId);
  }

  return {
    lessonId,
    jobId,
  };
}

export async function createOutlineGenerationJob(
  lessonId: string,
  options?: { autoProcess?: boolean },
) {
  const db = getDatabase();
  const lesson = db.prepare("SELECT * FROM lessons WHERE id = ?").get(lessonId) as LessonRow | undefined;

  if (!lesson) {
    throw new AppError("INVALID_REQUEST", "Lesson not found.");
  }

  const jobId = randomUUID();
  const now = Date.now();

  db.prepare(
    `INSERT INTO lesson_jobs (id, lesson_id, status, stage, progress, message, error_message, created_at, updated_at)
     VALUES (@id, @lesson_id, @status, @stage, @progress, @message, @error_message, @created_at, @updated_at)`,
  ).run({
    id: jobId,
    lesson_id: lessonId,
    status: "queued",
    stage: "queued",
    progress: 0,
    message: "Queued for scene generation",
    error_message: null,
    created_at: now,
    updated_at: now,
  });

  db.prepare(
    `UPDATE lessons
     SET status = ?, error_message = ?, updated_at = ?
     WHERE id = ?`,
  ).run("generating", null, now, lessonId);

  if (options?.autoProcess !== false) {
    void processLessonSceneJob(jobId);
  }

  return {
    lessonId,
    jobId,
  };
}

export async function createLessonRegenerationJob(
  lessonId: string,
  options?: { autoProcess?: boolean },
) {
  const db = getDatabase();
  const lesson = db.prepare("SELECT * FROM lessons WHERE id = ?").get(lessonId) as LessonRow | undefined;

  if (!lesson) {
    throw new AppError("INVALID_REQUEST", "Lesson not found.");
  }

  const jobId = randomUUID();
  const now = Date.now();

  db.prepare(
    `INSERT INTO lesson_jobs (id, lesson_id, status, stage, progress, message, error_message, created_at, updated_at)
     VALUES (@id, @lesson_id, @status, @stage, @progress, @message, @error_message, @created_at, @updated_at)`,
  ).run({
    id: jobId,
    lesson_id: lessonId,
    status: "queued",
    stage: "queued",
    progress: 0,
    message: "Queued for lesson regeneration",
    error_message: null,
    created_at: now,
    updated_at: now,
  });

  db.prepare(
    `UPDATE lessons
     SET status = ?, error_message = ?, last_viewed_scene_order = ?, updated_at = ?
     WHERE id = ?`,
  ).run("generating", null, null, now, lessonId);

  if (options?.autoProcess !== false) {
    void processLessonOutlineJob(jobId);
  }

  return {
    lessonId,
    jobId,
  };
}

export async function regenerateLessonScene(lessonId: string, sceneId: string) {
  const db = getDatabase();
  const lesson = await getLessonById(lessonId);

  if (!lesson) {
    throw new AppError("INVALID_REQUEST", "Lesson not found.");
  }

  const scene = lesson.scenes.find((entry) => entry.id === sceneId);
  if (!scene) {
    throw new AppError("INVALID_REQUEST", "Scene not found.");
  }

  const outlineRow = db
    .prepare("SELECT * FROM outline_items WHERE id = ? AND lesson_id = ?")
    .get(scene.outlineItemId, lessonId) as OutlineRow | undefined;

  if (!outlineRow) {
    throw new AppError("INVALID_REQUEST", "Scene outline item not found.");
  }

  let content: Scene["content"];
  let title = scene.title;

  if (scene.type === "lesson") {
    const nextScene = await generateLessonScene({
      lessonTitle: lesson.title,
      lessonPrompt: lesson.prompt ?? "",
      outlineTitle: outlineRow.title,
      outlineGoal: outlineRow.goal ?? undefined,
      language: lesson.language,
    });

    title = nextScene.title;
    content = nextScene;
  } else {
    const priorLessonScene = [...lesson.scenes]
      .filter(
        (entry) =>
          entry.type === "lesson" &&
          entry.order < scene.order &&
          entry.content &&
          "summary" in entry.content,
      )
      .sort((left, right) => right.order - left.order)[0];

    const nextQuiz = await generateQuizScene({
      lessonTitle: lesson.title,
      lessonPrompt: lesson.prompt ?? "",
      outlineTitle: outlineRow.title,
      outlineGoal: outlineRow.goal ?? undefined,
      sceneSummary:
        priorLessonScene?.content && "summary" in priorLessonScene.content
          ? priorLessonScene.content.summary
          : undefined,
      keyTakeaways:
        priorLessonScene?.content && "keyTakeaways" in priorLessonScene.content
          ? priorLessonScene.content.keyTakeaways
          : undefined,
      language: lesson.language,
    });

      title = nextQuiz.title;
      content = {
        questions: nextQuiz.questions,
      };
  }

  db.prepare(
    `UPDATE scenes
     SET title = ?, content_json = ?, status = ?, error_message = ?, updated_at = ?
     WHERE id = ? AND lesson_id = ?`,
  ).run(title, JSON.stringify(content), "ready", null, Date.now(), sceneId, lessonId);

  return getLessonById(lessonId);
}

export async function updateLessonOutline(lessonId: string, input: OutlineReviewUpdate) {
  const title = input.lessonTitle.trim();

  if (!title) {
    throw new AppError("INVALID_REQUEST", "A lesson title is required.");
  }

  if (!input.items.length) {
    throw new AppError("INVALID_REQUEST", "At least one outline item is required.");
  }

  const db = getDatabase();
  const lesson = db.prepare("SELECT * FROM lessons WHERE id = ?").get(lessonId) as LessonRow | undefined;
  if (!lesson) {
    throw new AppError("INVALID_REQUEST", "Lesson not found.");
  }

  const storedItems = db
    .prepare("SELECT * FROM outline_items WHERE lesson_id = ? ORDER BY display_order ASC")
    .all(lessonId) as OutlineRow[];
  const storedItemIds = new Set(storedItems.map((item) => item.id));

  if (input.items.some((item) => !storedItemIds.has(item.id))) {
    throw new AppError("INVALID_REQUEST", "Outline item mismatch.");
  }

  const now = Date.now();
  db.prepare("UPDATE lessons SET title = ?, updated_at = ? WHERE id = ?").run(title, now, lessonId);

  const updateOutline = db.prepare(
    `UPDATE outline_items
     SET title = ?, goal = ?, updated_at = ?
     WHERE id = ? AND lesson_id = ?`,
  );

  input.items.forEach((item) => {
    const nextTitle = item.title.trim();
    if (!nextTitle) {
      throw new AppError("INVALID_REQUEST", "Each outline item needs a title.");
    }

    updateOutline.run(nextTitle, item.goal?.trim() || null, now, item.id, lessonId);
  });

  return getLessonById(lessonId);
}

export async function processLessonOutlineJob(jobId: string) {
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
      progress: 30,
      message: "Generating lesson outline",
      error_message: null,
      updated_at: Date.now(),
    });

    const outline = await generateLessonOutline({
      prompt: lesson.prompt ?? "Teach me the key ideas from the uploaded material.",
      language: lesson.language,
      sourceText: lesson.source_upload_id
        ? (await getUploadById(lesson.source_upload_id))?.extractedText
        : undefined,
    });

    db.prepare("DELETE FROM outline_items WHERE lesson_id = ?").run(lesson.id);
    db.prepare("DELETE FROM scenes WHERE lesson_id = ?").run(lesson.id);
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
      status: "draft",
      error_message: null,
      updated_at: now,
    });

    updateJob.run({
      id: jobId,
      status: "awaiting_review",
      stage: "generating_outline",
      progress: 100,
      message: "Outline ready for review",
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

export async function processLessonJob(jobId: string) {
  return processFullLessonJob(jobId, true);
}

export async function processLessonSceneJob(jobId: string) {
  return processFullLessonJob(jobId, false);
}

async function processFullLessonJob(jobId: string, regenerateOutline: boolean) {
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
    let lessonTitle = lesson.title;
    let now = Date.now();

    if (regenerateOutline) {
      updateJob.run({
        id: jobId,
        status: "generating_outline",
        stage: "generating_outline",
        progress: 25,
        message: "Generating lesson outline",
        error_message: null,
        updated_at: now,
      });

      const outline = await generateLessonOutline({
        prompt: lesson.prompt ?? "Teach me the key ideas from the uploaded material.",
        language: lesson.language,
        sourceText: lesson.source_upload_id
          ? (await getUploadById(lesson.source_upload_id))?.extractedText
          : undefined,
      });

      db.prepare("DELETE FROM outline_items WHERE lesson_id = ?").run(lesson.id);
      db.prepare("DELETE FROM scenes WHERE lesson_id = ?").run(lesson.id);
      now = Date.now();
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
      lessonTitle = outline.title;
    } else {
      db.prepare("DELETE FROM scenes WHERE lesson_id = ?").run(lesson.id);
    }

    const outlineRows = db
      .prepare("SELECT * FROM outline_items WHERE lesson_id = ? ORDER BY display_order ASC")
      .all(lesson.id) as OutlineRow[];
    let latestLessonSummary: string | undefined;
    let latestLessonTakeaways: string[] | undefined;
    const sceneRows = outlineRows.filter((row) => row.scene_type === "lesson" || row.scene_type === "quiz");

    if (sceneRows.length === 0) {
      throw new AppError("INTERNAL_ERROR", "Generated outline did not contain any scenes.");
    }

    for (const [index, outlineRow] of sceneRows.entries()) {
      const progress = Math.min(95, 55 + Math.round(((index + 1) / sceneRows.length) * 40));
      const isLessonScene = outlineRow.scene_type === "lesson";

      updateJob.run({
        id: jobId,
        status: isLessonScene ? "generating_scenes" : "generating_quizzes",
        stage: isLessonScene ? "generating_scenes" : "generating_quizzes",
        progress,
        message: isLessonScene
          ? `Generating lesson scene ${index + 1} of ${sceneRows.length}`
          : `Generating quiz scene ${index + 1} of ${sceneRows.length}`,
        error_message: null,
        updated_at: Date.now(),
      });

      if (isLessonScene) {
        const scene = await generateLessonScene({
          lessonTitle,
          lessonPrompt: lesson.prompt ?? "",
          outlineTitle: outlineRow.title,
          outlineGoal: outlineRow.goal ?? undefined,
          language: lesson.language,
        });

        latestLessonSummary = scene.summary;
        latestLessonTakeaways = scene.keyTakeaways;

        insertScene.run({
          id: randomUUID(),
          lesson_id: lesson.id,
          outline_item_id: outlineRow.id,
          type: "lesson",
          title: scene.title,
          display_order: outlineRow.display_order,
          status: "ready",
          content_json: JSON.stringify(scene),
          error_message: null,
          created_at: now,
          updated_at: now,
        });

        continue;
      }

      const quizScene = await generateQuizScene({
        lessonTitle,
        lessonPrompt: lesson.prompt ?? "",
        outlineTitle: outlineRow.title,
        outlineGoal: outlineRow.goal ?? undefined,
        sceneSummary: latestLessonSummary,
        keyTakeaways: latestLessonTakeaways,
        language: lesson.language,
      });

      insertScene.run({
        id: randomUUID(),
        lesson_id: lesson.id,
        outline_item_id: outlineRow.id,
        type: "quiz",
        title: quizScene.title,
        display_order: outlineRow.display_order,
        status: "ready",
        content_json: JSON.stringify({
          questions: quizScene.questions,
        }),
        error_message: null,
        created_at: now,
        updated_at: now,
      });
    }

    updateLesson.run({
      id: lesson.id,
      title: lessonTitle,
      status: "ready",
      error_message: null,
      updated_at: now,
    });

    updateJob.run({
      id: jobId,
      status: "ready",
      stage: "ready",
      progress: 100,
      message: "All lesson scenes are ready",
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

export async function listLessons(): Promise<LessonListItem[]> {
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT lessons.id, lessons.title, lessons.status, lessons.updated_at,
              lessons.last_viewed_scene_order,
              COUNT(scenes.id) AS scene_count
       FROM lessons
       LEFT JOIN scenes ON scenes.lesson_id = lessons.id
       GROUP BY lessons.id, lessons.title, lessons.status, lessons.updated_at, lessons.last_viewed_scene_order
       ORDER BY lessons.updated_at DESC`,
    )
    .all() as Array<{
    id: string;
    title: string;
    status: Lesson["status"];
    updated_at: number;
    scene_count: number;
    last_viewed_scene_order: number | null;
  }>;

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    sceneCount: row.scene_count,
    lastViewedSceneOrder: row.last_viewed_scene_order ?? undefined,
    updatedAt: row.updated_at,
  }));
}

export async function rememberLessonProgress(lessonId: string, sceneOrder: number) {
  if (!Number.isInteger(sceneOrder) || sceneOrder < 1) {
    throw new AppError("INVALID_REQUEST", "A valid scene order is required.");
  }

  const db = getDatabase();
  const result = db
    .prepare("UPDATE lessons SET last_viewed_scene_order = ?, updated_at = ? WHERE id = ?")
    .run(sceneOrder, Date.now(), lessonId);

  if (result.changes === 0) {
    throw new AppError("INVALID_REQUEST", "Lesson not found.");
  }
}

export async function renameLesson(lessonId: string, nextTitle: string) {
  const title = nextTitle.trim();
  if (!title) {
    throw new AppError("INVALID_REQUEST", "A lesson title is required.");
  }

  const db = getDatabase();
  const result = db
    .prepare("UPDATE lessons SET title = ?, updated_at = ? WHERE id = ?")
    .run(title, Date.now(), lessonId);

  if (result.changes === 0) {
    throw new AppError("INVALID_REQUEST", "Lesson not found.");
  }
}

export async function deleteLessonById(lessonId: string) {
  const db = getDatabase();
  const result = db.prepare("DELETE FROM lessons WHERE id = ?").run(lessonId);

  if (result.changes === 0) {
    throw new AppError("INVALID_REQUEST", "Lesson not found.");
  }
}
