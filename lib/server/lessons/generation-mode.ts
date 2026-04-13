import type { GenerationMode } from "@/types/lesson";

type GenerationModeDefinition = {
  id: GenerationMode;
  label: string;
  description: string;
  temperatureOffset: number;
  maxTokensMultiplier: number;
  outlineGuidance: string;
  sceneGuidance: string;
  quizGuidance: string;
};

const generationModes: Record<GenerationMode, GenerationModeDefinition> = {
  fast: {
    id: "fast",
    label: "Fast",
    description: "Quicker generation with tighter scope and lighter detail.",
    temperatureOffset: -0.1,
    maxTokensMultiplier: 0.75,
    outlineGuidance:
      "Favor a lean teaching path with 3 to 4 outline items and keep titles tightly scoped.",
    sceneGuidance:
      "Keep explanations concise and practical. Prefer 2 sections unless extra depth is necessary.",
    quizGuidance:
      "Keep the quiz short and focused. Prefer 1 or 2 questions that check core understanding.",
  },
  balanced: {
    id: "balanced",
    label: "Balanced",
    description: "A steady tradeoff between speed, structure, and depth.",
    temperatureOffset: 0,
    maxTokensMultiplier: 1,
    outlineGuidance:
      "Use a well-paced lesson structure with practical progression and one quiz near the end.",
    sceneGuidance:
      "Balance clarity and depth. Use enough detail to teach the idea well without overloading the learner.",
    quizGuidance:
      "Use a short quiz that reinforces understanding of the most important content.",
  },
  detailed: {
    id: "detailed",
    label: "Detailed",
    description: "Richer explanations and fuller lesson structure, with more time to generate.",
    temperatureOffset: 0.05,
    maxTokensMultiplier: 1.35,
    outlineGuidance:
      "Favor a fuller teaching sequence with 5 to 6 outline items when the topic benefits from extra scaffolding.",
    sceneGuidance:
      "Go deeper with examples, clearer transitions, and fuller explanations. Use 3 to 4 sections when useful.",
    quizGuidance:
      "Use 2 or 3 questions when the lesson content supports it, and make the explanations more instructive.",
  },
};

export function listGenerationModes() {
  return Object.values(generationModes);
}

export function getGenerationModeDefinition(mode: GenerationMode) {
  return generationModes[mode];
}

export function resolveGenerationRequestSettings(
  mode: GenerationMode,
  settings: { temperature: number; maxTokens: number },
) {
  const definition = getGenerationModeDefinition(mode);
  const temperature = Math.max(0, Math.min(2, settings.temperature + definition.temperatureOffset));

  return {
    temperature: Math.round(temperature * 100) / 100,
    maxTokens: Math.max(256, Math.round(settings.maxTokens * definition.maxTokensMultiplier)),
  };
}
