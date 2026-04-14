import fs from "node:fs/promises";
import path from "node:path";
import { getGenerationModeDefinition, resolveGenerationRequestSettings } from "@/lib/server/lessons/generation-mode";
import {
  getLearnerLevelDefinition,
  getTeachingStyleDefinition,
} from "@/lib/server/lessons/personalization";
import { getLessonFormatDefinition } from "@/lib/server/lessons/teaching-modes";
import { getProvider } from "@/lib/server/llm/provider-registry";
import type { LLMProvider } from "@/lib/server/llm/types";
import { getModelSettings } from "@/lib/server/settings/settings-service";
import type { SourceContext } from "@/types/upload";
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
    generationMode?: "fast" | "balanced" | "detailed";
    learnerLevel?: "beginner" | "intermediate" | "advanced";
    teachingStyle?: "concise" | "practical" | "step_by_step";
    lessonFormat?: "standard" | "workshop" | "guided_project";
    sourceContext?: SourceContext;
  },
  providerOverride?: LLMProvider,
): Promise<LessonSceneResponse> {
  const settings = await getModelSettings();
  const provider = providerOverride ?? getProvider(settings.provider);
  const template = await loadPromptTemplate();
  const generationMode = input.generationMode ?? "balanced";
  const learnerLevel = input.learnerLevel ?? "intermediate";
  const teachingStyle = input.teachingStyle ?? "practical";
  const lessonFormat = input.lessonFormat ?? "standard";
  const modeDefinition = getGenerationModeDefinition(generationMode);
  const learnerLevelDefinition = getLearnerLevelDefinition(learnerLevel);
  const teachingStyleDefinition = getTeachingStyleDefinition(teachingStyle);
  const lessonFormatDefinition = getLessonFormatDefinition(lessonFormat);
  const requestSettings = resolveGenerationRequestSettings(generationMode, settings);

  const prompt = `${template}

Create a teaching scene for this lesson outline item.

Requirements:
- Return strict JSON only.
- JSON keys must be: "title", "summary", "sections", and optional "keyTakeaways".
- Provide 2 to 4 sections.
- Each section must include "heading" and "body".
- Use "bullets" only when they improve clarity.
- Keep the tone instructional and practical.
- Generation mode: ${modeDefinition.label}
- Mode guidance: ${modeDefinition.sceneGuidance}
- Learner level: ${learnerLevelDefinition.label}
- Learner level guidance: ${learnerLevelDefinition.guidance}
- Teaching style: ${teachingStyleDefinition.label}
- Teaching style guidance: ${teachingStyleDefinition.guidance}
- Lesson format: ${lessonFormatDefinition.label}
- Lesson format guidance: ${lessonFormatDefinition.sceneGuidance}
- Language: ${input.language}

Lesson title:
${input.lessonTitle}

Lesson request:
${input.lessonPrompt}

Current outline item:
- title: ${input.outlineTitle}
- goal: ${input.outlineGoal ?? "Introduce the concept clearly."}

Relevant source excerpt:
${input.sourceContext?.excerpt ?? "No uploaded source excerpt provided."}

Source highlights:
${input.sourceContext?.highlights.join(", ") || "No source highlights available."}`;

  let parsed: unknown;
  try {
    parsed = await provider.generateStructuredJson<unknown>({
      baseUrl: settings.baseUrl,
      model: settings.model,
      prompt,
      temperature: requestSettings.temperature,
      maxTokens: requestSettings.maxTokens,
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
