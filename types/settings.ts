export type ModelProvider = "ollama";

export type ModelSettings = {
  provider: ModelProvider;
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
};

