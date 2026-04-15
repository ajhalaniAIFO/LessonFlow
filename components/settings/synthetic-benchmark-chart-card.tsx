import { formatTelemetryDuration } from "@/lib/server/lessons/job-progress";
import type { SyntheticBenchmarkChart, SyntheticBenchmarkRecord } from "@/types/settings";

type Props = {
  chart: SyntheticBenchmarkChart;
  benchmarks: SyntheticBenchmarkRecord[];
};

function formatTimestamp(timestamp: number) {
  return new Date(timestamp).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function SyntheticBenchmarkChartCard({ chart, benchmarks }: Props) {
  return (
    <div className="status-box">
      <p className="status-title">{chart.headline}</p>
      <p className="status-copy">{chart.summary}</p>

      {chart.label === "ready" ? (
        <>
          <div className="runtime-comparison-chart-shell">
            <svg
              className="runtime-comparison-chart"
              viewBox="0 0 100 28"
              preserveAspectRatio="none"
              role="img"
              aria-label="Synthetic benchmark chart"
            >
              <polyline
                className="runtime-comparison-chart-line"
                points={chart.points.map((point) => `${point.x},${point.y}`).join(" ")}
              />
              {chart.points.map((point) => (
                <circle
                  key={point.benchmarkId}
                  className="runtime-comparison-chart-point"
                  cx={point.x}
                  cy={point.y}
                  r="1.8"
                />
              ))}
            </svg>
          </div>
          <div className="runtime-summary-grid">
            <div className="runtime-summary-item">
              <strong>Fastest</strong>
              <small>{chart.minLabel}</small>
            </div>
            <div className="runtime-summary-item">
              <strong>Slowest</strong>
              <small>{chart.maxLabel}</small>
            </div>
          </div>
          <div className="runtime-history-list">
            {benchmarks
              .filter(
                (benchmark) =>
                  benchmark.status === "success" && typeof benchmark.durationMs === "number",
              )
              .map((benchmark) => (
                <div key={benchmark.id} className="runtime-history-row">
                  <div>
                    <strong>{formatTimestamp(benchmark.createdAt)}</strong>
                    {benchmark.outputPreview ? (
                      <p className="status-copy">Preview: {benchmark.outputPreview}</p>
                    ) : null}
                  </div>
                  <div className="runtime-job-metrics">
                    <span>{formatTelemetryDuration(benchmark.durationMs)}</span>
                    <small>{benchmark.outputChars ?? 0} chars</small>
                  </div>
                </div>
              ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
