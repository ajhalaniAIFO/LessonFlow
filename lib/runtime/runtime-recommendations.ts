import type { GenerationMode, LessonFormat } from "@/types/lesson";
import type { ModelProvider } from "@/types/settings";

type WorkloadClass = "light" | "medium" | "heavy";

export type RuntimeRecommendation = {
  workloadClass: WorkloadClass;
  headline: string;
  summary: string;
  why: string[];
  providerTips: Record<
    ModelProvider,
    {
      recommendedUrl: string;
      exampleModels: string[];
      hint: string;
    }
  >;
};

function resolveWorkloadClass(
  generationMode: GenerationMode,
  lessonFormat: LessonFormat,
): WorkloadClass {
  if (generationMode === "detailed" || lessonFormat === "guided_project") {
    return "heavy";
  }

  if (generationMode === "fast" && lessonFormat === "standard") {
    return "light";
  }

  return "medium";
}

const recommendations: Record<WorkloadClass, RuntimeRecommendation> = {
  light: {
    workloadClass: "light",
    headline: "Lighter local setup is a good fit",
    summary:
      "Fast generation with a standard lesson format usually works well with smaller instruct models and the simplest local runtime setup.",
    why: [
      "Fast mode keeps token budgets tighter.",
      "Standard lessons usually need less branching than workshops or projects.",
      "A smaller local model can still deliver a responsive outline-first flow here.",
    ],
    providerTips: {
      ollama: {
        recommendedUrl: "http://127.0.0.1:11434",
        exampleModels: ["qwen2.5:3b-instruct", "llama3.2:3b"],
        hint: "If your machine feels slow, start with a smaller Ollama instruct model first.",
      },
      openai_compatible: {
        recommendedUrl: "http://127.0.0.1:8000/v1",
        exampleModels: ["google/gemma-3-4b-it", "Qwen/Qwen2.5-3B-Instruct"],
        hint: "A lighter OpenAI-compatible model is usually enough for fast mode and keeps iteration quick.",
      },
    },
  },
  medium: {
    workloadClass: "medium",
    headline: "Balanced local setup recommended",
    summary:
      "Balanced generation or workshop-style lessons benefit from a mid-range instruct model that can keep structure stable without becoming too slow.",
    why: [
      "Balanced mode asks for more structure than fast mode.",
      "Workshop lessons add more applied framing and checkpoints.",
      "Mid-range models usually hold JSON structure and tutoring tone more reliably here.",
    ],
    providerTips: {
      ollama: {
        recommendedUrl: "http://127.0.0.1:11434",
        exampleModels: ["qwen2.5:7b-instruct", "llama3:latest"],
        hint: "A 7B-class Ollama model is a good default if you want decent quality without leaning too hard on slower generation.",
      },
      openai_compatible: {
        recommendedUrl: "http://127.0.0.1:8000/v1",
        exampleModels: [
          "google/gemma-3-4b-it",
          "meta-llama/Llama-3.1-8B-Instruct",
        ],
        hint: "A mid-range OpenAI-compatible runtime setup is a strong default for balanced quality and stable lesson structure.",
      },
    },
  },
  heavy: {
    workloadClass: "heavy",
    headline: "Heavier local setup will help",
    summary:
      "Detailed mode or guided-project lessons ask more from the runtime, so a stronger local setup and a more capable instruct model will usually pay off.",
    why: [
      "Detailed mode pushes for deeper scenes, more structure, and richer quizzes.",
      "Guided projects ask the model to maintain a longer, more coherent arc.",
      "Larger models are more likely to preserve format, pacing, and instructional consistency here.",
    ],
    providerTips: {
      ollama: {
        recommendedUrl: "http://127.0.0.1:11434",
        exampleModels: ["qwen2.5:14b-instruct", "llama3.1:8b"],
        hint: "If you stay on Ollama for detailed or project-heavy lessons, a stronger local GPU setup will usually make the experience much smoother.",
      },
      openai_compatible: {
        recommendedUrl: "http://127.0.0.1:8000/v1",
        exampleModels: [
          "meta-llama/Llama-3.1-8B-Instruct",
          "Qwen/Qwen2.5-14B-Instruct",
        ],
        hint: "OpenAI-compatible runtimes are often a good fit when you want more control over larger local serving setups.",
      },
    },
  },
};

export function getRuntimeRecommendation(
  generationMode: GenerationMode,
  lessonFormat: LessonFormat,
) {
  return recommendations[resolveWorkloadClass(generationMode, lessonFormat)];
}
