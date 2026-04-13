import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { runMigrations } from "../../../lib/db/migrations";

const e2eDbPath = path.join(process.cwd(), "data", "e2e.db");

function openDatabase() {
  fs.mkdirSync(path.dirname(e2eDbPath), { recursive: true });
  const db = new Database(e2eDbPath);
  runMigrations(db);
  return db;
}

export function resetE2EDatabase() {
  const db = openDatabase();

  db.exec("PRAGMA foreign_keys = OFF;");
  db.exec(`
    DELETE FROM quiz_answers;
    DELETE FROM quiz_attempts;
    DELETE FROM chat_messages;
    DELETE FROM scenes;
    DELETE FROM outline_items;
    DELETE FROM lesson_jobs;
    DELETE FROM lessons;
    DELETE FROM uploads;
    DELETE FROM app_settings;
  `);
  db.exec("PRAGMA foreign_keys = ON;");
  db.close();
}

export function seedOutlineReviewLesson({
  lessonId,
  jobId,
}: {
  lessonId: string;
  jobId: string;
}) {
  const db = openDatabase();
  const now = Date.now();

  db.prepare(
    `INSERT INTO lessons (
      id, title, prompt, source_upload_id, source_type, language, status, error_message, last_viewed_scene_order, created_at, updated_at
    ) VALUES (
      @id, @title, @prompt, @source_upload_id, @source_type, @language, @status, @error_message, @last_viewed_scene_order, @created_at, @updated_at
    )`,
  ).run({
    id: lessonId,
    title: "E2E Outline Review Lesson",
    prompt: "Teach me recursion with one quick quiz.",
    source_upload_id: null,
    source_type: "prompt",
    language: "en",
    status: "draft",
    error_message: null,
    last_viewed_scene_order: null,
    created_at: now,
    updated_at: now,
  });

  db.prepare(
    `INSERT INTO lesson_jobs (
      id, lesson_id, status, stage, progress, message, error_message, created_at, updated_at
    ) VALUES (
      @id, @lesson_id, @status, @stage, @progress, @message, @error_message, @created_at, @updated_at
    )`,
  ).run({
    id: jobId,
    lesson_id: lessonId,
    status: "awaiting_review",
    stage: "generating_outline",
    progress: 100,
    message: "Outline ready for review",
    error_message: null,
    created_at: now,
    updated_at: now,
  });

  const insertOutline = db.prepare(
    `INSERT INTO outline_items (
      id, lesson_id, title, goal, scene_type, display_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  insertOutline.run(
    `${lessonId}-outline-1`,
    lessonId,
    "What recursion means",
    "Build a simple mental model first.",
    "lesson",
    1,
    now,
    now,
  );
  insertOutline.run(
    `${lessonId}-outline-2`,
    lessonId,
    "Spot the recursive pattern",
    "Recognize a base case and a shrinking step.",
    "lesson",
    2,
    now,
    now,
  );
  insertOutline.run(
    `${lessonId}-outline-3`,
    lessonId,
    "Quick recursion check",
    "Confirm the learner can identify the base case.",
    "quiz",
    3,
    now,
    now,
  );

  db.close();
}

export function seedLessonWithScenes({ lessonId }: { lessonId: string }) {
  const db = openDatabase();
  const now = Date.now();

  const existingLesson = db.prepare("SELECT id FROM lessons WHERE id = ?").get(lessonId) as
    | { id: string }
    | undefined;

  if (existingLesson) {
    db.prepare(
      `UPDATE lessons
       SET title = ?, prompt = ?, source_upload_id = ?, source_type = ?, language = ?, status = ?, error_message = ?, last_viewed_scene_order = ?, updated_at = ?
       WHERE id = ?`,
    ).run(
      "E2E Lesson Experience",
      "Teach me recursion with one quick quiz.",
      null,
      "prompt",
      "en",
      "ready",
      null,
      null,
      now,
      lessonId,
    );
  } else {
    db.prepare(
      `INSERT INTO lessons (
        id, title, prompt, source_upload_id, source_type, language, status, error_message, last_viewed_scene_order, created_at, updated_at
      ) VALUES (
        @id, @title, @prompt, @source_upload_id, @source_type, @language, @status, @error_message, @last_viewed_scene_order, @created_at, @updated_at
      )`,
    ).run({
      id: lessonId,
      title: "E2E Lesson Experience",
      prompt: "Teach me recursion with one quick quiz.",
      source_upload_id: null,
      source_type: "prompt",
      language: "en",
      status: "ready",
      error_message: null,
      last_viewed_scene_order: null,
      created_at: now,
      updated_at: now,
    });
  }

  db.prepare("DELETE FROM scenes WHERE lesson_id = ?").run(lessonId);
  db.prepare("DELETE FROM outline_items WHERE lesson_id = ?").run(lessonId);

  const insertOutline = db.prepare(
    `INSERT INTO outline_items (
      id, lesson_id, title, goal, scene_type, display_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertScene = db.prepare(
    `INSERT INTO scenes (
      id, lesson_id, outline_item_id, type, title, display_order, status, content_json, error_message, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  const lessonOutlineId = `${lessonId}-outline-lesson`;
  const quizOutlineId = `${lessonId}-outline-quiz`;
  const lessonSceneId = `${lessonId}-scene-lesson`;
  const quizSceneId = `${lessonId}-scene-quiz`;

  insertOutline.run(
    lessonOutlineId,
    lessonId,
    "What recursion means",
    "Build a simple mental model first.",
    "lesson",
    1,
    now,
    now,
  );
  insertOutline.run(
    quizOutlineId,
    lessonId,
    "Quick recursion check",
    "Confirm the learner can identify the base case.",
    "quiz",
    2,
    now,
    now,
  );

  insertScene.run(
    lessonSceneId,
    lessonId,
    lessonOutlineId,
    "lesson",
    "What recursion means",
    1,
    "ready",
    JSON.stringify({
      summary: "Recursion solves a problem by reducing it into smaller versions of itself.",
      sections: [
        {
          heading: "Core idea",
          body: "A recursive solution keeps calling itself until it reaches a base case.",
          bullets: ["base case", "recursive step"],
        },
      ],
      keyTakeaways: ["Every recursive function needs a base case."],
    }),
    null,
    now,
    now,
  );

  insertScene.run(
    quizSceneId,
    lessonId,
    quizOutlineId,
    "quiz",
    "Quick recursion check",
    2,
    "ready",
    JSON.stringify({
      questions: [
        {
          id: "q1",
          prompt: "What stops recursion from continuing forever?",
          type: "multiple_choice",
          options: ["A loop counter", "A base case", "A global variable", "A return type"],
          correctIndex: 1,
          explanation: "The base case stops the function from calling itself again.",
        },
      ],
    }),
    null,
    now,
    now,
  );

  db.close();
}
