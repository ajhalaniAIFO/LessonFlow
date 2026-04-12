import { OllamaProvider } from "@/lib/server/llm/ollama-provider";
import type { LLMProvider } from "@/lib/server/llm/types";
import { AppError } from "@/lib/server/utils/errors";
import type { ModelProvider } from "@/types/settings";

const providers: Record<ModelProvider, LLMProvider> = {
  ollama: new OllamaProvider(),
};

export function getProvider(provider: ModelProvider): LLMProvider {
  const instance = providers[provider];
  if (!instance) {
    throw new AppError("INVALID_REQUEST", `Unsupported provider: ${provider}`);
  }
  return instance;
}
