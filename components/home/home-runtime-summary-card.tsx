import Link from "next/link";
import type { HomeRuntimeSummary } from "@/lib/runtime/home-runtime-summary";

type Props = {
  summary: HomeRuntimeSummary;
};

export function HomeRuntimeSummaryCard({ summary }: Props) {
  return (
    <article className="card">
      <h2>Runtime summary</h2>
      <div className={`status-box ${summary.isCurrentBest ? "success" : ""}`}>
        <p className="status-title">{summary.headline}</p>
        <p className="status-copy">{summary.summary}</p>
      </div>

      <div className="runtime-summary-grid">
        <div className="runtime-summary-item">
          <strong>Current setup</strong>
          <p className="status-copy">{summary.currentSetupLabel}</p>
          <small>{summary.currentAverageLabel} average recent job</small>
        </div>

        {summary.bestSetupLabel ? (
          <div className="runtime-summary-item">
            <strong>Best recent setup</strong>
            <p className="status-copy">{summary.bestSetupLabel}</p>
            <small>{summary.bestAverageLabel} average recent job</small>
          </div>
        ) : null}
      </div>

      <div className="button-row">
        <Link className="button secondary" href="/settings">
          Open runtime insights
        </Link>
      </div>
    </article>
  );
}
