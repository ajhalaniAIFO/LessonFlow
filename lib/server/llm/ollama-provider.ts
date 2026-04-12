import { createLogger } from "@/lib/server/utils/logger";
import type { HealthStatus, LLMProvider, ModelInfo, PromptRequest, TextResult } from "./types";

const log = createLogger("OllamaProvider");

type OllamaTagsResponse = {
  models?: Array<{
    name: string;
    model?: string;
  }>;
};

type OllamaGenerateResponse = {
  response?: string;
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
    const cleanedBaseUrl = normalizeBaseUrl(_request.baseUrl ?? "http://127.0.0.1:11434");
    const response = await fetch(`${cleanedBaseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: _request.model,
        prompt: _request.prompt,
        stream: false,
        options: {
          temperature: _request.temperature,
          num_predict: _request.maxTokens,
        },
      }),
      signal:
        typeof _request.timeoutMs === "number"
          ? AbortSignal.timeout(_request.timeoutMs)
          : undefined,
    });

    if (!response.ok) {
      throw new Error(`Ollama returned HTTP ${response.status} while generating text.`);
    }

    const payload = (await response.json()) as OllamaGenerateResponse;
    return {
      text: payload.response ?? "",
    };
  }

  async generateStructuredJson<T>(request: PromptRequest): Promise<T> {
    const result = await this.generateText(request);
    return JSON.parse(result.text) as T;
  }
}
