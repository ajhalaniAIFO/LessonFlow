import { formatTelemetryDuration } from "@/lib/server/lessons/job-progress";
import type { RuntimeUsageJobInsight } from "@/types/job";
import type { ModelSettings } from "@/types/settings";

export type RuntimeChartPoint = {
  jobId: string;
  lessonTitle: string;
  updatedAt: number;
  totalMs: number;
  x: number;
  y: number;
};

export type RuntimeChart = {
  headline: string;
  summary: string;
  points: RuntimeChartPoint[];
  minMs?: number;
  maxMs?: number;
};

const CHART_WIDTH = 100;
const CHART_HEIGHT = 48;

export function getRuntimeChart(
  settings: Pick<ModelSettings, "provider" | "model">,
  recentJobs: RuntimeUsageJobInsight[],
  limit = 8,
): RuntimeChart {
  const samples = recentJobs
    .filter(
      (job) =>
        job.runtimeProvider === settings.provider &&
        job.runtimeModel === settings.model &&
        typeof job.telemetry?.totalMs === "number",
    )
    .slice(0, limit)
    .map((job) => ({
      jobId: job.jobId,
      lessonTitle: job.lessonTitle,
      updatedAt: job.updatedAt,
      totalMs: job.telemetry!.totalMs!,
    }));

  if (samples.length === 0) {
    return {
      headline: "Visual benchmark chart will appear after more completed runs",
      summary:
        "We need completed lessons from the current provider/model pair before we can draw the recent runtime pattern.",
      points: [],
    };
  }

  const durations = samples.map((sample) => sample.totalMs);
  const minMs = Math.min(...durations);
  const maxMs = Math.max(...durations);
  const range = Math.max(maxMs - minMs, 1);
  const xStep = samples.length === 1 ? 0 : CHART_WIDTH / (samples.length - 1);

  const points = samples.map((sample, index) => {
    const normalized = (sample.totalMs - minMs) / range;
    return {
      ...sample,
      x: samples.length === 1 ? CHART_WIDTH / 2 : index * xStep,
      y: samples.length === 1 ? CHART_HEIGHT / 2 : CHART_HEIGHT - normalized * CHART_HEIGHT,
    };
  });

  return {
    headline: "Recent runtime chart",
    summary: `Recent completed runs for ${settings.provider} with ${settings.model || "your current model"} range from ${formatTelemetryDuration(minMs)} to ${formatTelemetryDuration(maxMs)}.`,
    points,
    minMs,
    maxMs,
  };
}
