import { describe, expect, it } from "vitest";
import { getHomeUnifiedRecommendationBadge } from "@/lib/runtime/home-unified-recommendation-badges";

describe("home-unified-recommendation-badges", () => {
  it("returns an aligned badge for agreement", () => {
    expect(getHomeUnifiedRecommendationBadge("agree")).toEqual({
      label: "Aligned",
      tone: "success",
    });
  });

  it("returns a disagreement badge for disagreement", () => {
    expect(getHomeUnifiedRecommendationBadge("disagree")).toEqual({
      label: "Disagreement",
      tone: "warning",
    });
  });

  it("returns a data-light badge when recommendation data is sparse", () => {
    expect(getHomeUnifiedRecommendationBadge("insufficient_data")).toEqual({
      label: "Data-light",
      tone: "muted",
    });
  });
});
