import type { SyntheticBenchmarkRecord } from "@/types/settings";

export type SyntheticBenchmarkComparisonChartPoint = {
  benchmarkId: string;
  durationMs: number;
  x: number;
  y: number;
};

export type SyntheticBenchmarkComparisonChartRow = {
  provider: SyntheticBenchmarkRecord["provider"];
  model: string;
  successfulRuns: number;
  averageDurationMs: number;
  fastestDurationMs: number;
  slowestDurationMs: number;
  points: SyntheticBenchmarkComparisonChartPoint[];
};

const CHART_WIDTH = 100;
const CHART_HEIGHT = 28;

export function getSyntheticBenchmarkComparisonCharts(
  benchmarks: SyntheticBenchmarkRecord[],
  limitPerSetup = 5,
): SyntheticBenchmarkComparisonChartRow[] {
  const grouped = new Map<string, SyntheticBenchmarkRecord[]>();

  for (const benchmark of benchmarks) {
    if (benchmark.status !== "success" || typeof benchmark.durationMs !== "number") {
      continue;
    }

    const key = `${benchmark.provider}::${benchmark.model}`;
    const group = grouped.get(key) ?? [];

    if (group.length < limitPerSetup) {
      group.push(benchmark);
      grouped.set(key, group);
    }
  }

  return [...grouped.entries()]
    .map(([key, records]) => {
      const [provider, model] = key.split("::") as [SyntheticBenchmarkRecord["provider"], string];
      const orderedRecords = [...records].sort((left, right) => left.createdAt - right.createdAt);
      const durations = orderedRecords.map((record) => record.durationMs as number);
      const minMs = Math.min(...durations);
      const maxMs = Math.max(...durations);
      const range = Math.max(maxMs - minMs, 1);
      const xStep = orderedRecords.length === 1 ? 0 : CHART_WIDTH / (orderedRecords.length - 1);

      const points = orderedRecords.map((record, index) => {
        const durationMs = record.durationMs as number;
        const normalized = (durationMs - minMs) / range;
        return {
          benchmarkId: record.id,
          durationMs,
          x: orderedRecords.length === 1 ? CHART_WIDTH / 2 : index * xStep,
          y:
            orderedRecords.length === 1
              ? CHART_HEIGHT / 2
              : CHART_HEIGHT - normalized * CHART_HEIGHT,
        };
      });

      return {
        provider,
        model,
        successfulRuns: orderedRecords.length,
        averageDurationMs: Math.round(
          durations.reduce((sum, durationMs) => sum + durationMs, 0) / durations.length,
        ),
        fastestDurationMs: minMs,
        slowestDurationMs: maxMs,
        points,
      };
    })
    .sort((left, right) => {
      if (left.averageDurationMs !== right.averageDurationMs) {
        return left.averageDurationMs - right.averageDurationMs;
      }

      return right.successfulRuns - left.successfulRuns;
    });
}
