import type { HomeRuntimeSummary } from "@/lib/runtime/home-runtime-summary";
import type { HomeSyntheticBenchmarkSummary } from "@/lib/runtime/home-synthetic-benchmark-summary";

export type HomeUnifiedRecommendation = {
  headline: string;
  summary: string;
  observedSetupLabel?: string;
  syntheticSetupLabel?: string;
  currentSetupLabel: string;
  agreementLabel: "agree" | "disagree" | "insufficient_data";
  actionHref: "/settings" | "/settings?applyRecommendedRuntimeSetup=1" | "/settings?applySyntheticBenchmarkWinner=1";
  actionLabel: string;
  actionMessage?: string;
};

export function getHomeUnifiedRecommendation(
  runtimeSummary: HomeRuntimeSummary,
  syntheticSummary: HomeSyntheticBenchmarkSummary,
): HomeUnifiedRecommendation {
  const observedSetupLabel = runtimeSummary.bestSetupLabel;
  const syntheticSetupLabel = syntheticSummary.benchmarkWinnerLabel;
  const currentSetupLabel = runtimeSummary.currentSetupLabel;

  if (!observedSetupLabel && !syntheticSetupLabel) {
    return {
      headline: "Recommendation confidence grows as LessonFlow sees more local history",
      summary:
        "We do not have enough observed runtime history or synthetic benchmark history yet to recommend a stronger setup from Home.",
      currentSetupLabel,
      agreementLabel: "insufficient_data",
      actionHref: "/settings",
      actionLabel: "Open runtime insights",
    };
  }

  if (observedSetupLabel && syntheticSetupLabel && observedSetupLabel === syntheticSetupLabel) {
    const currentMatchesLeader =
      runtimeSummary.isCurrentBest && syntheticSummary.isCurrentBest;

    return {
      headline: currentMatchesLeader
        ? "Observed history and synthetic benchmarks agree with your current setup"
        : "Observed history and synthetic benchmarks agree on the same stronger setup",
      summary: currentMatchesLeader
        ? `${currentSetupLabel} is leading in both recent lesson performance and controlled benchmark runs.`
        : `${observedSetupLabel} is the clearest shared recommendation because it leads in both recent lesson performance and controlled benchmark runs.`,
      observedSetupLabel,
      syntheticSetupLabel,
      currentSetupLabel,
      agreementLabel: "agree",
      actionHref: currentMatchesLeader
        ? "/settings"
        : syntheticSummary.actionHref,
      actionLabel: currentMatchesLeader
        ? "Open runtime insights"
        : "Review shared recommendation in Settings",
      actionMessage: currentMatchesLeader
        ? undefined
        : "Both recommendation systems are pointing at the same provider/model, so this is the strongest next setup to review.",
    };
  }

  if (observedSetupLabel && !runtimeSummary.isCurrentBest) {
    return {
      headline: syntheticSetupLabel
        ? "Observed lesson history and synthetic benchmarks disagree"
        : "Observed lesson history is the strongest available recommendation",
      summary: syntheticSetupLabel
        ? `${observedSetupLabel} is leading on real lesson history, while ${syntheticSetupLabel} is leading on controlled benchmark probes.`
        : `${observedSetupLabel} is currently the strongest recommendation we can make from recent lesson history.`,
      observedSetupLabel,
      syntheticSetupLabel,
      currentSetupLabel,
      agreementLabel: syntheticSetupLabel ? "disagree" : "insufficient_data",
      actionHref: runtimeSummary.actionHref,
      actionLabel: syntheticSetupLabel
        ? "Review lesson-history leader in Settings"
        : runtimeSummary.actionLabel,
      actionMessage: syntheticSetupLabel
        ? "If you care more about real lesson generation performance, start with the observed-history recommendation first."
        : runtimeSummary.actionMessage,
    };
  }

  if (syntheticSetupLabel && !syntheticSummary.isCurrentBest) {
    return {
      headline: "Synthetic benchmarks are the strongest available recommendation",
      summary: `${syntheticSetupLabel} is currently the clearest recommendation from controlled benchmark probes for your local machine.`,
      observedSetupLabel,
      syntheticSetupLabel,
      currentSetupLabel,
      agreementLabel: observedSetupLabel ? "disagree" : "insufficient_data",
      actionHref: syntheticSummary.actionHref,
      actionLabel: syntheticSummary.actionLabel,
      actionMessage: observedSetupLabel
        ? "Synthetic benchmark guidance disagrees with observed lesson history here, so this path is best when you want the fastest controlled runtime response."
        : syntheticSummary.actionMessage,
    };
  }

  return {
    headline: "Your current setup still looks like the strongest overall choice",
    summary:
      "The recommendation signals we have from Home do not point to a stronger setup right now, so your current provider/model still looks like the best place to stay.",
    observedSetupLabel,
    syntheticSetupLabel,
    currentSetupLabel,
    agreementLabel: "agree",
    actionHref: "/settings",
    actionLabel: "Open runtime insights",
  };
}
