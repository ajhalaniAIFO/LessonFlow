import type { RuntimeHistoryEntry, RuntimeUsageJobInsight } from "@/types/job";
import type { ModelSettings } from "@/types/settings";

export type RuntimeHistory = {
  headline: string;
  summary: string;
  entries: RuntimeHistoryEntry[];
};

export function getRuntimeHistory(
  settings: Pick<ModelSettings, "provider" | "model">,
  recentJobs: RuntimeUsageJobInsight[],
  limit = 6,
): RuntimeHistory {
  const entries = recentJobs
    .filter(
      (job) =>
        job.runtimeProvider === settings.provider &&
        job.runtimeModel === settings.model &&
        typeof job.telemetry?.totalMs === "number",
    )
    .slice(0, limit)
    .map((job) => ({
      jobId: job.jobId,
      lessonId: job.lessonId,
      lessonTitle: job.lessonTitle,
      updatedAt: job.updatedAt,
      totalMs: job.telemetry!.totalMs!,
      lessonSceneCount: job.telemetry?.lessonSceneCount,
      quizSceneCount: job.telemetry?.quizSceneCount,
    }));

  if (entries.length === 0) {
    return {
      headline: "Recent benchmark history will appear after more completed runs",
      summary:
        "We need completed lessons from the current provider/model pair before we can show the run-by-run history behind the benchmark.",
      entries,
    };
  }

  return {
    headline: "Recent benchmark history",
    summary: `Showing the ${entries.length} most recent completed run${entries.length === 1 ? "" : "s"} for ${settings.provider} with ${settings.model || "your current model"}.`,
    entries,
  };
}
