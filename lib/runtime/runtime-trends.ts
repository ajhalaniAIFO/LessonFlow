import { formatTelemetryDuration } from "@/lib/server/lessons/job-progress";
import type { RuntimeTrendSample } from "@/types/job";
import type { ModelSettings } from "@/types/settings";

export type RuntimeTrend = {
  label: "improving" | "stable" | "regressing" | "insufficient_data";
  headline: string;
  summary: string;
  details: string[];
};

export function getRuntimeTrend(
  settings: Pick<ModelSettings, "provider" | "model">,
  samples: RuntimeTrendSample[],
): RuntimeTrend {
  if (samples.length < 3) {
    return {
      label: "insufficient_data",
      headline: "Trend will appear after more completed runs",
      summary:
        "We need at least three completed lessons from this provider/model pair before we can judge whether performance is improving or slipping.",
      details: [
        `Provider: ${settings.provider}`,
        `Model: ${settings.model || "not set yet"}`,
      ],
    };
  }

  const midpoint = Math.ceil(samples.length / 2);
  const recent = samples.slice(0, midpoint);
  const older = samples.slice(midpoint);
  const recentAverage = Math.round(recent.reduce((sum, sample) => sum + sample.totalMs, 0) / recent.length);
  const olderAverage = Math.round(older.reduce((sum, sample) => sum + sample.totalMs, 0) / older.length);
  const delta = recentAverage - olderAverage;

  const label =
    delta < -5000 ? "improving" : delta > 5000 ? "regressing" : "stable";

  const headline =
    label === "improving"
      ? "Recent runs are improving"
      : label === "regressing"
        ? "Recent runs are slowing down"
        : "Recent runs look stable";

  const summary =
    label === "improving"
      ? "The most recent completed jobs are finishing faster than the older local runs for this provider/model pair."
      : label === "regressing"
        ? "The most recent completed jobs are taking longer than the older local runs for this provider/model pair."
        : "Recent completed jobs are close enough to suggest a stable local performance pattern.";

  return {
    label,
    headline,
    summary,
    details: [
      `Provider: ${settings.provider}`,
      `Model: ${settings.model || "not set yet"}`,
      `Recent average: ${formatTelemetryDuration(recentAverage)}`,
      `Older average: ${formatTelemetryDuration(olderAverage)}`,
    ],
  };
}
