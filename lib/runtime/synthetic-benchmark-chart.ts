import { formatTelemetryDuration } from "@/lib/server/lessons/job-progress";
import type { SyntheticBenchmarkChart, SyntheticBenchmarkRecord } from "@/types/settings";

function normalizePoint(index: number, total: number, duration: number, min: number, max: number) {
  const x = total <= 1 ? 50 : Math.round((index / (total - 1)) * 100);
  const y =
    max === min
      ? 14
      : Math.round(28 - ((duration - min) / (max - min)) * 24);

  return {
    x,
    y,
  };
}

export function getSyntheticBenchmarkChart(
  benchmarks: SyntheticBenchmarkRecord[],
): SyntheticBenchmarkChart {
  const successfulBenchmarks = benchmarks
    .filter(
      (benchmark) =>
        benchmark.status === "success" && typeof benchmark.durationMs === "number",
    )
    .sort((left, right) => left.createdAt - right.createdAt);

  if (successfulBenchmarks.length === 0) {
    return {
      label: "empty",
      headline: "Synthetic benchmark chart will appear after successful runs",
      summary:
        "Run a few successful controlled benchmarks for the current provider/model and we will chart the recent durations here.",
      points: [],
    };
  }

  const durations = successfulBenchmarks.map((benchmark) => benchmark.durationMs as number);
  const min = Math.min(...durations);
  const max = Math.max(...durations);

  return {
    label: "ready",
    headline: "Synthetic benchmark chart",
    summary:
      "Recent successful controlled benchmark runs for the current provider/model, shown oldest to newest.",
    minLabel: formatTelemetryDuration(min),
    maxLabel: formatTelemetryDuration(max),
    points: successfulBenchmarks.map((benchmark, index) => ({
      benchmarkId: benchmark.id,
      durationMs: benchmark.durationMs as number,
      createdAt: benchmark.createdAt,
      ...normalizePoint(index, successfulBenchmarks.length, benchmark.durationMs as number, min, max),
    })),
  };
}
