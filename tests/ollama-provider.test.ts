import { afterEach, describe, expect, it, vi } from "vitest";
import { OllamaProvider, parseStructuredJson } from "@/lib/server/llm/ollama-provider";

describe("OllamaProvider", () => {
  const provider = new OllamaProvider();

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reports a successful health check when the model exists", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          models: [{ name: "qwen2.5:7b-instruct" }],
        }),
      }),
    );

    const result = await provider.healthCheck("http://127.0.0.1:11434/", "qwen2.5:7b-instruct");

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
          models: [{ name: "llama3.1:8b-instruct" }],
        }),
      }),
    );

    const result = await provider.healthCheck("http://127.0.0.1:11434", "qwen2.5:7b-instruct");

    expect(result.serverReachable).toBe(true);
    expect(result.modelAvailable).toBe(false);
    expect(result.message).toContain("was not found");
  });

  it("returns a clean failure state when the runtime is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("connect ECONNREFUSED")),
    );

    const result = await provider.healthCheck("http://127.0.0.1:11434", "qwen2.5:7b-instruct");

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
          models: [{ name: "qwen2.5:7b-instruct" }, { name: "llama3.1:8b-instruct" }],
        }),
      }),
    );

    const models = await provider.listModels("http://127.0.0.1:11434/");

    expect(models).toEqual([
      { id: "qwen2.5:7b-instruct", label: "qwen2.5:7b-instruct" },
      { id: "llama3.1:8b-instruct", label: "llama3.1:8b-instruct" },
    ]);
  });

  it("parses structured JSON when the model adds a prose preamble", () => {
    const parsed = parseStructuredJson<{ title: string; outline: unknown[] }>(
      'Here is a valid lesson outline as JSON:\n{"title":"Test lesson","outline":[]}',
    );

    expect(parsed).toEqual({
      title: "Test lesson",
      outline: [],
    });
  });

  it("parses structured JSON from fenced json blocks", () => {
    const parsed = parseStructuredJson<{ title: string; outline: unknown[] }>(
      '```json\n{"title":"Test lesson","outline":[]}\n```',
    );

    expect(parsed).toEqual({
      title: "Test lesson",
      outline: [],
    });
  });
});
