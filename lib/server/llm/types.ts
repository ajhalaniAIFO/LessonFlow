export type HealthStatus = {
  provider: string;
  serverReachable: boolean;
  modelAvailable: boolean;
  message: string;
};

export type ModelInfo = {
  id: string;
  label: string;
};

export type PromptRequest = {
  model: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
};

export type TextResult = {
  text: string;
};

export interface LLMProvider {
  healthCheck(baseUrl: string, model: string): Promise<HealthStatus>;
  listModels(baseUrl: string): Promise<ModelInfo[]>;
  generateText(request: PromptRequest): Promise<TextResult>;
  generateStructuredJson<T>(request: PromptRequest): Promise<T>;
}

