import { getHomeRuntimeSummary } from "@/lib/runtime/home-runtime-summary";
import { getHomeSyntheticBenchmarkSummary } from "@/lib/runtime/home-synthetic-benchmark-summary";
import {
  getHomeUnifiedRecommendation,
  type HomeUnifiedRecommendation,
} from "@/lib/runtime/home-unified-recommendations";
import type { RuntimeComparisonItem, RuntimeUsageJobInsight } from "@/types/job";
import type {
  ModelSettings,
  SyntheticBenchmarkComparisonItem,
  SyntheticBenchmarkRecord,
} from "@/types/settings";

export type HomeUnifiedRecommendationHistoryEntry = {
  id: string;
  timestamp: number;
  headline: string;
  summary: string;
  agreementLabel: HomeUnifiedRecommendation["agreementLabel"];
  observedSetupLabel?: string;
  syntheticSetupLabel?: string;
};

export type HomeUnifiedRecommendationHistory = {
  headline: string;
  summary: string;
  entries: HomeUnifiedRecommendationHistoryEntry[];
};

function getRuntimeComparisonItems(
  jobs: RuntimeUsageJobInsight[],
): RuntimeComparisonItem[] {
  const grouped = new Map<string, RuntimeUsageJobInsight[]>();

  for (const job of jobs) {
    if (!job.runtimeProvider || !job.runtimeModel || typeof job.telemetry?.totalMs !== "number") {
      continue;
    }

    const key = `${job.runtimeProvider}::${job.runtimeModel}`;
    const existing = grouped.get(key) ?? [];
    existing.push(job);
    grouped.set(key, existing);
  }

  return [...grouped.entries()]
    .map(([key, groupedJobs]) => {
      const [runtimeProvider, runtimeModel] = key.split("::") as [
        "ollama" | "openai_compatible",
        string,
      ];
      const totals = groupedJobs.map((job) => job.telemetry!.totalMs!);
      return {
        runtimeProvider,
        runtimeModel,
        completedJobs: groupedJobs.length,
        averageTotalMs: Math.round(totals.reduce((sum, total) => sum + total, 0) / totals.length),
        fastestTotalMs: Math.min(...totals),
        slowestTotalMs: Math.max(...totals),
      };
    })
    .sort((left, right) => {
      if ((left.averageTotalMs ?? Number.POSITIVE_INFINITY) !== (right.averageTotalMs ?? Number.POSITIVE_INFINITY)) {
        return (left.averageTotalMs ?? Number.POSITIVE_INFINITY) - (right.averageTotalMs ?? Number.POSITIVE_INFINITY);
      }

      return right.completedJobs - left.completedJobs;
    });
}

function getSyntheticComparisonItems(
  benchmarks: SyntheticBenchmarkRecord[],
): SyntheticBenchmarkComparisonItem[] {
  const grouped = new Map<string, SyntheticBenchmarkRecord[]>();

  for (const benchmark of benchmarks) {
    if (benchmark.status !== "success" || typeof benchmark.durationMs !== "number") {
      continue;
    }

    const key = `${benchmark.provider}::${benchmark.model}`;
    const existing = grouped.get(key) ?? [];
    existing.push(benchmark);
    grouped.set(key, existing);
  }

  return [...grouped.entries()]
    .map(([key, groupedBenchmarks]) => {
      const [provider, model] = key.split("::") as [SyntheticBenchmarkRecord["provider"], string];
      const durations = groupedBenchmarks.map((benchmark) => benchmark.durationMs as number);
      return {
        provider,
        model,
        successfulRuns: groupedBenchmarks.length,
        averageDurationMs: Math.round(
          durations.reduce((sum, duration) => sum + duration, 0) / durations.length,
        ),
        fastestDurationMs: Math.min(...durations),
        slowestDurationMs: Math.max(...durations),
        latestCreatedAt: Math.max(...groupedBenchmarks.map((benchmark) => benchmark.createdAt)),
      };
    })
    .sort((left, right) => {
      if (left.averageDurationMs !== right.averageDurationMs) {
        return left.averageDurationMs - right.averageDurationMs;
      }

      return right.successfulRuns - left.successfulRuns;
    });
}

function recommendationSignature(recommendation: HomeUnifiedRecommendation) {
  return [
    recommendation.agreementLabel,
    recommendation.observedSetupLabel ?? "",
    recommendation.syntheticSetupLabel ?? "",
    recommendation.actionHref,
  ].join("|");
}

export function getHomeUnifiedRecommendationHistory(
  settings: Pick<ModelSettings, "provider" | "model">,
  recentJobs: RuntimeUsageJobInsight[],
  benchmarks: SyntheticBenchmarkRecord[],
  limit = 5,
): HomeUnifiedRecommendationHistory {
  const timestamps = [...new Set([
    ...recentJobs.map((job) => job.updatedAt),
    ...benchmarks.map((benchmark) => benchmark.createdAt),
  ])].sort((left, right) => left - right);

  if (timestamps.length === 0) {
    return {
      headline: "Recommendation history will appear after more local activity",
      summary:
        "As LessonFlow sees more completed lessons and benchmark probes, we will show how the unified recommendation has been shifting over time.",
      entries: [],
    };
  }

  const snapshots: HomeUnifiedRecommendationHistoryEntry[] = [];
  let previousSignature = "";

  for (const timestamp of timestamps) {
    const jobsAtOrBeforeTimestamp = recentJobs.filter((job) => job.updatedAt <= timestamp);
    const benchmarksAtOrBeforeTimestamp = benchmarks.filter(
      (benchmark) => benchmark.createdAt <= timestamp,
    );

    const runtimeSummary = getHomeRuntimeSummary(
      settings,
      {
        recentJobs: jobsAtOrBeforeTimestamp,
        completedJobs: jobsAtOrBeforeTimestamp.length,
        totalLessonScenes: 0,
        totalQuizScenes: 0,
      },
      getRuntimeComparisonItems(jobsAtOrBeforeTimestamp),
    );
    const syntheticSummary = getHomeSyntheticBenchmarkSummary(
      settings,
      getSyntheticComparisonItems(benchmarksAtOrBeforeTimestamp),
    );
    const recommendation = getHomeUnifiedRecommendation(runtimeSummary, syntheticSummary);
    const signature = recommendationSignature(recommendation);

    if (signature === previousSignature) {
      continue;
    }

    previousSignature = signature;
    snapshots.push({
      id: `${timestamp}-${snapshots.length}`,
      timestamp,
      headline: recommendation.headline,
      summary: recommendation.summary,
      agreementLabel: recommendation.agreementLabel,
      observedSetupLabel: recommendation.observedSetupLabel,
      syntheticSetupLabel: recommendation.syntheticSetupLabel,
    });
  }

  const entries = snapshots.slice(-limit).reverse();

  return {
    headline: "Unified recommendation history",
    summary:
      "This timeline shows the most recent meaningful shifts in how observed lesson history and synthetic benchmarks combine into a single Home recommendation.",
    entries,
  };
}
