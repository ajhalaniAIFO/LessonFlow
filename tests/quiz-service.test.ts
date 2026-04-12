import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { getDatabase, resetDatabase } from "@/lib/db/client";
import { gradeQuizAnswers } from "@/lib/server/lessons/quiz-service";

function createTempDbPath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lessonflow-quiz-service-test-"));
  return path.join(dir, "app.db");
}

describe("quiz-service", () => {
  beforeEach(() => {
    resetDatabase();
    process.env.LESSONFLOW_DB_PATH = createTempDbPath();
  });

  it("grades quiz answers and stores the attempt", () => {
    const db = getDatabase();
    const now = Date.now();

    db.prepare(
      `INSERT INTO lessons (id, title, prompt, source_type, language, status, error_message, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run("lesson-1", "Thermodynamics Basics", "Teach me thermodynamics", "prompt", "en", "ready", null, now, now);

    db.prepare(
      `INSERT INTO outline_items (id, lesson_id, title, goal, scene_type, display_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      "outline-quiz",
      "lesson-1",
      "Quick knowledge check",
      "Reinforce understanding",
      "quiz",
      2,
      now,
      now,
    );

    db.prepare(
      `INSERT INTO scenes (id, lesson_id, outline_item_id, type, title, display_order, status, content_json, error_message, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      "scene-1",
      "lesson-1",
      "outline-quiz",
      "quiz",
      "Quick knowledge check",
      2,
      "ready",
      JSON.stringify({
        questions: [
          {
            id: "q1",
            prompt: "What does thermodynamics study?",
            type: "multiple_choice",
            options: ["Energy transfer", "Only gravity", "Only chemistry", "Only optics"],
            correctIndex: 0,
            explanation: "Thermodynamics studies heat, work, and energy transfer.",
          },
        ],
      }),
      null,
      now,
      now,
    );

    const result = gradeQuizAnswers({
      lessonId: "lesson-1",
      sceneId: "scene-1",
      answers: [{ questionId: "q1", selectedIndex: 0 }],
    });

    expect(result.score.correct).toBe(1);
    expect(result.score.total).toBe(1);

    const attempts = db.prepare("SELECT COUNT(*) AS count FROM quiz_attempts").get() as { count: number };
    const answers = db.prepare("SELECT COUNT(*) AS count FROM quiz_answers").get() as { count: number };

    expect(attempts.count).toBe(1);
    expect(answers.count).toBe(1);
  });
});
