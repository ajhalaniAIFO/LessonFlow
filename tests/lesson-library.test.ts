import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { getDatabase, resetDatabase } from "@/lib/db/client";
import {
  deleteLessonById,
  listLessons,
  renameLesson,
} from "@/lib/server/lessons/lesson-service";

function createTempDbPath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lessonflow-library-test-"));
  return path.join(dir, "app.db");
}

describe("lesson-library service", () => {
  beforeEach(() => {
    resetDatabase();
    process.env.LESSONFLOW_DB_PATH = createTempDbPath();
  });

  it("lists lessons ordered by most recently updated", async () => {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO lessons (id, title, prompt, source_type, language, status, error_message, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run("lesson-1", "First lesson", "Prompt 1", "prompt", "en", "ready", null, 100, 100);
    db.prepare(
      `INSERT INTO lessons (id, title, prompt, source_type, language, status, error_message, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run("lesson-2", "Second lesson", "Prompt 2", "prompt", "en", "ready", null, 200, 300);

    const lessons = await listLessons();

    expect(lessons[0]?.id).toBe("lesson-2");
    expect(lessons[1]?.id).toBe("lesson-1");
  });

  it("renames a lesson", async () => {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO lessons (id, title, prompt, source_type, language, status, error_message, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run("lesson-1", "Original title", "Prompt 1", "prompt", "en", "ready", null, 100, 100);

    await renameLesson("lesson-1", "Updated title");
    const updated = await listLessons();

    expect(updated[0]?.title).toBe("Updated title");
  });

  it("deletes a lesson", async () => {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO lessons (id, title, prompt, source_type, language, status, error_message, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run("lesson-1", "Disposable lesson", "Prompt 1", "prompt", "en", "ready", null, 100, 100);

    await deleteLessonById("lesson-1");
    const lessons = await listLessons();

    expect(lessons).toHaveLength(0);
  });
});
