import { formatTelemetryDuration } from "@/lib/server/lessons/job-progress";
import type { RuntimeUsageDashboard } from "@/types/job";
import type { ModelSettings } from "@/types/settings";

export type RuntimeBenchmark = {
  label: "quick" | "steady" | "heavy";
  headline: string;
  summary: string;
  details: string[];
};

export function getRuntimeBenchmark(
  settings: ModelSettings,
  dashboard: RuntimeUsageDashboard,
): RuntimeBenchmark {
  if (dashboard.completedJobs === 0 || typeof dashboard.averageTotalMs !== "number") {
    return {
      label: "steady",
      headline: "Benchmark will appear after a few completed lessons",
      summary:
        "We need recent completed jobs before we can tell how this runtime and model are behaving on your machine.",
      details: [
        `Current provider: ${settings.provider}`,
        `Current model: ${settings.model || "not set yet"}`,
      ],
    };
  }

  const average = dashboard.averageTotalMs;
  const label = average < 20_000 ? "quick" : average < 60_000 ? "steady" : "heavy";

  const headline =
    label === "quick"
      ? "This setup is benchmarking as quick"
      : label === "steady"
        ? "This setup is benchmarking as steady"
        : "This setup is benchmarking as heavy";

  const summary =
    label === "quick"
      ? "Recent local jobs are finishing quickly enough that this provider/model pairing looks comfortable for iteration."
      : label === "steady"
        ? "Recent local jobs look workable and reasonably stable, though larger lessons may still take some patience."
        : "Recent local jobs are taking noticeably longer, so this setup is better suited to deeper runs than rapid iteration.";

  return {
    label,
    headline,
    summary,
    details: [
      `Provider: ${settings.provider}`,
      `Model: ${settings.model || "not set yet"}`,
      `Average recent job: ${formatTelemetryDuration(dashboard.averageTotalMs)}`,
      `Fastest recent job: ${formatTelemetryDuration(dashboard.fastestTotalMs)}`,
      `Slowest recent job: ${formatTelemetryDuration(dashboard.slowestTotalMs)}`,
    ],
  };
}
