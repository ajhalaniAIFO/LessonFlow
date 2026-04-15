import { formatTelemetryDuration } from "@/lib/server/lessons/job-progress";
import { getSyntheticBenchmarkComparisonSummary } from "@/lib/runtime/synthetic-benchmark-comparison";
import type { SyntheticBenchmarkComparisonItem } from "@/types/settings";

type Props = {
  items: SyntheticBenchmarkComparisonItem[];
};

function formatTimestamp(timestamp: number) {
  return new Date(timestamp).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function SyntheticBenchmarkComparisonCard({ items }: Props) {
  const summary = getSyntheticBenchmarkComparisonSummary(items);

  return (
    <div className="status-box">
      <p className="status-title">{summary.headline}</p>
      <p className="status-copy">{summary.summary}</p>

      {items.length > 0 ? (
        <div className="runtime-comparison-list">
          {items.map((item) => (
            <div key={`${item.provider}-${item.model}`} className="runtime-comparison-row">
              <div>
                <strong>{item.provider} | {item.model}</strong>
                <p className="status-copy">
                  {item.successfulRuns} successful benchmark run{item.successfulRuns === 1 ? "" : "s"}
                </p>
                <small className="status-copy">
                  Latest: {formatTimestamp(item.latestCreatedAt)}
                </small>
              </div>
              <div className="runtime-job-metrics">
                <span>{formatTelemetryDuration(item.averageDurationMs)}</span>
                <small>
                  Best {formatTelemetryDuration(item.fastestDurationMs)} | Worst{" "}
                  {formatTelemetryDuration(item.slowestDurationMs)}
                </small>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
