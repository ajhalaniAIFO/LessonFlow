import type Database from "better-sqlite3";
import {
  CHAT_MESSAGES_TABLE_SQL,
  LESSONS_TABLE_SQL,
  LESSON_JOBS_TABLE_SQL,
  OUTLINE_ITEMS_TABLE_SQL,
  UPLOADS_TABLE_SQL,
  QUIZ_ANSWERS_TABLE_SQL,
  QUIZ_ATTEMPTS_TABLE_SQL,
  SCENES_TABLE_SQL,
  SETTINGS_TABLE_SQL,
} from "@/lib/db/schema";

export function runMigrations(db: Database.Database) {
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(SETTINGS_TABLE_SQL);
  db.exec(UPLOADS_TABLE_SQL);
  db.exec(LESSONS_TABLE_SQL);
  db.exec(LESSON_JOBS_TABLE_SQL);
  db.exec(OUTLINE_ITEMS_TABLE_SQL);
  db.exec(SCENES_TABLE_SQL);
  db.exec(QUIZ_ATTEMPTS_TABLE_SQL);
  db.exec(QUIZ_ANSWERS_TABLE_SQL);
  db.exec(CHAT_MESSAGES_TABLE_SQL);

  const lessonColumns = db.prepare("PRAGMA table_info(lessons)").all() as Array<{ name: string }>;
  const hasLastViewedSceneOrder = lessonColumns.some(
    (column) => column.name === "last_viewed_scene_order",
  );

  if (!hasLastViewedSceneOrder) {
    db.exec("ALTER TABLE lessons ADD COLUMN last_viewed_scene_order INTEGER;");
  }

  const hasGenerationMode = lessonColumns.some((column) => column.name === "generation_mode");

  if (!hasGenerationMode) {
    db.exec("ALTER TABLE lessons ADD COLUMN generation_mode TEXT NOT NULL DEFAULT 'balanced';");
  }

  const chatMessageColumns = db
    .prepare("PRAGMA table_info(chat_messages)")
    .all() as Array<{ name: string }>;
  const hasSceneId = chatMessageColumns.some((column) => column.name === "scene_id");

  if (!hasSceneId) {
    db.exec("ALTER TABLE chat_messages ADD COLUMN scene_id TEXT REFERENCES scenes(id) ON DELETE SET NULL;");
  }
}
