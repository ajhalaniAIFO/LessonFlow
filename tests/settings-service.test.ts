import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { getDatabasePath, resetDatabase } from "@/lib/db/client";
import { AppError } from "@/lib/server/utils/errors";
import {
  getModelSettings,
  parseModelSettings,
  saveModelSettings,
} from "@/lib/server/settings/settings-service";

function createTempDbPath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lessonflow-test-"));
  return path.join(dir, "app.db");
}

describe("settings-service", () => {
  beforeEach(() => {
    resetDatabase();
    process.env.LESSONFLOW_DB_PATH = createTempDbPath();
  });

  it("returns default settings when nothing has been saved", async () => {
    const settings = await getModelSettings();

    expect(settings).toEqual({
      provider: "ollama",
      baseUrl: "http://127.0.0.1:11434",
      model: "",
      temperature: 0.4,
      maxTokens: 2000,
      timeoutMs: 120000,
    });
  });

  it("persists and reloads saved settings", async () => {
    await saveModelSettings({
      provider: "ollama",
      baseUrl: "http://127.0.0.1:11434",
      model: "qwen2.5:7b-instruct",
      temperature: 0.2,
      maxTokens: 4096,
      timeoutMs: 240000,
    });

    resetDatabase();
    const settings = await getModelSettings();

    expect(settings.model).toBe("qwen2.5:7b-instruct");
    expect(settings.temperature).toBe(0.2);
    expect(getDatabasePath()).toContain("lessonflow-test-");
  });

  it("rejects invalid settings", () => {
    expect(() =>
      parseModelSettings({
        provider: "ollama",
        baseUrl: "not-a-url",
        model: "",
        temperature: 0.4,
        maxTokens: 2000,
        timeoutMs: 120000,
      }),
    ).toThrow(AppError);
  });
});
