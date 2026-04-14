import { parseStructuredJson } from "@/lib/server/llm/ollama-provider";
import type { HealthStatus, LLMProvider, ModelInfo, PromptRequest, TextResult } from "@/lib/server/llm/types";
import { createLogger } from "@/lib/server/utils/logger";

const log = createLogger("OpenAICompatibleProvider");

type OpenAIModelsResponse = {
  data?: Array<{
    id: string;
  }>;
};

type OpenAIChatCompletionsResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
};

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "");
}

function extractTextContent(content: string | Array<{ type?: string; text?: string }> | undefined) {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((entry) => entry.text ?? "")
      .filter(Boolean)
      .join("\n");
  }

  return "";
}

export class OpenAICompatibleProvider implements LLMProvider {
  async healthCheck(baseUrl: string, model: string): Promise<HealthStatus> {
    const cleanedBaseUrl = normalizeBaseUrl(baseUrl);

    try {
      const response = await fetch(`${cleanedBaseUrl}/models`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        return {
          provider: "openai_compatible",
          serverReachable: false,
          modelAvailable: false,
          message: `OpenAI-compatible runtime responded with HTTP ${response.status}.`,
          endpointPath: "/models",
        };
      }

      const payload = (await response.json()) as OpenAIModelsResponse;
      const availableModels = (payload.data ?? []).map((entry) => entry.id);
      const modelAvailable = model.trim().length > 0 && availableModels.includes(model.trim());

      return {
        provider: "openai_compatible",
        serverReachable: true,
        modelAvailable,
        endpointPath: "/models",
        availableModelCount: availableModels.length,
        availableModelsPreview: availableModels.slice(0, 3),
        message: modelAvailable
          ? `Connected successfully. Model "${model}" is available.`
          : model.trim().length === 0
            ? "Connected successfully. Save a model name to complete setup."
            : `Connected successfully, but model "${model}" was not found on the local runtime.`,
      };
    } catch (error) {
      log.warn("Unable to reach OpenAI-compatible runtime", error);
      return {
        provider: "openai_compatible",
        serverReachable: false,
        modelAvailable: false,
        message: "Could not reach the local OpenAI-compatible runtime. Confirm that it is running.",
        endpointPath: "/models",
      };
    }
  }

  async listModels(baseUrl: string): Promise<ModelInfo[]> {
    const cleanedBaseUrl = normalizeBaseUrl(baseUrl);
    const response = await fetch(`${cleanedBaseUrl}/models`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `OpenAI-compatible runtime returned HTTP ${response.status} while listing models.`,
      );
    }

    const payload = (await response.json()) as OpenAIModelsResponse;
    return (payload.data ?? []).map((entry) => ({
      id: entry.id,
      label: entry.id,
    }));
  }

  async generateText(request: PromptRequest): Promise<TextResult> {
    const cleanedBaseUrl = normalizeBaseUrl(request.baseUrl ?? "http://127.0.0.1:8000/v1");
    const response = await fetch(`${cleanedBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: request.model,
        messages: [
          {
            role: "user",
            content: request.prompt,
          },
        ],
        temperature: request.temperature,
        max_tokens: request.maxTokens,
      }),
      signal:
        typeof request.timeoutMs === "number"
          ? AbortSignal.timeout(request.timeoutMs)
          : undefined,
    });

    if (!response.ok) {
      throw new Error(
        `OpenAI-compatible runtime returned HTTP ${response.status} while generating text.`,
      );
    }

    const payload = (await response.json()) as OpenAIChatCompletionsResponse;
    const content = payload.choices?.[0]?.message?.content;

    return {
      text: extractTextContent(content),
    };
  }

  async generateStructuredJson<T>(request: PromptRequest): Promise<T> {
    const result = await this.generateText(request);
    return parseStructuredJson<T>(result.text);
  }
}
