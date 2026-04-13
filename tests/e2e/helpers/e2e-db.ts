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
