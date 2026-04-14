import type { RuntimeUsageJobInsight } from "@/types/job";

export type RuntimeComparisonChartPoint = {
  jobId: string;
  totalMs: number;
  x: number;
  y: number;
};

export type RuntimeComparisonChartRow = {
  runtimeProvider: "ollama" | "openai_compatible";
  runtimeModel: string;
  completedJobs: number;
  averageTotalMs: number;
  fastestTotalMs: number;
  slowestTotalMs: number;
  points: RuntimeComparisonChartPoint[];
};

const CHART_WIDTH = 100;
const CHART_HEIGHT = 28;

export function getRuntimeComparisonCharts(
  recentJobs: RuntimeUsageJobInsight[],
  limitPerRuntime = 5,
): RuntimeComparisonChartRow[] {
  const grouped = new Map<string, RuntimeUsageJobInsight[]>();

  for (const job of recentJobs) {
    if (!job.runtimeProvider || !job.runtimeModel || typeof job.telemetry?.totalMs !== "number") {
      continue;
    }

    const key = `${job.runtimeProvider}::${job.runtimeModel}`;
    const group = grouped.get(key) ?? [];
    if (group.length < limitPerRuntime) {
      group.push(job);
      grouped.set(key, group);
    }
  }

  return [...grouped.entries()]
    .map(([key, jobs]) => {
      const [runtimeProvider, runtimeModel] = key.split("::") as [
        "ollama" | "openai_compatible",
        string,
      ];
      const durations = jobs.map((job) => job.telemetry!.totalMs!);
      const minMs = Math.min(...durations);
      const maxMs = Math.max(...durations);
      const range = Math.max(maxMs - minMs, 1);
      const xStep = jobs.length === 1 ? 0 : CHART_WIDTH / (jobs.length - 1);

      const points = jobs.map((job, index) => {
        const totalMs = job.telemetry!.totalMs!;
        const normalized = (totalMs - minMs) / range;
        return {
          jobId: job.jobId,
          totalMs,
          x: jobs.length === 1 ? CHART_WIDTH / 2 : index * xStep,
          y: jobs.length === 1 ? CHART_HEIGHT / 2 : CHART_HEIGHT - normalized * CHART_HEIGHT,
        };
      });

      return {
        runtimeProvider,
        runtimeModel,
        completedJobs: jobs.length,
        averageTotalMs: Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length),
        fastestTotalMs: minMs,
        slowestTotalMs: maxMs,
        points,
      };
    })
    .sort((left, right) => {
      if (right.completedJobs !== left.completedJobs) {
        return right.completedJobs - left.completedJobs;
      }

      return left.averageTotalMs - right.averageTotalMs;
    });
}
