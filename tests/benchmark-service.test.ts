import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetDatabase } from "@/lib/db/client";
import * as providerRegistry from "@/lib/server/llm/provider-registry";
import { AppError } from "@/lib/server/utils/errors";
import {
  getSyntheticBenchmarkComparison,
  listSyntheticBenchmarks,
  runSyntheticBenchmark,
} from "@/lib/server/settings/benchmark-service";

function createTempDbPath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lessonflow-benchmark-test-"));
  return path.join(dir, "app.db");
}

describe("benchmark-service", () => {
  beforeEach(() => {
    resetDatabase();
    process.env.LESSONFLOW_DB_PATH = createTempDbPath();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects synthetic benchmark runs without a saved model name", async () => {
    await expect(
      runSyntheticBenchmark({
        provider: "ollama",
        baseUrl: "http://127.0.0.1:11434",
        model: "",
        temperature: 0.4,
        maxTokens: 2000,
        timeoutMs: 120000,
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("stores a successful synthetic benchmark result", async () => {
    vi.spyOn(providerRegistry, "getProvider").mockReturnValue({
      healthCheck: vi.fn(),
      listModels: vi.fn(),
      generateText: vi.fn().mockResolvedValue({
        text: "Benchmark ready.",
      }),
      generateStructuredJson: vi.fn(),
    });

    const result = await runSyntheticBenchmark({
      provider: "ollama",
      baseUrl: "http://127.0.0.1:11434",
      model: "llama3:latest",
      temperature: 0.4,
      maxTokens: 2000,
      timeoutMs: 120000,
    });

    expect(result.status).toBe("success");
    expect(result.outputPreview).toContain("Benchmark ready");

    const history = await listSyntheticBenchmarks({
      provider: "ollama",
      model: "llama3:latest",
    });
    expect(history).toHaveLength(1);
    expect(history[0]?.status).toBe("success");
  });

  it("stores an error synthetic benchmark result when generation fails", async () => {
    vi.spyOn(providerRegistry, "getProvider").mockReturnValue({
      healthCheck: vi.fn(),
      listModels: vi.fn(),
      generateText: vi.fn().mockRejectedValue(new Error("runtime overloaded")),
      generateStructuredJson: vi.fn(),
    });

    const result = await runSyntheticBenchmark({
      provider: "openai_compatible",
      baseUrl: "http://127.0.0.1:8000/v1",
      model: "gemma4",
      temperature: 0.4,
      maxTokens: 2000,
      timeoutMs: 120000,
    });

    expect(result.status).toBe("error");
    expect(result.errorMessage).toContain("runtime overloaded");

    const history = await listSyntheticBenchmarks({
      provider: "openai_compatible",
      model: "gemma4",
    });
    expect(history[0]?.status).toBe("error");
  });

  it("groups successful synthetic benchmarks side by side and ranks faster setups first", async () => {
    const timings = [1000, 1800, 3000, 4500];

    vi.spyOn(Date, "now").mockImplementation(() => timings.shift() ?? 5000);

    const generateText = vi
      .fn()
      .mockResolvedValueOnce({ text: "Benchmark ready." })
      .mockResolvedValueOnce({ text: "Benchmark ready." })
      .mockResolvedValueOnce({ text: "Benchmark ready." })
      .mockResolvedValueOnce({ text: "Benchmark ready." });

    vi.spyOn(providerRegistry, "getProvider").mockReturnValue({
      healthCheck: vi.fn(),
      listModels: vi.fn(),
      generateText,
      generateStructuredJson: vi.fn(),
    });

    await runSyntheticBenchmark({
      provider: "ollama",
      baseUrl: "http://127.0.0.1:11434",
      model: "llama3:latest",
      temperature: 0.4,
      maxTokens: 2000,
      timeoutMs: 120000,
    });

    await runSyntheticBenchmark({
      provider: "openai_compatible",
      baseUrl: "http://127.0.0.1:8000/v1",
      model: "gemma4",
      temperature: 0.4,
      maxTokens: 2000,
      timeoutMs: 120000,
    });

    const comparison = await getSyntheticBenchmarkComparison();

    expect(comparison).toHaveLength(2);
    expect(comparison[0]).toMatchObject({
      provider: "openai_compatible",
      model: "gemma4",
      successfulRuns: 1,
      averageDurationMs: 500,
    });
    expect(comparison[1]).toMatchObject({
      provider: "ollama",
      model: "llama3:latest",
      successfulRuns: 1,
      averageDurationMs: 800,
    });
  });
});
