import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetDatabase } from "@/lib/db/client";
import { generateLessonScene } from "@/lib/server/lessons/scene-generator";
import { saveModelSettings } from "@/lib/server/settings/settings-service";

function createTempDbPath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lessonflow-scene-test-"));
  return path.join(dir, "app.db");
}

describe("scene-generator", () => {
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

  it("validates a generated lesson scene", async () => {
    const fakeProvider = {
      healthCheck: vi.fn(),
      listModels: vi.fn(),
      generateText: vi.fn(),
      generateStructuredJson: vi.fn().mockResolvedValue({
        title: "What Thermodynamics Studies",
        summary: "Thermodynamics explains how heat, work, and energy relate to each other.",
        sections: [
          {
            heading: "Core idea",
            body: "Thermodynamics studies how energy moves and changes form.",
            bullets: ["Heat transfer", "Work", "Energy conservation"],
          },
          {
            heading: "Why it matters",
            body: "These ideas help explain engines, refrigerators, and natural processes.",
          },
        ],
        keyTakeaways: ["Heat and work are forms of energy transfer", "Thermodynamics is practical"],
      }),
    };

    const result = await generateLessonScene(
      {
        lessonTitle: "Thermodynamics Basics",
        lessonPrompt: "Teach me thermodynamics",
        outlineTitle: "What thermodynamics studies",
        language: "en",
      },
      fakeProvider,
    );

    expect(result.sections).toHaveLength(2);
    expect(result.summary).toContain("energy");
  });

  it("rejects malformed lesson scenes", async () => {
    const fakeProvider = {
      healthCheck: vi.fn(),
      listModels: vi.fn(),
      generateText: vi.fn(),
      generateStructuredJson: vi.fn().mockResolvedValue({
        title: "Bad scene",
        summary: "short",
        sections: [],
      }),
    };

    await expect(
      generateLessonScene(
        {
          lessonTitle: "Thermodynamics Basics",
          lessonPrompt: "Teach me thermodynamics",
          outlineTitle: "What thermodynamics studies",
          language: "en",
        },
        fakeProvider,
      ),
    ).rejects.toThrow("invalid lesson scene");
  });
});
