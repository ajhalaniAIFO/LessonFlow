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

      <div className="button-row">
        <Link className="button secondary" href="/settings">
          Open benchmark details
        </Link>
      </div>
    </article>
  );
}
