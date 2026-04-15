import { formatTelemetryDuration } from "@/lib/server/lessons/job-progress";
import type {
  RecommendedSyntheticBenchmarkSetup,
  SyntheticBenchmarkComparisonItem,
} from "@/types/settings";

export type SyntheticBenchmarkComparisonSummary = {
  headline: string;
  summary: string;
  best?: SyntheticBenchmarkComparisonItem;
};

export function getSyntheticBenchmarkComparisonSummary(
  items: SyntheticBenchmarkComparisonItem[],
): SyntheticBenchmarkComparisonSummary {
  if (items.length === 0) {
    return {
      headline: "Synthetic comparison will appear after more benchmark runs",
      summary:
        "Run controlled benchmarks against more than one provider/model pair and we will highlight the fastest benchmarked setup here.",
    };
  }

  const best = items[0];
  return {
    headline: "Best synthetic benchmarked setup",
    summary: `${best.provider} with ${best.model} is leading on controlled smoke-prompt runs with an average of ${formatTelemetryDuration(best.averageDurationMs)} across ${best.successfulRuns} successful probe${best.successfulRuns === 1 ? "" : "s"}.`,
    best,
  };
}

export function getRecommendedSyntheticBenchmarkSetup(
  items: SyntheticBenchmarkComparisonItem[],
): RecommendedSyntheticBenchmarkSetup | null {
  if (items.length === 0) {
    return null;
  }

  const best = items[0];
  return {
    provider: best.provider,
    model: best.model,
  };
}
