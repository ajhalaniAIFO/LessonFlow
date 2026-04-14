import type { RuntimeComparisonItem, RuntimeUsageDashboard } from "@/types/job";
import type { ModelSettings } from "@/types/settings";
import type { RuntimeTrend } from "@/lib/runtime/runtime-trends";

export type RuntimeAlert = {
  level: "info" | "warning";
  headline: string;
  message: string;
};

export function getRuntimeAlerts(
  settings: Pick<ModelSettings, "provider" | "model">,
  dashboard: RuntimeUsageDashboard,
  comparisonItems: RuntimeComparisonItem[],
  trend: RuntimeTrend,
): RuntimeAlert[] {
  const alerts: RuntimeAlert[] = [];
  const best = comparisonItems[0];
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

  if (
    best &&
    best.runtimeProvider !== settings.provider &&
    best.runtimeModel !== settings.model &&
    typeof best.averageTotalMs === "number" &&
    typeof currentAverage === "number" &&
    currentAverage - best.averageTotalMs >= 10_000
  ) {
    alerts.push({
      level: "warning",
      headline: "A faster recent setup is available",
      message: `${best.runtimeProvider} | ${best.runtimeModel} has been at least 10 seconds faster on average than your current setup.`,
    });
  }

  if (trend.label === "regressing") {
    alerts.push({
      level: "warning",
      headline: "Recent runs are slowing down",
      message:
        "This provider/model pair is trending slower than its older local runs, so it may be worth checking runtime load or trying a stronger recent setup.",
    });
  }

  if (alerts.length === 0 && best && best.runtimeProvider === settings.provider && best.runtimeModel === settings.model) {
    alerts.push({
      level: "info",
      headline: "Current setup still looks healthy",
      message:
        "Your active provider/model pair is still the strongest recent local option based on completed lessons.",
    });
  }

  return alerts;
}
