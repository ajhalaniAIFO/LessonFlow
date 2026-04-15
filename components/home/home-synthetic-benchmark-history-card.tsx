import Link from "next/link";
import { formatTelemetryDuration } from "@/lib/server/lessons/job-progress";
import type { HomeSyntheticBenchmarkHistory } from "@/lib/runtime/home-synthetic-benchmark-history";

type Props = {
  history: HomeSyntheticBenchmarkHistory;
};

function formatTimestamp(timestamp: number) {
  return new Date(timestamp).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function HomeSyntheticBenchmarkHistoryCard({ history }: Props) {
  return (
    <article className="card">
      <h2>Synthetic benchmark history</h2>
      <div className="status-box">
        <p className="status-title">{history.headline}</p>
        <p className="status-copy">{history.summary}</p>
      </div>

      {history.benchmarks.length > 0 ? (
        <div className="runtime-history-list">
          {history.benchmarks.map((benchmark) => (
            <div key={benchmark.id} className="runtime-history-row">
              <div>
                <strong>
                  {benchmark.provider} | {benchmark.model}
                </strong>
                <p className="status-copy">{formatTimestamp(benchmark.createdAt)}</p>
                {benchmark.outputPreview ? (
                  <small className="status-copy">Preview: {benchmark.outputPreview}</small>
                ) : null}
                {benchmark.errorMessage ? (
                  <small className="status-copy">Error: {benchmark.errorMessage}</small>
                ) : null}
              </div>
              <div className="runtime-job-metrics">
                <span>{formatTelemetryDuration(benchmark.durationMs)}</span>
                <small>
                  {benchmark.status} | {benchmark.outputChars ?? 0} chars
                </small>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="button-row">
        <Link className="button secondary" href="/settings">
          Open full benchmark history
        </Link>
      </div>
    </article>
  );
}
