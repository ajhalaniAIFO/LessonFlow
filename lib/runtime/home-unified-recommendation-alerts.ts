import type { RuntimeAlert } from "@/lib/runtime/runtime-alerts";
import type { HomeUnifiedRecommendation } from "@/lib/runtime/home-unified-recommendations";

export function getHomeUnifiedRecommendationAlerts(
  recommendation: HomeUnifiedRecommendation,
): RuntimeAlert[] {
  if (recommendation.agreementLabel === "insufficient_data") {
    return [];
  }

  if (recommendation.agreementLabel === "disagree") {
    return [
      {
        level: "warning",
        headline: "Recommendation signals disagree",
        message:
          "Observed lesson history and synthetic benchmarks are pointing at different setups, so choose based on whether you care more about real lesson generation or controlled probe speed.",
      },
    ];
  }

  if (
    recommendation.observedSetupLabel &&
    recommendation.syntheticSetupLabel &&
    recommendation.observedSetupLabel === recommendation.syntheticSetupLabel &&
    recommendation.currentSetupLabel !== recommendation.observedSetupLabel
  ) {
    return [
      {
        level: "warning",
        headline: "Both recommendation systems agree on a stronger setup",
        message: `${recommendation.observedSetupLabel} is currently the clearest shared recommendation from both observed lesson history and synthetic benchmarks.`,
      },
    ];
  }

  return [
    {
      level: "info",
      headline: "Recommendation signals are aligned with the current setup",
      message:
        "The strongest recommendation signals we have on Home do not currently point away from your active provider/model.",
    },
  ];
}
