import fs from "node:fs/promises";
import path from "node:path";
import { getProvider } from "@/lib/server/llm/provider-registry";
import type { LLMProvider } from "@/lib/server/llm/types";
import { getModelSettings } from "@/lib/server/settings/settings-service";
import { AppError } from "@/lib/server/utils/errors";
import {
  lessonSceneResponseSchema,
  type LessonSceneResponse,
} from "@/lib/server/validation/lesson-scene-schema";

async function loadPromptTemplate() {
  const filePath = path.join(process.cwd(), "prompts", "lesson-scene.txt");
  return fs.readFile(filePath, "utf8");
}

export async function generateLessonScene(
  input: {
    lessonTitle: string;
    lessonPrompt: string;
    outlineTitle: string;
    outlineGoal?: string;
    language: string;
  },
  providerOverride?: LLMProvider,
): Promise<LessonSceneResponse> {
  const settings = await getModelSettings();
  const provider = providerOverride ?? getProvider(settings.provider);
  const template = await loadPromptTemplate();

  const prompt = `${template}

Create the first teaching scene for this lesson.

Requirements:
- Return strict JSON only.
- JSON keys must be: "title", "summary", "sections", and optional "keyTakeaways".
- Provide 2 to 4 sections.
- Each section must include "heading" and "body".
- Use "bullets" only when they improve clarity.
- Keep the tone instructional and practical.
- Language: ${input.language}

Lesson title:
${input.lessonTitle}

Lesson request:
${input.lessonPrompt}

Current outline item:
- title: ${input.outlineTitle}
- goal: ${input.outlineGoal ?? "Introduce the concept clearly."}`;

  let parsed: unknown;
  try {
    parsed = await provider.generateStructuredJson<unknown>({
      baseUrl: settings.baseUrl,
      model: settings.model,
      prompt,
      temperature: settings.temperature,
      maxTokens: settings.maxTokens,
      timeoutMs: settings.timeoutMs,
    });
  } catch (error) {
    throw new AppError(
      "INTERNAL_ERROR",
      error instanceof Error ? error.message : "Failed to generate lesson scene.",
    );
  }

  const validated = lessonSceneResponseSchema.safeParse(parsed);
  if (!validated.success) {
    throw new AppError("INTERNAL_ERROR", "Model returned an invalid lesson scene.");
  }

  return validated.data;
}
