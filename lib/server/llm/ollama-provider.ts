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

function extractJsonSegment(text: string) {
  const trimmed = text.trim();
  if (!trimmed) {
    return trimmed;
  }

  const directCandidate = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    JSON.parse(directCandidate);
    return directCandidate;
  } catch {
    // Fall through to segmented extraction.
  }

  const startMatch = /[\[{]/.exec(trimmed);
  if (!startMatch) {
    throw new Error("Model did not return JSON content.");
  }

  const startIndex = startMatch.index;
  const opening = trimmed[startIndex];
  const closing = opening === "{" ? "}" : "]";

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = startIndex; index < trimmed.length; index += 1) {
    const char = trimmed[index];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (char === '"') {
        inString = false;
      }

      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === opening) {
      depth += 1;
      continue;
    }

    if (char === closing) {
      depth -= 1;
      if (depth === 0) {
        return trimmed.slice(startIndex, index + 1);
      }
    }
  }

  throw new Error("Model returned incomplete JSON content.");
}

export function parseStructuredJson<T>(text: string): T {
  const candidate = extractJsonSegment(text);
  return JSON.parse(candidate) as T;
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
          endpointPath: "/api/tags",
        };
      }

      const payload = (await response.json()) as OllamaTagsResponse;
      const availableModels = (payload.models ?? []).map((entry) => entry.name);
      const modelAvailable = model.trim().length > 0 && availableModels.includes(model.trim());

      return {
        provider: "ollama",
        serverReachable: true,
        modelAvailable,
        endpointPath: "/api/tags",
        availableModelCount: availableModels.length,
        availableModelsPreview: availableModels.slice(0, 3),
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
        endpointPath: "/api/tags",
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
    return parseStructuredJson<T>(result.text);
  }
}
