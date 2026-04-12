import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetDatabase } from "@/lib/db/client";
import { generateQuizScene } from "@/lib/server/lessons/quiz-generator";
import { saveModelSettings } from "@/lib/server/settings/settings-service";

function createTempDbPath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lessonflow-quiz-test-"));
  return path.join(dir, "app.db");
}

describe("quiz-generator", () => {
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

  it("validates a generated quiz scene", async () => {
    const fakeProvider = {
      healthCheck: vi.fn(),
      listModels: vi.fn(),
      generateText: vi.fn(),
      generateStructuredJson: vi.fn().mockResolvedValue({
        title: "Quick knowledge check",
        questions: [
          {
            prompt: "What does thermodynamics study?",
            type: "multiple_choice",
            options: ["Energy transfer", "Only gravity", "Only electricity", "Only chemistry"],
            correctIndex: 0,
            explanation: "Thermodynamics studies heat, work, and energy transfer.",
          },
        ],
      }),
    };

    const result = await generateQuizScene(
      {
        lessonTitle: "Thermodynamics Basics",
        lessonPrompt: "Teach me thermodynamics",
        outlineTitle: "Quick knowledge check",
        language: "en",
      },
      fakeProvider,
    );

    expect(result.questions).toHaveLength(1);
    expect(result.questions[0]?.type).toBe("multiple_choice");
    expect(result.questions[0]?.id).toBeTruthy();
  });

  it("rejects malformed quiz scenes", async () => {
    const fakeProvider = {
      healthCheck: vi.fn(),
      listModels: vi.fn(),
      generateText: vi.fn(),
      generateStructuredJson: vi.fn().mockResolvedValue({
        title: "Bad quiz",
        questions: [],
      }),
    };

    await expect(
      generateQuizScene(
        {
          lessonTitle: "Thermodynamics Basics",
          lessonPrompt: "Teach me thermodynamics",
          outlineTitle: "Quick knowledge check",
          language: "en",
        },
        fakeProvider,
      ),
    ).rejects.toThrow("invalid quiz scene");
  });
});
