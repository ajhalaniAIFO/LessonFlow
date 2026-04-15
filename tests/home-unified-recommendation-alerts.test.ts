import { describe, expect, it } from "vitest";
import { getHomeUnifiedRecommendationAlerts } from "@/lib/runtime/home-unified-recommendation-alerts";
import type { HomeUnifiedRecommendation } from "@/lib/runtime/home-unified-recommendations";

function createRecommendation(
  overrides: Partial<HomeUnifiedRecommendation> = {},
): HomeUnifiedRecommendation {
  return {
    headline: "Recommendation",
    summary: "summary",
    currentSetupLabel: "ollama | llama3:latest",
    agreementLabel: "agree",
    actionHref: "/settings",
    actionLabel: "Open runtime insights",
    ...overrides,
  };
}

describe("home-unified-recommendation-alerts", () => {
  it("stays quiet when unified recommendation data is still sparse", () => {
    const alerts = getHomeUnifiedRecommendationAlerts(
      createRecommendation({ agreementLabel: "insufficient_data" }),
    );

    expect(alerts).toEqual([]);
  });

  it("warns when observed and synthetic recommendation signals disagree", () => {
    const alerts = getHomeUnifiedRecommendationAlerts(
      createRecommendation({
        agreementLabel: "disagree",
        observedSetupLabel: "openai_compatible | gemma4",
        syntheticSetupLabel: "ollama | qwen2.5:7b-instruct",
      }),
    );

    expect(alerts).toHaveLength(1);
    expect(alerts[0].level).toBe("warning");
    expect(alerts[0].headline).toContain("disagree");
  });

  it("warns when both recommendation systems agree on a stronger setup", () => {
    const alerts = getHomeUnifiedRecommendationAlerts(
      createRecommendation({
        agreementLabel: "agree",
        currentSetupLabel: "ollama | llama3:latest",
        observedSetupLabel: "openai_compatible | gemma4",
        syntheticSetupLabel: "openai_compatible | gemma4",
      }),
    );

    expect(alerts).toHaveLength(1);
    expect(alerts[0].level).toBe("warning");
    expect(alerts[0].headline).toContain("stronger setup");
  });

  it("shows a healthy info state when the current setup still matches aligned signals", () => {
    const alerts = getHomeUnifiedRecommendationAlerts(
      createRecommendation({
        agreementLabel: "agree",
        currentSetupLabel: "ollama | llama3:latest",
      }),
    );

    expect(alerts).toHaveLength(1);
    expect(alerts[0].level).toBe("info");
  });
});
