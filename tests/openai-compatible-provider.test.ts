import { afterEach, describe, expect, it, vi } from "vitest";
import { OpenAICompatibleProvider } from "@/lib/server/llm/openai-compatible-provider";

describe("OpenAICompatibleProvider", () => {
  const provider = new OpenAICompatibleProvider();

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reports a successful health check when the model exists", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [{ id: "google/gemma-3-4b-it" }],
        }),
      }),
    );

    const result = await provider.healthCheck(
      "http://127.0.0.1:8000/v1/",
      "google/gemma-3-4b-it",
    );

    expect(result.serverReachable).toBe(true);
    expect(result.modelAvailable).toBe(true);
    expect(result.message).toContain("available");
  });

  it("returns a clear message when the model is missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [{ id: "meta-llama/Meta-Llama-3-8B-Instruct" }],
        }),
      }),
    );

    const result = await provider.healthCheck(
      "http://127.0.0.1:8000/v1",
      "google/gemma-3-4b-it",
    );

    expect(result.serverReachable).toBe(true);
    expect(result.modelAvailable).toBe(false);
    expect(result.message).toContain("was not found");
  });

  it("returns a clean failure state when the runtime is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("connect ECONNREFUSED")));

    const result = await provider.healthCheck(
      "http://127.0.0.1:8000/v1",
      "google/gemma-3-4b-it",
    );

    expect(result.serverReachable).toBe(false);
    expect(result.modelAvailable).toBe(false);
    expect(result.message).toContain("Could not reach");
  });

  it("lists models returned by the runtime", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [{ id: "google/gemma-3-4b-it" }, { id: "Qwen/Qwen2.5-7B-Instruct" }],
        }),
      }),
    );

    const models = await provider.listModels("http://127.0.0.1:8000/v1/");

    expect(models).toEqual([
      { id: "google/gemma-3-4b-it", label: "google/gemma-3-4b-it" },
      { id: "Qwen/Qwen2.5-7B-Instruct", label: "Qwen/Qwen2.5-7B-Instruct" },
    ]);
  });

  it("extracts text content from chat completions responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: "Structured teaching content",
              },
            },
          ],
        }),
      }),
    );

    const result = await provider.generateText({
      baseUrl: "http://127.0.0.1:8000/v1",
      model: "google/gemma-3-4b-it",
      prompt: "Teach me thermodynamics",
    });

    expect(result.text).toBe("Structured teaching content");
  });
});
