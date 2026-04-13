import fs from "node:fs/promises";
import path from "node:path";
import { getProvider } from "@/lib/server/llm/provider-registry";
import type { LLMProvider } from "@/lib/server/llm/types";
import { getModelSettings } from "@/lib/server/settings/settings-service";
import { buildSourceContext } from "@/lib/server/uploads/source-intelligence";
import { AppError } from "@/lib/server/utils/errors";
import { outlineResponseSchema, type OutlineResponse } from "@/lib/server/validation/outline-schema";

async function loadPromptTemplate() {
  const filePath = path.join(process.cwd(), "prompts", "outline.txt");
  return fs.readFile(filePath, "utf8");
}

export async function generateLessonOutline(
  input: { prompt: string; language: string; sourceText?: string },
  providerOverride?: LLMProvider,
): Promise<OutlineResponse> {
  const settings = await getModelSettings();
  const provider = providerOverride ?? getProvider(settings.provider);
  const template = await loadPromptTemplate();
  const sourceContext = buildSourceContext({
    sourceText: input.sourceText,
    lessonPrompt: input.prompt,
    maxExcerptLength: 900,
  });

  const prompt = `${template}

Create a structured lesson outline for the following learning request.

Requirements:
- Return strict JSON with keys "title" and "outline".
- The "outline" array must contain between 3 and 6 items.
- Each outline item must include: "title", "goal", and "sceneType".
- Use "lesson" for teaching sections and include exactly one "quiz" item near the end.
- Keep the lesson practical and progressive.
- Language: ${input.language}

Learning request:
${input.prompt}

Source material:
${sourceContext?.excerpt ?? "No uploaded source material provided."}

Source highlights:
${sourceContext?.highlights.join(", ") || "No source highlights available."}`;

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
      error instanceof Error ? error.message : "Failed to generate lesson outline.",
    );
  }

  const validated = outlineResponseSchema.safeParse(parsed);
  if (!validated.success) {
    throw new AppError("INTERNAL_ERROR", "Model returned an invalid lesson outline.");
  }

  return validated.data;
}
