import { describe, expect, it } from "vitest";
import {
  getGenerationModeDefinition,
  listGenerationModes,
  resolveGenerationRequestSettings,
} from "@/lib/server/lessons/generation-mode";

describe("generation-mode", () => {
  it("lists the supported generation modes", () => {
    expect(listGenerationModes().map((mode) => mode.id)).toEqual([
      "fast",
      "balanced",
      "detailed",
    ]);
  });

  it("adjusts request settings for fast mode", () => {
    const resolved = resolveGenerationRequestSettings("fast", {
      temperature: 0.4,
      maxTokens: 2000,
    });

    expect(resolved.temperature).toBe(0.3);
    expect(resolved.maxTokens).toBe(1500);
  });

  it("adjusts request settings for detailed mode", () => {
    const resolved = resolveGenerationRequestSettings("detailed", {
      temperature: 0.4,
      maxTokens: 2000,
    });

    expect(resolved.temperature).toBe(0.45);
    expect(resolved.maxTokens).toBe(2700);
    expect(getGenerationModeDefinition("detailed").description).toContain("Richer explanations");
  });
});
