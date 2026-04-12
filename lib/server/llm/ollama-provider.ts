import { createLogger } from "@/lib/server/utils/logger";
import type { HealthStatus, LLMProvider, ModelInfo, PromptRequest, TextResult } from "./types";

const log = createLogger("OllamaProvider");

type OllamaTagsResponse = {
  models?: Array<{
    name: string;
    model?: string;
  }>;
};

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "");
}

export class OllamaProvider implements LLMProvider {
  async healthCheck(baseUrl: string, model: string): Promise<HealthStatus> {
    const cleanedBaseUrl = normalizeBaseUrl(baseUrl);
    try {
      const response = await fetch(`${cleanedBaseUrl}/api/tags`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        return {
          provider: "ollama",
          serverReachable: false,
          modelAvailable: false,
          message: `Ollama responded with HTTP ${response.status}.`,
        };
      }

      const payload = (await response.json()) as OllamaTagsResponse;
      const availableModels = (payload.models ?? []).map((entry) => entry.name);
      const modelAvailable = model.trim().length > 0 && availableModels.includes(model.trim());

      return {
        provider: "ollama",
        serverReachable: true,
        modelAvailable,
        message: modelAvailable
          ? `Connected successfully. Model "${model}" is available.`
          : model.trim().length === 0
            ? "Connected successfully. Save a model name to complete setup."
            : `Connected successfully, but model "${model}" was not found on the local runtime.`,
      };
    } catch (error) {
      log.warn("Unable to reach Ollama runtime", error);
      return {
        provider: "ollama",
        serverReachable: false,
        modelAvailable: false,
        message: "Could not reach the local Ollama runtime. Confirm that it is running.",
      };
    }
  }

  async listModels(baseUrl: string): Promise<ModelInfo[]> {
    const cleanedBaseUrl = normalizeBaseUrl(baseUrl);
    const response = await fetch(`${cleanedBaseUrl}/api/tags`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Ollama returned HTTP ${response.status} while listing models.`);
    }

    const payload = (await response.json()) as OllamaTagsResponse;

    return (payload.models ?? []).map((entry) => ({
      id: entry.name,
      label: entry.name,
    }));
  }

  async generateText(_request: PromptRequest): Promise<TextResult> {
    throw new Error("Ollama text generation is not implemented yet.");
  }

  async generateStructuredJson<T>(_request: PromptRequest): Promise<T> {
    throw new Error("Ollama structured generation is not implemented yet.");
  }
}
