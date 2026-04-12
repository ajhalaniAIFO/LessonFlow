import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetDatabase } from "@/lib/db/client";
import { generateLessonOutline } from "@/lib/server/lessons/outline-generator";
import { saveModelSettings } from "@/lib/server/settings/settings-service";

function createTempDbPath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lessonflow-outline-test-"));
  return path.join(dir, "app.db");
}

describe("outline-generator", () => {
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

  it("validates a structured outline from the provider", async () => {
    const fakeProvider = {
      healthCheck: vi.fn(),
      listModels: vi.fn(),
      generateText: vi.fn(),
      generateStructuredJson: vi.fn().mockResolvedValue({
        title: "Thermodynamics Basics",
        outline: [
          { title: "What thermodynamics studies", goal: "Understand the scope", sceneType: "lesson" },
          { title: "Energy, heat, and work", goal: "Learn the key concepts", sceneType: "lesson" },
          { title: "Quick knowledge check", goal: "Reinforce understanding", sceneType: "quiz" },
        ],
      }),
    };

    const result = await generateLessonOutline(
      {
        prompt: "Teach me thermodynamics",
        language: "en",
      },
      fakeProvider,
    );

    expect(result.title).toBe("Thermodynamics Basics");
    expect(result.outline).toHaveLength(3);
    expect(fakeProvider.generateStructuredJson).toHaveBeenCalledOnce();
  });

  it("rejects malformed provider output", async () => {
    const fakeProvider = {
      healthCheck: vi.fn(),
      listModels: vi.fn(),
      generateText: vi.fn(),
      generateStructuredJson: vi.fn().mockResolvedValue({
        title: "",
        outline: [],
      }),
    };

    await expect(
      generateLessonOutline(
        {
          prompt: "Teach me thermodynamics",
          language: "en",
        },
        fakeProvider,
      ),
    ).rejects.toThrow("invalid lesson outline");
  });
});
