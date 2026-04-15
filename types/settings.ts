export type ModelProvider = "ollama" | "openai_compatible";

export type ModelSettings = {
  provider: ModelProvider;
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
};

export type SyntheticBenchmarkStatus = "success" | "error";

export type SyntheticBenchmarkRecord = {
  id: string;
  provider: ModelProvider;
  model: string;
  baseUrl: string;
  benchmarkKind: "smoke_prompt";
  status: SyntheticBenchmarkStatus;
  durationMs?: number;
  outputChars?: number;
  outputPreview?: string;
  errorMessage?: string;
  createdAt: number;
};

export type SyntheticBenchmarkComparisonItem = {
  provider: ModelProvider;
  model: string;
  successfulRuns: number;
  averageDurationMs: number;
  fastestDurationMs: number;
  slowestDurationMs: number;
  latestCreatedAt: number;
};

export type RecommendedSyntheticBenchmarkSetup = {
  provider: ModelProvider;
  model: string;
};

export type SyntheticBenchmarkChartPoint = {
  benchmarkId: string;
  x: number;
  y: number;
  durationMs: number;
  createdAt: number;
};

export type SyntheticBenchmarkChart = {
  label: "ready" | "empty";
  headline: string;
  summary: string;
  minLabel?: string;
  maxLabel?: string;
  points: SyntheticBenchmarkChartPoint[];
};
