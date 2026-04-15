import type { RuntimeTrend } from "@/lib/runtime/runtime-trends";
import type { ModelSettings, SyntheticBenchmarkComparisonItem } from "@/types/settings";

export type HomeSyntheticBenchmarkSummary = {
  headline: string;
  summary: string;
  currentSetupLabel: string;
  benchmarkWinnerLabel?: string;
  isCurrentBest: boolean;
  trendHeadline?: string;
  trendSummary?: string;
};

export function getHomeSyntheticBenchmarkSummary(
  settings: Pick<ModelSettings, "provider" | "model">,
  comparisonItems: SyntheticBenchmarkComparisonItem[],
  trend?: RuntimeTrend,
): HomeSyntheticBenchmarkSummary {
  const currentSetupLabel = `${settings.provider} | ${settings.model || "model not set"}`;
  const best = comparisonItems[0];

  if (!best) {
    return {
      headline: "Synthetic benchmark insight grows as you run more probes",
      summary:
        "We do not have enough controlled benchmark history yet to compare your current setup against a benchmark winner.",
      currentSetupLabel,
      isCurrentBest: false,
      trendHeadline: trend?.headline,
      trendSummary: trend?.summary,
    };
  }

  const isCurrentBest = best.provider === settings.provider && best.model === settings.model;

  return {
    headline: isCurrentBest
      ? "Your current setup is leading in synthetic benchmarks"
      : "A synthetic benchmark winner is available",
    summary: isCurrentBest
      ? `Controlled smoke-prompt runs suggest ${currentSetupLabel} is still your fastest benchmarked local setup.`
      : `${best.provider} | ${best.model} is currently the fastest controlled benchmarked option compared with your active setup.`,
    currentSetupLabel,
    benchmarkWinnerLabel: `${best.provider} | ${best.model}`,
    isCurrentBest,
    trendHeadline: trend?.headline,
    trendSummary: trend?.summary,
  };
}
