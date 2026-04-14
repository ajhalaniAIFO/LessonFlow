import { describe, expect, it } from "vitest";
import {
  getRuntimeGuidance,
  listRuntimeGuidance,
} from "@/lib/server/settings/runtime-guidance";

describe("runtime-guidance", () => {
  it("returns Ollama guidance with the expected endpoint defaults", () => {
    const guidance = getRuntimeGuidance("ollama");

    expect(guidance.defaultUrl).toBe("http://127.0.0.1:11434");
    expect(guidance.endpointShape).toContain("Ollama");
    expect(guidance.compatibilityHints[0]).toContain("/api/tags");
  });

  it("returns OpenAI-compatible guidance with /v1 style defaults", () => {
    const guidance = getRuntimeGuidance("openai_compatible");

    expect(guidance.defaultUrl).toBe("http://127.0.0.1:8000/v1");
    expect(guidance.exampleModel).toContain("gemma");
    expect(guidance.compatibilityHints[0]).toContain("/models");
  });

  it("lists all supported runtime guidance entries", () => {
    const guidance = listRuntimeGuidance();

    expect(guidance.map((entry) => entry.provider)).toEqual([
      "ollama",
      "openai_compatible",
    ]);
  });
});
