import { formatTelemetryDuration } from "@/lib/server/lessons/job-progress";
import { getRuntimeComparisonSummary } from "@/lib/runtime/runtime-comparison";
import type { RuntimeComparisonItem } from "@/types/job";

type Props = {
  items: RuntimeComparisonItem[];
};

export function RuntimeComparisonCard({ items }: Props) {
  const summary = getRuntimeComparisonSummary(items);

  return (
    <div className="status-box">
      <p className="status-title">{summary.headline}</p>
      <p className="status-copy">{summary.summary}</p>

      {items.length > 0 ? (
        <div className="runtime-comparison-list">
          {items.map((item) => (
            <div key={`${item.runtimeProvider}-${item.runtimeModel}`} className="runtime-comparison-row">
              <div>
                <strong>
                  {item.runtimeProvider} · {item.runtimeModel}
                </strong>
                <p className="status-copy">{item.completedJobs} completed jobs</p>
              </div>
              <div className="runtime-job-metrics">
                <span>{formatTelemetryDuration(item.averageTotalMs)}</span>
                <small>
                  Best {formatTelemetryDuration(item.fastestTotalMs)} · Worst{" "}
                  {formatTelemetryDuration(item.slowestTotalMs)}
                </small>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
