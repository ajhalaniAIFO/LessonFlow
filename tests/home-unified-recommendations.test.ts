import { describe, expect, it } from "vitest";
import { getHomeUnifiedRecommendation } from "@/lib/runtime/home-unified-recommendations";
import type { HomeRuntimeSummary } from "@/lib/runtime/home-runtime-summary";
import type { HomeSyntheticBenchmarkSummary } from "@/lib/runtime/home-synthetic-benchmark-summary";

function createRuntimeSummary(
  overrides: Partial<HomeRuntimeSummary> = {},
): HomeRuntimeSummary {
  return {
    headline: "Runtime summary",
    summary: "runtime summary",
    currentSetupLabel: "ollama | llama3:latest",
    currentAverageLabel: "10s",
    isCurrentBest: true,
    actionHref: "/settings",
    actionLabel: "Open runtime insights",
    ...overrides,
  };
}

function createSyntheticSummary(
  overrides: Partial<HomeSyntheticBenchmarkSummary> = {},
): HomeSyntheticBenchmarkSummary {
  return {
    headline: "Synthetic summary",
    summary: "synthetic summary",
    currentSetupLabel: "ollama | llama3:latest",
    isCurrentBest: true,
    actionHref: "/settings",
    actionLabel: "Open benchmark details",
    ...overrides,
  };
}

describe("home-unified-recommendations", () => {
  it("returns a placeholder when neither recommendation source has a leader", () => {
    const recommendation = getHomeUnifiedRecommendation(
      createRuntimeSummary(),
      createSyntheticSummary(),
    );

    expect(recommendation.agreementLabel).toBe("insufficient_data");
    expect(recommendation.actionHref).toBe("/settings");
  });

  it("recognizes when observed and synthetic leaders agree", () => {
    const recommendation = getHomeUnifiedRecommendation(
      createRuntimeSummary({
        isCurrentBest: false,
        bestSetupLabel: "openai_compatible | gemma4",
        actionHref: "/settings?applyRecommendedRuntimeSetup=1",
      }),
      createSyntheticSummary({
        isCurrentBest: false,
        benchmarkWinnerLabel: "openai_compatible | gemma4",
        actionHref: "/settings?applySyntheticBenchmarkWinner=1",
      }),
    );

    expect(recommendation.agreementLabel).toBe("agree");
    expect(recommendation.observedSetupLabel).toBe("openai_compatible | gemma4");
    expect(recommendation.syntheticSetupLabel).toBe("openai_compatible | gemma4");
    expect(recommendation.actionLabel).toContain("shared");
  });

  it("prefers observed lesson history when the two recommendation sources disagree", () => {
    const recommendation = getHomeUnifiedRecommendation(
      createRuntimeSummary({
        isCurrentBest: false,
        bestSetupLabel: "openai_compatible | gemma4",
        actionHref: "/settings?applyRecommendedRuntimeSetup=1",
      }),
      createSyntheticSummary({
        isCurrentBest: false,
        benchmarkWinnerLabel: "ollama | qwen2.5:7b-instruct",
        actionHref: "/settings?applySyntheticBenchmarkWinner=1",
      }),
    );

    expect(recommendation.agreementLabel).toBe("disagree");
    expect(recommendation.actionHref).toBe("/settings?applyRecommendedRuntimeSetup=1");
    expect(recommendation.summary).toContain("real lesson history");
  });
});
