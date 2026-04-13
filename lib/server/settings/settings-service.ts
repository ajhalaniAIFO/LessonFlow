import { z } from "zod";
import { getDatabase } from "@/lib/db/client";
import { AppError } from "@/lib/server/utils/errors";
import type { ModelSettings } from "@/types/settings";

const SETTINGS_KEY = "llm_config";

const modelSettingsSchema = z.object({
  provider: z.enum(["ollama", "openai_compatible"]),
  baseUrl: z.string().trim().url("Base URL must be a valid URL."),
  model: z.string().trim(),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().int().min(256).max(32768),
  timeoutMs: z.number().int().min(1000).max(600000),
});

const DEFAULT_MODEL_SETTINGS: ModelSettings = {
  provider: "ollama",
  baseUrl: "http://127.0.0.1:11434",
  model: "",
  temperature: 0.4,
  maxTokens: 2000,
  timeoutMs: 120000,
};

export function parseModelSettings(input: unknown): ModelSettings {
  const parsed = modelSettingsSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new AppError("INVALID_REQUEST", issue?.message ?? "Invalid model settings.");
  }

  return parsed.data;
}

export async function getModelSettings(): Promise<ModelSettings> {
  const db = getDatabase();
  const row = db
    .prepare("SELECT value_json FROM app_settings WHERE key = ?")
    .get(SETTINGS_KEY) as { value_json: string } | undefined;

  if (!row) {
    return DEFAULT_MODEL_SETTINGS;
  }

  try {
    return parseModelSettings(JSON.parse(row.value_json));
  } catch {
    return DEFAULT_MODEL_SETTINGS;
  }
}

export async function saveModelSettings(input: unknown): Promise<ModelSettings> {
  const settings = parseModelSettings(input);
  const db = getDatabase();

  db.prepare(
    `
      INSERT INTO app_settings (key, value_json, updated_at)
      VALUES (@key, @value_json, @updated_at)
      ON CONFLICT(key) DO UPDATE SET
        value_json = excluded.value_json,
        updated_at = excluded.updated_at
    `,
  ).run({
    key: SETTINGS_KEY,
    value_json: JSON.stringify(settings),
    updated_at: Date.now(),
  });

  return settings;
}
