import { formatTelemetryDuration } from "@/lib/server/lessons/job-progress";
import type { RuntimeChart } from "@/lib/runtime/runtime-chart";

type Props = {
  chart: RuntimeChart;
};

function formatRunTimestamp(timestamp: number) {
  return new Date(timestamp).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RuntimeChartCard({ chart }: Props) {
  const polyline = chart.points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <div className="status-box">
      <p className="status-title">{chart.headline}</p>
      <p className="status-copy">{chart.summary}</p>

      {chart.points.length > 0 ? (
        <>
          <div className="runtime-chart-shell" aria-label="Recent runtime benchmark chart">
            <div className="runtime-chart-scale">
              <span>{formatTelemetryDuration(chart.maxMs)}</span>
              <span>{formatTelemetryDuration(chart.minMs)}</span>
            </div>
            <svg
              className="runtime-chart"
              viewBox="0 0 100 48"
              preserveAspectRatio="none"
              role="img"
              aria-label="Sparkline of recent runtime durations"
            >
              <polyline className="runtime-chart-line" points={polyline} />
              {chart.points.map((point) => (
                <circle
                  key={point.jobId}
                  className="runtime-chart-point"
                  cx={point.x}
                  cy={point.y}
                  r="2"
                />
              ))}
            </svg>
          </div>

          <div className="runtime-chart-legend">
            {chart.points.map((point) => (
              <div key={point.jobId} className="runtime-chart-legend-row">
                <strong>{formatTelemetryDuration(point.totalMs)}</strong>
                <small>
                  {point.lessonTitle} | {formatRunTimestamp(point.updatedAt)}
                </small>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
