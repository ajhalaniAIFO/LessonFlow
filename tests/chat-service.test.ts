import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDatabase, resetDatabase } from "@/lib/db/client";
import * as lessonService from "@/lib/server/lessons/lesson-service";
import { sendTutorMessage } from "@/lib/server/lessons/chat-service";
import { saveModelSettings } from "@/lib/server/settings/settings-service";

function createTempDbPath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lessonflow-chat-test-"));
  return path.join(dir, "app.db");
}

describe("chat-service", () => {
  beforeEach(async () => {
    resetDatabase();
    process.env.LESSONFLOW_DB_PATH = createTempDbPath();
    await saveModelSettings({
      provider: "ollama",
      baseUrl: "http://127.0.0.1:11434",
      model: "qwen2.5:7b-instruct",
      temperature: 0.4,
      maxTokens: 2000,
      timeoutMs: 120000,
    });
  });

  it("stores a user message and assistant reply", async () => {
    const db = getDatabase();
    const now = Date.now();
    db.prepare(
      `INSERT INTO lessons (id, title, prompt, source_upload_id, source_type, language, status, error_message, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run("lesson-1", "Thermodynamics Basics", "Teach me thermodynamics", null, "prompt", "en", "ready", null, now, now);

    vi.spyOn(lessonService, "getLessonById").mockResolvedValue({
      id: "lesson-1",
      title: "Thermodynamics Basics",
      prompt: "Teach me thermodynamics",
      sourceType: "prompt",
      language: "en",
      status: "ready",
      outline: [
        { id: "outline-1", title: "Core concepts", sceneType: "lesson", order: 1 },
      ],
      scenes: [],
      createdAt: now,
      updatedAt: now,
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          response: "Focus on how energy, heat, and work relate to each other first.",
        }),
      }),
    );

    const reply = await sendTutorMessage("lesson-1", "What should I focus on first?");

    expect(reply.role).toBe("assistant");
    expect(reply.content).toContain("energy");

    const messages = db.prepare("SELECT COUNT(*) AS count FROM chat_messages").get() as { count: number };
    expect(messages.count).toBe(2);
  });
});
