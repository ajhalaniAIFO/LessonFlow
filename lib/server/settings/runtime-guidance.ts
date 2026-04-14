import type { ModelProvider } from "@/types/settings";

export type RuntimeGuidance = {
  provider: ModelProvider;
  label: string;
  defaultUrl: string;
  exampleModel: string;
  endpointShape: string;
  bestFor: string[];
  setupSteps: string[];
  compatibilityHints: string[];
};

const runtimeGuidance: Record<ModelProvider, RuntimeGuidance> = {
  ollama: {
    provider: "ollama",
    label: "Ollama",
    defaultUrl: "http://127.0.0.1:11434",
    exampleModel: "qwen2.5:7b-instruct",
    endpointShape: "Native Ollama HTTP API",
    bestFor: [
      "quick local setup on a single machine",
      "simple model pulls and local experimentation",
      "users who want the shortest path to a working runtime",
    ],
    setupSteps: [
      "Install and start Ollama locally.",
      "Pull a chat/instruct model such as qwen2.5:7b-instruct or llama3:latest.",
      "Use the Ollama base URL and exact model tag here.",
    ],
    compatibilityHints: [
      "Model discovery reads from /api/tags.",
      "Model names usually look like llama3:latest or qwen2.5:7b-instruct.",
      "If generation fails with HTTP 404, the model tag usually does not match what Ollama has installed.",
    ],
  },
  openai_compatible: {
    provider: "openai_compatible",
    label: "OpenAI-compatible local runtime",
    defaultUrl: "http://127.0.0.1:8000/v1",
    exampleModel: "google/gemma-3-4b-it",
    endpointShape: "OpenAI-style /models and /chat/completions endpoints",
    bestFor: [
      "vLLM, llama.cpp server mode, or other OpenAI-style local runtimes",
      "setups that already expose a /v1 endpoint",
      "more advanced local serving stacks",
    ],
    setupSteps: [
      "Start a local runtime that exposes OpenAI-compatible routes.",
      "Use the base URL that includes the /v1 prefix when your runtime expects it.",
      "Save the exact served model identifier returned by /models.",
    ],
    compatibilityHints: [
      "Model discovery reads from /models and generation uses /chat/completions.",
      "Model names often look like google/gemma-3-4b-it or meta-llama/Llama-3.1-8B-Instruct.",
      "If discovery works but generation fails, the runtime may support listing models but not chat completions in the expected format.",
    ],
  },
};

export function getRuntimeGuidance(provider: ModelProvider): RuntimeGuidance {
  return runtimeGuidance[provider];
}

export function listRuntimeGuidance(): RuntimeGuidance[] {
  return Object.values(runtimeGuidance);
}
