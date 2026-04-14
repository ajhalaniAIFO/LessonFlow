import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
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
import type { QuizSceneContent } from "@/types/scene";
import {
  quizSceneResponseSchema,
} from "@/lib/server/validation/quiz-scene-schema";

type GeneratedQuizScene = QuizSceneContent & {
  title: string;
};

async function loadPromptTemplate() {
  const filePath = path.join(process.cwd(), "prompts", "quiz-scene.txt");
  return fs.readFile(filePath, "utf8");
}

export async function generateQuizScene(
  input: {
    lessonTitle: string;
    lessonPrompt: string;
    outlineTitle: string;
    outlineGoal?: string;
    sceneSummary?: string;
    keyTakeaways?: string[];
    language: string;
    generationMode?: "fast" | "balanced" | "detailed";
    learnerLevel?: "beginner" | "intermediate" | "advanced";
    teachingStyle?: "concise" | "practical" | "step_by_step";
    lessonFormat?: "standard" | "workshop" | "guided_project";
    sourceContext?: SourceContext;
  },
  providerOverride?: LLMProvider,
): Promise<GeneratedQuizScene> {
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

Create a short multiple-choice quiz for this lesson.

Requirements:
- Return strict JSON only.
- JSON keys must be: "title" and "questions".
- Provide 1 to 3 questions.
- Each question must include: "prompt", "type", "options", "correctIndex", and "explanation".
- "type" must always be "multiple_choice".
- Each question must have exactly 4 options.
- Make the quiz check understanding of the generated lesson content.
- Generation mode: ${modeDefinition.label}
- Mode guidance: ${modeDefinition.quizGuidance}
- Learner level: ${learnerLevelDefinition.label}
- Learner level guidance: ${learnerLevelDefinition.guidance}
- Teaching style: ${teachingStyleDefinition.label}
- Teaching style guidance: ${teachingStyleDefinition.guidance}
- Lesson format: ${lessonFormatDefinition.label}
- Lesson format guidance: ${lessonFormatDefinition.quizGuidance}
- Language: ${input.language}

Lesson title:
${input.lessonTitle}

Lesson request:
${input.lessonPrompt}

Quiz outline item:
- title: ${input.outlineTitle}
- goal: ${input.outlineGoal ?? "Check understanding."}

Lesson scene summary:
${input.sceneSummary ?? "No summary provided."}

Lesson key takeaways:
${(input.keyTakeaways ?? []).join("; ") || "No key takeaways provided."}

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
      error instanceof Error ? error.message : "Failed to generate quiz scene.",
    );
  }

  const validated = quizSceneResponseSchema.safeParse(parsed);
  if (!validated.success) {
    throw new AppError("INTERNAL_ERROR", "Model returned an invalid quiz scene.");
  }

  return {
    ...validated.data,
    questions: validated.data.questions.map((question) => ({
      ...question,
      id: randomUUID(),
    })),
  };
}
