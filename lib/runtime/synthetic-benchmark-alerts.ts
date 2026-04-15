import type { RuntimeAlert } from "@/lib/runtime/runtime-alerts";
import type { ModelSettings, SyntheticBenchmarkComparisonItem } from "@/types/settings";

export function getSyntheticBenchmarkAlerts(
  settings: Pick<ModelSettings, "provider" | "model">,
  comparisonItems: SyntheticBenchmarkComparisonItem[],
): RuntimeAlert[] {
  const alerts: RuntimeAlert[] = [];
  const best = comparisonItems[0];
  const current = comparisonItems.find(
    (item) => item.provider === settings.provider && item.model === settings.model,
  );

  if (
    best &&
    current &&
    (best.provider !== settings.provider || best.model !== settings.model) &&
    current.averageDurationMs - best.averageDurationMs >= 1_500
  ) {
    alerts.push({
      level: "warning",
      headline: "A faster benchmark winner is available",
      message: `${best.provider} | ${best.model} is at least 1.5 seconds faster on average than the current setup in controlled benchmark runs.`,
    });
  }

  if (
    alerts.length === 0 &&
    best &&
    best.provider === settings.provider &&
    best.model === settings.model
  ) {
    alerts.push({
      level: "info",
      headline: "Current setup is leading in synthetic benchmarks",
      message:
        "Your active provider/model pair is still the fastest controlled benchmarked option so far.",
    });
  }

  return alerts;
}
