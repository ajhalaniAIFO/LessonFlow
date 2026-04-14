import { getHardwareProfile } from "@/lib/runtime/hardware-profile";
import { getHardwareAwareRuntimeRecommendation } from "@/lib/runtime/runtime-recommendations";
import type { HealthStatus } from "@/lib/server/llm/types";
import type { GenerationMode, LessonFormat } from "@/types/lesson";
import type { ModelSettings } from "@/types/settings";

export type RuntimeDiagnostics = {
  health: HealthStatus;
  hardwareSummary: string;
  accelerationHint: string;
  workloadFit: "comfortable" | "watch" | "strained";
  nextSteps: string[];
};

export function buildRuntimeDiagnostics(
  settings: ModelSettings,
  health: HealthStatus,
  options?: {
    generationMode?: GenerationMode;
    lessonFormat?: LessonFormat;
  },
): RuntimeDiagnostics {
  const hardwareProfile = getHardwareProfile();
  const recommendation = getHardwareAwareRuntimeRecommendation(
    options?.generationMode ?? "balanced",
    options?.lessonFormat ?? "standard",
    hardwareProfile,
  );

  const nextSteps: string[] = [];

  if (!health.serverReachable) {
    nextSteps.push(
      `Confirm the local ${settings.provider === "ollama" ? "Ollama" : "OpenAI-compatible"} runtime is running at ${settings.baseUrl}.`,
    );
    if (health.endpointPath) {
      nextSteps.push(`Make sure the runtime responds on ${health.endpointPath}.`);
    }
  } else if (!health.modelAvailable) {
    nextSteps.push("Check the saved model name and compare it with the models returned by the runtime.");
    if (health.availableModelsPreview?.length) {
      nextSteps.push(`Try one of the detected models: ${health.availableModelsPreview.join(", ")}.`);
    }
  } else {
    nextSteps.push("The runtime and selected model look reachable.");
    if (recommendation.caution) {
      nextSteps.push(recommendation.caution);
    }
  }

  if (health.availableModelCount === 0 && health.serverReachable) {
    nextSteps.push("The runtime responded, but did not report any installed models yet.");
  }

  return {
    health,
    hardwareSummary: recommendation.hardwareSummary,
    accelerationHint: recommendation.accelerationHint,
    workloadFit: recommendation.fit,
    nextSteps,
  };
}
