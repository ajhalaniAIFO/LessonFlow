import type { HomeUnifiedRecommendation } from "@/lib/runtime/home-unified-recommendations";

export type HomeUnifiedRecommendationBadge = {
  label: string;
  tone: "success" | "warning" | "muted";
};

export function getHomeUnifiedRecommendationBadge(
  agreementLabel: HomeUnifiedRecommendation["agreementLabel"],
): HomeUnifiedRecommendationBadge {
  if (agreementLabel === "agree") {
    return {
      label: "Aligned",
      tone: "success",
    };
  }

  if (agreementLabel === "disagree") {
    return {
      label: "Disagreement",
      tone: "warning",
    };
  }

  return {
    label: "Data-light",
    tone: "muted",
  };
}
