import { describe, expect, it } from "vitest";
import { buildRuntimeDiagnostics } from "@/lib/server/settings/runtime-diagnostics";

describe("runtime-diagnostics", () => {
  it("suggests startup checks when the runtime is unreachable", () => {
    const diagnostics = buildRuntimeDiagnostics(
      {
        provider: "ollama",
        baseUrl: "http://127.0.0.1:11434",
        model: "llama3:latest",
        temperature: 0.4,
        maxTokens: 2000,
        timeoutMs: 120000,
      },
      {
        provider: "ollama",
        serverReachable: false,
        modelAvailable: false,
        message: "Could not reach the local Ollama runtime.",
        endpointPath: "/api/tags",
      },
    );

    expect(diagnostics.nextSteps[0]).toContain("Confirm the local Ollama runtime is running");
    expect(diagnostics.nextSteps[1]).toContain("/api/tags");
  });

  it("suggests detected models when the runtime is reachable but the selected model is missing", () => {
    const diagnostics = buildRuntimeDiagnostics(
      {
        provider: "openai_compatible",
        baseUrl: "http://127.0.0.1:8000/v1",
        model: "missing-model",
        temperature: 0.4,
        maxTokens: 2000,
        timeoutMs: 120000,
      },
      {
        provider: "openai_compatible",
        serverReachable: true,
        modelAvailable: false,
        message: "Connected successfully, but model was not found.",
        endpointPath: "/models",
        availableModelCount: 2,
        availableModelsPreview: ["google/gemma-3-4b-it", "Qwen/Qwen2.5-7B-Instruct"],
      },
    );

    expect(diagnostics.nextSteps[0]).toContain("Check the saved model name");
    expect(diagnostics.nextSteps[1]).toContain("google/gemma-3-4b-it");
  });
});
