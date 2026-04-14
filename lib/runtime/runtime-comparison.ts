import { formatTelemetryDuration } from "@/lib/server/lessons/job-progress";
import type { RuntimeComparisonItem } from "@/types/job";
import type { ModelSettings } from "@/types/settings";

export type RuntimeComparisonSummary = {
  headline: string;
  summary: string;
  best?: RuntimeComparisonItem;
};

export type RecommendedRuntimeSetup = {
  provider: ModelSettings["provider"];
  model: string;
};

export function getRuntimeComparisonSummary(items: RuntimeComparisonItem[]): RuntimeComparisonSummary {
  if (items.length === 0) {
    return {
      headline: "Comparison will appear after more local history",
      summary:
        "We need completed lessons from at least one saved runtime/model pairing before we can recommend the strongest observed setup.",
    };
  }

  const best = items[0];
  return {
    headline: "Best recent local setup",
    summary: `${best.runtimeProvider} with ${best.runtimeModel} is currently leading based on ${best.completedJobs} completed job${best.completedJobs === 1 ? "" : "s"} and an average of ${formatTelemetryDuration(best.averageTotalMs)}.`,
    best,
  };
}

export function getRecommendedRuntimeSetup(items: RuntimeComparisonItem[]): RecommendedRuntimeSetup | null {
  if (items.length === 0) {
    return null;
  }

  const best = items[0];
  return {
    provider: best.runtimeProvider,
    model: best.runtimeModel,
  };
}
