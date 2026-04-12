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
    db.prepare(
      `INSERT INTO outline_items (id, lesson_id, title, goal, scene_type, display_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run("outline-1", "lesson-1", "Core concepts", "Understand the basics", "lesson", 1, now, now);
    db.prepare(
      `INSERT INTO scenes (id, lesson_id, outline_item_id, type, title, display_order, status, content_json, error_message, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      "scene-1",
      "lesson-1",
      "outline-1",
      "lesson",
      "Core concepts",
      1,
      "ready",
      JSON.stringify({
        summary: "Thermodynamics connects energy, heat, and work.",
        sections: [
          { heading: "Energy", body: "Energy changes form." },
          { heading: "Heat and work", body: "Heat and work transfer energy." },
        ],
        keyTakeaways: ["Energy transfer matters", "Heat and work are related"],
      }),
      null,
      now,
      now,
    );

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
      scenes: [
        {
          id: "scene-1",
          lessonId: "lesson-1",
          outlineItemId: "outline-1",
          type: "lesson",
          title: "Core concepts",
          order: 1,
          status: "ready",
          content: {
            summary: "Thermodynamics connects energy, heat, and work.",
            sections: [
              { heading: "Energy", body: "Energy changes form." },
              { heading: "Heat and work", body: "Heat and work transfer energy." },
            ],
            keyTakeaways: ["Energy transfer matters", "Heat and work are related"],
          },
        },
      ],
      createdAt: now,
      updatedAt: now,
    });

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        response: "Focus on how energy, heat, and work relate to each other first.",
      }),
    });
    vi.stubGlobal(
      "fetch",
      fetchSpy,
    );

    const reply = await sendTutorMessage("lesson-1", "What should I focus on first?", {
      sceneId: "scene-1",
    });

    expect(reply.role).toBe("assistant");
    expect(reply.sceneId).toBe("scene-1");
    expect(reply.content).toContain("energy");

    const messages = db.prepare("SELECT COUNT(*) AS count FROM chat_messages").get() as { count: number };
    expect(messages.count).toBe(2);

    const storedRows = db
      .prepare("SELECT scene_id FROM chat_messages ORDER BY created_at ASC")
      .all() as Array<{ scene_id: string | null }>;
    expect(storedRows.every((row) => row.scene_id === "scene-1")).toBe(true);

    expect(fetchSpy).toHaveBeenCalled();
    const requestInit = fetchSpy.mock.calls[0]?.[1] as RequestInit | undefined;
    const requestBody = requestInit?.body ? JSON.parse(String(requestInit.body)) : {};
    expect(requestBody.prompt).toContain("Current scene: Core concepts");
    expect(requestBody.prompt).toContain("Current scene summary: Thermodynamics connects energy, heat, and work.");
  });
});
