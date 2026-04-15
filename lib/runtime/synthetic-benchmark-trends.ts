import { formatTelemetryDuration } from "@/lib/server/lessons/job-progress";
import type { RuntimeTrend } from "@/lib/runtime/runtime-trends";
import type { ModelSettings, SyntheticBenchmarkRecord } from "@/types/settings";

export function getSyntheticBenchmarkTrend(
  settings: Pick<ModelSettings, "provider" | "model">,
  benchmarks: SyntheticBenchmarkRecord[],
): RuntimeTrend {
  const successfulBenchmarks = benchmarks.filter(
    (benchmark) =>
      benchmark.provider === settings.provider &&
      benchmark.model === settings.model &&
      benchmark.status === "success" &&
      typeof benchmark.durationMs === "number",
  );

  if (successfulBenchmarks.length < 3) {
    return {
      label: "insufficient_data",
      headline: "Synthetic trend will appear after more benchmark runs",
      summary:
        "We need at least three successful controlled benchmarks for this provider/model pair before we can judge whether it is improving or slowing down.",
      details: [
        `Provider: ${settings.provider}`,
        `Model: ${settings.model || "not set yet"}`,
      ],
    };
  }

  const midpoint = Math.ceil(successfulBenchmarks.length / 2);
  const recent = successfulBenchmarks.slice(0, midpoint);
  const older = successfulBenchmarks.slice(midpoint);
  const recentAverage = Math.round(
    recent.reduce((sum, benchmark) => sum + (benchmark.durationMs ?? 0), 0) / recent.length,
  );
  const olderAverage = Math.round(
    older.reduce((sum, benchmark) => sum + (benchmark.durationMs ?? 0), 0) / older.length,
  );
  const delta = recentAverage - olderAverage;

  const label =
    delta < -1000 ? "improving" : delta > 1000 ? "regressing" : "stable";

  const headline =
    label === "improving"
      ? "Synthetic benchmarks are improving"
      : label === "regressing"
        ? "Synthetic benchmarks are slowing down"
        : "Synthetic benchmarks look stable";

  const summary =
    label === "improving"
      ? "Recent controlled benchmark runs are completing faster than the older runs for this provider/model pair."
      : label === "regressing"
        ? "Recent controlled benchmark runs are taking longer than the older runs for this provider/model pair."
        : "Recent controlled benchmark runs are close enough to suggest a stable performance pattern.";

  return {
    label,
    headline,
    summary,
    details: [
      `Provider: ${settings.provider}`,
      `Model: ${settings.model || "not set yet"}`,
      `Recent benchmark average: ${formatTelemetryDuration(recentAverage)}`,
      `Older benchmark average: ${formatTelemetryDuration(olderAverage)}`,
    ],
  };
}
