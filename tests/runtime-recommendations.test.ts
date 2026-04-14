import { describe, expect, it } from "vitest";
import { getRuntimeRecommendation } from "@/lib/runtime/runtime-recommendations";

describe("runtime-recommendations", () => {
  it("returns a light recommendation for fast standard lessons", () => {
    const recommendation = getRuntimeRecommendation("fast", "standard");

    expect(recommendation.workloadClass).toBe("light");
    expect(recommendation.providerTips.ollama.exampleModels[0]).toContain("3b");
  });

  it("returns a medium recommendation for balanced workshop lessons", () => {
    const recommendation = getRuntimeRecommendation("balanced", "workshop");

    expect(recommendation.workloadClass).toBe("medium");
    expect(recommendation.providerTips.openai_compatible.recommendedUrl).toContain("/v1");
  });

  it("returns a heavy recommendation for detailed guided projects", () => {
    const recommendation = getRuntimeRecommendation("detailed", "guided_project");

    expect(recommendation.workloadClass).toBe("heavy");
    expect(recommendation.headline).toContain("Heavier");
    expect(recommendation.providerTips.ollama.hint).toContain("GPU");
  });
});
