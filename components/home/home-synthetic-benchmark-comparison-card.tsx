import Link from "next/link";
import { formatTelemetryDuration } from "@/lib/server/lessons/job-progress";
import type { SyntheticBenchmarkComparisonChartRow } from "@/lib/runtime/synthetic-benchmark-comparison-chart";

type Props = {
  rows: SyntheticBenchmarkComparisonChartRow[];
};

export function HomeSyntheticBenchmarkComparisonCard({ rows }: Props) {
  const visibleRows = rows.slice(0, 3);
  const best = visibleRows[0];

  return (
    <article className="card">
      <h2>Synthetic benchmark comparison</h2>
      <div className={`status-box ${best ? "success" : ""}`}>
        <p className="status-title">
          {best
            ? "Best benchmarked setups are visible at a glance"
            : "Synthetic comparison charts appear after more successful benchmark runs"}
        </p>
        <p className="status-copy">
          {best
            ? `${best.provider} | ${best.model} is currently the fastest benchmarked setup in recent controlled runs, and the rows below show how other benchmarked setups compare visually.`
            : "Run successful controlled benchmarks across more than one provider/model pair and we will chart the leading setups here."}
        </p>
      </div>

      {visibleRows.length > 0 ? (
        <div className="runtime-comparison-list">
          {visibleRows.map((row, index) => (
            <div key={`${row.provider}-${row.model}`} className="runtime-comparison-row">
              <div>
                <strong>
                  {index === 0 ? "Leader: " : ""}
                  {row.provider} | {row.model}
                </strong>
                <p className="status-copy">
                  {row.successfulRuns} successful benchmark run{row.successfulRuns === 1 ? "" : "s"}
                </p>
                <div className="runtime-comparison-chart-shell">
                  <svg
                    className="runtime-comparison-chart"
                    viewBox="0 0 100 28"
                    preserveAspectRatio="none"
                    role="img"
                    aria-label={`${row.provider} ${row.model} synthetic benchmark comparison chart`}
                  >
                    <polyline
                      className="runtime-comparison-chart-line"
                      points={row.points.map((point) => `${point.x},${point.y}`).join(" ")}
                    />
                    {row.points.map((point) => (
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
              </div>
              <div className="runtime-job-metrics">
                <span>{formatTelemetryDuration(row.averageDurationMs)}</span>
                <small>
                  Best {formatTelemetryDuration(row.fastestDurationMs)} | Worst{" "}
                  {formatTelemetryDuration(row.slowestDurationMs)}
                </small>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="button-row">
        <Link className="button secondary" href="/settings">
          Open full benchmark comparison
        </Link>
      </div>
    </article>
  );
}
