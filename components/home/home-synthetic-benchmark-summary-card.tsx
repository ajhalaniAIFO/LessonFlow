import Link from "next/link";
import type { HomeSyntheticBenchmarkSummary } from "@/lib/runtime/home-synthetic-benchmark-summary";

type Props = {
  summary: HomeSyntheticBenchmarkSummary;
};

export function HomeSyntheticBenchmarkSummaryCard({ summary }: Props) {
  return (
    <article className="card">
      <h2>Synthetic benchmark summary</h2>
      <div className={`status-box ${summary.isCurrentBest ? "success" : ""}`}>
        <p className="status-title">{summary.headline}</p>
        <p className="status-copy">{summary.summary}</p>
      </div>

      <div className="runtime-summary-grid">
        <div className="runtime-summary-item">
          <strong>Current setup</strong>
          <p className="status-copy">{summary.currentSetupLabel}</p>
          <small>Controlled benchmark reference</small>
        </div>

        {summary.benchmarkWinnerLabel ? (
          <div className="runtime-summary-item">
            <strong>Benchmark winner</strong>
            <p className="status-copy">{summary.benchmarkWinnerLabel}</p>
            <small>Fastest controlled smoke-prompt setup</small>
          </div>
        ) : null}
      </div>

      {summary.trendHeadline ? (
        <div className="status-box">
          <p className="status-title">{summary.trendHeadline}</p>
          <p className="status-copy">{summary.trendSummary}</p>
        </div>
      ) : null}

      {summary.chart?.label === "ready" ? (
        <div className="status-box">
          <p className="status-title">{summary.chart.headline}</p>
          <p className="status-copy">{summary.chart.summary}</p>
          <div className="runtime-comparison-chart-shell">
            <svg
              className="runtime-comparison-chart"
              viewBox="0 0 100 28"
              preserveAspectRatio="none"
              role="img"
              aria-label="Home synthetic benchmark chart"
            >
              <polyline
                className="runtime-comparison-chart-line"
                points={summary.chart.points.map((point) => `${point.x},${point.y}`).join(" ")}
              />
              {summary.chart.points.map((point) => (
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
              <small>{summary.chart.minLabel}</small>
            </div>
            <div className="runtime-summary-item">
              <strong>Slowest</strong>
              <small>{summary.chart.maxLabel}</small>
            </div>
          </div>
        </div>
      ) : null}

      <div className="button-row">
        <Link className="button secondary" href="/settings">
          Open benchmark details
        </Link>
      </div>
    </article>
  );
}
