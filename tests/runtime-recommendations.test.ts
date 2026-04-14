import { describe, expect, it } from "vitest";
import { getHardwareAwareRuntimeRecommendation, getRuntimeRecommendation } from "@/lib/runtime/runtime-recommendations";

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

  it("adds a caution when the workload is heavy for entry hardware", () => {
    const recommendation = getHardwareAwareRuntimeRecommendation("detailed", "guided_project", {
      cpuCores: 4,
      totalMemoryGb: 8,
      platform: "win32",
      tier: "entry",
      likelyGpuAvailable: false,
      gpuNames: [],
    });

    expect(recommendation.fit).toBe("strained");
    expect(recommendation.caution).toContain("may feel slow");
    expect(recommendation.accelerationHint).toContain("CPU-heavy");
  });

  it("softens a strained recommendation when likely GPU acceleration is available", () => {
    const recommendation = getHardwareAwareRuntimeRecommendation("detailed", "guided_project", {
      cpuCores: 4,
      totalMemoryGb: 8,
      platform: "win32",
      tier: "entry",
      likelyGpuAvailable: true,
      gpuNames: ["NVIDIA GeForce RTX 4070"],
    });

    expect(recommendation.fit).toBe("watch");
    expect(recommendation.accelerationHint).toContain("RTX 4070");
  });
});
