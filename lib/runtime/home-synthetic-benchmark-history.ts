import type { SyntheticBenchmarkRecord } from "@/types/settings";

export type HomeSyntheticBenchmarkHistory = {
  headline: string;
  summary: string;
  benchmarks: SyntheticBenchmarkRecord[];
};

export function getHomeSyntheticBenchmarkHistory(
  benchmarks: SyntheticBenchmarkRecord[],
  limit = 4,
): HomeSyntheticBenchmarkHistory {
  const visibleBenchmarks = benchmarks.slice(0, limit);

  if (visibleBenchmarks.length === 0) {
    return {
      headline: "Recent synthetic benchmark runs will appear here",
      summary:
        "Run controlled benchmarks for your current provider/model in Settings and we will surface the latest results on Home.",
      benchmarks: [],
    };
  }

  return {
    headline: "Recent synthetic benchmark runs",
    summary:
      "These are the latest controlled smoke-prompt runs for your active provider/model, so you can inspect recent benchmark results without leaving Home.",
    benchmarks: visibleBenchmarks,
  };
}
