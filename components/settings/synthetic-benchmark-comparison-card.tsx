import { formatTelemetryDuration } from "@/lib/server/lessons/job-progress";
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
  const best = items[0];

  return (
    <div className="status-box">
      <p className="status-title">
        {best ? "Best synthetic benchmarked setup" : "Synthetic comparison will appear after more benchmark runs"}
      </p>
      <p className="status-copy">
        {best
          ? `${best.provider} | ${best.model} is leading on controlled smoke-prompt runs with an average of ${formatTelemetryDuration(best.averageDurationMs)} across ${best.successfulRuns} successful probe${best.successfulRuns === 1 ? "" : "s"}.`
          : "Run the benchmark against more than one provider/model pairing and we will compare them side by side here."}
      </p>

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
