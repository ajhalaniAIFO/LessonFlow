import type { HomeUnifiedRecommendationHistoryEntry } from "@/lib/runtime/home-unified-recommendation-history";

export type HomeUnifiedRecommendationChartPoint = {
  id: string;
  x: number;
  y: number;
  agreementLabel: HomeUnifiedRecommendationHistoryEntry["agreementLabel"];
  timestamp: number;
};

export type HomeUnifiedRecommendationChart = {
  label: "ready" | "empty";
  headline: string;
  summary: string;
  points: HomeUnifiedRecommendationChartPoint[];
  lowLabel?: string;
  highLabel?: string;
};

const CHART_WIDTH = 100;
const CHART_HEIGHT = 28;

function agreementScore(entry: HomeUnifiedRecommendationHistoryEntry) {
  if (entry.agreementLabel === "agree") {
    return 2;
  }

  if (entry.agreementLabel === "disagree") {
    return 0;
  }

  return 1;
}

export function getHomeUnifiedRecommendationChart(
  entries: HomeUnifiedRecommendationHistoryEntry[],
): HomeUnifiedRecommendationChart {
  const orderedEntries = [...entries].reverse();

  if (orderedEntries.length === 0) {
    return {
      label: "empty",
      headline: "Unified recommendation chart will appear after more local activity",
      summary:
        "As the coordinated recommendation shifts over time, we will chart those changes here so the pattern is easier to scan.",
      points: [],
    };
  }

  const xStep = orderedEntries.length === 1 ? 0 : CHART_WIDTH / (orderedEntries.length - 1);

  return {
    label: "ready",
    headline: "Unified recommendation chart",
    summary:
      "Recent unified recommendation states, shown oldest to newest, with higher points meaning stronger alignment and lower points meaning disagreement.",
    lowLabel: "disagreement",
    highLabel: "alignment",
    points: orderedEntries.map((entry, index) => {
      const score = agreementScore(entry);
      return {
        id: entry.id,
        agreementLabel: entry.agreementLabel,
        timestamp: entry.timestamp,
        x: orderedEntries.length === 1 ? CHART_WIDTH / 2 : index * xStep,
        y: CHART_HEIGHT - score * 12,
      };
    }),
  };
}
