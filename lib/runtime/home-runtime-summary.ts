import { formatTelemetryDuration } from "@/lib/server/lessons/job-progress";
import { getRuntimeComparisonSummary } from "@/lib/runtime/runtime-comparison";
import type { RuntimeComparisonItem, RuntimeUsageDashboard } from "@/types/job";
import type { ModelSettings } from "@/types/settings";

export type HomeRuntimeSummary = {
  headline: string;
  summary: string;
  currentSetupLabel: string;
  currentAverageLabel: string;
  bestSetupLabel?: string;
  bestAverageLabel?: string;
  isCurrentBest: boolean;
  actionHref: "/settings" | "/settings?applyRecommendedRuntimeSetup=1";
  actionLabel: string;
  actionMessage?: string;
};

export function getHomeRuntimeSummary(
  settings: Pick<ModelSettings, "provider" | "model">,
  dashboard: RuntimeUsageDashboard,
  comparisonItems: RuntimeComparisonItem[],
): HomeRuntimeSummary {
  const currentSetupLabel = `${settings.provider} | ${settings.model || "model not set"}`;
  const currentJobs = dashboard.recentJobs.filter(
    (job) =>
      job.runtimeProvider === settings.provider &&
      job.runtimeModel === settings.model &&
      typeof job.telemetry?.totalMs === "number",
  );
  const currentAverage =
    currentJobs.length > 0
      ? Math.round(
          currentJobs.reduce((sum, job) => sum + (job.telemetry?.totalMs ?? 0), 0) /
            currentJobs.length,
        )
      : undefined;

  const summary = getRuntimeComparisonSummary(comparisonItems);
  const best = summary.best;
  if (!best) {
    return {
      headline: "Runtime insight grows as you generate more lessons",
      summary:
        "We do not have enough completed local history yet to compare your current setup against a stronger recent option.",
      currentSetupLabel,
      currentAverageLabel: formatTelemetryDuration(currentAverage),
      isCurrentBest: false,
      actionHref: "/settings",
      actionLabel: "Open runtime insights",
    };
  }

  const isCurrentBest =
    best.runtimeProvider === settings.provider &&
    best.runtimeModel === settings.model;

  return {
    headline: isCurrentBest ? "Your current runtime setup is leading" : "A stronger recent runtime setup is available",
    summary: isCurrentBest
      ? `Recent completed jobs suggest ${currentSetupLabel} is currently your best-performing observed local setup.`
      : `${best.runtimeProvider} | ${best.runtimeModel} is currently outperforming your active setup based on recent completed jobs.`,
    currentSetupLabel,
    currentAverageLabel: formatTelemetryDuration(currentAverage),
    bestSetupLabel: `${best.runtimeProvider} | ${best.runtimeModel}`,
    bestAverageLabel: formatTelemetryDuration(best.averageTotalMs),
    isCurrentBest,
    actionHref: isCurrentBest
      ? "/settings"
      : "/settings?applyRecommendedRuntimeSetup=1",
    actionLabel: isCurrentBest
      ? "Open runtime insights"
      : "Review recommended runtime in Settings",
    actionMessage: isCurrentBest
      ? undefined
      : "We can preload the strongest recent observed provider/model into Settings so you can review it and save explicitly.",
  };
}
