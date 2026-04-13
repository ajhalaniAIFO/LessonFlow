export type ModelProvider = "ollama" | "openai_compatible";

export type ModelSettings = {
  provider: ModelProvider;
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
};
