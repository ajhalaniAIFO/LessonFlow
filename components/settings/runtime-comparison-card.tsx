import { formatTelemetryDuration } from "@/lib/server/lessons/job-progress";
import type { RuntimeComparisonChartRow } from "@/lib/runtime/runtime-comparison-chart";
import { getRuntimeComparisonSummary } from "@/lib/runtime/runtime-comparison";
import type { RuntimeComparisonItem } from "@/types/job";

type Props = {
  items: RuntimeComparisonItem[];
  charts?: RuntimeComparisonChartRow[];
};

export function RuntimeComparisonCard({ items, charts = [] }: Props) {
  const summary = getRuntimeComparisonSummary(items);
  const chartMap = new Map(
    charts.map((chart) => [`${chart.runtimeProvider}::${chart.runtimeModel}`, chart]),
  );

  return (
    <div className="status-box">
      <p className="status-title">{summary.headline}</p>
      <p className="status-copy">{summary.summary}</p>

      {items.length > 0 ? (
        <div className="runtime-comparison-list">
          {items.map((item) => (
            <div key={`${item.runtimeProvider}-${item.runtimeModel}`} className="runtime-comparison-row">
              <div>
                <strong>{item.runtimeProvider} | {item.runtimeModel}</strong>
                <p className="status-copy">{item.completedJobs} completed jobs</p>
                {chartMap.has(`${item.runtimeProvider}::${item.runtimeModel}`) ? (
                  <div className="runtime-comparison-chart-shell">
                    <svg
                      className="runtime-comparison-chart"
                      viewBox="0 0 100 28"
                      preserveAspectRatio="none"
                      role="img"
                      aria-label={`${item.runtimeProvider} ${item.runtimeModel} runtime chart`}
                    >
                      <polyline
                        className="runtime-comparison-chart-line"
                        points={chartMap
                          .get(`${item.runtimeProvider}::${item.runtimeModel}`)!
                          .points.map((point) => `${point.x},${point.y}`)
                          .join(" ")}
                      />
                      {chartMap
                        .get(`${item.runtimeProvider}::${item.runtimeModel}`)!
                        .points.map((point) => (
                          <circle
                            key={point.jobId}
                            className="runtime-comparison-chart-point"
                            cx={point.x}
                            cy={point.y}
                            r="1.8"
                          />
                        ))}
                    </svg>
                  </div>
                ) : null}
              </div>
              <div className="runtime-job-metrics">
                <span>{formatTelemetryDuration(item.averageTotalMs)}</span>
                <small>
                  Best {formatTelemetryDuration(item.fastestTotalMs)} | Worst{" "}
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
