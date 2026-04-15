import { describe, expect, it } from "vitest";
import { getHomeUnifiedRecommendationChart } from "@/lib/runtime/home-unified-recommendation-chart";
import type { HomeUnifiedRecommendationHistoryEntry } from "@/lib/runtime/home-unified-recommendation-history";

describe("home-unified-recommendation-chart", () => {
  it("returns an empty placeholder when there is no unified recommendation history", () => {
    const chart = getHomeUnifiedRecommendationChart([]);

    expect(chart.label).toBe("empty");
    expect(chart.points).toEqual([]);
  });

  it("creates oldest-to-newest chart points from history entries", () => {
    const chart = getHomeUnifiedRecommendationChart([
      {
        id: "newest",
        timestamp: 30,
        headline: "Aligned",
        summary: "aligned",
        agreementLabel: "agree",
      },
      {
        id: "oldest",
        timestamp: 10,
        headline: "Disagree",
        summary: "disagree",
        agreementLabel: "disagree",
      },
      {
        id: "middle",
        timestamp: 20,
        headline: "Sparse",
        summary: "sparse",
        agreementLabel: "insufficient_data",
      },
    ] satisfies HomeUnifiedRecommendationHistoryEntry[]);

    expect(chart.label).toBe("ready");
    expect(chart.points).toHaveLength(3);
    expect(chart.points[0].id).toBe("middle");
    expect(chart.points[1].id).toBe("oldest");
    expect(chart.points[2].id).toBe("newest");
  });

  it("places agreement higher than insufficient data and disagreement", () => {
    const chart = getHomeUnifiedRecommendationChart([
      {
        id: "agree",
        timestamp: 30,
        headline: "Agree",
        summary: "agree",
        agreementLabel: "agree",
      },
      {
        id: "insufficient",
        timestamp: 20,
        headline: "Sparse",
        summary: "sparse",
        agreementLabel: "insufficient_data",
      },
      {
        id: "disagree",
        timestamp: 10,
        headline: "Disagree",
        summary: "disagree",
        agreementLabel: "disagree",
      },
    ] satisfies HomeUnifiedRecommendationHistoryEntry[]);

    const byId = Object.fromEntries(chart.points.map((point) => [point.id, point]));
    expect(byId.agree.y).toBeLessThan(byId.insufficient.y);
    expect(byId.insufficient.y).toBeLessThan(byId.disagree.y);
  });
});
